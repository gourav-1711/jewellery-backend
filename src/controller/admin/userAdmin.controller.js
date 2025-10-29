// admin panel login and user management
const { generateToken } = require("../../lib/jwt");
const userModel = require("../../models/user");
const cartModel = require("../../models/cart");
const order = require("../../models/order");
const wishlistModel = require("../../models/wishlist");
const reviewModel = require("../../models/review");

// admin panel login
exports.login = async (req, res) => {
  if (!req.body) {
    return res
      .status(400)
      .json({ _status: false, _message: "No data provided" });
  }
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        _status: false,
        _message: "All fields are required",
      });
    }
    const user = await userModel.findOne({ email, role: "admin" });
    if (!user) {
      return res.status(404).json({
        _status: false,
        _message: "Admin not found",
      });
    }
    const token = generateToken(user);
    return res.status(200).json({
      _status: true,
      _message: "Admin logged in successfully",
      _token: token,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && {
        _error: error.message,
      }),
    });
  }
};

exports.findAllUser = async (req, res) => {
  try {
    const users = await userModel.find({}).lean();
    return res.status(200).json({
      _status: true,
      _message: "Users found successfully",
      _data: users,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && {
        _error: error.message,
      }),
    });
  }
};
exports.getFullDetails = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    const cart = await cartModel.find({ user: req.params.id });
    const orders = await order.find({ user: req.params.id });
    const wishlist = await wishlistModel.find({ user: req.params.id });
    const reviews = await reviewModel.find({ user: req.params.id });
    return res.status(200).json({
      _status: true,
      _message: "User found successfully",
      _user: user,
      _cart: cart,
      _orders: orders,
      _wishlist: wishlist,
      _reviews: reviews,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && {
        _error: error.message,
      }),
    });
  }
};
