const express = require("express");
const router = express.Router();
const { getAllReviews, getReviewById, updateReview, deleteReview } = require("../../controller/admin/adminReview.controller");

router.post("/view", getAllReviews);
router.post("/details/:id", getReviewById);
router.put("/update/:id", updateReview);
router.put("/delete/:id", deleteReview);

module.exports = router;