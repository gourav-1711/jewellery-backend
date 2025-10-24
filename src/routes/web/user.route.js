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
  changePassword,
  googleLogin,
  googleAuthCallback,
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

router.put(
  "/update-profile",
  rateLimit.updateProfile,
  protect,
  uploadAvatar,
  updateProfile
);

router.post(
  "/change-password",
  rateLimit.passwordReset,
  protect,
  uploadNone,
  changePassword
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

// router.post("/google-login", uploadNone, googleLogin);

router.post("/google-callback", uploadNone, googleAuthCallback);

module.exports = router;
