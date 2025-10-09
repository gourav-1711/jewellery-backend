const express = require("express");
const router = express.Router();
const {
  createBanner,
  //   updateBanner,
  deleteBanner,
  getAllBanner,
  changeStatus,
} = require("../../controller/admin/adminBanner.controller");
const protect = require("../../middleware/authMiddleware");
const { uploadSingle } = require("../../middleware/uploadMiddleware");

// create banner
router.post("/create", protect, uploadSingle, createBanner);
// update banner
// router.put("/update/:id", protect, uploadSingle, updateBanner);
// delete banner
router.delete("/delete/:id", protect, uploadSingle, deleteBanner);
// get all banner
router.post("/get-all", protect, uploadSingle, getAllBanner);
// change status
router.post("/change-status", protect, uploadSingle, changeStatus);
module.exports = router;
