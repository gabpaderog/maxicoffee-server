import mongoose from "mongoose";
import crypto from "crypto";

const tokenSchema = mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  token: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['verification', "reset_password", "refresh_token"],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

tokenSchema.statics.getExpirationTime = (type) => {
  const expirationTimes = {
    verification: 5 * 60 * 1000, // 5 minutes
    reset_password: 1 * 60 * 1000, // 5 minutes
    refresh_token: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  return new Date(Date.now() + (expirationTimes[type] || 5 * 60 * 1000)); // Default 5 min
};



export const Token = mongoose.model("Token", tokenSchema);