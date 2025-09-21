const express = require("express");
const mongoose = require("mongoose");
const leadmodel = require("../model/lead-model");

const leadRouter = express.Router();

// Utility to extract portalId
const getPortalId = (req) => req.user?.portalId || req.apiKey?.portal?._id;

// GET all leads (paginated)
leadRouter.get("/", async (req, res, next) => {
  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await leadmodel.countDocuments({ portal: portalId });
    const leads = await leadmodel
      .find({ portal: portalId })
      .skip(skip)
      .limit(limit)
      .populate("assignedTo", "-password")
      .select("-portal");

    res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      leads,
    });
  } catch (err) {
    next(err);
  }
});

// GET lead by ID
leadRouter.get("/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid lead ID" });
  }

  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const lead = await leadmodel
      .findOne({ _id: id, portal: portalId })
      .populate("assignedTo", "-password")
      .select("-portal");

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json({ lead });
  } catch (err) {
    next(err);
  }
});

// POST - Create new lead
leadRouter.post("/", async (req, res, next) => {
  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const newLead = new leadmodel({
      ...req.body,
      portal: portalId,
    });

    await newLead.save();

    const leadResponse = newLead.toObject();
    delete leadResponse.portal;

    res.status(201).json({ message: "Lead created", lead: leadResponse });
  } catch (err) {
    next(err);
  }
});

// PUT - Update lead
leadRouter.put("/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid lead ID" });
  }

  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const updated = await leadmodel
      .findOneAndUpdate({ _id: id, portal: portalId }, req.body, { new: true })
      .select("-portal");

    if (!updated) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json({ message: "Updated successfully", lead: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE - Delete lead
leadRouter.delete("/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid lead ID" });
  }

  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const deleted = await leadmodel.findOneAndDelete({ _id: id, portal: portalId });

    if (!deleted) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = leadRouter;
