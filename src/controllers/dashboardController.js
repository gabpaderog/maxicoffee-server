import Order from "../models/Order.js";
import { User } from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { startOfYear, endOfYear } from 'date-fns';

export const getDashboardSummary = asyncHandler(async (req, res, next) => {
  const now = new Date();

  // Start of Today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  console.log(todayStart)

  // Get today's orders
  const todayOrders = await Order.find({ createdAt: { $gte: todayStart, $lte: now } });

  const totalOrdersToday = todayOrders.length;
  const totalSalesToday = todayOrders.reduce((sum, order) => console.log(sum, order.total), 0);


  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  const completedOrders = await Order.countDocuments({ status: 'completed'});

  const totalUsers = await User.countDocuments();

  const data = {
    totalOrdersToday,
    totalSalesToday,
    pendingOrders,
    completedOrders,
    totalUsers,
  };

  res.status(200).json({
    success: true,
    message: "Dashboard summary fetched successfully",
    data,
  });
});

export const getMonthlySales = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  const salesByMonth = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: yearStart,
          $lte: yearEnd,
        }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalSales: { $sum: "$total" },
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);

  // Map numeric month to month name
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const formatted = Array.from({ length: 12 }, (_, i) => {
    const monthData = salesByMonth.find(item => item._id === i + 1);
    return {
      month: months[i],
      totalSales: monthData ? monthData.totalSales : 0
    };
  });

  res.status(200).json({
    success: true,
    message: "Monthly sales data fetched successfully",
    data: formatted
  });
});


export const getWeeklySales = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  const salesByWeek = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: yearStart,
          $lte: yearEnd,
        }
      }
    },
    {
      $group: {
        _id: { $isoWeek: "$createdAt" },
        totalSales: { $sum: "$totalPrice" },
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);

  // Format weeks to Week 1, Week 2, ...
  const formatted = Array.from({ length: 52 }, (_, i) => {
    const weekData = salesByWeek.find(item => item._id === i + 1);
    return {
      week: `Week ${i + 1}`,
      totalSales: weekData ? weekData.totalSales : 0
    };
  });

  res.status(200).json({
    success: true,
    message: "Weekly sales data fetched successfully",
    data: formatted
  });
});
