const Reviews = require("../../models/review");
const Product = require("../../models/product");

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user?._id; // assuming you're using auth middleware

    // Validation
    if (!productId || !rating || !comment) {
      return res.status(400).json({
        _status: false,
        _message: "Product ID, rating, and comment are required",
        _data: null,
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        _status: false,
        _message: "Product not found",
        _data: null,
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Reviews.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.status(400).json({
        _status: false,
        _message: "You have already reviewed this product",
        _data: null,
      });
    }

    // Create new review
    const review = await Reviews.create({
      user: userId,
      product: productId,
      rating,
      comment,
    });

    res.status(201).json({
      _status: true,
      _message: "Review submitted successfully",
      _data: review,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error.message || "Failed to create review",
      _data: null,
    });
  }
};

exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Reviews.find({
      product: productId,
      deletedAt: null,
    })
      .populate("user", "name email avatar")
      .sort("-createdAt");

    res.status(200).json({
      _status: true,
      _message: "Reviews fetched successfully",
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
