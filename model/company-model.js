// models/Customer.js
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  industry: { type: String, default: "" },
  website: { type: String },
  domain: { type: String, required: false },
  phone: { type: String },
  email: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
  portal: { type: mongoose.Schema.Types.ObjectId, ref: "portal", required: true },
  status: { type: String, enum: ["Active", "Inactive", "Lead"], default: "Lead" },
  notes: { type: String, default: "" },
}, { timestamps: true });

const companymodel = mongoose.model("company", companySchema);
module.exports = companymodel;
