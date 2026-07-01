// backend/src/routes/profitRoutes.js
import express from 'express';
import { getProfits, updateProfit } from '../controllers/profitController.js';
import { verifyToken, isAdminOrSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Investor fetches their profit summary (protected)
router.get('/', verifyToken, getProfits);

// Admin updates profit using frontend path: /api/profits/update
router.put('/update', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await updateProfit(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Backward-compatible route
router.put('/:investmentId', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    req.body = { ...req.body, investment_id: req.params.investmentId };
    await updateProfit(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;