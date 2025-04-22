import { Router } from "express";
import { createProduct, deleteProduct, getAllProducts, getProductByCategory, getProductById, updateProduct } from "../controllers/productController.js";
import upload from "../middlewares/multer.js";

export const productRouter = Router();

// GET routes
productRouter.get('/category/:categoryId', getProductByCategory);       
// productRouter.get('/search', searchProducts);                           
// productRouter.get('/featured', getFeaturedProducts);                   
productRouter.get('/:productId', getProductById);                      
productRouter.get('/', getAllProducts);                             

// POST route
productRouter.post('/', upload.single('image'), createProduct);         

// PATCH route
productRouter.patch('/:productId', upload.single('image'), updateProduct); 

// DELETE route
productRouter.delete('/:productId', deleteProduct);                     


