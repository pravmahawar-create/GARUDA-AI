const express = require("express");
const router = express.Router();
const controller = require("../controllers/permissionReviewController");

// Founder Engagement Review Queue — controlled permission & Founder approval.
router.get("/", controller.list);
router.get("/stats", controller.stats);
router.post("/batch", controller.batchDecide);
router.get("/:id", controller.get);
router.get("/:id/history", controller.history);
router.post("/:id/decision", controller.decide);

module.exports = router;