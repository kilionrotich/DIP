// backend/src/routes/dealRoutes.js
import express from 'express';
import { createDeal, getDeals } from '../controllers/dealController.js';
import { verifyToken, isAdminOrSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin creates a deal (protected)
router.post('/', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await createDeal(req, res);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Investors fetch all deals (protected)
router.get('/', verifyToken, getDeals);

export default router;