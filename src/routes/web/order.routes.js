const express = require("express");
const {
  createOrder,
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  getUserOrders,
  getOrderById,
  cancelOrder,
  verifyDeliveryOTP,
} = require("../../controller/web/order.controller.js");
const protect = require("../../middleware/authMiddleware.js"); // Your auth middleware

const router = express.Router();

// ============================================
// USER ROUTES (Protected)
// ============================================

// Create order (from cart or direct purchase)
router.post("/create", protect, createOrder);

// Create Razorpay order
router.post("/create-razorpay-order", protect, createRazorpayOrder);

// Verify payment
router.post("/verify-payment", protect, verifyPayment);

// Get all user orders (with pagination and filters)
router.get("/my-orders", protect, getUserOrders);

// Get single order details
router.get("/:orderId", protect, getOrderById);

// Cancel order
router.put("/:orderId/cancel", protect, cancelOrder);

// ============================================
// WEBHOOK ROUTE (Not protected - uses signature verification)
// ============================================

// Razorpay webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

// ============================================
// DELIVERY ROUTES
// ============================================

// Verify delivery OTP (can be used by delivery person)
router.post("/verify-delivery-otp", verifyDeliveryOTP);

module.exports = router;
