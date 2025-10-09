const slugify = require("slugify");



const generateUniqueSlug = async (model, text, count = 0) => {
  const slug = count ? `${slugify(text)}-${count}` : slugify(text);
  const exists = await model.findOne({ slug, deletedAt: null });
  return exists ? generateUniqueSlug(model, text, count + 1) : slug;
};

module.exports = {
  slugify,
  generateUniqueSlug
};
