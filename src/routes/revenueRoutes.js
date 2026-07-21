const express = require("express");
const revenueController = require("../controllers/revenueController");

const router = express.Router();

router.get("/", revenueController.list);
router.post("/", revenueController.create);
router.post("/conversion/:opportunityId/preview", revenueController.previewConversion);
router.post("/conversion/:opportunityId/execute", revenueController.executeConversion);
router.get("/settlements", revenueController.listSettlements);
router.post("/settlements/:revenueRecordId/preview", revenueController.previewSettlement);
router.post("/settlements/:revenueRecordId", revenueController.createSettlement);
router.patch("/settlements/:id/status", revenueController.updateSettlementStatus);
router.patch("/:id", revenueController.update);
router.delete("/:id", revenueController.remove);

router.get("/metrics", revenueController.metrics);
router.get("/analytics", revenueController.analytics);
router.get("/settlement", revenueController.settlement);

module.exports = router;
