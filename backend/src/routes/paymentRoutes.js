// backend/src/routes/paymentRoutes.js
import express from 'express';
import {
  createPayment,
  getPayments,
  verifyPaymentProof,
  rejectPaymentProof,
  getPaymentProofs,
} from '../controllers/paymentController.js';
import { verifyToken, isAdminOrSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new payment
router.post('/', verifyToken, createPayment);

// Get all payments
router.get('/', verifyToken, getPayments);

// Admin verifies/rejects payment proofs
router.get('/proofs', verifyToken, isAdminOrSuperAdmin, getPaymentProofs);
router.post('/proofs/:proofId/verify', verifyToken, isAdminOrSuperAdmin, verifyPaymentProof);
router.post('/proofs/:proofId/reject', verifyToken, isAdminOrSuperAdmin, rejectPaymentProof);

export default router;
