import Addon from '../models/Addon.js';
import asyncHandler from '../utils/asyncHandler.js';
import { NotFoundError } from '../utils/errorTypes.js';
import mongoose from "mongoose";

// Create an addon
export const createAddon = asyncHandler(async (req, res) => {
  const { name, price, isGlobal, applicableCategories } = req.body;

  if (!name || price == null) {
    return res.status(400).json({ success: false, message: "Name and price are required" });
  }

  const addon = new Addon({
    name,
    price,
    isGlobal,
    applicableCategories: isGlobal ? [] : applicableCategories || []
  });

  await addon.save();

  return res.status(201).json({
    success: true,
    message: "Addon created successfully",
    data: addon
  });
});

// Get all addons
export const getAllAddons = asyncHandler(async (req, res) => {
  const addons = await Addon.find().populate('applicableCategories');
  res.status(200).json({ 
    success: true, 
    message: "Addons fetched successfully",
    data: addons 
  });
});

// Get addon by ID
export const getAddonById = asyncHandler(async (req, res) => {
  const {addonId} = req.params;
  if (!mongoose.Types.ObjectId.isValid(addonId)) throw new BadRequestError("Invalid addon ID");
  const addon = await Addon.findById(addonId).populate('applicableCategories');
  if (!addon) throw new NotFoundError('Addon not found');
  res.status(200).json({ 
    success: true, 
    message: "Addon fetched successfully",
    data: addon
  });
});

// Update addon
export const updateAddon = asyncHandler(async (req, res) => {
  const { addonId } = req.params;
  const { name, price, isGlobal, applicableCategories, available } = req.body;

  if (!mongoose.Types.ObjectId.isValid(addonId)) {
    throw new BadRequestError("Invalid addon ID");
  }

  const addon = await Addon.findById(addonId);
  if (!addon) {
    throw new NotFoundError("Addon not found");
  }

  if (name) addon.name = name;
  if (price) addon.price = price;
  if (isGlobal !== undefined) addon.isGlobal = isGlobal;

  if (applicableCategories && Array.isArray(applicableCategories)) {
    const uniqueCategories = [...new Set(applicableCategories.map(String))]; // ensure uniqueness
    addon.applicableCategories = isGlobal ? [] : uniqueCategories;
  } else if (isGlobal) {
    addon.applicableCategories = [];
  }

  if (available !== undefined) addon.available = available;

  await addon.save();

  res.status(200).json({
    success: true,
    message: "Addon updated successfully",
    data: addon,
  });
});


// Delete addon
export const deleteAddon = asyncHandler(async (req, res) => {
  const {addonId} = req.params;
  if (!mongoose.Types.ObjectId.isValid(addonId)) throw new BadRequestError("Invalid addon ID");
  const addon = await Addon.findByIdAndDelete(addonId);
  if (!addon) throw new NotFoundError('Addon not found');
  res.status(200).json({ 
    success: true, 
    message: 'Addon deleted successfully' 
  });
});


export const getGlobalAddons = asyncHandler(async (req, res) => {
  const addons = await Addon.find({ isGlobal: true, available: true });
  res.status(200).json({
    success: true,
    message: "Global addons fetched successfully",
    data: addons
  });
});