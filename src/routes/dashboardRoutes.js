//express dashboard routes

import express from "express";
import { 
  getDashboardSummary, 
  getMonthlySales, 
  getTopProductsByDay, 
  getWeeklySales,
  getYearlySales,
  getDailySales,
  getTopProductsByMonth,
  getTopProductsByYear,
  getProductTrends
} from "../controllers/dashboardController.js";

export const dashboardRouter = express.Router();

dashboardRouter.route('/')
  .get(getDashboardSummary)

dashboardRouter.route('/weeklysales')
  .get(getWeeklySales)

dashboardRouter.route('/monthlysales')
  .get(getMonthlySales)

dashboardRouter.route('/yearlysales')
  .get(getYearlySales)

dashboardRouter.route('/dailysales')
  .get(getDailySales)

dashboardRouter.route('/productSales')
  .get(getTopProductsByDay)

dashboardRouter.route('/productSalesByMonth')
  .get(getTopProductsByMonth)

dashboardRouter.route('/productSalesByYear')
  .get(getTopProductsByYear)

dashboardRouter.route('/productTrends')
  .get(getProductTrends)
