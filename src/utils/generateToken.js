import { generateToken } from "./jwt.js";

export const generateVerificationToken = (userId, name, role) => {
  console.log(userId, role)
  return generateToken(userId, name, 'verification', role, '5m');
};

export const generatePasswordResetToken = (userId, name, role) => {
  return generateToken(userId, name, 'password_reset', role, '5m');
};

export const generateAccessToken = (userId, name, role) => {
  return generateToken(userId, name, 'access_token', role, '1h');
};

export const generateRefreshToken = (userId, name,  role) => {
  return generateToken(userId, name, 'refresh_token', role, '7d');
};
