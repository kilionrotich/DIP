import express from 'express';
import { verifyToken, isAdminOrSuperAdmin } from '../middleware/authMiddleware.js';
import { getRecentAuditLogs } from '../controllers/auditController.js';

const router = express.Router();

router.get('/recent', verifyToken, isAdminOrSuperAdmin, getRecentAuditLogs);

export default router;

