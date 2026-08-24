const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Default in-memory user registry used when MongoDB is offline / disconnected
const memoryUsers = [
  {
    _id: 'user_admin_001',
    name: 'Admin User',
    email: 'admin@fitsy.com',
    password: 'admin123',
    isAdmin: true,
    shippingAddresses: [
      {
        fullName: 'Fitsy HQ Admin',
        address: '100 Fashion Ave, Suite 400',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
        phoneNumber: '+1 555-0199',
      },
    ],
  },
  {
    _id: 'user_demo_002',
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    password: 'password123',
    isAdmin: false,
    shippingAddresses: [
      {
        fullName: 'Alex Johnson',
        address: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'United States',
        phoneNumber: '+1 555-0142',
      },
    ],
  },
];

const isDbReady = () => mongoose.connection.readyState === 1;

// Generate JWT and set it in an httpOnly cookie
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fitsy_dev_secret_key_123', {
    expiresIn: '30d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // False in dev so cookies work over HTTP
    sameSite: 'lax', // Compatible across dev ports
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  const cleanEmail = email?.toLowerCase().trim();

  if (!cleanEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (isDbReady()) {
    try {
      const userExists = await User.findOne({ email: cleanEmail });

      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password,
        isAdmin: cleanEmail === 'admin@fitsy.com',
      });

      if (user) {
        const token = generateTokenAndSetCookie(res, user._id);
        return res.status(201).json({
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            shippingAddresses: user.shippingAddresses || [],
          },
        });
      }
    } catch (error) {
      console.warn('[DB Error during register, falling back to memory store]:', error.message);
    }
  }

  // Memory fallback
  const existingMemory = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingMemory) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const newMemUser = {
    _id: `user_${Date.now()}`,
    name: name || cleanEmail.split('@')[0],
    email: cleanEmail,
    password,
    isAdmin: cleanEmail === 'admin@fitsy.com',
    shippingAddresses: [],
  };
  memoryUsers.push(newMemUser);

  const token = generateTokenAndSetCookie(res, newMemUser._id);
  return res.status(201).json({
    token,
    user: {
      _id: newMemUser._id,
      name: newMemUser.name,
      email: newMemUser.email,
      isAdmin: newMemUser.isAdmin,
      shippingAddresses: newMemUser.shippingAddresses,
    },
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email?.toLowerCase().trim();

  if (!cleanEmail || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (isDbReady()) {
    try {
      const user = await User.findOne({ email: cleanEmail });

      if (user && (await user.matchPassword(password))) {
        const token = generateTokenAndSetCookie(res, user._id);
        return res.json({
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            shippingAddresses: user.shippingAddresses || [],
          },
        });
      }
    } catch (error) {
      console.warn('[DB Error during login, falling back to memory store]:', error.message);
    }
  }

  // Memory store fallback
  const memoryUser = memoryUsers.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === password
  );

  if (memoryUser) {
    const token = generateTokenAndSetCookie(res, memoryUser._id);
    return res.json({
      token,
      user: {
        _id: memoryUser._id,
        name: memoryUser.name,
        email: memoryUser.email,
        isAdmin: memoryUser.isAdmin,
        shippingAddresses: memoryUser.shippingAddresses || [],
      },
    });
  }

  return res.status(401).json({ message: 'Invalid email or password' });
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  if (req.user) {
    return res.json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isAdmin: req.user.isAdmin,
        shippingAddresses: req.user.shippingAddresses || [],
      },
    });
  }
  res.status(404).json({ message: 'User not found' });
};

// @desc    Update user shipping address
// @route   PUT /api/auth/address
// @access  Private
const updateUserAddress = async (req, res) => {
  const { fullName, address, city, state, postalCode, country, phoneNumber } = req.body;

  if (isDbReady()) {
    try {
      const user = await User.findById(req.user._id);

      if (user) {
        if (!user.shippingAddresses) {
          user.shippingAddresses = [];
        }
        user.shippingAddresses.push({
          fullName,
          address,
          city,
          state,
          postalCode,
          country,
          phoneNumber,
        });

        const updatedUser = await user.save();

        return res.json({
          user: {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            shippingAddresses: updatedUser.shippingAddresses,
          },
        });
      }
    } catch (error) {
      console.warn('[DB Error during address update, falling back to memory]:', error.message);
    }
  }

  // Memory fallback
  const memUser = memoryUsers.find((u) => String(u._id) === String(req.user._id));
  if (memUser) {
    if (!memUser.shippingAddresses) memUser.shippingAddresses = [];
    memUser.shippingAddresses.push({ fullName, address, city, state, postalCode, country, phoneNumber });
    return res.json({
      user: {
        _id: memUser._id,
        name: memUser.name,
        email: memUser.email,
        isAdmin: memUser.isAdmin,
        shippingAddresses: memUser.shippingAddresses,
      },
    });
  }

  res.status(404).json({ message: 'User not found' });
};

// @desc    Get all registered users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  if (isDbReady()) {
    try {
      const users = await User.find({}).select('-password').sort({ createdAt: -1 });
      if (users && users.length > 0) {
        return res.json(users);
      }
    } catch (error) {
      console.warn('[DB Error during getAllUsers, falling back to memory]:', error.message);
    }
  }

  return res.json(
    memoryUsers.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      isAdmin: u.isAdmin,
      shippingAddresses: u.shippingAddresses,
      createdAt: new Date().toISOString(),
    }))
  );
};

const getMemoryUserById = (id) => {
  return memoryUsers.find((u) => String(u._id) === String(id));
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserAddress,
  getAllUsers,
  getMemoryUserById,
};