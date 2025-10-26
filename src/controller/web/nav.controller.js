const categoryModel = require("../../models/category");
const subCategoryModel = require("../../models/subCategory");
const subSubCategoryModel = require("../../models/subSubCategory");

exports.navController = async (req, res) => {
  try {
    // Fetch all data with ALL fields (including image)
    const categories = await categoryModel
      .find({ deletedAt: null, status: true })
      .lean();
    const subCategories = await subCategoryModel
      .find({ deletedAt: null, status: true })
      .lean();
    const subSubCategories = await subSubCategoryModel
      .find({ deletedAt: null, status: true })
      .lean();

    // Build hierarchical structure
    const navigationData = categories.map((category) => {
      // Find all subCategories that belong to this category
      const categorySubCategories = subCategories
        .filter((subCat) => {
          // Handle both single ID and array of IDs
          if (Array.isArray(subCat.category)) {
            return subCat.category.some(
              (catId) => catId.toString() === category._id.toString()
            );
          }
          return subCat.category.toString() === category._id.toString();
        })
        .map((subCat) => {
          // Find all subSubCategories that belong to this subCategory
          const subCatSubSubCategories = subSubCategories.filter(
            (subSubCat) => {
              // Handle both single ID and array of IDs
              if (Array.isArray(subSubCat.subCategory)) {
                return subSubCat.subCategory.some(
                  (subCatId) => subCatId.toString() === subCat._id.toString()
                );
              }
              return (
                subSubCat.subCategory?.toString() === subCat._id.toString()
              );
            }
          );

          // Returns ALL fields from subCat including image
          return {
            ...subCat,
            subSubCategories: subCatSubSubCategories, // Each includes image field
          };
        });

      // Returns ALL fields from category including image
      return {
        ...category,
        subCategories: categorySubCategories,
      };
    });

    res.status(200).json({
      _status: true,
      _message: "Data fetched successfully",
      _data: navigationData,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error.message,
      _data: [],
    });
  }
};
