// backend/src/routes/investmentRoutes.js
import express from 'express';
import {
  createInvestment,
  getInvestments,
  verifyInvestment,
  rejectInvestment,
  getInvestmentSummary,
} from '../controllers/investmentController.js';
import { verifyToken, isAdminOrSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin records an investment (protected)
router.post('/', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await createInvestment(req, res);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Role-aware dashboard summary (Total Invested, Profits, ROI, counts)
router.get('/summary', verifyToken, getInvestmentSummary);

// Admin verifies/rejects an investment (proof verification)
router.post('/:investmentId/verify', verifyToken, isAdminOrSuperAdmin, verifyInvestment);
router.post('/:investmentId/reject', verifyToken, isAdminOrSuperAdmin, rejectInvestment);

// Fetch investments (investor: own; admin: all)
router.get('/', verifyToken, getInvestments);

export default router;
