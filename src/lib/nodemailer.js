const nodemailer = require("nodemailer");
const path = require("path");
const ejs = require("ejs");
const { promisify } = require("util");

const renderFile = promisify(ejs.renderFile);

// Create a test account for development
const createTestAccount = async () => {
  if (process.env.NODE_ENV === "development") {
    const testAccount = await nodemailer.createTestAccount();
    return {
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    };
  }

  // Production configuration
  return {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };
};

// Create transporter
const createTransporter = async () => {
  const config = await createTestAccount();
  return nodemailer.createTransport(config);
};

// Email templates
const templates = {
  passwordReset: {
    subject: "Password Reset OTP",
    template: "password-reset-otp.ejs",
  },
  verifyEmail: {
    subject: "Verify Your Email",
    template: "verify-email.ejs",
  },
};

// Render email template
const renderTemplate = async (templateName, data) => {
  try {
    const template = templates[templateName];
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const templatePath = path.join(
      __dirname,
      "..",
      "views",
      "emails",
      template.template
    );

    const html = await renderFile(templatePath, {
      ...data,
      year: new Date().getFullYear(),
      appName: process.env.APP_NAME || "Jewellery Walla",
    });

    return {
      subject: template.subject,
      html,
    };
  } catch (error) {
    console.error("Error rendering email template:", error);
    throw error;
  }
};

// Send email
const sendEmail = async (to, templateName, data = {}) => {
  try {
    const transporter = await createTransporter();
    const { subject, html } = await renderTemplate(templateName, data);

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Jewellery Walla"}" <${
        process.env.EMAIL_FROM || "noreply@jewellerywalla.com"
      }>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV === "development") {
      console.log("Message sent: %s", info.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// Export functions
module.exports = {
  sendEmail,
  templates: Object.keys(templates),
};
