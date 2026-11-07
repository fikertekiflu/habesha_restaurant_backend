import express from 'express';
import {
  getMenu,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
} from '../controllers/menuController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getMenu);
router.post('/items', protect, authorize('admin', 'manager'), createMenuItem);
router.put('/items/:id', protect, authorize('admin', 'manager'), updateMenuItem);
router.patch('/items/:id/toggle', protect, authorize('admin', 'manager', 'kitchen'), toggleAvailability);
router.delete('/items/:id', protect, authorize('admin'), deleteMenuItem);

export default router;
