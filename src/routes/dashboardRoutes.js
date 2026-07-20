const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/snapshot", dashboardController.snapshot);
router.get("/revenue-analytics", dashboardController.revenueAnalytics);

module.exports = router;
