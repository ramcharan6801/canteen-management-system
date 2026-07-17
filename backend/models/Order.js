import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true }, // snapshot of the name at order time
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // snapshot of the price at order time
});

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'preparing', 'ready', 'completed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'card'], required: true },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);