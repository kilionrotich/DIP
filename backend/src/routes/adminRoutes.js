import express from 'express';
import { getPrimaryAdmin } from '../controllers/adminController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/admins/primary — returns primary admin id + email (authenticated)
router.get('/primary', verifyToken, async (req, res) => {
  try {
    await getPrimaryAdmin(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
