//express dashboard controller

import Order from "../models/Order.js";
import { User } from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { startOfYear, endOfYear, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Parser } from 'json2csv';

// Function to calculate total price including addons
const calculateTotalItemPrice = (item) => {
  const basePrice = item.price || 0;
  const addonsTotal = item.addons && Array.isArray(item.addons) 
    ? item.addons.reduce((sum, addon) => sum + (addon.price || 0), 0) 
    : 0;
  return basePrice + addonsTotal;
};

export const getDashboardSummary = asyncHandler(async (req, res, next) => {
  const now = new Date();
  // Start of Today
  const todayStart = startOfDay(now);
  
  // Get today's orders
  const todayOrders = await Order.find({ createdAt: { $gte: todayStart, $lte: now } });
  const totalOrdersToday = todayOrders.length;
  // Fix the reduce function to properly calculate total sales
  const totalSalesToday = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  const completedOrders = await Order.countDocuments({ status: 'completed' });
  const totalUsers = await User.countDocuments();
  
  // Get the top 5 products sold today
  const topProductsToday = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: todayStart, $lte: now }
      }
    },
    {
      $unwind: "$items"
    },
    {
      $group: {
        _id: "$items.productName",
        totalSold: { $sum: 1 },
        totalRevenue: { $sum: "$items.price" }
      }
    },
    {
      $sort: { totalSold: -1 }
    },
    {
      $limit: 5
    },
    {
      $project: {
        _id: 0,
        productName: "$_id",
        totalSold: 1,
        totalRevenue: 1
      }
    }
  ]);
  
  const data = {
    totalOrdersToday,
    totalSalesToday,
    pendingOrders,
    completedOrders,
    totalUsers,
    topProductsToday
  };
  
  res.status(200).json({
    success: true,
    message: "Dashboard summary fetched successfully",
    data,
  });
});

export const getMonthlySales = asyncHandler(async (req, res, next) => {
  const monthParam = parseInt(req.query.month) || new Date().getMonth() + 1;
  const yearParam = parseInt(req.query.year) || new Date().getFullYear();

  const monthStart = startOfMonth(new Date(yearParam, monthParam - 1));
  const monthEnd = endOfMonth(new Date(yearParam, monthParam - 1));

  const salesByDay = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: monthStart,
          $lte: monthEnd,
        }
      }
    },
    {
      $group: {
        _id: { $dayOfMonth: "$createdAt" },
        totalSales: { $sum: "$total" },
        orderCount: { $sum: 1 }
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);

  const daysInMonth = new Date(yearParam, monthParam, 0).getDate();

  const formatted = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayData = salesByDay.find(item => item._id === day);
    return {
      day: day.toString(),
      date: `${yearParam}-${monthParam.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      totalSales: dayData ? dayData.totalSales : 0,
      orderCount: dayData ? dayData.orderCount : 0
    };
  });

  if (req.query.export === 'csv') {
    const fields = ['date', 'day', 'totalSales', 'orderCount'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formatted);
    res.header('Content-Type', 'text/csv');
    res.attachment(`daily_sales_${yearParam}_${monthParam}.csv`);
    return res.send(csv);
  }

  res.status(200).json({
    success: true,
    message: `Daily sales data for ${monthParam}/${yearParam} fetched successfully`,
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
        // Fix: Changed from $totalPrice to $total to match other functions
        totalSales: { $sum: "$total" },
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
  
  // Check if export to CSV is requested
  if (req.query.export === 'csv') {
    const fields = ['week', 'totalSales'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formatted);
    
    res.header('Content-Type', 'text/csv');
    res.attachment('weekly_sales.csv');
    return res.send(csv);
  }
  
  res.status(200).json({
    success: true,
    message: "Weekly sales data fetched successfully",
    data: formatted
  });
});

export const getYearlySales = asyncHandler(async (req, res, next) => {
  const yearParam = parseInt(req.query.year) || new Date().getFullYear();

  const yearStart = startOfYear(new Date(yearParam, 0));
  const yearEnd = endOfYear(new Date(yearParam, 11));

  const salesByMonth = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: yearStart,
          $lte: yearEnd
        }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalSales: { $sum: "$total" },
        orderCount: { $sum: 1 }
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const formatted = Array.from({ length: 12 }, (_, i) => {
    const monthData = salesByMonth.find(item => item._id === i + 1);
    return {
      month: months[i],
      totalSales: monthData ? monthData.totalSales : 0,
      orderCount: monthData ? monthData.orderCount : 0
    };
  });

  if (req.query.export === 'csv') {
    const fields = ['month', 'totalSales', 'orderCount'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formatted);
    res.header('Content-Type', 'text/csv');
    res.attachment(`monthly_sales_${yearParam}.csv`);
    return res.send(csv);
  }

  res.status(200).json({
    success: true,
    message: `Monthly sales data for year ${yearParam} fetched successfully`,
    data: formatted
  });
});



export const getDailySales = asyncHandler(async (req, res, next) => {
  // Get month and year from query or use current month/year
  const monthParam = parseInt(req.query.month) || new Date().getMonth() + 1;
  const yearParam = parseInt(req.query.year) || new Date().getFullYear();
  
  const monthStart = startOfMonth(new Date(yearParam, monthParam - 1));
  const monthEnd = endOfMonth(new Date(yearParam, monthParam - 1));
  
  const salesByDay = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: monthStart,
          $lte: monthEnd,
        }
      }
    },
    {
      $group: {
        _id: { $dayOfMonth: "$createdAt" },
        totalSales: { $sum: "$total" },
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);
  
  // Get number of days in the selected month
  const daysInMonth = new Date(yearParam, monthParam, 0).getDate();
  
  // Format the results
  const formatted = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayData = salesByDay.find(item => item._id === day);
    return {
      day: day.toString(),
      date: `${yearParam}-${monthParam.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      totalSales: dayData ? dayData.totalSales : 0
    };
  });
  
  // Check if export to CSV is requested
  if (req.query.export === 'csv') {
    const fields = ['date', 'day', 'totalSales'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formatted);
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`daily_sales_${yearParam}_${monthParam}.csv`);
    return res.send(csv);
  }
  
  res.status(200).json({
    success: true,
    message: "Daily sales data fetched successfully",
    data: {
      month: monthParam,
      year: yearParam,
      sales: formatted
    }
  });
});

export const getTopProductsByDay = asyncHandler(async (req, res, next) => {
  // Get date param from query or use current date
  const dateParam = req.query.date ? new Date(req.query.date) : new Date();
  const dayStart = startOfDay(dateParam);
  const dayEnd = endOfDay(dateParam);
  
  // Number of top products to return
  const limit = parseInt(req.query.limit) || 5;
  
  // Get top products for the specified day
  const topProducts = await Order.aggregate([
    {
      // Match orders from the specified day
      $match: {
        createdAt: { $gte: dayStart, $lte: dayEnd }
      }
    },
    {
      // Unwind the items array to get individual products
      $unwind: "$items"
    },
    {
      // Add calculated field for total item price (including addons)
      $addFields: {
        "itemTotalPrice": {
          $add: [
            "$items.price",
            { $sum: "$items.addons.price" }
          ]
        }
      }
    },
    {
      // Group by product name since there's no product ID reference
      $group: {
        _id: "$items.productName",
        // Count occurrences of each product
        totalSold: { $sum: 1 },
        // Total revenue is base price plus addons
        totalRevenue: { $sum: "$itemTotalPrice" },
        // Get a sample of addon combinations for this product
        addonCombinations: { $push: "$items.addons" }
      }
    },
    {
      // Sort by count in descending order
      $sort: { totalSold: -1 }
    },
    {
      // Limit to top products
      $limit: limit
    },
    {
      // Project the final result
      $project: {
        _id: 0,
        productName: "$_id",
        totalSold: 1,
        totalRevenue: 1,
        // Limit addon combinations to 3 examples
        popularAddons: { $slice: ["$addonCombinations", 0, 3] }
      }
    }
  ]);

  // Format the date for the response
  const formattedDate = dateParam.toISOString().split('T')[0];

  // Check if export to CSV is requested
  if (req.query.export === 'csv') {
    // For CSV export, simplify the data structure by removing complex objects
    const csvData = topProducts.map(product => ({
      productName: product.productName,
      totalSold: product.totalSold,
      totalRevenue: product.totalRevenue,
      // Convert popularAddons to a simple string representation for CSV
      popularAddons: JSON.stringify(product.popularAddons)
    }));
    
    const fields = ['productName', 'totalSold', 'totalRevenue', 'popularAddons'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`top_products_${formattedDate}.csv`);
    return res.send(csv);
  }

  res.status(200).json({
    success: true,
    message: `Top ${limit} products sold on ${formattedDate} fetched successfully`,
    data: {
      date: formattedDate,
      products: topProducts
    }
  });
});

export const getTopProductsByMonth = asyncHandler(async (req, res, next) => {
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));

  const result = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
      },
    },
    { $unwind: "$items" },
    {
      $addFields: {
        "items.totalItemPrice": {
          $add: ["$items.price", { $sum: "$items.addons.price" }],
        },
      },
    },
    {
      $group: {
        _id: "$items.productName",
        totalSold: { $sum: 1 },
        totalRevenue: { $sum: "$items.totalItemPrice" },
      },
    },
    { $sort: { totalSold: -1 } },
  ]);

  const topProducts = result.map(item => ({
    productName: item._id,
    totalSold: item.totalSold,
    totalRevenue: item.totalRevenue,
  }));

  res.status(200).json({
    success: true,
    message: `Top products for ${month}/${year} fetched successfully`,
    data: topProducts,
  });
});


export const getTopProductsByYear = asyncHandler(async (req, res, next) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year}-12-31`);

  const result = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
      },
    },
    { $unwind: "$items" },
    {
      $addFields: {
        "items.totalItemPrice": {
          $add: ["$items.price", { $sum: "$items.addons.price" }],
        },
      },
    },
    {
      $group: {
        _id: "$items.productName",
        totalSold: { $sum: 1 },
        totalRevenue: { $sum: "$items.totalItemPrice" },
      },
    },
    { $sort: { totalSold: -1 } },
  ]);

  const topProducts = result.map(item => ({
    productName: item._id,
    totalSold: item.totalSold,
    totalRevenue: item.totalRevenue,
  }));

  res.status(200).json({
    success: true,
    message: `Top products for ${year} fetched successfully`,
    data: topProducts,
  });
});


export const getProductTrends = asyncHandler(async (req, res, next) => {
  // Get the product name from query parameters
  const productName = req.query.productName;
  
  if (!productName) {
    return res.status(400).json({
      success: false,
      message: "Product name is required"
    });
  }

  // Get number of days to analyze
  const days = parseInt(req.query.days) || 7;
  const today = new Date();
  
  // Create an array of the last 'days' days
  const dailyData = [];
  
  for (let i = 0; i < days; i++) {
    const date = subDays(today, i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    // Aggregate sales for this product on this day
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dayStart, $lte: dayEnd }
        }
      },
      {
        $unwind: "$items"
      },
      {
        $match: {
          "items.productName": productName
        }
      },
      {
        // Add calculated field for total item price (including addons)
        $addFields: {
          "itemTotalPrice": {
            $add: [
              "$items.price",
              { $sum: "$items.addons.price" }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          // Count occurrences
          totalSold: { $sum: 1 },
          // Total revenue includes addons
          totalRevenue: { $sum: "$itemTotalPrice" },
          // Get popular addon combinations
          addonCombinations: { $push: "$items.addons" }
        }
      }
    ]);
    
    // Process addon data to find most common combinations (if there's data)
    let addonStats = [];
    if (result.length > 0 && result[0].addonCombinations && result[0].addonCombinations.length > 0) {
      // Here we could analyze addon combinations, but for now just grab the first few examples
      addonStats = result[0].addonCombinations.slice(0, 3);
    }
    
    dailyData.push({
      date: date.toISOString().split('T')[0],
      totalSold: result.length > 0 ? result[0].totalSold : 0,
      totalRevenue: result.length > 0 ? result[0].totalRevenue : 0,
      addonExamples: addonStats
    });
  }
  
  // Sort by date ascending
  dailyData.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Check if export to CSV is requested
  if (req.query.export === 'csv') {
    // For CSV, simplify the addon data
    const csvData = dailyData.map(day => ({
      date: day.date,
      productName,
      totalSold: day.totalSold,
      totalRevenue: day.totalRevenue,
      // Convert addon examples to a simple string
      addonExamples: JSON.stringify(day.addonExamples)
    }));
    
    const fields = ['date', 'productName', 'totalSold', 'totalRevenue', 'addonExamples'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`product_trend_${productName}_${days}days.csv`);
    return res.send(csv);
  }
  
  res.status(200).json({
    success: true,
    message: `Sales trend for ${productName} over the last ${days} days fetched successfully`,
    data: {
      productName,
      dailyData
    }
  });
});