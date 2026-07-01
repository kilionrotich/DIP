import express from 'express';
import { verifyToken, isAdminOrSuperAdmin } from '../middleware/authMiddleware.js';
import { approveInvestorAdmin } from '../controllers/investorAdminController.js';

const router = express.Router();

// Admin approves an investor for a specific admin.
router.post('/approve', verifyToken, isAdminOrSuperAdmin, approveInvestorAdmin);

export default router;

