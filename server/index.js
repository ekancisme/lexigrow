import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import errorHandler from './middleware/error.middleware.js';

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// Khai báo Routes
app.use('/api/auth', authRoutes);

// Error Middleware (Phải đặt ở cuối cùng)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
