import { getJetStreamClients } from "./jetStreamSetup.js";
import { User } from "./UserModel.js";
import { withRetry } from "./utils/retryLogic.js";

const makeSubmission = async (data) => {
    const { id, submissionId, qid, questionTitle, language, tags, difficulty, verdict } = data;
    const skillCategories = {
        basic: [
            "array", "string", "math", "implementation", "simulation", "sorting",
            "searching", "two-pointers", "pointers", "prefix-sum", "matrix"
        ],
        intermediate: [
            "hashmap", "linked-list", "stack", "queue", "recursion", "sliding-window",
            "binary-search", "greedy", "tree", "binary-tree", "binary-search-tree",
            "hashing", "intervals", "bit-manipulation", "combinatorics", "memoization"
        ],
        advanced: [
            "heap", "priority-queue", "backtracking", "dynamic-programming",
            "divide-and-conquer", "number-theory", "geometry", "graph", "bfs", "dfs",
            "topological-sort", "union-find", "disjoint-set", "shortest-path",
            "dijkstra", "bellman-ford", "floyd-warshall", "minimum-spanning-tree",
            "kruskal", "prim", "segment-tree", "fenwick-tree", "trie", "monotonic-stack",
            "monotonic-queue", "greedy-intervals", "suffix-array", "rolling-hash",
            "game-theory", "state-space-search", "modular-arithmetic", "bitmasking",
            "recursion-tree"
        ]
    };
    const categorizeTag = (tag) => {
        if (skillCategories.basic.includes(tag)) return 'basic';
        if (skillCategories.intermediate.includes(tag)) return 'intermediate';
        if (skillCategories.advanced.includes(tag)) return 'advanced';
        return 'basic'; // default fallback
    };

    const user = await User.findById(id).select("submissions basicSkills intermediateSkills advancedSkills languages").lean();
    if (!user) {
        console.warn("⚠️ No user found with provided id. Could not persist submission in user srv.");
        return;
    }
    console.log("user", user);

    const submission = {
        submissionId,
        questionId: qid,
        questionTitle,
        verdict
    }

    // Only increment 'solved' if submission is accepted
    let shouldIncrement = verdict === "AC";

    // increment only if this is the first time the user is solving this question
    if (shouldIncrement) {
        const alreadySolved = user.submissions.some(sub => sub.questionId.toString() === qid && sub.verdict === "AC");
        if (alreadySolved) {
            console.warn("⚠️ User has already solved this question.");
            shouldIncrement = false;
        }
    }

    const skillUpdates = {};

    if (shouldIncrement && tags && tags.length > 0) {
        // Categorize tags and prepare bulk updates
        const tagCategories = {
            basic: [],
            intermediate: [],
            advanced: []
        };

        tags.forEach(tag => {
            const category = categorizeTag(tag);
            tagCategories[category].push(tag);
        });

        // Process each category
        for (const [category, categoryTags] of Object.entries(tagCategories)) {
            const skillField = `${category}Skills`;

            categoryTags.forEach(tag => {
                const userSkills = user[skillField] || [];
                const existingSkill = userSkills.find(skill => skill.tag === tag);

                if (existingSkill) {
                    const skillIndex = userSkills.indexOf(existingSkill);
                    skillUpdates[`${skillField}.${skillIndex}.solved`] = 1;
                } else {
                    skillUpdates[`$push`] ??= {};
                    skillUpdates[`$push`][skillField] ??= [];
                    skillUpdates[`$push`][skillField].push({ tag, solved: 1 });
                }
            });
        }
    }

    const incFields = {
        [`difficultyCategory.${difficulty}.solved`]: shouldIncrement ? 1 : 0,
        // [`languages.${language}.solved`]: shouldIncrement ? 1 :  0,
        ...Object.fromEntries(
            Object.entries(skillUpdates).filter(([key]) => key.includes('.solved'))
        )
    };

    // Handle languages array update - find the correct index for the language
    if (shouldIncrement && language && user.languages) {
        const languageIndex = user.languages.findIndex(lang => lang.language === language);
        if (languageIndex !== -1) {
            incFields[`languages.${languageIndex}.solved`] = 1;
        } else {
            console.warn(`⚠️ Language ${language} not found in user's languages array`);
        }
    }

    if (shouldIncrement) {
        incFields.solved = 1; // ✅ Top-level solved field
    }

    const updateObject = {
        $push: { submissions: submission },
        $inc: incFields
    };

    if (skillUpdates.$push) {
        Object.assign(updateObject.$push, skillUpdates.$push);
    }


    if (skillUpdates.$push) {
        Object.assign(updateObject.$push, skillUpdates.$push);
    }

    // Update user document
    await User.findByIdAndUpdate(id, updateObject);

    console.log(`✅ Submission processed for user ${id}. Solved: ${shouldIncrement ? 'Yes' : 'No'}`);
}


export const startSubmissionConsumer = async () => {
    let js, sc;
    const initConsumer = async () => {
        ({ js, sc } = getJetStreamClients());
        if (!js) throw new Error('JetStream client not initialized');

        const consumer = await js.consumers.get("USER", "user-submission-worker");
        if (!consumer) throw new Error('Failed to get consumer');

        console.log("✅ jetStream consumer user-submission-worker started...");
        return consumer;
    };

    const consumer = await withRetry(initConsumer, {
        name: 'submission consumer initialization'
    });

    const processMessages = async () => {
        while (true) {
            try {
                const messages = await consumer.fetch({ max_messages: 1, expires: 15000 });
                if (!messages) continue;

                for await (const m of messages) {
                    try {
                        const data = JSON.parse(sc.decode(m.data));

                        if (m.info.redelivered) {
                            console.warn("⚠️ Redelivered message skipping...");
                            continue;
                        }

                        console.log("📩 Received submission:", data);
                        await makeSubmission(data);
                        await m.ack();
                        console.log("✅ ACK done");
                    } catch (err) {
                        console.error("❌ Error processing message:", err.message);
                        // Don't ack problematic messages
                    }
                }
            } catch (err) {
                console.error("❌ Error fetching messages:", err.message);
                throw err; // Trigger retry
            }
        }
    };

    await withRetry(processMessages, {
        name: 'submission message processing'
    });
};
