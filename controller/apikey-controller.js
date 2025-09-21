const express = require("express");
const APIrouter = express.Router();
const ApiKey = require("../model/apikey-model");

APIrouter.post("/generate/:portalId", async (req, res) => {
  const { portalId } = req.params;
  const { name, ownerId, expiresAt } = req.body;

  const key = ApiKey.generate();

  const newKey = new ApiKey({
    key,
    name,
    owner: ownerId,
    portal: portalId,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  });

  await newKey.save();

  res.status(201).json({
    message: "API key generated",
    apiKey: {
      key,
      user: {
        id: ownerId,
      },
      portal: {
        id: portalId,
      },
    },
  });
});

APIrouter.put("/disable/:id", async (req, res) => {
  await ApiKey.findByIdAndUpdate(req.params.id, { active: false });
  res.json({ message: "API key disabled" });
});

module.exports = APIrouter;
