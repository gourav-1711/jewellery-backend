const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyOtp,
  verifyUser,
  completeVerify,
} = require("../../controller/web/user.controller");
const protect = require("../../middleware/authMiddleware");
const rateLimit = require("../../middleware/rateLimit");
const {
  uploadAvatar,
  uploadNone,
} = require("../../middleware/uploadMiddleware");

router.post("/register", rateLimit.register, uploadNone, registerUser);
router.post("/login", rateLimit.login, uploadNone, loginUser);
router.post("/profile", protect, uploadNone, getProfile);

router.post(
  "/update-profile",
  rateLimit.updateProfile,
  protect,
  uploadAvatar,
  updateProfile
);

router.post(
  "/forgot-password",
  rateLimit.passwordReset,
  protect,
  uploadNone,
  forgotPassword
);

router.post("/verify-otp", protect, uploadNone, verifyOtp);

router.post(
  "/reset-password",
  rateLimit.passwordReset,
  protect,
  uploadNone,
  resetPassword
);

router.post("/verify-user", protect, uploadNone, verifyUser);

router.post("/complete-verify", protect, uploadNone, completeVerify);

module.exports = router;
