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
    console.log(req);
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
companyRouter.post("/search", async (req, res, next) => {
  try {
    const portalId = getPortalId(req);

    if (!portalId) {
      return res.status(403).json({
        message: "Missing portal context",
      });
    }

    const { query = "", page = 1, limit = 100, filters = [], sorts = [] } = req.body;

    const mongoQuery = {
      portal: portalId,
    };

    /**
     * =========================================================
     * GLOBAL SEARCH
     * =========================================================
     */

    if (query && query.trim() !== "") {
      mongoQuery.$or = [
        { name: { $regex: query, $options: "i" } },
        { industry: { $regex: query, $options: "i" } },
        { website: { $regex: query, $options: "i" } },
        { domain: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { status: { $regex: query, $options: "i" } },

        // Address fields
        { "address.street": { $regex: query, $options: "i" } },
        { "address.city": { $regex: query, $options: "i" } },
        { "address.state": { $regex: query, $options: "i" } },
        { "address.zip": { $regex: query, $options: "i" } },
        { "address.country": { $regex: query, $options: "i" } },
      ];
    }

    /**
     * =========================================================
     * FILTERS
     * =========================================================
     */

    if (Array.isArray(filters) && filters.length > 0) {
      filters.forEach((filter) => {
        const { field, operator, value } = filter;

        switch (operator) {
          case "eq":
            mongoQuery[field] = value;
            break;

          case "ne":
            mongoQuery[field] = { $ne: value };
            break;

          case "contains":
            mongoQuery[field] = {
              $regex: value,
              $options: "i",
            };
            break;

          case "startsWith":
            mongoQuery[field] = {
              $regex: `^${value}`,
              $options: "i",
            };
            break;

          case "endsWith":
            mongoQuery[field] = {
              $regex: `${value}$`,
              $options: "i",
            };
            break;

          case "in":
            mongoQuery[field] = {
              $in: Array.isArray(value) ? value : [value],
            };
            break;

          case "nin":
            mongoQuery[field] = {
              $nin: Array.isArray(value) ? value : [value],
            };
            break;

          case "gt":
            mongoQuery[field] = { $gt: value };
            break;

          case "gte":
            mongoQuery[field] = { $gte: value };
            break;

          case "lt":
            mongoQuery[field] = { $lt: value };
            break;

          case "lte":
            mongoQuery[field] = { $lte: value };
            break;

          default:
            break;
        }
      });
    }

    /**
     * =========================================================
     * SORTING
     * =========================================================
     */

    let sortQuery = {};

    if (Array.isArray(sorts) && sorts.length > 0) {
      sorts.forEach((sort) => {
        sortQuery[sort.field] = sort.direction === "desc" ? -1 : 1;
      });
    } else {
      sortQuery = { createdAt: -1 };
    }

    /**
     * =========================================================
     * PAGINATION
     * =========================================================
     */

    const currentPage = parseInt(page);
    const currentLimit = parseInt(limit);
    const skip = (currentPage - 1) * currentLimit;

    /**
     * =========================================================
     * FETCH DATA
     * =========================================================
     */

    const total = await companymodel.countDocuments(mongoQuery);

    const companies = await companymodel
      .find(mongoQuery)
      .populate("assignedTo", "-password")
      .select("-portal")
      .sort(sortQuery)
      .skip(skip)
      .limit(currentLimit);

    /**
     * =========================================================
     * RESPONSE
     * =========================================================
     */

    res.status(200).json({
      success: true,
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
      search: {
        query,
        filters,
        sorts,
      },
      companies,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = companyRouter;
