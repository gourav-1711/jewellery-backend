const faq = require("../../models/faq");

exports.faqController = async (req, res) => {
  try {
    const faqData = await faq.find({
      status: true,
      deletedAt: null,
    });
    res.status(200).json({
      _status: true,
      _message: "Faq Data",
      _data: faqData,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error.message,
    });
  }
};
