import express from 'express';
import { verifyToken, isAdminOrSuperAdmin } from '../middleware/authMiddleware.js';
import { listInvestors } from '../controllers/investorController.js';

const router = express.Router();

// Admin/Super-admin: list investors (derived from investments/users)
router.get('/', verifyToken, isAdminOrSuperAdmin, listInvestors);

export default router;

