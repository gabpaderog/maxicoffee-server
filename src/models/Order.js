import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  items: [{
    productName: String,
    price: Number,
    addons: [{
      addonName: String,
      price: Number
    }]
  }],
  discount: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Discount', 
    default: null 
  },
  discountApplied: {
    type: Boolean, 
    default: false 
  },
  discountDetails: {
    name: String,
    percentage: Number
  },
  total: Number,
  status: { 
    type: String, 
    enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  qrCode: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
