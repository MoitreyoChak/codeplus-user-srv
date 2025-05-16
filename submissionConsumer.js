import { getJetStreamClients } from "./jetStreamSetup.js";
import { User } from "./UserModel.js";

const makeSubmission = async (data) => {
    const { id, submissionId, qid, questionTitle, problemSetter, status } = data;
    const user = await User.findById(id).select("submissions").lean();

    if (!user) {
        console.warn("⚠️ No user found with provided id. Could not persist submission in user srv.");
        return;
    }

    const submission = {
        submissionId,
        questionId: qid,
        questionTitle,
        status: status
    }
    user.submissions.push(submission);

    // Only increment 'solved' if submission is accepted
    const shouldIncrement = status === "AC";

    try {
        // await User.findByIdAndUpdate(id, user);
        await User.findByIdAndUpdate(
            id,
            {
                $set: { submissions: user.submissions },
                ...(shouldIncrement && { $inc: { solved: 1 } })
            }
        );
        console.log("✅ Submission persisted successfully");
    } catch (e) {
        console.error("❌ Error while storing the submission:", e.message);
    }

}


export const startSubmissionConsumer = async () => {
    const { js, jsm, sc, nc } = getJetStreamClients();

    let consumer = null;
    // Get durable consumer using modern API
    try {
        consumer = await js.consumers.get("USER", "user-submission-worker");
        console.log("✅ jetStream consumer user-submission-worker started...");
    } catch (e) {
        console.error("❌ jetStream consumer error", e.message);
    }

    // Pull messages continuously
    const pullMessages = async () => {
        console.log("[*] starting to pull submissions...");
        while (true) {
            // const messages = await consumer.fetch({ max_messages: 10, expires: 10000 });
            // const messages = await consumer.consume({ expires: 0 }); // 0 = no timeout, keeps listening

            try {
                const messages = await consumer.fetch({ max_messages: 1, expires: 15000 });

                for await (const m of messages) {
                    const data = JSON.parse(sc.decode(m.data));

                    if (m.info.redelivered) {
                        console.warn("⚠️ Redelivered message skipping...");
                        // console.warn("⚠️ Redelivered message:", data);
                        continue;
                    }
                    console.log("📩 Received user submission:", data);

                    await makeSubmission(data);

                    m.ack();
                    console.log("✅ ACK done");
                }
            } catch (err) {
                console.error("❌ Error while receiving/processing submission:", err.message);
                // Don't ack, will be retried or sent to DLQ if configured
            }

        }
    };

    pullMessages();

};
