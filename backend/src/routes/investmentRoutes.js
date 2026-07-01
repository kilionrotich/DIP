import express from 'express';
import {
  createInvestment,
  getInvestments,
  commitInvestment,
  verifyInvestment,
  updateProfit,
  getAvailableDeals
} from '../controllers/investmentController.js';
import { verifyToken, isAdminOrSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin records an investment (legacy direct creation)
router.post('/', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await createInvestment(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Investor commits to a deal (protected): /api/investments/:dealId/commit
router.post('/:dealId/commit', verifyToken, async (req, res) => {
  try {
    await commitInvestment(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Backward-compatible commit route
router.post('/commit', verifyToken, async (req, res) => {
  try {
    await commitInvestment(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin verifies an investment (protected)
router.put('/:id/verify', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await verifyInvestment(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Backward-compatible verify route
router.put('/:investmentId/verify', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await verifyInvestment(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin updates profit for an investment (protected)
router.put('/:investmentId/profit', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await updateProfit(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Investor/Admin fetch all investments (protected)
router.get('/', verifyToken, getInvestments);

// Investor: Available Opportunities
router.get('/available', verifyToken, getAvailableDeals);

export default router;
