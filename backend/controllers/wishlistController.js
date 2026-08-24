const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const isDbReady = () => mongoose.connection.readyState === 1;
const memoryWishlists = {};

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate('items.productId');
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
    // No items to populate on a fresh wishlist
  }
  return wishlist;
};

// Format wishlist items for frontend, handling both populated and raw IDs.
const formatWishlistItems = (wishlist) => {
  return wishlist.items
    .filter((item) => item.productId != null)
    .map((item) => {
      const isPopulated = item.productId && typeof item.productId === 'object' && item.productId.name;
      return {
        productId: isPopulated ? String(item.productId._id) : String(item.productId),
        name: isPopulated ? item.productId.name : (item.name || ''),
        price: isPopulated ? item.productId.price : (item.price || 0),
        image: isPopulated ? item.productId.image : (item.image || ''),
        category: isPopulated ? item.productId.category : (item.category || ''),
      };
    });
};

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  if (isDbReady()) {
    try {
      const wishlist = await getOrCreateWishlist(req.user._id);
      return res.json({ items: formatWishlistItems(wishlist) });
    } catch (error) {
      console.warn('[DB Error during getWishlist, using memory wishlist]:', error.message);
    }
  }

  const userWishlist = memoryWishlists[req.user._id] || [];
  return res.json({ items: userWishlist });
};

// @desc    Toggle item in wishlist (add if absent, remove if present)
// @route   POST /api/wishlist/toggle
// @access  Private
const toggleWishlist = async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: 'productId is required' });
  }

  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    let added = false;
    if (!wishlist) {
      // First wishlist item for this user
      wishlist = await Wishlist.create({
        user: req.user._id,
        items: [{ productId }],
      });
      added = true;
    } else {
      const itemIndex = wishlist.items.findIndex(
        (item) => item.productId.toString() === productId,
      );

      if (itemIndex >= 0) {
        // Item exists → remove it
        wishlist.items.splice(itemIndex, 1);
        added = false;
      } else {
        // Item missing → add it
        wishlist.items.push({ productId });
        added = true;
      }

      await wishlist.save();
    }

    await wishlist.populate('items.productId');

    return res.json({ items: formatWishlistItems(wishlist), added });
  } catch (error) {
    console.error('[toggleWishlist error]', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
};
