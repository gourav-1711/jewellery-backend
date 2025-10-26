const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../../models/order.js");
const Product = require("../../models/product.js");
const Cart = require("../../models/cart.js");
require("dotenv").config();
// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email placeholder function
const sendEmail = async (to, subject, body) => {
  console.log("📧 Sending Email:");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Body:", body);
  // TODO: Integrate with email service (Nodemailer, SendGrid, etc.)
  return true;
};

// Send OTP via email/SMS
const sendOTP = async (email, phone, otp, orderId) => {
  const emailBody = `
    Your order ${orderId} has been confirmed!
    
    Delivery OTP: ${otp}
    
    Please share this OTP with the delivery person at the time of delivery.
    
    Thank you for shopping with us!
  `;

  await sendEmail(email, "Order Confirmed - Delivery OTP", emailBody);

  // TODO: Send SMS with OTP
  console.log("📱 SMS OTP:", otp, "to", phone);

  return otp;
};

// ============================================
// ORDER CONTROLLERS
// ============================================

// 1. Create Order (from Cart or Direct Purchase)
exports.createOrder = async (req, res) => {
  try {
    const {
      purchaseType, // 'cart' or 'direct'
      items, // For direct purchase: [{ productId, colorId, quantity, isPersonalized, personalizedName }]
      shippingAddress,
      billingAddress,
      notes,
      isGift,
      giftMessage,
      giftWrap,
      couponCode,
    } = req.body;

    const userId = req.user._id; // From auth middleware

    let orderItems = [];
    let subtotal = 0;

    // Handle Cart Purchase
    if (purchaseType === "cart") {
      const cart = await Cart.findOne({ userId }).populate("items.productId");

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty",
        });
      }

      // Process cart items
      for (const cartItem of cart.items) {
        const product = cartItem.productId;

        const itemSubtotal = product.price * cartItem.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
          productId: product._id,
          colorId: cartItem.colorId,
          name: product.name,
          description: product.description,
          quantity: cartItem.quantity,
          isPersonalized: cartItem.isPersonalized || false,
          personalizedName: cartItem.personalizedName || null,
          priceAtPurchase: product.price,
          subtotal: itemSubtotal,
          addedFrom: "cart",
          images: product.images,
          sku: product.sku,
        });
      }
    }

    // Handle Direct Purchase
    else if (purchaseType === "direct") {
      for (const item of items) {
        const product = await Product.findById(item.productId);

        if (!product) {
          return res.status(404).json({
            success: false,
            message: "Product not found",
          });
        }

        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
          productId: product._id,
          colorId: item.colorId,
          name: product.name,
          description: product.description,
          quantity: item.quantity,
          isPersonalized: item.isPersonalized || false,
          personalizedName: item.personalizedName || null,
          priceAtPurchase: product.price,
          subtotal: itemSubtotal,
          addedFrom: "direct",
          images: product.images,
          sku: product.sku,
        });
      }
    }

    // Calculate pricing
    let discount = 0;
    let couponId = null;

    // TODO: Apply coupon logic here
    // if (couponCode) {
    //   // Validate and apply coupon
    //   // discount = ...
    //   // couponId = ...
    // }

    const shipping = subtotal > 1000 ? 0 : 50; // Free shipping above ₹1000
    const giftWrapCharges = giftWrap ? 50 : 0;
    const total = subtotal - discount + shipping + giftWrapCharges;

    // Create order
    const order = new Order({
      userId,
      purchaseType,
      items: orderItems,
      pricing: {
        subtotal,
        discount: {
          amount: discount,
          couponCode: couponCode || null,
          couponId,
        },
        shipping,
        total,
      },
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      notes: {
        customer: notes || "",
      },
      isGift: isGift || false,
      giftMessage: giftMessage || null,
      giftWrap: giftWrap || false,
      giftWrapCharges,
      status: "pending",
      payment: {
        status: "pending",
      },
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        orderId: order.orderId,
        _id: order._id,
        total: order.pricing.total,
      },
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// 2. Create Razorpay Order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user._id;

    // Find order
    const order = await Order.findOne({ orderId, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order is pending
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Order is not in pending state",
      });
    }
    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: order.pricing.total * 100, // Amount in paise
      currency: "INR",
      receipt: order.orderId,
      notes: {
        orderId: order.orderId,
        userId: userId.toString(),
      },
    });
    // Update order with Razorpay order ID
    order.payment.razorpay.orderId = razorpayOrder.id;
    await order.save();

    res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: order.pricing.total,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create Razorpay Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
};

// 3. Verify Payment (MOST CRITICAL)
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const userId = req.user._id;

    // Find order
    const order = await Order.findOne({ orderId, userId }).populate(
      "items.productId"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      // Payment verification failed
      order.status = "payment_failed";
      order.payment.status = "failed";
      await order.save();

      // Send failure email
      await sendEmail(
        order.shippingAddress.email,
        "paymentFailed",
        `Your payment for order ${order.orderId} has failed. Please try again.`
      );

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Verify amount with Razorpay
    const razorpayOrderDetails = await razorpay.orders.fetch(razorpay_order_id);
    const expectedAmount = order.pricing.total * 100; // Amount in paise

    if (razorpayOrderDetails.amount !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: "Amount mismatch",
      });
    }

    // Payment successful - Update order
    order.status = "confirmed";
    order.payment.status = "completed";
    order.payment.verified = true;
    order.payment.razorpay.paymentId = razorpay_payment_id;
    order.payment.razorpay.signature = razorpay_signature;
    order.payment.transactionId = razorpay_payment_id;
    order.payment.paidAt = new Date();

    // Reduce stock for each item
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const colorVariant = product.colors.id(item.colorId);
        if (colorVariant) {
          colorVariant.stock -= item.quantity;
          await product.save();
        }
      }
    }

    // Generate OTP for delivery
    const deliveryOTP = generateOTP();
    order.notes.internal = `Delivery OTP: ${deliveryOTP}`;

    await order.save();

    // Clear cart if order was from cart
    if (order.purchaseType === "cart") {
      await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });
    }

    // Send OTP and success email
    await sendOTP(
      order.shippingAddress.email,
      order.shippingAddress.phone,
      deliveryOTP,
      order.orderId
    );

    await sendEmail(
      order.shippingAddress.email,
      "orderConfirmed",
      `Your order ${order.orderId} has been confirmed! Total: ₹${order.pricing.total}. Delivery OTP: ${deliveryOTP}`
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order: {
        orderId: order.orderId,
        status: order.status,
        deliveryOTP,
      },
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};

// 4. Webhook Handler for Razorpay
exports.handleWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET; // Add this to .env

    // Verify webhook signature
    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (generatedSignature !== webhookSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;

    // Find order by Razorpay order ID
    const order = await Order.findOne({
      "payment.razorpay.orderId": paymentEntity.order_id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Handle different events
    switch (event) {
      case "payment.captured":
        order.status = "confirmed";
        order.payment.status = "completed";
        order.payment.verified = true;
        await order.save();
        break;

      case "payment.failed":
        order.status = "payment_failed";
        order.payment.status = "failed";
        await order.save();

        await sendEmail(
          order.shippingAddress.email,
          "Payment Failed",
          `Your payment for order ${order.orderId} has failed.`
        );
        break;

      case "refund.created":
        order.payment.status = "refunded";
        order.status = "refunded";
        await order.save();
        break;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

// 5. Get User Orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { userId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("items.productId", "name images");

    const count = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalOrders: count,
    });
  } catch (error) {
    console.error("Get User Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// 6. Get Single Order
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ orderId, userId }).populate(
      "items.productId"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// 7. Cancel Order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const order = await Order.findOne({ orderId, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage",
      });
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const colorVariant = product.colors.id(item.colorId);
        if (colorVariant) {
          colorVariant.stock += item.quantity;
          await product.save();
        }
      }
    }

    order.status = "cancelled";
    order.cancellation = {
      reason,
      cancelledBy: "customer",
      cancelledAt: new Date(),
      refundStatus: "pending",
    };

    await order.save();

    // Send cancellation email
    await sendEmail(
      order.shippingAddress.email,
      "Order Cancelled",
      `Your order ${order.orderId} has been cancelled. Refund will be processed within 5-7 business days.`
    );

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

// 8. Verify Delivery OTP
exports.verifyDeliveryOTP = async (req, res) => {
  try {
    const { orderId, otp } = req.body;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Extract OTP from internal notes
    const storedOTP = order.notes.internal?.match(/Delivery OTP: (\d{6})/)?.[1];

    if (!storedOTP || storedOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    order.status = "delivered";
    order.shipping.deliveredAt = new Date();
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order delivered successfully",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
};
