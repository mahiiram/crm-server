const express = require("express");
const mongoose = require("mongoose");
const companymodel = require("../model/company-model");
const contactmodel = require("../model/contact-model");
const opportunitymodel = require("../model/opportunity-model");
const productmodel = require("../model/product-model");

const dashboardRouter = express.Router();
const getPortalId = (req) => req.user?.portalId || req.apiKey?.portal?._id;

dashboardRouter.get("/metrics", async (req, res, next) => {
  try {
    const rawPortalId = getPortalId(req);
    if (!rawPortalId) return res.status(403).json({ message: "Missing portal context" });
    const portalId = new mongoose.Types.ObjectId(rawPortalId);
    const now = new Date();
    const closingThrough = new Date(now);
    closingThrough.setDate(closingThrough.getDate() + 30);
    const trendFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [companyCount, contactCount, productCount, stageMetrics, monthlyWins, recentOpportunities, closingSoon] =
      await Promise.all([
        companymodel.countDocuments({ portal: portalId }),
        contactmodel.countDocuments({ portal: portalId }),
        productmodel.countDocuments({ portal: portalId }),
        opportunitymodel.aggregate([
          { $match: { portal: portalId } },
          {
            $group: {
              _id: "$stage",
              count: { $sum: 1 },
              value: { $sum: { $ifNull: ["$amount", 0] } },
              weightedValue: {
                $sum: {
                  $multiply: [
                    { $ifNull: ["$amount", 0] },
                    { $divide: [{ $ifNull: ["$probability", 0] }, 100] },
                  ],
                },
              },
              averageDeal: { $avg: { $ifNull: ["$amount", 0] } },
            },
          },
        ]),
        opportunitymodel.aggregate([
          { $match: { portal: portalId, stage: "Closed-Won", closeDate: { $gte: trendFrom } } },
          {
            $group: {
              _id: { year: { $year: "$closeDate" }, month: { $month: "$closeDate" } },
              value: { $sum: { $ifNull: ["$amount", 0] } },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
        opportunitymodel
          .find({ portal: portalId })
          .sort({ updatedAt: -1 })
          .limit(6)
          .populate("company", "name")
          .populate("assignedTo", "firstname lastname email")
          .select("title stage amount probability closeDate company assignedTo updatedAt"),
        opportunitymodel
          .find({
            portal: portalId,
            stage: { $nin: ["Closed-Won", "Closed-Lost"] },
            closeDate: { $gte: now, $lte: closingThrough },
          })
          .sort({ closeDate: 1 })
          .limit(5)
          .populate("company", "name")
          .select("title stage amount probability closeDate company"),
      ]);

    const stages = ["Prospecting", "Proposal", "Negotiation", "Closed-Won", "Closed-Lost"].map((stage) => {
      const metric = stageMetrics.find((item) => item._id === stage);
      return {
        stage,
        count: metric?.count || 0,
        value: metric?.value || 0,
        weightedValue: metric?.weightedValue || 0,
        averageDeal: metric?.averageDeal || 0,
      };
    });
    const byStage = Object.fromEntries(stages.map((item) => [item.stage, item]));
    const totalOpportunities = stages.reduce((sum, item) => sum + item.count, 0);
    const won = byStage["Closed-Won"].count;
    const lost = byStage["Closed-Lost"].count;
    const closed = won + lost;
    const openStages = stages.filter((item) => !item.stage.startsWith("Closed-"));

    res.status(200).json({
      generatedAt: now,
      counts: { companies: companyCount, contacts: contactCount, opportunities: totalOpportunities, products: productCount },
      performance: {
        won,
        lost,
        closed,
        winRate: closed ? Number(((won / closed) * 100).toFixed(1)) : 0,
        overallSuccessRate: totalOpportunities ? Number(((won / totalOpportunities) * 100).toFixed(1)) : 0,
        pipelineValue: openStages.reduce((sum, item) => sum + item.value, 0),
        forecastValue: openStages.reduce((sum, item) => sum + item.weightedValue, 0),
        wonValue: byStage["Closed-Won"].value,
        averageWonDeal: byStage["Closed-Won"].averageDeal,
      },
      stages,
      monthlyWins,
      recentOpportunities,
      closingSoon,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = dashboardRouter;
