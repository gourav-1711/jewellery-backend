const express = require("express");
const router = express.Router();
const {
  login,
  findAllUser,
  getFullDetails,
} = require("../../controller/admin/userAdmin.controller");
const protect = require("../../middleware/authMiddleware");
const { uploadNone } = require("../../middleware/uploadMiddleware");
router.post("/login", uploadNone, login);
router.post("/findAllUser", protect, uploadNone, findAllUser);
router.post("/get-full-details`/:id", protect, uploadNone, getFullDetails);

module.exports = router;
