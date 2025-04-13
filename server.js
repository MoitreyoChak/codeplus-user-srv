import mongoose from "mongoose";
import app from "./app.js";
import { initJetStream } from "./jetStreamSetup.js";
import { startSubmissionConsumer } from "./submissionConsumer.js";
import { startQuestionConsumer } from "./questionConsumer.js";


console.clear();

const PORT = 5000;
const { MONGODB_URI } = process.env;
let isConnected = false;

const connectDB = async () => {
    // if (isConnected) {
    //     console.log("Using existing MongoDB connection");
    //     return;
    // }
    try {
        const { connection } = await mongoose.connect(MONGODB_URI);
        isConnected = connection.readyState === 1;

        if (isConnected) {
            console.log("✅ Successfully connected to MongoDB");
            return Promise.resolve(true);
        }
    } catch (error) {
        console.error(error);
        return Promise.reject(error);
    }
};


await connectDB();

try {
    await initJetStream();
    console.log("✅ Successfully connected to jetStream");
} catch (e) {
    console.error("❌ jetStream connection error", e.message);
}

await startSubmissionConsumer();
await startQuestionConsumer();


app.listen(PORT, () => {
    console.log(`user server listening on port ${PORT}...`);
});