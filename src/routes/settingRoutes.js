import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', protect, authorize('admin', 'manager'), updateSettings);

export default router;
