import { connect, StringCodec, RetentionPolicy, AckPolicy } from "nats";

let nc, js, jsm, sc;

export const initJetStream = async () => {
    nc = await connect({ servers: "localhost:4222" });
    js = nc.jetstream();
    jsm = await nc.jetstreamManager();
    sc = StringCodec();

    // Ensure the stream exists
    try {
        await jsm.streams.add({
            name: "USER",
            retention: RetentionPolicy.Workqueue,
            subjects: ["user.submission.*"],
        })

        await jsm.streams.add({
            name: "QUESTION",
            retention: RetentionPolicy.Workqueue,
            subjects: ["question.*"],
        });

        // console.log("✅ Stream created successfully.")

        // Ensure durable consumer exists
        try {
            await jsm.consumers.info("USER", "user-submission-worker");
            console.log("✅ Durable consumer user-submission-worker already exists.");
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
            console.log("✅ Durable consumer user-submission-worker created.");
        }

        try {
            await jsm.consumers.info("QUESTION", "question-worker");
            console.log("✅ Durable consumer already exists.");
        } catch (err) {
            await jsm.consumers.add("QUESTION", {
                durable_name: "question-worker",
                ack_policy: AckPolicy.Explicit,
                filter_subject: "question.created",
                deliver_policy: "all",
                max_deliver: 5, // Retry up to 5 times
                ack_wait: 30_000, // Retry after 30 seconds if not acked
                replay_policy: "instant",
            });
            console.log("✅ Durable consumer question-worker created.");
        }
    } catch (e) {
        console.log("❌ error while setting up the stream: ", e.message)
    }

    return { nc, js, jsm, sc };
};

export const getJetStreamClients = () => {
    return { nc, js, jsm, sc };
};
