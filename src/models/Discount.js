import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema({
  name: String, // e.g., "Student", "Senior"
  percentage: Number,
  requiresVerification: { type: Boolean, default: true }
});

const Discount = mongoose.model('Discount', discountSchema);
export default Discount;
