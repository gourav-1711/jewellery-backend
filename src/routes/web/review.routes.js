const express = require("express");
const router = express.Router();
const { createReview, getReviewsByProduct } = require("../../controller/web/review.controller");
const { uploadNone } = require("../../middleware/uploadMiddleware");

router.post("/create", uploadNone, createReview);
router.post("/get/:productId", uploadNone, getReviewsByProduct);

module.exports = router;