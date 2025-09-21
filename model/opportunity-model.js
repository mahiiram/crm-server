// models/Opportunity.js
const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "company" },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: "contact" },
    portal: { type: mongoose.Schema.Types.ObjectId, ref: "portal" },
    amount: { type: Number }, // Deal amount ($)
    stage: {
      type: String,
      enum: ["Prospecting", "Proposal", "Negotiation", "Closed-Won", "Closed-Lost"],
      default: "Prospecting",
    },
    closeDate: { type: Date },
    probability: { type: Number, min: 0, max: 100 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    notes: { type: String },
  },
  { timestamps: true }
);

const opportunitymodel = mongoose.model("opportunity", opportunitySchema);
module.exports = opportunitymodel;
