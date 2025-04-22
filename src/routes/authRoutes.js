import express from "express";
import {loginUser, registerUser, requestResetPassword, resetPassword, verifyEmail, verifyResetPassword 
} from "../controllers/authController.js";
import rateLimit from "express-rate-limit";

export const authRouter = express.Router();

export const rateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 mins
  max: 5, // Max 5 requests
  message: {
    success: false,
    message: "Too many attempts. Please try again in 5 minutes.",
  },
});

authRouter.post('/login', loginUser);
authRouter.post('/register', rateLimiter, registerUser);
authRouter.post('/verify', verifyEmail);

// Reset Password Routes
authRouter.post('/forgot_password', rateLimiter, requestResetPassword);
authRouter.get('/reset_password', verifyResetPassword);
authRouter.post('/reset_password', resetPassword);