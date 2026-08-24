const express = require('express');
const router = express.Router();
const {
  createOrder,
  createPaymentIntent,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getAllOrders);

router.route('/create-payment-intent').post(protect, createPaymentIntent);
router.route('/myorders').get(protect, getUserOrders);
router.route('/:id/status').put(protect, admin, updateOrderStatus);

module.exports = router;
