const userModel = require("../../models/user");
const { generateToken } = require("../../lib/jwt");
const { hashPassword } = require("../../lib/bcrypt");
const { comparePassword } = require("../../lib/bcrypt");
const {
  generateOtp,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} = require("../../lib/jwt");
const { sendEmail } = require("../../lib/nodemailer");

const { uploadToR2, deleteFromR2 } = require("../../lib/cloudflare");
const jwt = require("jsonwebtoken");

module.exports.registerUser = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      _status: false,
      _message: "Please Give Name , Email and Password",
    });
  }
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        _status: false,
        _message: "All fields are required",
      });
    }

    const user = await userModel.findOne({ email });
    if (user) {
      return res.status(409).json({
        _status: false,
        _message: "User already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      _status: true,
      _message: "User registered successfully",
      _token: token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { _error: error.message }),
    });
  }
};

module.exports.loginUser = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      _status: false,
      _message: "Please Give Email and Password",
    });
  }
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        _status: false,
        _message: "All fields are required",
      });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        _status: false,
        _message: "User not found",
      });
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        _status: false,
        _message: "Incorrect password",
      });
    }
    const token = generateToken(user);
    return res.status(200).json({
      _status: true,
      _message: "User logged in successfully",
      _token: token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { _error: error.message }),
    });
  }
};

module.exports.getProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      _status: false,
      _message: "Unauthorized",
    });
  }
  try {
    const user = await userModel.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({
        _status: false,
        _message: "User not found",
      });
    }
    return res.status(200).json({
      _status: true,
      _message: "User profile Found ",
      _data: user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { _error: error.message }),
    });
  }
};

module.exports.updateProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      _status: false,
      _message: "Unauthorized",
    });
  }
  try {
    const user = await userModel.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        _status: false,
        _message: "User not found",
      });
    }

    let avatarUrl = user.avatar;
    if (req.file) {
      try {
        // Delete old avatar if exists
        if (user.avatarFileName) {
          await deleteFromR2(user.avatarFileName);
        }

        // Upload new avatar to Cloudflare R2
        const uploadResult = await uploadToR2(req.file, "users/avatars");
        avatarUrl = uploadResult.url;
        user.avatarFileName = uploadResult.fileName;
        // Remove the avatarFileId field as it's not needed with R2
        if (user.avatarFileId) {
          user.avatarFileId = undefined;
        }
      } catch (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return res.status(500).json({
          _status: false,
          _message: "Failed to upload avatar",
        });
      }
    }

    // Update user fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    user.avatar = avatarUrl;

    await user.save();

    return res.status(200).json({
      _status: true,
      _message: "User profile updated successfully",
      _data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { _error: error.message }),
    });
  }
};

module.exports.forgotPassword = async (req, res) => {
  if (!req.body || !req.body.email) {
    return res.status(400).json({
      _status: false,
      _message: "Email is required",
    });
  }

  try {
    const { email } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal if the email exists or not
      return res.status(200).json({
        _status: true,
        _message:
          "If your email exists in our system, you will receive a password reset OTP",
      });
    }

    // Generate OTP and token
    const otp = generateOtp();
    const token = generatePasswordResetToken(email, otp);

    // Send OTP via email
    try {
      await sendEmail(email, "passwordReset", {
        otp,
        subject: "Your Password Reset OTP",
        name: user.name || "User",
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      return res.status(500).json({
        _status: false,
        _message: "Failed to send OTP. Please try again later.",
      });
    }

    return res.status(200).json({
      _status: true,
      _message: "OTP sent to your email",
      _token: token,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { _error: error.message }),
    });
  }
};

module.exports.verifyOtp = async (req, res) => {
  if (!req.body || !req.body.otp || !req.body.token) {
    return res.status(400).json({
      _status: false,
      _message: "OTP and token are required",
    });
  }

  try {
    const { otp, token } = req.body;

    // Verify the token
    const decoded = verifyPasswordResetToken(token);
    if (!decoded || decoded.type !== "password_reset") {
      return res.status(400).json({
        _status: false,
        _message: "Invalid or expired token",
      });
    }

    // Verify OTP
    if (decoded.otp !== otp) {
      return res.status(400).json({
        _status: false,
        _message: "Invalid OTP",
      });
    }

    // Generate a new token for password reset
    const newToken = generatePasswordResetToken(decoded.email, otp);

    return res.status(200).json({
      _status: true,
      _message: "OTP verified successfully",
      _token: newToken, // Send new token for password reset
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { _error: error.message }),
    });
  }
};

module.exports.resetPassword = async (req, res) => {
  if (!req.body || !req.body.token || !req.body.newPassword) {
    return res.status(400).json({
      _status: false,
      _message: "Token and new password are required",
    });
  }

  try {
    const { token, newPassword } = req.body;

    // Verify the token
    const decoded = verifyPasswordResetToken(token);
    if (!decoded || decoded.type !== "password_reset") {
      return res.status(400).json({
        _status: false,
        _message: "Invalid or expired token",
      });
    }

    // Find user by email
    const user = await userModel.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({
        _status: false,
        _message: "User not found",
      });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      _status: true,
      _message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { _error: error.message }),
    });
  }
};

module.exports.verifyUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      _status: false,
      _message: "Unauthorized",
    });
  }

  try {
    const user = req.user;
    const email = user.email;

    // Generate OTP
    const otp = generateOtp();

    // Generate JWT token with OTP and user email
    const verificationToken = jwt.sign(
      {
        email,
        otp,
        type: "email_verification",
        userId: user._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" } // Token expires in 10 minutes
    );

    // Send verification email
    try {
      await sendEmail(email, "verifyEmail", {
        otp,
        subject: "Verify Your Email",
        name: user.name || "User",
        verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&otp=${otp}`,
      });

      return res.status(200).json({
        _status: true,
        _message: "Verification email sent successfully",
        _token: verificationToken, // Send token to client for verification
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return res.status(500).json({
        _status: false,
        _message: "Failed to send verification email. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Verify user error:", error);
    return res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { _error: error.message }),
    });
  }
};

module.exports.completeVerify = async (req, res) => {
  const { token, otp } = req.body;

  if (!token || !otp) {
    return res.status(400).json({
      _status: false,
      _message: "Token and OTP are required",
    });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is for email verification
    if (decoded.type !== "email_verification") {
      return res.status(400).json({
        _status: false,
        _message: "Invalid verification token",
      });
    }

    // Verify OTP
    if (decoded.otp !== otp) {
      return res.status(400).json({
        _status: false,
        _message: "Invalid OTP",
      });
    }

    // Find and update user
    const user = await userModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        _status: false,
        _message: "User not found",
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    await user.save();

    return res.status(200).json({
      _status: true,
      _message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Complete verify error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        _status: false,
        _message: "Verification link has expired. Please request a new one.",
      });
    }

    return res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { _error: error.message }),
    });
  }
};

