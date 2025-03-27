import express from 'express';
import 'dotenv/config'
import routes from './routes.js';
import globalErrorHandler from './globalErrorHandler.js';

const app = express();

app.use(express.json());

app.use("/user", routes);

app.use("*", (req, res) => {
    res.send('route not found')
})

app.use(globalErrorHandler);
export default app;