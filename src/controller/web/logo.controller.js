const logo = require("../../models/logo");

exports.logoController = async (req, res) => {
  try {
    const logoData = await logo.find();
    res.status(200).json({
      _status: true,
      _message: "Logo Data",
      _data: logoData,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error.message,
    });
  }
};
