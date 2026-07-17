import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import MenuItem from '../models/MenuItem.js';

const router = express.Router();

// Ensure the uploads folder exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Multer setup: save uploaded images to /uploads with a unique filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// GET /api/menu - list all menu items, optional category/search filter
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' }; // case-insensitive search

    const items = await MenuItem.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// POST /api/menu - add a new menu item (e.g. a cake), with optional image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, stock, description } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ error: 'name, category, and price are required' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const item = await MenuItem.create({
      name,
      category,
      price,
      stock: stock || 0,
      description,
      imageUrl,
    });

    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// PATCH /api/menu/:id - update a menu item (edit details, restock, or replace image)
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      updates.imageUrl = `/uploads/${req.file.filename}`;
    }

    const item = await MenuItem.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/menu/:id - remove a menu item
router.delete('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;