import Addon from "../models/Addon.js";
import Category from "../models/Category.js";
import asyncHandler from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/errorTypes.js";
import { withTransaction } from "../utils/withTransaction.js";
import mongoose from "mongoose";

/**
 * @desc create new product category
 * @route POST /api/v1/categories
 * @access Private/Admin
 */
export const createCategory = asyncHandler(async(req, res, next) => {
  const {name, desc} = req.body;

  if(!name) throw new BadRequestError("Category name is required");

  const formattedName = name
    .split(' ') 
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); 
    })
    .join(' '); 

  const existingCategory = await Category.findOne({ name: formattedName });
  if (existingCategory) {
    throw new BadRequestError("Category already exists");
  }

  const result = await withTransaction(async(session) => {

    const category = new Category({name: formattedName, description: desc});
    await category.save({session});

    return {
      success: true,
      message: "New product category was created"
    }
  });

  res.status(201).json(result);
})

/**
 * @desc Get all product categories
 * @route GET /api/v1/categories
 * @access Public
 */
export const getAllCategories = asyncHandler(async(req, res, next) => {
  const categories = await Category.find();

  if (categories.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No categories set up yet. Please add categories.',
      data: [] 
    });
  }

  return res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    data: categories
  })
});


/**
 * @desc Get category by ID
 * @route GET /api/v1/categories/:categoryId 
 * @access Public
 */
export const getCategoryById = asyncHandler(async(req, res, next) => {
  const {categoryId} = req.params;

  if(!mongoose.Types.ObjectId.isValid(categoryId)) throw new BadRequestError("Invalid category id")

  const category = await Category.findById(categoryId);
  if(!category) throw new BadRequestError("categoryId not found");

  return res.status(200).json({
    success: true,
    message: `${categoryId} fetch successfully`,
    data: category
  })
});

/**
 * @desc Update category by ID
 * @route PUT /api/v1/categories/:id
 * @access Private/Admin
 */
export const updateCategory = asyncHandler(async(req, res, next) => {
  const {name, desc} = req.body;
  const {categoryId} = req.params;

  if(!name) throw new BadRequestError("Category name is required");

  const formattedName = name
    .split(' ') 
    .map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); 
    })
    .join(' '); 

  const existingCategory = await Category.findOne({ name: formattedName });
  if (existingCategory) {
    throw new BadRequestError("Category already exists");
  }

  const updatedCategory = await Category.findByIdAndUpdate(categoryId, {name: formattedName, description: desc}, {new: true});

  res.status(201).json({
    success: true,
    message: `${categoryId} updated successfully`
  })
});

/**
 * @desc Delete category by ID
 * @route DELETE /api/v1/categories/:id
 * @access Private/Admin
 */
export const deleteCategory = asyncHandler(async(req, res, next) => {
  const {categoryId} = req.params;

  if(!mongoose.Types.ObjectId.isValid(categoryId)) throw new BadRequestError("Invalid category id");

  const deletedCategory = await Category.findByIdAndDelete(categoryId);
  if(!deletedCategory) throw new BadRequestError("categoryId not found");

  return res.status(200).json({
    success: true,
    message: `${categoryId} deleted successfully`
  })
});


export const getAddonByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(categoryId)) throw new BadRequestError("Invalid category ID");
  const addons = await Addon.find({ isGlobal: false, applicableCategories: categoryId, available: true });
  res.status(200).json({
    success: true,
    message: "Addons fetched successfully",
    data: addons
  });
});
