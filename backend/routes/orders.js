import express from 'express';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';

const router = express.Router();

// GET /api/orders - list all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/orders - place a new order, deducting stock for each item
router.post('/', async (req, res) => {
  try {
    const { customerName, items, paymentMethod } = req.body; // items: [{ menuItemId, quantity }]

    if (!customerName || !items || !items.length) {
      return res.status(400).json({ error: 'customerName and items are required' });
    }
    if (!['cash', 'upi', 'card'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'A valid paymentMethod (cash, upi, or card) is required' });
    }

    let totalAmount = 0;
    const orderItems = [];

    // Validate stock and build order line items
    for (const { menuItemId, quantity } of items) {
      const menuItem = await MenuItem.findById(menuItemId);
      if (!menuItem) {
        return res.status(404).json({ error: `Menu item ${menuItemId} not found` });
      }
      if (menuItem.stock < quantity) {
        return res.status(400).json({ error: `Not enough stock for ${menuItem.name}. Only ${menuItem.stock} left.` });
      }

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity,
        price: menuItem.price,
      });
      totalAmount += menuItem.price * quantity;
    }

    // Deduct stock for each item
    for (const { menuItemId, quantity } of items) {
      await MenuItem.findByIdAndUpdate(menuItemId, { $inc: { stock: -quantity } });
    }

    // UPI/Card are simulated as paid instantly (mock gateway); Cash is paid at the counter, so stays unpaid until then
    const paymentStatus = paymentMethod === 'cash' ? 'unpaid' : 'paid';

    const order = await Order.create({
      customerName,
      items: orderItems,
      totalAmount,
      paymentMethod,
      paymentStatus,
    });
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// PATCH /api/orders/:id - update order status or payment status
router.patch('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

export default router;