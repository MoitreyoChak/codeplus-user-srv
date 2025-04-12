import { connect, StringCodec, RetentionPolicy, StorageType } from "nats";

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
        // console.log("✅ Stream created successfully.")
    } catch (e) {
        console.log("❌ error while setting up the stream: ", e.message)
    }

    return { nc, js, jsm, sc };
};

export const getJetStreamClients = () => {
    return { nc, js, jsm, sc };
};
