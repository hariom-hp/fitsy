const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const isDbReady = () => mongoose.connection.readyState === 1;
const memoryCarts = {};

// Helper to get or create cart for a user (always populated)
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.productId');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    // No need to populate an empty cart
  }
  return cart;
};

// Format cart items for frontend (flattens populated product).
// Handles both populated items (productId is a full Product doc) and
// non-populated items (productId is an ObjectId) gracefully.
const formatCartItems = (cart) => {
  return cart.items
    .filter((item) => item.productId != null) // filter out deleted products
    .map((item) => {
      // productId is either a populated Product document or a raw ObjectId
      const isPopulated = item.productId && typeof item.productId === 'object' && item.productId.name;
      return {
        productId: isPopulated ? String(item.productId._id) : String(item.productId),
        size: item.size,
        quantity: item.quantity,
        name: isPopulated ? item.productId.name : (item.name || ''),
        price: isPopulated ? item.productId.price : (item.price || 0),
        image: isPopulated ? item.productId.image : (item.image || ''),
      };
    });
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  if (isDbReady()) {
    try {
      const cart = await getOrCreateCart(req.user._id);
      return res.json({ items: formatCartItems(cart) });
    } catch (error) {
      console.warn('[DB Error during getCart, using memory cart]:', error.message);
    }
  }

  const userCart = memoryCarts[req.user._id] || [];
  return res.json({ items: userCart });
};

// @desc    Add item to cart or increment quantity
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  const { productId, size, quantity = 1 } = req.body;

  if (!productId || !size) {
    return res.status(400).json({ message: 'productId and size are required' });
  }

  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // Create new cart
      cart = await Cart.create({
        user: req.user._id,
        items: [{ productId, size, quantity }],
      });
    } else {
      // Check if item already exists in cart (same product + same size)
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId && item.size === size,
      );

      if (existingItemIndex >= 0) {
        // Item exists — increment quantity
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Item does not exist — add it
        cart.items.push({ productId, size, quantity });
      }

      await cart.save();
    }

    await cart.populate('items.productId');
    return res.json({ items: formatCartItems(cart) });
  } catch (error) {
    console.error('[addToCart error]', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart
// @access  Private
const updateCart = async (req, res) => {
  const { productId, size, quantity } = req.body;

  if (!productId || !size || quantity === undefined) {
    return res.status(400).json({ message: 'productId, size and quantity are required' });
  }

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.size === size,
    );

    if (existingItemIndex >= 0) {
      if (quantity > 0) {
        cart.items[existingItemIndex].quantity = quantity;
      } else {
        // quantity 0 or less → remove the item
        cart.items.splice(existingItemIndex, 1);
      }
      await cart.save();
      await cart.populate('items.productId');
      return res.json({ items: formatCartItems(cart) });
    } else {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    console.error('[updateCart error]', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId/:size
// @access  Private
const removeFromCart = async (req, res) => {
  const { productId, size } = req.params;

  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => !(item.productId.toString() === productId && item.size === size),
    );

    if (cart.items.length === initialLength) {
      // No item was removed — not an error, just return current state
      await cart.populate('items.productId');
      return res.json({ items: formatCartItems(cart) });
    }

    await cart.save();
    await cart.populate('items.productId');

    return res.json({ items: formatCartItems(cart) });
  } catch (error) {
    console.error('[removeFromCart error]', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return res.json({ items: [] });
  } catch (error) {
    console.error('[clearCart error]', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
};
