const mongoose = require("mongoose");

const user_schema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  countryCode: { type: String, required: true, default: "+91" },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "agent"], default: "admin" },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  portal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "portal", // the CRM portal the user owns or belongs to
  },
});

const usermodel = mongoose.model("user", user_schema);
module.exports = usermodel;
