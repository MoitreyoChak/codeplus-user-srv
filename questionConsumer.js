import { getJetStreamClients } from "./jetStreamSetup.js";
import { User } from "./UserModel.js";


const submitQuestion = async (data) => {
    const { id, questionId, questionTitle } = data;

    try {
        let questionsPosted = await User.findById(id).select("questionsPosted").lean();
        if (!questionsPosted) {
            console.warn("⚠️ No user found with provided id. Could not persist question in user srv.");
            return;
        }

        questionsPosted = questionsPosted?.questionsPosted;

        const question = {
            questionId,
            questionTitle
        }
        questionsPosted.push(question);

        await User.findByIdAndUpdate(id, { $set: { questionsPosted } })

        console.log("✅ Question persisted successfully");
    } catch (e) {
        console.error("❌ Error while storing the question:", e.message);
    }
}


export const startQuestionConsumer = async () => {
    const { js, jsm, sc, nc } = getJetStreamClients();

    let consumer = null;
    // Get durable consumer using modern API
    try {
        consumer = await js.consumers.get("QUESTION", "question-worker");
        console.log("✅ jetStream consumer question-worker started...");
    } catch (e) {
        console.error("❌ jetStream consumer error", e.message);
    }

    // Pull messages continuously
    const pullMessages = async () => {
        console.log("[*] starting to pull questions...");
        while (true) {
            try {
                const questions = await consumer.fetch({ max_messages: 1, expires: 15000 });

                for await (const q of questions) {
                    const data = JSON.parse(sc.decode(q.data));

                    if (q.info.redelivered) {
                        console.warn("⚠️ Redelivered message skipping...");
                        continue;
                    }
                    console.log("📩 Received question:", data);

                    await submitQuestion(data);

                    q.ack();
                    console.log("✅ ACK done");
                }
            } catch (err) {
                console.error("❌ Error while receiving/processing question:", err.message);
                // Don't ack, will be retried or sent to DLQ if configured
            }

        }
    };

    pullMessages();

};
