const express = require("express");
const mongoose = require("mongoose");
const productmodel = require("../model/product-model");
const opportunitymodel = require("../model/opportunity-model");

const productRouter = express.Router();
const getPortalId = (req) => req.user?.portalId || req.apiKey?.portal?._id;

const splitPayload = (body) => {
  const data = { ...body };
  const opportunityIds = Array.isArray(data.opportunityIds) ? data.opportunityIds : null;
  delete data.opportunityIds;
  return { data, opportunityIds };
};

const syncOpportunities = async (product, portalId, opportunityIds) => {
  if (!Array.isArray(opportunityIds)) return;
  const validIds = opportunityIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  await opportunitymodel.updateMany(
    { portal: portalId, "products.product": product._id },
    { $pull: { products: { product: product._id } } }
  );
  if (validIds.length) {
    await opportunitymodel.updateMany(
      { portal: portalId, _id: { $in: validIds } },
      { $push: { products: { product: product._id, quantity: 1, unitPrice: product.price || 0 } } }
    );
  }
};

productRouter.get("/", async (req, res, next) => {
  try {
    const portalId = getPortalId(req);
    if (!portalId) return res.status(403).json({ message: "Missing portal context" });
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 200);
    const query = String(req.query.search || "").trim();
    const filter = { portal: portalId };
    if (query) {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: regex }, { sku: regex }, { category: regex }, { description: regex }];
    }
    const allowedSorts = ["name", "sku", "price", "stockQuantity", "createdAt", "updatedAt"];
    const orderBy = allowedSorts.includes(req.query.orderBy) ? req.query.orderBy : "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const [total, products] = await Promise.all([
      productmodel.countDocuments(filter),
      productmodel.find(filter).populate("assignedTo", "-password").select("-portal").sort({ [orderBy]: order }).skip((page - 1) * limit).limit(limit),
    ]);
    res.status(200).json({ page, limit, total, totalPages: Math.ceil(total / limit), products });
  } catch (err) { next(err); }
});

productRouter.get("/:id", async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
  try {
    const portalId = getPortalId(req);
    if (!portalId) return res.status(403).json({ message: "Missing portal context" });
    const [product, opportunities] = await Promise.all([
      productmodel.findOne({ _id: req.params.id, portal: portalId }).populate("assignedTo", "-password").select("-portal"),
      opportunitymodel.find({ portal: portalId, "products.product": req.params.id }).populate("company contact", "name firstName lastName email").select("title stage amount company contact products closeDate"),
    ]);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ product, associations: { opportunities } });
  } catch (err) { next(err); }
});

productRouter.post("/", async (req, res, next) => {
  try {
    const portalId = getPortalId(req);
    if (!portalId) return res.status(403).json({ message: "Missing portal context" });
    const { data, opportunityIds } = splitPayload(req.body);
    const product = await productmodel.create({ ...data, portal: portalId });
    await syncOpportunities(product, portalId, opportunityIds);
    const response = product.toObject();
    delete response.portal;
    res.status(201).json({ message: "Product created", product: response });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "A product with this SKU already exists" });
    next(err);
  }
});

productRouter.put("/:id", async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
  try {
    const portalId = getPortalId(req);
    if (!portalId) return res.status(403).json({ message: "Missing portal context" });
    const { data, opportunityIds } = splitPayload(req.body);
    const product = await productmodel.findOneAndUpdate({ _id: req.params.id, portal: portalId }, data, { new: true, runValidators: true }).populate("assignedTo", "-password").select("-portal");
    if (!product) return res.status(404).json({ message: "Product not found" });
    await syncOpportunities(product, portalId, opportunityIds);
    res.status(200).json({ message: "Updated successfully", product });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: "A product with this SKU already exists" });
    next(err);
  }
});

productRouter.delete("/:id", async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid product ID" });
  try {
    const portalId = getPortalId(req);
    if (!portalId) return res.status(403).json({ message: "Missing portal context" });
    const product = await productmodel.findOneAndDelete({ _id: req.params.id, portal: portalId });
    if (!product) return res.status(404).json({ message: "Product not found" });
    await opportunitymodel.updateMany({ portal: portalId, "products.product": product._id }, { $pull: { products: { product: product._id } } });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) { next(err); }
});

module.exports = productRouter;
