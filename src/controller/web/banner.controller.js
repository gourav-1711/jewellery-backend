const banner = require("../../models/banner");

exports.bannerController = async (req, res) => {
  try {
    const bannerData = await banner.find();
    res.status(200).json({
      _status: true,
      _message: "Banner Data",
      _data: bannerData,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error.message,
    });
  }
};
