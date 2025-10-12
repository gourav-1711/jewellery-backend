const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter A Name"],
      minlenght: 3,
      maxlenght: 20,
      match: /^[a-zA-Z 0-9"' ]+$/,
      validate: {
        validator: async function (name) {
          const existingProduct = await this.constructor.findOne({
            name,
            deletedAt: null,
          });
          return !existingProduct;
        },
        message: "Name already exists",
      },
    },
    slug: {
      type: String,
      required: [true, "Please Enter A Slug"],
    },
    image: {
      type: String,
      required: [true, "Please Enter A Image"],
    },
    images: [
      {
        type: String,
        default: "",
        required: [true, "Please Enter A Image"],
      },
    ],
    colors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "colors",
        required: [true, "Please Enter A Color"],
      },
    ],
    material: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "materials",
        required: [true, "Please Enter A Material"],
      },
    ],
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories",
        required: [true, "Category is required"],
      },
    ],
    subCategory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategories",
        required: [true, " Sub Category is required"],
      },
    ],
    subSubCategory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubSubCategories",
        required: [true, " Sub Sub Category is required"],
      },
    ],

    description: {
      type: String,
      required: [true, "Please enter a description"],
    },
    short_description: {
      type: String,
      required: [true, "Please enter a short description"],
    },
    dimensions: {
      type: String,
      required: [true, "Please enter a dimensions"],
    },
    code: {
      type: String,
      required: [true, "Please enter a code"],
    },
    price: {
      type: Number,
      required: [true, "Please enter a price"],
    },
    discount_price: {
      type: Number,
      required: [true, "Please enter a discount price"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter a stock"],
    },
    estimated_delivery_time: {
      type: String,
      required: [true, "Please enter a estimated delivery time"],
    },
    status: {
      type: Boolean,
      required: [true, "Please enter a status"],
    },
    isPersonalized: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isTopRated: {
      type: Boolean,
      default: false,
    },
    isUpsell: {
      type: Boolean,
      default: false,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
      max: 100000,
      match: /^[0-9]+$/,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const productModal = mongoose.model("products", productSchema);

module.exports = productModal;
