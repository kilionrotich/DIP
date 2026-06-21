// backend/src/routes/investmentRoutes.js
import express from 'express';
import { createInvestment, getInvestments } from '../controllers/investmentController.js';
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

// Investor fetches their investments (protected)
router.get('/', verifyToken, getInvestments);

export default router;