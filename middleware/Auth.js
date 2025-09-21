// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const ApiKey = require("../model/apikey-model");
dotenv.config();


async function CombinedAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Missing authorization header" });
  }

  // Handle API Key
  if (authHeader.startsWith("ApiKey ")) {
    const token = authHeader.split(" ")[1];
    const apiKey = await ApiKey.findOne({ key: token, active: true }).populate("owner").populate("portal");

    if (!apiKey) {
      return res.status(403).json({ message: "Invalid or inactive API key" });
    }
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return res.status(403).json({ message: "API key has expired" });
    }

    req.apiKey = apiKey;
    return next(); // ✅ API key is valid
  }

  // Handle JWT
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decodedToken;;
      return next(); // ✅ JWT is valid
    } catch (error) {
      return res.status(403).json({ message: "Invalid or expired JWT token" });
    }
  }

  return res.status(401).json({ message: "Invalid authorization header format" });
}

module.exports = CombinedAuth;

