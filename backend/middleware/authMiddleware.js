const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');
const { getMemoryUserById } = require('../controllers/authController');

const isDbReady = () => mongoose.connection.readyState === 1;

const protect = async (req, res, next) => {
  let token = req.cookies?.token;

  // Fallback to Bearer token in Authorization header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fitsy_dev_secret_key_123');

      if (isDbReady()) {
        try {
          req.user = await User.findById(decoded.id).select('-password');
        } catch {
          // DB error, will check memory store below
        }
      }

      if (!req.user) {
        req.user = getMemoryUserById(decoded.id);
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User not found or token invalid' });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Add this below your protect function
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

// Update your exports
module.exports = { protect, admin };
