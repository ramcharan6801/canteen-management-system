import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import menuRouter from './routes/menu.js';
import ordersRouter from './routes/orders.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // serve uploaded images

app.get('/', (req, res) => {
  res.json({ message: 'Canteen Management API is running' });
});

app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});