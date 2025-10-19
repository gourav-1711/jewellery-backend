// src/routes/admin/category.routes.js
const express = require("express");
const router = express.Router();
const {
  getOne,
  getByCategory,
  getProductByFilter,
  getBySearch,
} = require("../../controller/web/product.controller");
const { uploadNone } = require("../../middleware/uploadMiddleware");
// Category routes
router.post("/details/:slug", uploadNone, getOne);
router.post(
  "/get-by-category/:categorySlug/:subCategorySlug/:subSubCategorySlug",
  uploadNone,
  getByCategory
);
router.post("/get-by-filter", uploadNone, getProductByFilter);
router.post("/get-by-search", uploadNone, getBySearch);

module.exports = router;
