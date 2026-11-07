import { Setting } from '../models/Setting.js';

// @desc    Get public restaurant settings
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({});
    }
    res.status(200).json({ success: true, setting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update restaurant settings
// @route   PUT /api/settings
// @access  Private (Admin)
export const updateSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create(req.body);
    } else {
      setting = await Setting.findByIdAndUpdate(setting._id, req.body, {
        new: true,
        runValidators: true,
      });
    }
    res.status(200).json({ success: true, setting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
