const Product = require("../../models/product");
const mongoose = require("mongoose");
const Category = require("../../models/category");
const SubCategory = require("../../models/subCategory");
const SubSubCategory = require("../../models/subSubCategory");
const { uploadToR2, deleteFromR2 } = require("../../lib/cloudflare");
const {generateUniqueSlug} = require("../../lib/slugFunc");

// Create Product
exports.create = async (request, response) => {
  try {
    const data = new Product(request.body);

    // Upload main image to Cloudflare R2 if file exists
    if (request.file) {
      const uploadResult = await uploadToR2(request.file, "products");

      if (uploadResult.success) {
        data.image = uploadResult.url;
      } else {
        throw new Error("Failed to upload image");
      }
    }

    // Upload multiple images if they exist
    if (request.files && request.files.length > 0) {
      const imageUrls = [];

      for (const file of request.files) {
        const uploadResult = await uploadToR2(file, "products");

        if (uploadResult.success) {
          imageUrls.push(uploadResult.url);
        }
      }

      data.images = imageUrls;
    }

    // Generate slug
    const slug = await generateUniqueSlug(Product, data.name);
    data.slug = slug;

    // Validate categories exist (handle both single and multiple)
    if (data.category) {
      const categoryIds = Array.isArray(data.category)
        ? data.category
        : [data.category];

      for (const catId of categoryIds) {
        const categoryExists = await Category.findById(catId);
        if (!categoryExists) {
          throw new Error(`Category with ID ${catId} not found`);
        }
      }
    }

    // Validate subCategories exist (handle both single and multiple)
    if (data.subCategory) {
      const subCategoryIds = Array.isArray(data.subCategory)
        ? data.subCategory
        : [data.subCategory];

      for (const subCatId of subCategoryIds) {
        const subCategoryExists = await SubCategory.findById(subCatId);
        if (!subCategoryExists) {
          throw new Error(`SubCategory with ID ${subCatId} not found`);
        }
      }
    }

    // Validate subSubCategories exist (handle both single and multiple)
    if (data.subSubCategory) {
      const subSubCategoryIds = Array.isArray(data.subSubCategory)
        ? data.subSubCategory
        : [data.subSubCategory];

      for (const subSubCatId of subSubCategoryIds) {
        const subSubCategoryExists = await SubSubCategory.findById(subSubCatId);
        if (!subSubCategoryExists) {
          throw new Error(`SubSubCategory with ID ${subSubCatId} not found`);
        }
      }
    }

    const ress = await data.save();

    const output = {
      _status: true,
      _message: "Product created successfully",
      _data: ress,
    };

    response.send(output);
  } catch (err) {
    const messages = [];

    if (err.errors) {
      for (let msg in err.errors) {
        if (err.errors[msg].message) {
          messages.push(err.errors[msg].message);
        }
      }
    } else {
      messages.push(err.message || "Something went wrong");
    }

    const output = {
      _status: false,
      _message: messages,
      _data: [],
    };

    response.send(output);
  }
};

// Get All Products
exports.view = async (request, response) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      subCategory,
      subSubCategory,
      minPrice,
      maxPrice,
      search,
      sort = "-createdAt",
      inStock,
    } = request.query;

    const query = {deletedAt: null};

    // Filter by category
    if (category) {
      query.category = Array.isArray(category) ? { $in: category } : category;
    }
    if (subCategory) {
      query.subCategory = Array.isArray(subCategory)
        ? { $in: subCategory }
        : subCategory;
    }
    if (subSubCategory) {
      query.subSubCategory = Array.isArray(subSubCategory)
        ? { $in: subSubCategory }
        : subSubCategory;
    }
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by stock
    if (inStock === "true") {
      query.stock = { $gt: 0 };
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .sort(sort)
      .limit(Number(limit))
      .skip(skip);

    const total = await Product.countDocuments(query);

    const output = {
      _status: true,
      _message: "Products fetched successfully",
      _data: products,
      _pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };

    response.send(output);
  } catch (err) {
    const output = {
      _status: false,
      _message: err.message || "Something went wrong",
      _data: [],
    };

    response.send(output);
  }
};

// Get Single Product by ID or Slug
exports.getOne = async (request, response) => {
  try {
    const { id, slug } = request.params;

    let product;

    // Check if id is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id)
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .populate("subSubCategory", "name slug");
    } else {
      // Find by slug
      product = await Product.findOne({ slug: slug })
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .populate("subSubCategory", "name slug");
    }

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

// Update Product
exports.update = async (request, response) => {
  try {
    const { id } = request.params;
    const updateData = { ...request.body };

    // Find existing product
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      throw new Error("Product not found");
    }

    // Upload new main image if provided
    if (request.file) {
      const uploadResult = await uploadToR2(request.file, "products");

      if (uploadResult.success) {
        // Delete old image if exists
        if (existingProduct.image) {
          await deleteFromR2(existingProduct.image);
        }
        updateData.image = uploadResult.url;
      }
    }

    // Upload new multiple images if provided
    if (request.files && request.files.length > 0) {
      const imageUrls = [];

      for (const file of request.files) {
        const uploadResult = await uploadToR2(file, "products");

        if (uploadResult.success) {
          imageUrls.push(uploadResult.url);
        }
      }

      // Delete old images if exists
      if (existingProduct.images && existingProduct.images.length > 0) {
        for (const imageUrl of existingProduct.images) {
          await deleteFromR2(imageUrl);
        }
      }

      updateData.images = imageUrls;
    }

    // Update slug if name changed
    if (updateData.name && updateData.name !== existingProduct.name) {
      const slug = await generateUniqueSlug(Product, updateData.name);
      updateData.slug = slug;
    }

    // Validate categories if changed (handle both single and multiple)
    if (updateData.category) {
      const categoryIds = Array.isArray(updateData.category)
        ? updateData.category
        : [updateData.category];

      // Check if categories have changed
      const existingCategoryIds = Array.isArray(existingProduct.category)
        ? existingProduct.category.map((id) => id.toString())
        : [existingProduct.category.toString()];

      const categoriesChanged =
        JSON.stringify(categoryIds.sort()) !==
        JSON.stringify(existingCategoryIds.sort());

      if (categoriesChanged) {
        for (const catId of categoryIds) {
          const categoryExists = await Category.findById(catId);
          if (!categoryExists) {
            throw new Error(`Category with ID ${catId} not found`);
          }
        }
      }
    }

    // Validate subCategories if changed (handle both single and multiple)
    if (updateData.subCategory) {
      const subCategoryIds = Array.isArray(updateData.subCategory)
        ? updateData.subCategory
        : [updateData.subCategory];

      // Check if subCategories have changed
      const existingSubCategoryIds = existingProduct.subCategory
        ? Array.isArray(existingProduct.subCategory)
          ? existingProduct.subCategory.map((id) => id.toString())
          : [existingProduct.subCategory.toString()]
        : [];

      const subCategoriesChanged =
        JSON.stringify(subCategoryIds.sort()) !==
        JSON.stringify(existingSubCategoryIds.sort());

      if (subCategoriesChanged) {
        for (const subCatId of subCategoryIds) {
          const subCategoryExists = await SubCategory.findById(subCatId);
          if (!subCategoryExists) {
            throw new Error(`SubCategory with ID ${subCatId} not found`);
          }
        }
      }
    }

    // Validate subSubCategories if changed (handle both single and multiple)
    if (updateData.subSubCategory) {
      const subSubCategoryIds = Array.isArray(updateData.subSubCategory)
        ? updateData.subSubCategory
        : [updateData.subSubCategory];

      // Check if subSubCategories have changed
      const existingSubSubCategoryIds = existingProduct.subSubCategory
        ? Array.isArray(existingProduct.subSubCategory)
          ? existingProduct.subSubCategory.map((id) => id.toString())
          : [existingProduct.subSubCategory.toString()]
        : [];

      const subSubCategoriesChanged =
        JSON.stringify(subSubCategoryIds.sort()) !==
        JSON.stringify(existingSubSubCategoryIds.sort());

      if (subSubCategoriesChanged) {
        for (const subSubCatId of subSubCategoryIds) {
          const subSubCategoryExists = await SubSubCategory.findById(
            subSubCatId
          );
          if (!subSubCategoryExists) {
            throw new Error(`SubSubCategory with ID ${subSubCatId} not found`);
          }
        }
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug");

    const output = {
      _status: true,
      _message: "Product updated successfully",
      _data: updatedProduct,
    };

    response.send(output);
  } catch (err) {
    const messages = [];

    if (err.errors) {
      for (let msg in err.errors) {
        if (err.errors[msg].message) {
          messages.push(err.errors[msg].message);
        }
      }
    } else {
      messages.push(err.message || "Something went wrong");
    }

    const output = {
      _status: false,
      _message: messages,
      _data: null,
    };

    response.send(output);
  }
};

// Delete Product
exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      throw new Error("Product not found");
    }

    product.deletedAt = Date.now();
    await product.save();

    res.send({
      _status: true,
      _message: "Product deleted successfully",
      _data: product,
    });
  } catch (err) {
    res.send({
      _status: false,
      _message: err.message || "Something went wrong",
      _data: null,
    });
  }
};

exports.changeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.updateMany(
      {
        _id: id,
      },
      [
        {
          $set: {
            status: {
              $not: "$status",
            },
          },
        },
      ]
    );

    if (!product) {
      throw new Error("Product not found");
    }

    res.send({
      _status: true,
      _message: "Product status changed successfully",
      _data: product,
    });
  } catch (err) {
    res.send({
      _status: false,
      _message: err.message || "Something went wrong",
      _data: null,
    });
  }
};

// Get Products by Category
exports.getByCategory = async (request, response) => {
  try {
    let { categoryId, subCategoryId, subSubCategoryId } = request.params;
    const { page = 1, limit = 20, sort = "-createdAt" } = request.query;

    // Convert single categoryId to array if it's not already
    const categoryIds = Array.isArray(categoryId) ? categoryId : [categoryId];
    const subCategoryIds = Array.isArray(subCategoryId)
      ? subCategoryId
      : [subCategoryId];
    const subSubCategoryIds = Array.isArray(subSubCategoryId)
      ? subSubCategoryId
      : [subSubCategoryId];

    const skip = (page - 1) * limit;

    // Find products where any of the categories match
    const products = await Product.find({
      $or: [
        { category: { $in: categoryIds } },
        { subCategory: { $in: subCategoryIds } },
        { subSubCategory: { $in: subSubCategoryIds } },
      ],
    })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .sort(sort)
      .limit(Number(limit))
      .skip(skip);

    const total = await Product.countDocuments({
      category: { $in: categoryIds },
    });

    const output = {
      _status: true,
      _message: "Products fetched successfully",
      _data: products,
      _pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };

    response.send(output);
  } catch (err) {
    const output = {
      _status: false,
      _message: err.message || "Something went wrong",
      _data: [],
    };

    response.send(output);
  }
};

// Get Filtered Products
exports.getProductByFilter = async (request, response) => {
  try {
    const {
      limit = 10,
      isFeatured,
      isNewArrival,
      isBestSeller,
      isTopRated,
      isUpsell,
      isOnSale,
      category,
      subCategory,
      subSubCategory,
    } = request.body;

    const query = {};

    // Add filter conditions if they are provided
    if (isFeatured !== undefined) query.isFeatured = isFeatured;
    if (isNewArrival !== undefined) query.isNewArrival = isNewArrival;
    if (isBestSeller !== undefined) query.isBestSeller = isBestSeller;
    if (isTopRated !== undefined) query.isTopRated = isTopRated;
    if (isUpsell !== undefined) query.isUpsell = isUpsell;
    if (isOnSale !== undefined) query.isOnSale = isOnSale;

    // Handle category filters
    if (category) {
      query.category = Array.isArray(category) ? { $in: category } : category;
    }
    if (subCategory) {
      query.subCategory = Array.isArray(subCategory)
        ? { $in: subCategory }
        : subCategory;
    }
    if (subSubCategory) {
      query.subSubCategory = Array.isArray(subSubCategory)
        ? { $in: subSubCategory }
        : subSubCategory;
    }

    const products = await Product.find(query)
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .limit(Number(limit))
      .sort("-createdAt");

    const output = {
      _status: true,
      _message: "Filtered products fetched successfully",
      _data: products,
    };

    response.send(output);
  } catch (err) {
    const output = {
      _status: false,
      _message: err.message || "Something went wrong",
      _data: [],
    };

    response.send(output);
  }
};

// Update Stock
exports.updateStock = async (request, response) => {
  try {
    const { id, stock } = request.body;

    if (stock === undefined || stock < 0) {
      throw new Error("Invalid stock value");
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { stock: Number(stock) },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new Error("Product not found");
    }

    const output = {
      _status: true,
      _message: "Stock updated successfully",
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
