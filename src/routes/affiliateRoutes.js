const router = require("express").Router();
const controller = require("../controllers/affiliateController");

router.get("/status", controller.status);
router.get("/cases", controller.list);
router.post("/offers", controller.createOffer);
router.get("/cases/:id", controller.get);
router.get("/cases/:id/events", controller.events);
router.post("/cases/:id/campaign", controller.draftCampaign);
router.post("/cases/:id/handoff", controller.approveHandoff);
router.post("/cases/:id/publication", controller.recordPublication);
router.post("/cases/:id/conversion", controller.recordConversion);
router.post("/cases/:id/commission", controller.verifyCommission);
router.post("/cases/:id/payment", controller.recordPayment);

module.exports = router;
