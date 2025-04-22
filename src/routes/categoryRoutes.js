import express from "express";
import { getAllCategories, createCategory, getCategoryById, updateCategory, deleteCategory, getAddonByCategory} from "../controllers/categoryController.js";


export const categoryRouter = express.Router();

categoryRouter.route('/')
  .get(getAllCategories)
  .post(createCategory)

categoryRouter.route('/:categoryId')
  .get(getCategoryById)
  .patch(updateCategory)
  .delete(deleteCategory);

categoryRouter.route('/:categoryId/addons')
  .get(getAddonByCategory)

