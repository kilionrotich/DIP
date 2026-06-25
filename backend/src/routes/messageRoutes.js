import express from 'express';
import { sendMessage, getMessages } from '../controllers/messageController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Send message (authenticated)
router.post('/', verifyToken, sendMessage);

// Inbox messages for receiver (authenticated)
router.get('/', verifyToken, getMessages);

export default router;

