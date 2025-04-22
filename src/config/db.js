import mongoose from "mongoose";
import env from "../utils/env.js";

export const dbConnection = async() => {
  try {
    const conn = mongoose.connect(env.dbUri);

    if(!conn) return console.error('Database Connection Failed')
    return console.log('Database Connected')
  } catch (error) {
    throw error
  }
}