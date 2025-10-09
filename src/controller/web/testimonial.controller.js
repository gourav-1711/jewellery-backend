const testimonial = require("../../models/testimonial");

exports.testimonialController = async (req, res) => {
  try {
    const testimonialData = await testimonial.find();
    res.status(200).json({
      _status: true,
      _message: "Testimonial Data",
      _data: testimonialData,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error.message,
    });
  }
};
