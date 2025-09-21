const mongoose = require("mongoose");
const crypto = require("crypto");

const apiKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, // optional
  portal: { type: mongoose.Schema.Types.ObjectId, ref: "portal", required: true },
  name: { type: String }, // Label for identification
  active: { type: Boolean, default: true },
  expiresAt: { type: Date }, // Optional expiration
  createdAt: { type: Date, default: Date.now },
});

apiKeySchema.statics.generate = function () {
  return crypto.randomBytes(32).toString("hex");
};

const ApiKey = mongoose.model("ApiKey", apiKeySchema);
module.exports = ApiKey;
