// backend/src/routes/authRoutes.js
import express from 'express';
import {
  registerUser,
  loginUser,
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from '../controllers/authController.js';
import { verifyToken, isSuperAdmin, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Super admin: manage admin accounts
router.get('/admins', verifyToken, isSuperAdmin, listAdmins);
router.post('/admins', verifyToken, isSuperAdmin, createAdmin);
router.put('/admins/:id', verifyToken, isSuperAdmin, updateAdmin);
router.delete('/admins/:id', verifyToken, isSuperAdmin, deleteAdmin);


export default router;

