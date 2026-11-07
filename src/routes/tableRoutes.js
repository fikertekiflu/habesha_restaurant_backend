import express from 'express';
import {
  getTables,
  getTableByNumber,
  callWaiter,
  requestBill,
  clearTable,
} from '../controllers/tableController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes for Customer QR experience
router.get('/:number', getTableByNumber);
router.post('/:number/call', callWaiter);
router.post('/:number/bill', requestBill);

// Staff floor overview routes
router.get('/', protect, getTables);
router.post('/:number/clear', protect, authorize('admin', 'manager', 'waiter', 'cashier'), clearTable);

export default router;
