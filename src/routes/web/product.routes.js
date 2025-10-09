// src/routes/admin/category.routes.js
const express = require("express");
const router = express.Router();
const {
  getOne,
  getByCategory,
  getProductByFilter,
} = require("../../controller/web/product.controller");
const Protect = require("../../middleware/authMiddleware");
const { uploadNone } = require("../../middleware/uploadMiddleware");
// Category routes
router.post("/details/:slug", Protect, getOne);
router.post(
  "/get-by-category/:categorySlug/:subCategorySlug/:subSubCategorySlug",
  Protect,
  uploadNone,
  getByCategory
);
router.post("/get-by-filter", Protect, uploadNone, getProductByFilter);

module.exports = router;
