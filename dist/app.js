import express from "express";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import NodeCache from 'node-cache';
import { config } from 'dotenv';
import morgan from 'morgan';
// importing routes
// import userRoute from "./routes/user.js"
import userRoute from "./routes/user.js";
import productRoute from "./routes/products.js";
import orderRoute from "./routes/order.js";
import paymentRoute from "./routes/payment.js";
// env file no Path Devano
config({
    path: "./.env"
});
// console.log(process.env.PORT);
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI || "";
connectDB(mongoURI);
export const myCache = new NodeCache();
const app = express();
app.use(express.json());
// app.use(morgan("dev"));
app.use(morgan('dev'));
// using Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.get("/", (req, res) => {
    res.send("API Working With /api/v1");
});
app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);
app.listen(port, () => {
    console.log(`Express is Server Is working on http://localhost:${port}`);
});
