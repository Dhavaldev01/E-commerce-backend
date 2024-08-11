import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { newOrder, myOrders, allOrders, getSingleOrder, processOrder, deleteOrder, } from "../controllers/order.js";
const app = express.Router();
// route--- /api/v1/order/new
app.post("/new", newOrder);
// route--- /api/v1/order/my
app.get("/my", myOrders);
// route--- /api/v1/order/my
app.get("/all", adminOnly, allOrders);
app
    .route("/:id")
    .get(getSingleOrder)
    .put(adminOnly, processOrder)
    .delete(adminOnly, deleteOrder);
export default app;
