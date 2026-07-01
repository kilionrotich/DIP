// backend/src/routes/messageRoutes.js
import express from 'express';
import {
  sendMessage,
  getMessages,
  verifyMessage,
  deleteMessage,
} from '../controllers/messageController.js';
import { verifyToken, isAdminOrSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Send message (authenticated: investor or admin)
// Accepts both POST / and POST /send for flexibility
router.post('/', verifyToken, async (req, res) => {
  try {
    await sendMessage(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Explicit /send route for investor dashboard
router.post('/send', verifyToken, async (req, res) => {
  try {
    await sendMessage(req, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inbox messages for receiver (authenticated)
router.get('/', verifyToken, async (req, res) => {
  try {
    await getMessages(req, res);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin verifies/marks a message (protected)
router.put('/:messageId/verify', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await verifyMessage(req, res);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin deletes a message (protected)
router.delete('/:messageId', verifyToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await deleteMessage(req, res);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
