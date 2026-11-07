import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'dev-jwt-secret-key-12345',
    { expiresIn: '30d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    });
};

// @desc    Staff Login with Username & Password (or PIN)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { username, password, pin, role } = req.body;
    const credential = password || pin;

    if (!credential) {
      return res.status(400).json({ success: false, error: 'Please enter your password / PIN' });
    }

    let matchedUser = null;

    if (username) {
      // Find by username, name, or phone
      const cleanUser = String(username).trim();
      const user = await User.findOne({
        $or: [
          { username: cleanUser.toLowerCase() },
          { name: new RegExp('^' + cleanUser + '$', 'i') },
          { phone: cleanUser },
        ],
        active: true,
      });

      if (user) {
        const isMatch = await user.matchPin(credential);
        if (isMatch) matchedUser = user;
      }
    } else {
      // Fallback search by PIN
      const query = { active: true };
      if (role) query.role = role;
      const users = await User.find(query);

      for (const u of users) {
        const isMatch = await u.matchPin(credential);
        if (isMatch) {
          matchedUser = u;
          break;
        }
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    sendTokenResponse(matchedUser, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Current Logged-in Staff
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

// @desc    Logout Staff
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Get all staff (Admin/Manager only)
// @route   GET /api/auth/staff
// @access  Private (Admin, Manager)
export const getStaff = async (req, res) => {
  try {
    const staff = await User.find().select('-pin').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: staff.length, staff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new staff user (Admin only)
// @route   POST /api/auth/staff
// @access  Private (Admin)
export const createStaff = async (req, res) => {
  try {
    const { name, role, pin, phone } = req.body;
    const user = await User.create({ name, role, pin, phone });
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
