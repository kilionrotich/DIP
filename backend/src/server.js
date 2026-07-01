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
import payoutRoutes from './routes/payoutRoutes.js';
import investorRoutes from './routes/investorRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// CORS setup
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
app.use('/api/deals', dealRoutes);          // includes create, approve, cancel, close, invest
app.use('/api/investments', investmentRoutes); // includes commit, verify, profit update, legacy create
app.use('/api/profits', profitRoutes);      // includes get profits, update profit by investmentId
app.use('/api/payments', paymentRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/messages', messageRoutes);    // includes send, get, verify, delete
app.use('/api/admins', adminRoutes);        // primary admin lookup

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
    console.log('Models synced successfully');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('X Database connection error:', error);
  }
})();
