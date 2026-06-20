// backend/src/routes/profitRoutes.js
import express from 'express';
import { getProfits, updateProfit } from '../controllers/profitController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Investor fetches their profit summary (protected)
router.get('/', verifyToken, getProfits);

// Admin updates profit for an investment (protected)
router.put('/', verifyToken, isAdmin, async (req, res) => {
  try {
    await updateProfit(req, res);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;