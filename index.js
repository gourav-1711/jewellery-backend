const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

require("dotenv").config();
const app = express();

// parse requests of content-type - application/json
app.use(express.json());

// npm install express body-parser
app.use(bodyParser.json());

app.use(cors());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
// website routes variables
const userRoutes = require("./src/routes/web/user.route");
const productRoutes = require("./src/routes/web/product.routes");
const cartRoutes = require("./src/routes/web/cart.routes");
const wishlistRoutes = require("./src/routes/web/wishlist.routes");
const navRoutes = require("./src/routes/web/nav.routes");
const faqRoutes = require("./src/routes/web/faq.routes");
const testimonialRoutes = require("./src/routes/web/testimonial.routes");
const logoRoutes = require("./src/routes/web/logo.routes");
const bannerRoutes = require("./src/routes/web/banner.routes");
const reviewRoutes = require("./src/routes/web/review.routes");
const whyChooseUsRoutes = require("./src/routes/web/whyChooseUs.routes");
const webColorRoutes = require("./src/routes/web/color.routes");
const webMaterialRoutes = require("./src/routes/web/material.routes");
// admin routes variables
const materialRoutes = require("./src/routes/admin/material.routes");
const colorRoutes = require("./src/routes/admin/color.routes");
const userAdminRoutes = require("./src/routes/admin/userAdmin.routes");
const adminCategoryRoutes = require("./src/routes/admin/adminCategory.routes");
const adminSubCategoryRoutes = require("./src/routes/admin/adminSubCat.routes");
const adminSubSubCategoryRoutes = require("./src/routes/admin/adminSubSubCat.routes");
const adminFaqRoutes = require("./src/routes/admin/adminFaq.routes");
const adminBannerRoutes = require("./src/routes/admin/adminBanner.routes");
const adminTestimonialRoutes = require("./src/routes/admin/adminTestimonial.routes");
const adminLogoRoutes = require("./src/routes/admin/adminLogo.routes");
const adminProductRoutes = require("./src/routes/admin/adminProduct.routes");
const adminReviewRoutes = require("./src/routes/admin/adminReview.routes");
const adminWhyChooseUsRoutes = require("./src/routes/admin/adminWhyChooseUs.routes");
// website routes
app.use("/api/website/logo", logoRoutes);
app.use("/api/website/banner", bannerRoutes);
app.use("/api/website/nav", navRoutes);
app.use("/api/website/user", userRoutes);
app.use("/api/website/product", productRoutes);
app.use("/api/website/cart", cartRoutes);
app.use("/api/website/wishlist", wishlistRoutes);
app.use("/api/website/faq", faqRoutes);
app.use("/api/website/testimonial", testimonialRoutes);
app.use("/api/website/whyChooseUs", whyChooseUsRoutes);
app.use("/api/website/review", reviewRoutes);
app.use("/api/website/color", webColorRoutes);
app.use("/api/website/material", webMaterialRoutes);
// admin routes
app.use("/api/admin/logo", adminLogoRoutes);
app.use("/api/admin/banner", adminBannerRoutes);
app.use("/api/admin/user", userAdminRoutes);
app.use("/api/admin/category", adminCategoryRoutes);
app.use("/api/admin/subcategory", adminSubCategoryRoutes);
app.use("/api/admin/subsubcategory", adminSubSubCategoryRoutes);
app.use("/api/admin/product", adminProductRoutes);
app.use("/api/admin/color", colorRoutes);
app.use("/api/admin/material", materialRoutes);
app.use("/api/admin/faq", adminFaqRoutes);
app.use("/api/admin/testimonial", adminTestimonialRoutes);
app.use("/api/admin/review", adminReviewRoutes);
app.use("/api/admin/whyChooseUs", adminWhyChooseUsRoutes);

// api routes
app.get("/", (req, res) => {
  res.send("server started");
});

app.listen(process.env.PORT, () => {
  mongoose
    .connect(process.env.NEW_DB_URL)
    .then(() => console.log("Connected!"))
    .catch((err) => {
      console.log(err);
    });
  console.log("serer is working");
});
