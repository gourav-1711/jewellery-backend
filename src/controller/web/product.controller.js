const Product = require("../../models/product");
const Category = require("../../models/category");
const SubCategory = require("../../models/subCategory");
const SubSubCategory = require("../../models/subSubCategory");

const cache = require("../../lib/cache");

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
      .populate("subSubCategory", "name slug")
      .lean();

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
      colorIds,
      materialIds,
      categorySlug,
      subCategorySlug,
      subSubCategorySlug,
      priceFrom,
      priceTo,
      limit = 20,
      page = 1,
    } = req.body || {}; // ✅ default to empty object

    const query = {
      deletedAt: null,
      status: true,
    };

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
      })
        .select("_id")
        .lean();
      if (categories.length > 0) {
        query.category = { $in: categories.map((c) => c._id) };
      }
    }

    if (subCategorySlug) {
      const subCategories = await SubCategory.find({
        slug: Array.isArray(subCategorySlug)
          ? { $in: subCategorySlug }
          : subCategorySlug,
      })
        .select("_id")
        .lean();
      if (subCategories.length > 0) {
        query.subCategory = { $in: subCategories.map((c) => c._id) };
      }
    }

    if (subSubCategorySlug) {
      const subSubCategories = await SubSubCategory.find({
        slug: Array.isArray(subSubCategorySlug)
          ? { $in: subSubCategorySlug }
          : subSubCategorySlug,
      })
        .select("_id")
        .lean();
      if (subSubCategories.length > 0) {
        query.subSubCategory = { $in: subSubCategories.map((c) => c._id) };
      }
    }

    if (colorIds?.length > 0) {
      query.colors = { $in: colorIds };
    }

    if (materialIds?.length > 0) {
      query.material = { $in: materialIds };
    }

    // ✅ Price range filter
    if (priceFrom !== undefined && priceTo !== undefined) {
      query.price = { $gte: Number(priceFrom), $lte: Number(priceTo) };
    } else if (priceFrom !== undefined) {
      query.price = { $gte: Number(priceFrom) };
    } else if (priceTo !== undefined) {
      query.price = { $lte: Number(priceTo) };
    }
    const total = await Product.countDocuments(query);
    const skip = (page - 1) * limit;
    // ✅ Fetch results
    const products = await Product.find(query)
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .populate("colors", "name code")
      .populate("material", "name ")
      .limit(limit)
      .skip(skip)
      .sort("-createdAt")
      .lean();

    res.send({
      _status: true,
      _message: "Products Found",
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

exports.getBySearch = async (req, res) => {
  try {
    const { search } = req.body;

    // Trim and validate search term
    if (!search || search.trim() === "") {
      return res.send({
        _status: false,
        _message: "Search term is required",
        _data: [],
      });
    }

    const trimmedSearch = search.trim();

    // Split search term into words for better matching
    const searchWords = trimmedSearch.split(/\s+/);
    // Build regex patterns for each word
    const regexPatterns = searchWords.map((word) => ({
      $or: [
        { name: { $regex: word, $options: "i" } },
        { slug: { $regex: word, $options: "i" } },
        { description: { $regex: word, $options: "i" } },
      ],
    }));

    const query = {
      $and: [...regexPatterns, { deletedAt: null }, { status: true }],
    };

    const products = await Product.find(query)
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .populate("colors", "name code")
      .populate("material", "name ")
      .sort("-createdAt")
      .limit(20)
      .lean();

    res.send({
      _status: true,
      _message: "Products fetched successfully",
      _data: products,
    });
  } catch (err) {
    console.error("Search error:", err);
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
      .sort("-createdAt")
      .lean();
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

// Related Products API (based on subCategory slug)

exports.relatedProducts = async (req, res) => {
  try {
    const { subCategoryIds, subSubCategoryIds } = req.body;

    let products = [];

    // First priority: Find products matching subSubCategory IDs
    if (subSubCategoryIds && subSubCategoryIds.length > 0) {
      products = await Product.find({
        subSubCategory: { $in: subSubCategoryIds },
      })
        .limit(10)
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .populate("subSubCategory", "name slug")
        .populate("colors", "name code")
        .populate("material", "name")
        .lean();
    }

    // If we don't have enough products (less than 10), fill with subCategory matches
    if (products.length < 10 && subCategoryIds && subCategoryIds.length > 0) {
      const remainingLimit = 10 - products.length;

      // Get product IDs we already have to exclude them
      const existingProductIds = products.map((p) => p._id);

      const subCategoryProducts = await Product.find({
        subCategory: { $in: subCategoryIds },
        _id: { $nin: existingProductIds }, // Exclude already fetched products
      })
        .limit(remainingLimit)
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .populate("subSubCategory", "name slug")
        .populate("colors", "name code")
        .populate("material", "name")
        .lean();

      products = [...products, ...subCategoryProducts];
    }

    res.send({
      _status: true,
      _message: "Related products fetched successfully",
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

//////////////////////////////////

// HOME PAGE API

//////////////////////////////////////

// new arrivals
exports.newArrivals = async (req, res) => {
  try {
    if (cache.has("newArrivals")) {
      return res.send({
        _status: true,
        _message: "Products fetched successfully",
        _data: cache.get("newArrivals"),
      });
    }
    const products = await Product.find({
      isNewArrival: true,
      deletedAt: null,
      status: true,
    })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .populate("colors", "name code")
      .populate("material", "name ")
      .sort("-createdAt")
      .limit(20)
      .lean();

    cache.set("newArrivals", products);

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

// trending products
exports.trendingProducts = async (req, res) => {
  try {
    if (cache.has("trendingProducts")) {
      return res.send({
        _status: true,
        _message: "Products fetched successfully",
        _data: cache.get("trendingProducts"),
      });
    }
    const products = await Product.find({
      isUpsell: true,
      deletedAt: null,
      status: true,
    })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .populate("colors", "name code")
      .populate("material", "name ")
      .sort("-createdAt")
      .limit(20)
      .lean();

    cache.set("trendingProducts", products);

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

// 2 featured for footer
exports.featuredForFooter = async (req, res) => {
  try {
    if (cache.has("featuredForFooter")) {
      return res.send({
        _status: true,
        _message: "Products fetched successfully",
        _data: cache.get("featuredForFooter"),
      });
    }
    const products = await Product.find({
      isFeatured: true,
      deletedAt: null,
      status: true,
    })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .populate("colors", "name code")
      .populate("material", "name ")
      .sort("-createdAt")
      .limit(2)
      .lean();

    cache.set("featuredForFooter", products);

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

// for tabbing gold material silver material and is gift 4 per tab
exports.tabProducts = async (req, res) => {
  try {
    if (cache.has("tabProducts")) {
      return res.send({
        _status: true,
        _message: "Products fetched successfully",
        _data: cache.get("tabProducts"),
      });
    }

    const [goldProducts, silverProducts, giftProducts] = await Promise.all([
      Product.find({
        deletedAt: null,
        status: true,
        material: { $exists: true },
      })
        .populate({
          path: "material",
          match: { name: { $regex: "gold", $options: "i" } },
          select: "name",
        })
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .populate("subSubCategory", "name slug")
        .populate("colors", "name code")
        .sort("-createdAt")
        .limit(4)
        .lean(),

      Product.find({
        deletedAt: null,
        status: true,
        material: { $exists: true },
      })
        .populate({
          path: "material",
          match: { name: { $regex: "silver", $options: "i" } },
          select: "name",
        })
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .populate("subSubCategory", "name slug")
        .populate("colors", "name code")
        .sort("-createdAt")
        .limit(4)
        .lean(),

      Product.find({
        deletedAt: null,
        status: true,
        isGift: true,
      })
        .populate({
          path: "category",
          match: { slug: { regex: "gift-items", options: "i" } },
          select: "name slug",
        })
        .populate("subCategory", "name slug")
        .populate("subSubCategory", "name slug")
        .populate("colors", "name code")
        .populate("material", "name")
        .sort("-createdAt")
        .limit(4)
        .lean(),
    ]);

    const goldFiltered = goldProducts.filter((p) => p.material);
    const silverFiltered = silverProducts.filter((p) => p.material);

    cache.set("tabProducts", {
      gold: goldFiltered,
      silver: silverFiltered,
      gift: giftProducts,
    });

    res.send({
      _status: true,
      _message: "Tab products fetched successfully",
      _data: {
        gold: goldFiltered,
        silver: silverFiltered,
        gift: giftProducts,
      },
    });
  } catch (err) {
    res.send({
      _status: false,
      _message: err.message || "Something went wrong",
      _data: { gold: [], silver: [], gift: [] },
    });
  }
};
