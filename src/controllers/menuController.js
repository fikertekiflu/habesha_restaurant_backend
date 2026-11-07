import { MenuItem } from '../models/MenuItem.js';
import { Category } from '../models/Category.js';

// @desc    Get full categorized bilingual menu
// @route   GET /api/menu
// @access  Public
export const getMenu = async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort('order');
    const items = await MenuItem.find().populate('category', 'name slug icon');

    // Group items by category
    const categorized = categories.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      items: items.filter((item) => item.category?._id?.toString() === cat._id.toString()),
    }));

    res.status(200).json({
      success: true,
      categories: categorized,
      totalItems: items.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new menu item
// @route   POST /api/menu/items
// @access  Private (Admin, Manager)
export const createMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update menu item
// @route   PUT /api/menu/items/:id
// @access  Private (Admin, Manager)
export const updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.status(200).json({ success: true, item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Quick toggle availability (Stock control)
// @route   PATCH /api/menu/items/:id/toggle
// @access  Private (Admin, Manager, Kitchen)
export const toggleAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

    item.isAvailable = !item.isAvailable;
    await item.save();

    // Broadcast menu update to connected clients via socket
    const io = req.app.get('io');
    if (io) io.emit('menu:updated', { itemId: item._id, isAvailable: item.isAvailable });

    res.status(200).json({ success: true, isAvailable: item.isAvailable });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/items/:id
// @access  Private (Admin)
export const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.status(200).json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
