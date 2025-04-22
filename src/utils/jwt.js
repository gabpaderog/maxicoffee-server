import jwt from "jsonwebtoken";
import env from "./env.js";
import asyncHandler from "./asyncHandler.js";
import { BadRequestError } from "./errorTypes.js";

export const generateToken = (userId, name, type, role, expiresIn) => {
  const payload = {
    userId,
    name,
    type,
    role
  };

  return jwt.sign(payload, env.tokenSecretKey, {expiresIn: expiresIn})  
};

export const verifyToken = (token) => {
  try {
    if(!token) throw new BadRequestError('Token not found');

    const decoded = jwt.verify(token, env.tokenSecretKey);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new BadRequestError('Token has expired');
    } 
    if (error.name === 'JsonWebTokenError') {
      throw new BadRequestError('Invalid token');
    }
    throw new BadRequestError('Failed to verify token');
  }
};