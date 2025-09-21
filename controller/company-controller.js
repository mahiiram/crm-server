const express = require("express");
const mongoose = require("mongoose");
const companymodel = require("../model/company-model");

const companyRouter = express.Router();

// 🔧 Utility to extract portalId
const getPortalId = (req) => req.user?.portalId || req.apiKey?.portal?._id;

// GET all companies (paginated)
companyRouter.get("/", async (req, res, next) => {
  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await companymodel.countDocuments({ portal: portalId });
    const companies = await companymodel
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
      companies,
    });
  } catch (err) {
    next(err);
  }
});

// GET company by ID
companyRouter.get("/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid company ID" });
  }

  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const company = await companymodel
      .findOne({ _id: id, portal: portalId })
      .populate("assignedTo", "-password")
      .select("-portal");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ company });
  } catch (err) {
    next(err);
  }
});

// POST - Create new company
companyRouter.post("/", async (req, res, next) => {
  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const newCompany = new companymodel({
      ...req.body,
      portal: portalId,
    });

    await newCompany.save();

    const companyResponse = newCompany.toObject();
    delete companyResponse.portal;

    res.status(201).json({ message: "Company created", company: companyResponse });
  } catch (err) {
    next(err);
  }
});

// PUT - Update company
companyRouter.put("/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid company ID" });
  }

  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const updated = await companymodel
      .findOneAndUpdate({ _id: id, portal: portalId }, req.body, { new: true })
      .select("-portal");

    if (!updated) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ message: "Updated successfully", company: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE - Delete company
companyRouter.delete("/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid company ID" });
  }

  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const deleted = await companymodel.findOneAndDelete({ _id: id, portal: portalId });

    if (!deleted) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = companyRouter;
