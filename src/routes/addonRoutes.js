import express from 'express';
import {
  createAddon,
  getAllAddons,
  getAddonById,
  updateAddon,
  deleteAddon,
  getGlobalAddons
} from '../controllers/addonController.js';

export const addonRouter = express.Router();

addonRouter.route('/')
  .get(getAllAddons)
  .post(createAddon);

addonRouter.route('/global')
  .get(getGlobalAddons)

addonRouter.route('/:addonId')
  .get(getAddonById)
  .patch(updateAddon)
  .delete(deleteAddon);



