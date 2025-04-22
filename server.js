import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { dbConnection } from "./src/config/db.js";
import errorHandler from "./src/middlewares/errorHandler.js";
import { authRouter } from "./src/routes/authRoutes.js";
import { categoryRouter } from "./src/routes/categoryRoutes.js";
import { productRouter } from "./src/routes/productRoutes.js";
import { discountRouter } from "./src/routes/discountRoutes.js";
import { addonRouter } from "./src/routes/addonRoutes.js";
import { orderRouter } from "./src/routes/orderRoutes.js";
import { dashboardRouter } from "./src/routes/dashboardRoutes.js";

const server = express();
const PORT = 8080;

//Cors Config
const corsOptions = {
  origin: "*"
};

//Middleware
server.use(cors(corsOptions));
server.use(express.json());
server.use(cookieParser());

//Routes
server.use('/api/v1/auth', authRouter);
server.use('/api/v1/dashboard', dashboardRouter);
server.use('/api/v1/categories', categoryRouter);
server.use('/api/v1/products', productRouter);
server.use('/api/v1/discounts', discountRouter);
server.use('/api/v1/addons', addonRouter);
server.use('/api/v1/orders', orderRouter);

//Error Handler
server.use(errorHandler);

server.listen(PORT, () => {
  console.log(`server is running on port: ${PORT}`)
});

dbConnection();