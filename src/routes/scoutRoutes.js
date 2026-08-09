const express = require("express");
const controller = require("../controllers/scoutController");
const router = express.Router();

router.get("/categories", controller.categories);
router.get("/categories/:id", controller.categoryDetail);
router.get("/platforms", controller.platforms);
router.post("/scan", controller.runScan);

router.post("/opportunities", controller.createOpportunity);
router.post("/opportunities/bulk", controller.bulkCreate);
router.get("/opportunities", controller.listOpportunities);
router.get("/opportunities/dashboard", controller.dashboard);
router.get("/opportunities/:id", controller.getOpportunity);
router.post("/opportunities/:id/score", controller.scoreOpportunity);
router.post("/opportunities/:id/draft", controller.draftProposal);
router.post("/opportunities/:id/approve", controller.approveOpportunity);
router.post("/opportunities/:id/submit", controller.submitOpportunity);
router.post("/opportunities/:id/outcome", controller.recordOutcome);
router.post("/opportunities/:id/request-payment", controller.requestPayment);
router.get("/payment/bridge", controller.paymentBridgeStatus);
router.get("/payment/:ref", controller.publicPayment);

router.get("/affiliate/partners", controller.affiliatePartners);
router.get("/affiliate/link", controller.affiliateLink);
router.get("/affiliate/disclosure", controller.affiliateDisclosure);
router.post("/affiliate/events", controller.affiliateRecord);
router.get("/affiliate/summary", controller.affiliateSummary);
router.get("/affiliate/ledger", controller.affiliateLedger);

router.get("/plan", controller.plan);

module.exports = router;