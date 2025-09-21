// routes/contact-router.js
const express = require("express");
const mongoose = require("mongoose");
const contactmodel = require("../model/contact-model");

const contactrouter = express.Router();

// Middleware to extract portalId
const getPortalId = (req) => req.user?.portalId || req.apiKey?.portal?._id;

// GET all contacts with pagination and ordering
contactrouter.get("/", async (req, res, next) => {
  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 200;
    const skip = (page - 1) * limit;

    // Sorting
    const orderBy = req.query.orderBy === "updatedAt" ? "updatedAt" : "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const sort = { [orderBy]: order };

    const total = await contactmodel.countDocuments({ portal: portalId });
    const contacts = await contactmodel
      .find({ portal: portalId })
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .populate("assignedTo", "-password")
      .select("-portal");

    res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      contacts,
    });
  } catch (err) {
    next(err);
  }
});

// GET contact by ID
contactrouter.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid contact ID" });
  }

  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const contact = await contactmodel
      .findOne({ _id: id, portal: portalId })
      .populate("company owner_id assignedTo", "-password")
      .select("-portal");

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.status(200).json({ contact });
  } catch (err) {
    next(err);
  }
});

// POST - Create new contact
contactrouter.post("/", async (req, res, next) => {
  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const newContact = new contactmodel({
      ...req.body,
      portal: portalId,
    });

    await newContact.save();

    const contactResponse = newContact.toObject();
    delete contactResponse.portal;

    res.status(201).json({ message: "Contact created", contact: contactResponse });
  } catch (err) {
    next(err);
  }
});

// PUT - Update contact
contactrouter.put("/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid contact ID" });
  }

  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const updated = await contactmodel
      .findOneAndUpdate({ _id: id, portal: portalId }, req.body, { new: true })
      .select("-portal");

    if (!updated) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.status(200).json({ message: "Updated successfully", contact: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE - Delete contact
contactrouter.delete("/:id", async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid contact ID" });
  }

  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }

    const deleted = await contactmodel.findOneAndDelete({ _id: id, portal: portalId });

    if (!deleted) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// SEARCH contacts by name or email with ordering
contactrouter.get("/search", async (req, res, next) => {
  try {
    const portalId = getPortalId(req);
    if (!portalId) {
      return res.status(403).json({ message: "Missing portal context" });
    }
    const { q } = req.query;
    if (!q || typeof q !== "string" || !q.trim()) {
      return res.status(400).json({ message: "Missing or invalid search query" });
    }
    // Sorting
    const orderBy = req.query.orderBy === "updatedAt" ? "updatedAt" : "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const sort = { [orderBy]: order };
    // Case-insensitive partial match on firstName, lastName, or email
    const regex = new RegExp(q, "i");
    const results = await contactmodel
      .find({
        portal: portalId,
        $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
      })
      .limit(200)
      .sort(sort)
      .populate("assignedTo", "-password")
      .select("-portal");
    res.status(200).json({ results });
  } catch (err) {
    next(err);
  }
});

module.exports = contactrouter;
