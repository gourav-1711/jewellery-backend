const Reviews = require("../../models/review");

// 🟢 Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Reviews.find()
      .populate("userId") // optional if you have user reference
      .populate("productId") // optional if linked to product
      .sort("-createdAt");

    res.status(200).json({
      _status: true,
      _message: "All reviews fetched successfully",
      _data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error.message || "Failed to fetch reviews",
      _data: [],
    });
  }
};

// 🟢 Get single review by ID
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Reviews.findById(id)
      .populate("userId")
      .populate("productId");

    if (!review) {
      return res.status(404).json({
        _status: false,
        _message: "Review not found",
        _data: null,
      });
    }

    res.status(200).json({
      _status: true,
      _message: "Review fetched successfully",
      _data: review,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error.message || "Failed to fetch review",
      _data: null,
    });
  }
};

// 🟢 Update review 
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await Reviews.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        _status: false,
        _message: "Review not found",
        _data: null,
      });
    }

    res.status(200).json({
      _status: true,
      _message: "Review updated successfully",
      _data: updated,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error.message || "Failed to update review",
      _data: null,
    });
  }
};

// 🟢 Soft delete review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Reviews.findById(id);
    if (!review) {
      return res.status(404).json({
        _status: false,
        _message: "Review not found",
        _data: null,
      });
    }

    review.deletedAt = Date.now();
    await review.save();

    res.status(200).json({
      _status: true,
      _message: "Review marked as deleted successfully",
      _data: null,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error.message || "Failed to delete review",
      _data: null,
    });
  }
};
