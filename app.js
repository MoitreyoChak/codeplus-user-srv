import express from 'express';
import 'dotenv/config'
import routes from './routes.js';
import globalErrorHandler from './globalErrorHandler.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware

// Update CORS configuration
app.use(cors({
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use("/user", routes);

app.use("*", (req, res) => {
    res.send('route not found')
})

app.use(globalErrorHandler);
export default app;