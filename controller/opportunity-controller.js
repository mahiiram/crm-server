const express = require("express");
const mongoose = require("mongoose");
const opportunitymodel = require("../model/opportunity-model");

const opportunityRouter = express.Router();

// Utility to extract portalId
const getPortalId = (req) => req.user?.portalId || req.apiKey?.portal?._id;

// GET all opportunities (paginated)
opportunityRouter.get("/", async (req, res, next) => {
  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await opportunitymodel.countDocuments({ portal: portalId });
    const opportunities = await opportunitymodel
      .find({ portal: portalId })
      .skip(skip)
      .limit(limit)
      .populate("company contact assignedTo", "-password")
      .select("-portal");

    res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      opportunities,
    });
  } catch (err) {
    next(err);
  }
});

// GET opportunity by ID
opportunityRouter.get("/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid opportunity ID" });
  }

  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const opportunity = await opportunitymodel
      .findOne({ _id: id, portal: portalId })
      .populate("company contact assignedTo", "-password")
      .select("-portal");

    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    res.status(200).json({ opportunity });
  } catch (err) {
    next(err);
  }
});

// POST - Create new opportunity
opportunityRouter.post("/", async (req, res, next) => {
  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const newOpportunity = new opportunitymodel({
      ...req.body,
      portal: portalId,
    });

    await newOpportunity.save();

    const opportunityResponse = newOpportunity.toObject();
    delete opportunityResponse.portal;

    res.status(201).json({ message: "Opportunity created", opportunity: opportunityResponse });
  } catch (err) {
    next(err);
  }
});

// PUT - Update opportunity
opportunityRouter.put("/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid opportunity ID" });
  }

  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const updated = await opportunitymodel
      .findOneAndUpdate({ _id: id, portal: portalId }, req.body, { new: true })
      .select("-portal");

    if (!updated) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    res.status(200).json({ message: "Updated successfully", opportunity: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE - Delete opportunity
opportunityRouter.delete("/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid opportunity ID" });
  }

  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const deleted = await opportunitymodel.findOneAndDelete({ _id: id, portal: portalId });

    if (!deleted) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = opportunityRouter;
