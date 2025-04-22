import Product from "../models/Product.js";
import ProductCategory from "../models/Category.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { withTransaction } from "../utils/withTransaction.js";
import { BadRequestError, InternalServerError, NotFoundError } from "../utils/errorTypes.js";
import cloudinary from "../config/cloudinary.js";
import Category from "../models/Category.js";

/**
 * @desc Get all product
 * @route GET /api/v1/products
 * @access Admin
 */
export const getAllProducts = asyncHandler(async(req, res, next) => {
  const products = await Product.find()
    .populate('category', 'name')

  if (products.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No products set up yet. Please add products.',
      data: [] 
    });
  }

  return res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: products
  })
});

/**
 * @desc Create a new product with image upload
 * @route POST /api/v1/products
 * @access Admin
 */
export const createProduct = asyncHandler(async (req, res) => {
  const { name, basePrice, categoryId } = req.body;

  // Validate required fields
  if (!name || !basePrice || !categoryId ) {
    return res.status(400).json({ success: false, message: 'Name, price, category are required' });
  }

  const result =  await withTransaction(async(session) => {
    
    // Check if the category exists
    const category = await ProductCategory.findById(categoryId).session(session);
    if (!category) throw new NotFoundError("Category not found")

    const upload = await uploadToCloudinary("products", req.file);

    const product = new Product({
      name,
      basePrice,
      category: categoryId,
      image: upload.secure_url,
      cloudinary_public_id: upload.public_id,
    });

    await product.save({session});

    return {
      success: true,
      message: 'Product created successfully',
      data: product,
    };
  });

  return res.status(201).json(result);
});

/**
 * @desc Delete a product and its image from Cloudinary
 * @route DELETE /api/v1/products/:productId
 * @access Admin
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params

  if(!productId) throw new BadRequestError("ProductId is required")

  const result = await withTransaction(async(session) => {
    const product = await Product.findById(productId).session(session);
    if(!product) throw new NotFoundError("Product not found");

    if(product.cloudinary_public_id){
      try {
        await cloudinary.v2.uploader.destroy(product.cloudinary_public_id);
      } catch (error) {
        throw new InternalServerError("Failed to delete image from cloudinary.")
      }
    }

    await product.deleteOne({session});

    return {
      success: false,
      message: "Product deleted successfully"
    }
  });

  return res.status(200).json(result);
});

/**
 * @desc Update a product with image upload and cloudinary deletion
 * @route PUT /api/v1/products/:productId
 * @access Admin
 */
export const updateProduct = asyncHandler(async(req, res, next) => {
  const { productId } = req.params;
  const {name, basePrice, categoryId, available} = req.body;

  if(!productId) throw new BadRequestError("ProductId is required");

  const result = await withTransaction(async(session) => {
    const product = await Product.findById(productId).session(session);
    if(!product) throw new NotFoundError("Product not found");

    if (name) product.name = name;
    if (basePrice) product.basePrice = basePrice;
    if (categoryId) product.category = categoryId;
    if (available) product.available = available;

    if(req.file){
      if(product.cloudinary_public_id){
        try {
          await cloudinary.v2.uploader.destroy(product.cloudinary_public_id);
        } catch (error) {
          throw new InternalServerError("Failed to delete image from cloudinary.")
        }
      }

      const image = await uploadToCloudinary("products", req.file);
      product.image = image.secure_url;
      product.cloudinary_public_id = image.public_id;
    }

    // Save the updated product
    await product.save({ session });

    return {
        success: true,
        message: 'Product updated successfully',
        data: product,
    };
  })

  return res.status(200).json(result)
});

/**
 * @desc Get product by id
 * @route GET /api/v1/products/:productId
 * @access Admin
 */
export const getProductById = asyncHandler(async(req, res, next) => {
  const {productId} = req.params

  if(!productId) throw new BadRequestError("ProductId is required");

  const product = await Product.findById(productId)
    .populate('category', 'name');
  if(!product) throw new NotFoundError("Product not found");

  return res.status(200).json({
    success: true,
    message: "Product fecthed successfully",
    data: product
  });
});

/**
 * @desc Get product by category
 * @route GET /api/v1/products/category/:categoryId
 * @access Admin
 */
export const getProductByCategory = asyncHandler(async(req, res, next) => {
  const {categoryId} = req.params

  if(!categoryId) throw new BadRequestError("CategoryId is required");

  const category = await Category.findById(categoryId);
  if(!category) throw new NotFoundError("This category do not exist");

  const product = await Product.find({category: categoryId});
  if(!product) throw new NotFoundError("No products yet in this category");

  return res.status(200).json({
    success: true,
    message: 'Products fetched successfully',
    data: product
  });
});
