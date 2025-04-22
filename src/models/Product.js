import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  basePrice: {
    type: Number,
    required: true
  },
  available: { 
    type: Boolean, 
    default: true 
  },
  image: String,
  cloudinary_public_id: String,
  createdAt: { 
    type: Date,
    default: Date.now 
  }
});

const Product = mongoose.model('Product', productSchema);
export default Product;
