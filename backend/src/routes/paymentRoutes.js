// backend/src/routes/paymentRoutes.js
import express from 'express';
import { createPayment, getPayments } from '../controllers/paymentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new payment
router.post('/', verifyToken, createPayment);

// Get all payments
router.get('/', verifyToken, getPayments);

export default router;