import mongoose from 'mongoose';

const productCategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Category = mongoose.model('Category', productCategorySchema);
export default Category;
