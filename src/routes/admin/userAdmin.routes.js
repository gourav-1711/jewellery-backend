const express = require("express");
const router = express.Router();
const {
  login,
  findAllUser,
} = require("../../controller/admin/userAdmin.controller");
const protect = require("../../middleware/authMiddleware");
const { uploadNone } = require("../../middleware/uploadMiddleware");
router.post("/login" ,uploadNone,login);
router.get("/findAllUser", protect ,uploadNone,findAllUser);

module.exports = router;
