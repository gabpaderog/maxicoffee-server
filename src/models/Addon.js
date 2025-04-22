import mongoose from 'mongoose';

const addonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  applicableCategories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    }
  ],
  available: { 
    type: Boolean,
    default: true
  }
});

const Addon = mongoose.model('Addon', addonSchema);
export default Addon;
