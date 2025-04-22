import express from "express";
import { applyDiscount, createOrder, deleteOrderById, getAllOrders, getOrderById, updateOrderStatus } from "../controllers/orderController.js";

export const orderRouter = express.Router();

orderRouter.route('/')
  .post(createOrder)
  .get(getAllOrders)

orderRouter.route('/:orderId')
  .get(getOrderById)
  .delete(deleteOrderById)

orderRouter.route('/:orderId/apply-discount')
  .patch(applyDiscount)

orderRouter.route('/:orderId/status')
  .patch(updateOrderStatus)