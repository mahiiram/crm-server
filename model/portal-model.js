const mongoose = require("mongoose");

const portalSchema = new mongoose.Schema({
  portalName: {
    type: String,
    required: true,
    unique: true, // e.g., "mahiram-crm"
  },

  slug: {
    type: String,
    required: true,
    unique: true, // used for subdomain or API prefix
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  plan: {
    type: String,
    enum: ["free", "pro", "enterprise"],
    default: "free",
  },

  isActive: {
    type: Boolean,
    default: true,
  },
  users: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
      role: { type: String, enum: ["admin", "user"], default: "user" },
    },
  ],
});
const portalmodel = mongoose.model("portal", portalSchema);
module.exports = portalmodel;
