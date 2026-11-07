import express from 'express';
import {
  createOrder,
  updateOrderStatus,
  settlePayment,
  getOrders,
  updateDriverLocation,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public order placement (Table QR and Delivery)
router.post('/', createOrder);

// Staff order management
router.get('/', protect, getOrders);
router.patch('/:id/status', protect, updateOrderStatus);
router.post('/:id/settle', protect, authorize('admin', 'manager', 'cashier'), settlePayment);
router.post('/:id/driver-location', protect, authorize('driver', 'admin'), updateDriverLocation);

export default router;
