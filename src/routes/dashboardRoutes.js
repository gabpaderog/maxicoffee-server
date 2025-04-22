import express from "express";
import { getDashboardSummary, getMonthlySales, getWeeklySales } from "../controllers/dashboardController.js";


export const dashboardRouter = express.Router();

dashboardRouter.route('/')
  .get(getDashboardSummary)

dashboardRouter.route('/weeklysales')
  .get(getWeeklySales)

dashboardRouter.route('/monthlysales')
  .get(getMonthlySales)

