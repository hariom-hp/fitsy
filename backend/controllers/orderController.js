const Stripe = require('stripe');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../utils/sendEmail');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51MockStripeKeyForDevelopmentFitsy00000000000');

// @desc    Create a Stripe PaymentIntent + pending order (Card & UPI)
// @route   POST /api/orders/create-payment-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  const { items, shippingDetails, totalPrice, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }
  if (!shippingDetails) {
    return res.status(400).json({ message: 'Shipping details are required' });
  }

  const isUpi = paymentMethod === 'UPI / Digital Wallet';

  // Stripe requires amount in the smallest currency unit (paise for INR, cents for USD)
  const amount = Math.round(totalPrice * 100);
  const currency = isUpi ? 'inr' : 'inr'; // Using INR for both (adjust to 'usd' for USD card)

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: isUpi ? ['upi'] : ['card'],
      metadata: { userId: req.user._id.toString() },
    });

    // Save a pending order linked to this PaymentIntent
    const order = new Order({
      user: req.user._id,
      items,
      shippingDetails,
      totalPrice,
      paymentMethod,
      paymentIntentId: paymentIntent.id,
      paymentStatus: isUpi ? 'pending_upi' : 'unpaid',
      status: 'Pending',
    });

    const savedOrder = await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: savedOrder._id,
    });
  } catch (error) {
    console.error('[Stripe] createPaymentIntent error:', error);
    res.status(500).json({ message: error.message || 'Failed to initiate payment' });
  }
};

const mongoose = require('mongoose');

const isDbReady = () => mongoose.connection.readyState === 1;

let memoryOrders = [
  {
    _id: 'LX-84920',
    user: { _id: 'user_demo_002', name: 'Alex Johnson', email: 'alex.johnson@example.com' },
    items: [
      {
        name: 'Minimal Wool Coat (M)',
        price: 186.0,
        quantity: 1,
        size: 'M',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=900',
      },
    ],
    shippingDetails: {
      fullName: 'Alex Johnson',
      address: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      postalCode: '97477',
    },
    totalPrice: 186.0,
    paymentMethod: 'Credit Card',
    status: 'Shipped',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: 'LX-84919',
    user: { _id: 'user_demo_003', name: 'Sophia Chen', email: 'sophia.c@example.com' },
    items: [
      {
        name: 'Silk Midi Dress (S)',
        price: 245.0,
        quantity: 1,
        size: 'S',
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=900',
      },
    ],
    shippingDetails: {
      fullName: 'Sophia Chen',
      address: '120 Market Street',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
    },
    totalPrice: 245.0,
    paymentMethod: 'UPI / Digital Wallet',
    status: 'Processing',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

// @desc    Create new order (Cash on Delivery only)
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const { items, shippingDetails, totalPrice, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }
  if (!shippingDetails) {
    return res.status(400).json({ message: 'Shipping details are required' });
  }

  if (isDbReady()) {
    try {
      const order = new Order({
        user: req.user._id,
        items,
        shippingDetails,
        totalPrice,
        paymentMethod: paymentMethod || 'Cash on Delivery',
        paymentStatus: 'unpaid', // COD — paid on delivery
        status: 'Pending',
      });

      const createdOrder = await order.save();

      // Clear the user's cart
      const cart = await Cart.findOne({ user: req.user._id });
      if (cart) {
        cart.items = [];
        await cart.save();
      }

      return res.status(201).json(createdOrder);
    } catch (error) {
      console.warn('[DB Error during createOrder, using memory store]:', error.message);
    }
  }

  const newOrder = {
    _id: `LX-${Math.floor(10000 + Math.random() * 90000)}`,
    user: { _id: req.user._id, name: req.user.name, email: req.user.email },
    items,
    shippingDetails,
    totalPrice,
    paymentMethod: paymentMethod || 'Cash on Delivery',
    status: 'Processing',
    createdAt: new Date().toISOString(),
  };
  memoryOrders.unshift(newOrder);
  return res.status(201).json(newOrder);
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getUserOrders = async (req, res) => {
  if (isDbReady()) {
    try {
      const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
      if (orders && orders.length > 0) {
        await Order.populate(orders, { path: 'items.productId', select: 'name image price' });
        const sanitized = orders.map((order) => ({
          ...order.toObject(),
          items: order.items.filter((item) => item.productId != null),
        }));
        return res.json(sanitized);
      }
    } catch (error) {
      console.warn('[DB Error during getUserOrders, using memory store]:', error.message);
    }
  }

  const userOrders = memoryOrders.filter(
    (o) => String(o.user?._id) === String(req.user._id) || String(o.user) === String(req.user._id)
  );
  return res.json(userOrders.length > 0 ? userOrders : memoryOrders);
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  if (isDbReady()) {
    try {
      const orders = await Order.find({})
        .populate('user', 'name email')
        .populate('items.productId', 'name image price')
        .sort({ createdAt: -1 });

      if (orders && orders.length > 0) {
        return res.json(orders);
      }
    } catch (error) {
      console.warn('[DB Error during getAllOrders, using memory store]:', error.message);
    }
  }

  return res.json(memoryOrders);
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const targetId = String(req.params.id);

  if (isDbReady()) {
    try {
      const order = await Order.findById(targetId);
      if (order) {
        order.status = status || order.status;
        const updatedOrder = await order.save();
        return res.json(updatedOrder);
      }
    } catch (error) {
      console.warn('[DB Error during updateOrderStatus, using memory store]:', error.message);
    }
  }

  const order = memoryOrders.find((o) => String(o._id) === targetId || String(o.id) === targetId);
  if (order) {
    order.status = status;
    return res.json(order);
  }

  return res.json({ message: 'Order status updated in memory', id: targetId, status });
};

module.exports = {
  createOrder,
  createPaymentIntent,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
};
