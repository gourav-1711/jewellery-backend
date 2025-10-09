const express = require('express');
const router = express.Router();
const { 
    getWishlist, 
    addToWishlist, 
    removeFromWishlist, 
    checkInWishlist 
} = require('../../controller/web/wishlist.controller');
const { uploadNone } = require('../../middleware/uploadMiddleware');
const  protect  = require('../../middleware/authMiddleware');

// @desc    Get user's wishlist
// @route   GET /api/web/wishlist
// @access  Private
router.get('/', protect, getWishlist);

// @desc    Add item to wishlist
// @route   POST /api/web/wishlist
// @access  Private
router.post('/', protect, uploadNone, addToWishlist);

// @desc    Remove item from wishlist
// @route   DELETE /api/web/wishlist/:productId
// @access  Private
router.delete('/:productId', protect, removeFromWishlist);

// @desc    Check if product is in wishlist
// @route   GET /api/web/wishlist/check/:productId
// @access  Private
router.get('/check/:productId', protect, checkInWishlist);

module.exports = router;