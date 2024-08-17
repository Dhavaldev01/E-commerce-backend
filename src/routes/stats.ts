/// Deshboad Statices  Admin Na Chart na Data

import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { getbarCharts, getDashboardStats, getLineCharts, getPieCharts } from "../controllers/stats.js";

const app = express.Router();
// create route Dashboard-pie/bar/line-chart
// route - api/v1/dashboard/stats
app.get("/stats" ,adminOnly, getDashboardStats);

// route - api/v1/dashboard/pie
app.get("/pie" , adminOnly,getPieCharts);

// route - /api/v1/dashboard/bar
app.get("/bar",adminOnly,getbarCharts);

// route - /api/v1/dashboard/line
app.get("/line",adminOnly,getLineCharts);

export default app;
