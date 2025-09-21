const express = require("express");
const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");

const mailer_router = express.Router();

async function sendMail({ to, subject, username, text }) {
  const Config = {
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  };

  let transporter = nodemailer.createTransport(Config);

  let MailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "CRM App",
      link: "https://your-app-link.com/",
    },
  });

  const response = {
    body: {
      name: username,
      intro: text,
      outro: text.includes("OTP")
        ? "If you did not request a password reset, we recommend securing your account immediately."
        : "If this wasn’t you, please reset your password immediately.",
    },
  };

  const emailBody = MailGenerator.generate(response);

  const message = {
    from: process.env.EMAIL,
    to,
    subject,
    html: emailBody,
  };

  await transporter.sendMail(message);
}

// keep your route if you want to test email directly
mailer_router.post("/registerMail", async (req, res) => {
  try {
    const { email, text, subject } = req.body;
    await sendMail({ to: email, subject, username: email, text });
    return res.status(201).json({ msg: "You should receive an email from us." });
  } catch (error) {
    console.error("Mailer Error:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
});

// mailer.js
module.exports = { router: mailer_router, sendMail };
