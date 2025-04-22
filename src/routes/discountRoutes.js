import express from "express";
import { createDiscount, deleteDiscountById, getAllDiscounts, getDiscountById, updateDiscountById } from "../controllers/discountController.js";

export const discountRouter = express.Router();

discountRouter.get('/:discountId', getDiscountById);
discountRouter.get('/', getAllDiscounts);

discountRouter.post('/', createDiscount);

discountRouter.patch('/:discountId', updateDiscountById);

discountRouter.delete('/:discountId', deleteDiscountById);




