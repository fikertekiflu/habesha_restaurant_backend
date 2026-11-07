import express from 'express';
import {
  login,
  getMe,
  logout,
  getStaff,
  createStaff,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.get('/staff', protect, authorize('admin', 'manager'), getStaff);
router.post('/staff', protect, authorize('admin'), createStaff);

export default router;
