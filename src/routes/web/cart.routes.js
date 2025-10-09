const express = require('express');
const router = express.Router();
const { 
    getCart, 
    addToCart, 
    updateCartItem, 
    removeFromCart, 
    clearCart 
} = require('../../controller/web/cart.controller');
const { uploadNone } = require('../../middleware/uploadMiddleware');
const  protect  = require('../../middleware/authMiddleware');

// @desc    Get user's cart
// @route   GET /api/web/cart
// @access  Private
router.get('/', protect, getCart);

// @desc    Add item to cart
// @route   POST /api/web/cart
// @access  Private
router.post('/', protect, uploadNone, addToCart);

// @desc    Update cart item quantity
// @route   PUT /api/web/cart/items/:itemId
// @access  Private
router.put('/items/:itemId', protect, uploadNone, updateCartItem);

// @desc    Remove item from cart
// @route   DELETE /api/web/cart/items/:itemId
// @access  Private
router.delete('/items/:itemId', protect, removeFromCart);

// @desc    Clear cart
// @route   DELETE /api/web/cart
// @access  Private
router.delete('/', protect, clearCart);

module.exports = router;