const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    price: { type: Number, min: 0, default: 0 },
    cost: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: ["INR", "USD", "EUR", "GBP"], default: "INR" },
    stockQuantity: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ["Active", "Inactive", "Draft"], default: "Active" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    portal: { type: mongoose.Schema.Types.ObjectId, ref: "portal", required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

productSchema.index({ portal: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model("product", productSchema);
