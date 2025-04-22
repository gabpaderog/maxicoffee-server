import cloudinary from "../config/cloudinary.js";
import { BadRequestError } from "./errorTypes.js";

export const uploadToCloudinary = async(folder, file) => {
  try {
    if(!file) throw new BadRequestError("No file provided");

    const base64EncodedImage = Buffer.from(file.buffer).toString("base64")
    const dataUri = `data:${file.mimetype};base64,${base64EncodedImage}`

    const result = await cloudinary.v2.uploader.upload(dataUri, {
      folder,
      resource_type: "auto",
    });

    return result
  } catch (error) {
    // Handle errors and rethrow
    console.error("Cloudinary upload failed:", error);
    throw new BadRequestError("Image upload failed");  // You can also throw a custom error
  }
}