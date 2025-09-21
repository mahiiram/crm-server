// models/Lead.js
const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    status: { type: String, enum: ["New", "Contacted", "Qualified", "Closed"], default: "New" },
    source: { type: String, enum: ["Website", "Referral", "Social Media"] },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    notes: { type: String },
    portal: { type: mongoose.Schema.Types.ObjectId, ref: "portal" },
  },
  { timestamps: true }
);

const leadmodel = mongoose.model("lead", leadSchema);
module.exports = leadmodel;
