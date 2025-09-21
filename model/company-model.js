// models/Customer.js
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, index: true }, // Indexed for faster search
  industry: { type: String, enum: ["Finance", "Tech", "Healthcare", "Retail", "Software and development"] },
  website: { type: String },
  domain: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  portal: { type: mongoose.Schema.Types.ObjectId, ref: "portal" },
  status: { type: String, enum: ["Active", "Inactive", "Lead"], default: "Lead" },
  createdAt: { type: Date, default: Date.now },
});

const companymodel = mongoose.model("company", companySchema);
module.exports = companymodel;
