import Order from "../models/Order.js";
import Discount from "../models/Discount.js";
import asyncHandler from "../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/errorTypes.js";
import mongoose from "mongoose";
import { User } from "../models/User.js";

/**
 * @desc Create a new order
 * @route POST /api/v1/orders
 * @access Public
 */
export const createOrder = asyncHandler(async (req, res, next) => {
  const { userId, items, discountId } = req.body;

  // Validate required fields
  if (!userId || !Array.isArray(items) || items.length === 0) throw new BadRequestError("User, items, and total are required fields.");

  if(!mongoose.Types.ObjectId.isValid(userId)) throw new BadRequestError("Invalid userId")

  const user = await User.findById(userId);
  if(!user) throw new NotFoundError("User not found")

  let total = 0;
  items.forEach(item => {
    total += item.price;
    
    // Add addon prices
    item.addons.forEach(addon => {
      total += addon.price;
    });
  });
 
  let discount = null;
  let discountDetails = null;
  let discountApplied = false;
  if (discountId) {
    if (!mongoose.Types.ObjectId.isValid(discountId)) throw new BadRequestError("Invalid discount ID.");
    discount = await Discount.findById(discountId);
    if (!discount) throw new BadRequestError("Discount not found.");

    discountDetails = {
      name : discount.name,
      percentage : discount.percentage
    }

    if(discount.requiresVerification === false  && discount.percentage > 0){
        total = total - (total * discount.percentage);
        discountApplied = true;
    }
  }

  
  const order = new Order({
    user: userId,
    items,
    discount: discount?._id || null,
    discountDetails,
    discountApplied,
    total
  });

  await order.save();

  return res.status(201).json({ 
    success: true,
    message: "Order successfully created",
    data: order 
  });
});

/**
 * @desc Update order status
 * @route POST /api/v1/orders/:orderId/status
 * @access Public
 */
export const updateOrderStatus = asyncHandler(async(req, res, next) => {
  const {status} = req.body;
  const {orderId} = req.params

  if (!['pending', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) throw new BadRequestError("Invalid status value");

  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new BadRequestError("Invalid order ID.");
  
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  order.status = status;
  await order.save();

  return res.status(200).json({
    success: true,
    message: "Order status updated successfully"
  });
});

/**
 * @desc Get all orders (admin only)
  * @route GET /api/v1/orders
  * @access Private (admin)
 */
export const getAllOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    data: orders
  });
} );

/**
 * @desc Get order by ID
 * @route GET /api/v1/orders/:orderId
 * @access Public
 */
export const getOrderById = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new BadRequestError("Invalid order ID.");

  const order = await Order.findById(orderId)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  if (!order) throw new NotFoundError("Order not found");

  return res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    data: order
  });
});

export const applyDiscount = asyncHandler(async (req, res, next) => {
  const { discountApplied } = req.body;
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new BadRequestError("Invalid order ID.");

  const order = await Order.findById(orderId).populate('discount');
  if (!order) throw new NotFoundError("Order not found");
  if (order.discountApplied) throw new BadRequestError("Discount already applied to this order.");

  if (!order.discount || !order.discount.percentage) {
    throw new BadRequestError("No valid discount found for this order.");
  }

  // Calculate new total based on discount percentage
  const discountPercentage = order.discount.percentage;
  const newTotal = order.total - (order.total * discountPercentage);

  order.total = newTotal;
  order.discountApplied = true;
  await order.save();

  return res.status(200).json({
    success: true,
    message: "Discount applied successfully.",
    data: order
  });
});


export const deleteOrderById = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new BadRequestError("Invalid order ID.");

  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");
  

  
  await order.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Order deleted successfully."
  });
});