const color = require("../../models/color");

exports.colorController = async (req, res) => {
  try {
    const colorData = await color.find({
      status: true,
      deletedAt: null,
    });
    console.log(colorData);
    res.status(200).json({
      _status: true,
      _message: "Color Data",
      _data: colorData,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error.message,
    });
  }
};
