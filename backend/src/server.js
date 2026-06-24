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
import investorRoutes from './routes/investorRoutes.js';
import auditRoutes from './routes/auditRoutes.js';


// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// CORS setup
// Allow configured origins; fallback to permissive CORS to avoid "Network error" on phones/browsers.
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/profits', profitRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/audit-logs', auditRoutes);


// Default route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Database connection + start server ONCE
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Yaay! Database connected');

    await sequelize.sync();
    console.log('Models synced succesfuly');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('X Database connection error:', error);
  }
})();
