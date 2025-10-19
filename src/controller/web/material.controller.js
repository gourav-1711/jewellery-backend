const material = require("../../models/material");

exports.materialController = async (req, res) => {
  try {
    const materialData = await material.find({
      status: true,
      deletedAt: null,
    });
    res.status(200).json({
      _status: true,
      _message: "Material Data",
      _data: materialData,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error.message,
    });
  }
};
