import { initJetStream, getJetStreamClients } from "./jetStreamSetup.js";
import { AckPolicy } from "nats";
// import { makeSubmissionFromMessage } from "./controllers.js";


(async () => {
    console.clear();
    await initJetStream();
    const { js, jsm, sc, nc } = getJetStreamClients();

    // Ensure durable consumer exists
    try {
        await jsm.consumers.info("USER", "user-submission-worker");
        console.log("✅ Durable consumer already exists.");
    } catch (err) {
        await jsm.consumers.add("USER", {
            durable_name: "user-submission-worker",
            ack_policy: AckPolicy.Explicit,
            filter_subject: "user.submission.created",
            deliver_policy: "all",
            max_deliver: 5, // Retry up to 5 times
            ack_wait: 30_000, // Retry after 30 seconds if not acked
            replay_policy: "instant",
        });
        console.log("✅ Durable consumer created.");
    }


    // Get durable consumer using modern API
    const consumer = await js.consumers.get("USER", "user-submission-worker");

    // Pull messages continuously
    const pullMessages = async () => {
        console.log("[*] starting to pull messages...");
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

                    await new Promise(r => setTimeout(r, 0));
                    m.ack();
                    console.log("✅ ACK done");
                }
            } catch (err) {
                console.error("❌ Error while receiving/processing message:", err.message);
                // Don't ack, will be retried or sent to DLQ if configured
            }

        }
    };

    pullMessages();
})();
