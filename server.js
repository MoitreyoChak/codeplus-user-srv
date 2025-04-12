import mongoose from "mongoose";
import app from "./app.js";
import { initJetStream } from "./jetStreamSetup.js";


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
            console.log("Successfully connected to MongoDB");
            return Promise.resolve(true);
        }
    } catch (error) {
        console.error(error);
        return Promise.reject(error);
    }
};

const connectjetStream = async () => {
    try {
        await initJetStream();
        console.log("Successfully connected to jetStream");
    } catch (error) {
        console.error(error);
        return Promise.reject(error);
    }
};

await connectDB();
await connectjetStream();


app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});