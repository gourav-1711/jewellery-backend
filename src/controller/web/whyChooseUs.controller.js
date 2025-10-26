const whyChooseUs = require("../../models/whyChooseUs");

exports.whyChooseUsController = async (req, res) => {
  try {
    const whyChooseUsData = await whyChooseUs.find({
      deletedAt: null,
      status: true,
    });
    res.status(200).json({
      _status: true,
      _message: "Why Choose Us Data",
      _data: whyChooseUsData,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error.message,
    });
  }
};
