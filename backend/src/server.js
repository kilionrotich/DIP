// backend/src/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// ✅ Load environment variables BEFORE importing db.js
dotenv.config();

import { sequelize } from './config/db.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import dealRoutes from './routes/dealRoutes.js';
import investmentRoutes from './routes/investmentRoutes.js';
import profitRoutes from './routes/profitRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/profits', profitRoutes);
app.use('/api/payments', paymentRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Database connection
(async () => {
  try{
    await sequelize.authenticate();
    console.log('Yaay! Database connected');

    await sequelize.sync();
      console.log('Models synced succesfuly');
    
      app.listen(process.env.PORT || 5000, () => {
        console.log('server started on port ${process.env.PORT || 5000}');
      });
  } catch (error) {
    console.error('X Database connection error:', error);
  }
})();

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});