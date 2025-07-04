import mongoose from "mongoose";
import app from "./app.js";
import { initJetStream } from "./jetStreamSetup.js";
import { startSubmissionConsumer } from "./submissionConsumer.js";
import { withRetry } from "./utils/retryLogic.js";

// import { startQuestionConsumer } from "./questionConsumer.js";


console.clear();

const PORT = 5000;
const { MONGODB_URI } = process.env;
let isConnected = false;

const connectDB = async () => {
    try {
        const { connection } = await mongoose.connect(MONGODB_URI);
        isConnected = connection.readyState === 1;

        if (isConnected) {
            console.log("✅ Successfully connected to MongoDB");
            return Promise.resolve(true);
        }
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        return Promise.reject(error);
    }
};

// Start server function
const startServer = () => {
    app.listen(PORT, () => {
        console.log(`✅ User server listening on port ${PORT}...`);
    });
};

// Initialize services
const initializeServices = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Initialize JetStream
        // await initJetStream();
        try {
            await withRetry(initJetStream, {
                name: 'connect to JetStream',
            });
            console.log("✅ Successfully connected to JetStream");
        } catch (e) {
            console.error("❌ JetStream connection error:", e.message);
            // Continue even if JetStream fails
        }

        // Start the main server
        startServer();

        // Start consumers in the background
        await withRetry(startSubmissionConsumer, {
            name: 'start Submission Consumer'
        });
        // startSubmissionConsumer().catch(error => {
        //     console.error("❌ Submission consumer error:", error.message);
        //     // Consumer will keep retrying in the background
        // });

        // Optionally start question consumer
        // startQuestionConsumer().catch(error => {
        //     console.error("❌ Question consumer error:", error.message);
        // });

    } catch (error) {
        console.error("❌ Fatal error during initialization:", error);
        process.exit(1);
    }
};

// Start everything
initializeServices();