// admin panel login and user management
const { generateToken } = require("../../lib/jwt");
const userModel = require("../../models/user");

// admin panel login
module.exports.login = async (req, res) => {
  if (!req.body) {
    return res
      .status(400)
      .json({ _status: false, _message: "No data provided" });
  }
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        _status: false,
        _message: "All fields are required",
      });
    }
    const user = await userModel.findOne({ email , role : "admin" });
    if (!user) {
      return res.status(404).json({
        _status: false,
        _message: "Admin not found",
      });
    }
    const token = generateToken(user);
    return res.status(200).json({
      _status: true,
      _message: "Admin logged in successfully",
      _token: token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && {
        _error: error.message,
      }),
    });
  }
};

module.exports.findAllUser = async (req, res) => {
  try {
    const users = await userModel.find({});
    return res.status(200).json({
      _status: true,
      _message: "Users found successfully",
      _users: users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && {
        _error: error.message,
      }),
    });
  }
};
