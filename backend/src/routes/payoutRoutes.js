import express from 'express';
import { createPayout, getPayouts } from '../controllers/payoutController.js';
import { verifyToken, isAdminOrSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, isAdminOrSuperAdmin, createPayout);
router.get('/', verifyToken, isAdminOrSuperAdmin, getPayouts);

export default router;
