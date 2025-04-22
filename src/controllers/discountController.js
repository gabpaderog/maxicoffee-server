import Discount from "../models/Discount.js";
import asyncHandler from "../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/errorTypes.js";
import { withTransaction } from "../utils/withTransaction.js";
import mongoose from "mongoose";


/**
 * @desc Create a new discount
 * @route POST /api/v1/discounts
 * @access Admin
 */
export const createDiscount = asyncHandler(async(req, res, next) => {
  const {name, percentage, requiresVerification} = req.body;

  if(!name || !percentage) throw new BadRequestError("Discount name and percentage is required");

  const result = await withTransaction(async(session)=>{
    const discount = new Discount({
      name,
      percentage,
      requiresVerification
    });

    await discount.save({session});

    return {
      success: true,
      message: "Discount created successfully"
    }
  });

  return res.status(200).json(result)
})

/**
 * @desc Get all discounts
 * @route GET /api/v1/discounts
 * @access Public
 */
export const getAllDiscounts = asyncHandler(async(req, res, next)=>{
  const discounts = await Discount.find();
 
  if (discounts.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No discounts set up yet. Please add discounts.',
      data: [] 
    });
  }

  return res.status(200).json({
    success: true,
    message: "Discounts fetched successfully",
    data: discounts
  });
});

/**
 * @desc Get discount by id
 * @route GET /api/v1/discounts/:discountId
 * @access Public
 */
export const getDiscountById = asyncHandler(async(req, res, next)=>{
  const {discountId} = req.params;
 
  if (!mongoose.Types.ObjectId.isValid(discountId)) throw new BadRequestError("Invalid discount ID");

  if(!discountId) throw new BadRequestError("DiscountId is required");

  const discount = await Discount.findById(discountId);
  if(!discount) throw new NotFoundError("Discount not found");

  return res.status(200).json({
    success: true,
    message: "Discount fetched successfully",
    data: discount
  });
});

/**
 * @desc Update discount by id
 * @route PATCH /api/v1/discounts/:discountId
 * @access Admin
 */
export const updateDiscountById = asyncHandler(async(req, res, next)=>{
  const {name, percentage, requiresVerification} = req.body;
  const {discountId} = req.params;

  if (!mongoose.Types.ObjectId.isValid(discountId)) throw new BadRequestError("Invalid discount ID");
  
  const discount = await Discount.findById(discountId);
  if(!discount) throw new NotFoundError("Discount not found");

  if(name) discount.name = name;
  if(percentage) discount.percentage = percentage;
  if(requiresVerification) discount.requiresVerification = requiresVerification;

  await discount.save()

  return res.status(200).json({
    success: true,
    message: "Discount successfully updated",
    data: discount
  });
});

/**
 * @desc Delete discount by id
 * @route DELETE /api/v1/discounts/:discountId
 * @access Admin
 */
export const deleteDiscountById = asyncHandler(async(req, res, next)=>{
  const {discountId} = req.params;

  if (!mongoose.Types.ObjectId.isValid(discountId)) throw new BadRequestError("Invalid discount ID");

  const discount = await Discount.findByIdAndDelete(discountId);
  if (!discount) {
    throw new NotFoundError("Discount not found");
  }

  return res.status(200).json({
    success: true,
    message: "Deleted successfully"
  });
});

