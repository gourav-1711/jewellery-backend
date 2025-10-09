const express = require("express");
const router = express.Router();
const { createReview, getReviewsByProduct } = require("../../controller/web/review.controller");

router.post("/create", createReview);
router.get("/get/:productId", getReviewsByProduct);

module.exports = router;