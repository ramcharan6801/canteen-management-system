import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // e.g. Cakes, Snacks, Beverages
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  imageUrl: { type: String },
  description: { type: String },
}, { timestamps: true });

export default mongoose.model('MenuItem', menuItemSchema);