const Product = require("../../models/product");
const Category = require("../../models/category");
const SubCategory = require("../../models/subCategory");
const SubSubCategory = require("../../models/subSubCategory");

// Get Single Product by ID or Slug
exports.getOne = async (request, response) => {
  try {
    const { slug } = request.params;

    let product;

    // Check if id is a valid ObjectId

    // Find by slug
    product = await Product.findOne({
      slug: slug,
      status: true,
      deletedAt: null,
    })
      .populate("colors", "name code")
      .populate("material", "name ")
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug");

    if (!product) {
      throw new Error("Product not found");
    }

    const output = {
      _status: true,
      _message: "Product fetched successfully",
      _data: product,
    };

    response.send(output);
  } catch (err) {
    const output = {
      _status: false,
      _message: err.message || "Something went wrong",
      _data: null,
    };

    response.send(output);
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const { categorySlug, subCategorySlug, subSubCategorySlug } = req.params;
    const { page = 1, limit = 20, sort = "-createdAt" } = req.query;

    const skip = (page - 1) * limit;

    // Find categories by slug
    const category = categorySlug
      ? await Category.findOne({ slug: categorySlug })
      : null;
    const subCategory = subCategorySlug
      ? await SubCategory.findOne({ slug: subCategorySlug })
      : null;
    const subSubCategory = subSubCategorySlug
      ? await SubSubCategory.findOne({ slug: subSubCategorySlug })
      : null;

    // Build filter
    const filters = [];
    if (category) filters.push({ category: { $in: [category._id] } });
    if (subCategory) filters.push({ subCategory: { $in: [subCategory._id] } });
    if (subSubCategory)
      filters.push({ subSubCategory: { $in: [subSubCategory._id] } });

    if (filters.length === 0) {
      return res.send({
        _status: false,
        _message: "No Products Found",
        _data: [],
      });
    }

    // Fetch products (array-safe query)
    const products = await Product.find({
      $or: filters,
      deletedAt: null, // exclude soft-deleted
      status: true,
    })
      .populate("category")
      .populate("subCategory")
      .populate("subSubCategory")
      .sort(sort)
      .limit(Number(limit))
      .skip(skip);

    const total = await Product.countDocuments({
      $or: filters,
      deletedAt: null,
      status: true,
    });

    res.send({
      _status: true,
      _message: "Products fetched successfully",
      _data: products,
      _pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.send({
      _status: false,
      _message: err.message || "Something went wrong",
      _data: [],
    });
  }
};
exports.getProductByFilter = async (req, res) => {
  try {
    const {
      isFeatured,
      isNewArrival,
      isBestSeller,
      isTopRated,
      isUpsell,
      isOnSale,
      categorySlug,
      subCategorySlug,
      subSubCategorySlug,
    } = req.body || {}; // ✅ default to empty object

    const query = {
      deletedAt: null,
      status: true,
    };
    console.log(categorySlug , subCategorySlug , subSubCategorySlug);

    // ✅ Boolean filters
    if (isFeatured !== undefined) query.isFeatured = isFeatured;
    if (isNewArrival !== undefined) query.isNewArrival = isNewArrival;
    if (isBestSeller !== undefined) query.isBestSeller = isBestSeller;
    if (isTopRated !== undefined) query.isTopRated = isTopRated;
    if (isUpsell !== undefined) query.isUpsell = isUpsell;
    if (isOnSale !== undefined) query.isOnSale = isOnSale;

    // ✅ Slug filters
    if (categorySlug) {
      const categories = await Category.find({
        slug: Array.isArray(categorySlug)
          ? { $in: categorySlug }
          : categorySlug,
      }).select("_id");
      if (categories.length > 0) {
        query.category = { $in: categories.map((c) => c._id) };
      }
    }

    if (subCategorySlug) {
      const subCategories = await SubCategory.find({
        slug: Array.isArray(subCategorySlug)
          ? { $in: subCategorySlug }
          : subCategorySlug,
      }).select("_id");
      if (subCategories.length > 0) {
        query.subCategory = { $in: subCategories.map((c) => c._id) };
      }
    }

    if (subSubCategorySlug) {
      const subSubCategories = await SubSubCategory.find({
        slug: Array.isArray(subSubCategorySlug)
          ? { $in: subSubCategorySlug }
          : subSubCategorySlug,
      }).select("_id");
      if (subSubCategories.length > 0) {
        query.subSubCategory = { $in: subSubCategories.map((c) => c._id) };
      }
    }

    // ✅ Fetch results
    const products = await Product.find(query)
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .populate("colors", "name code")
      .populate("material", "name ")
      .limit(20)
      .sort("-createdAt");

    res.send({
      _status: true,
      _message: "Filtered products fetched successfully",
      _data: products,
    });
  } catch (err) {
    res.send({
      _status: false,
      _message: err.message || "Something went wrong",
      _data: [],
    });
  }
};

exports.getBySearch = async (req, res) => {
  try {
    const { search } = req.body;
    const products = await Product.find({
      name: { $regex: search, $options: "i" },
      slug: { $regex: search, $options: "i" },
      deletedAt: null,
      status: true,
    })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .sort("-createdAt");
    res.send({
      _status: true,
      _message: "Products fetched successfully",
      _data: products,
    });
  } catch (err) {
    res.send({
      _status: false,
      _message: err.message || "Something went wrong",
      _data: [],
    });
  }
};

// for sitemap only
exports.getAll = async (req, res) => {
  try {
    const products = await Product.find({
      deletedAt: null,
      status: true,
    })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .sort("-createdAt");
    res.send({
      _status: true,
      _message: "Products fetched successfully",
      _data: products,
    });
  } catch (err) {
    res.send({
      _status: false,
      _message: err.message || "Something went wrong",
      _data: [],
    });
  }
};
