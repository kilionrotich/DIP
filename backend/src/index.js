import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load env vars (e.g. JWT_SECRET) before any routes/controllers use them
dotenv.config();

import authRoutes from './routes/authRoutes.js';

const app = express();


// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Mount API routes
app.use('/api/auth', authRoutes);

// Export the app so server.js can use it
export default app;


