import express from "express";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";

// importing routes
// import userRoute from "./routes/user.js"
import userRoute from "./routes/user.js";
import productRoute from "./routes/products.js";

const port = 3000;

connectDB();
const app = express();

app.use(express.json());
// using Routes

app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);

app.get("/", (req, res) => {
  res.send("API Working With /api/v1");
});

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Express is Server Is working on http://localhost:${port}`);
});
