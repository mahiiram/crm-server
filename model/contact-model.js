// models/Contact.js
const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, default: "" },
    lastName: { type: String, required: true, default: "" },
    email: { type: String, required: true }, // ✅ required
    phone: { type: String, default: "" },
    position: { type: String, default: "" },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "company", default: null },
    notes: { type: String, default: "" },
    lastContacted: { type: Date, default: null },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    portal: { type: mongoose.Schema.Types.ObjectId, ref: "portal", required: true },
    linkedin_url: { type: String, default: "" },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zip: { type: String, default: "" },
      country: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// ✅ Enforce unique email per portal
contactSchema.index({ portal: 1, email: 1 }, { unique: true });

const ContactModel = mongoose.model("contact", contactSchema);
module.exports = ContactModel;
