const express = require("express");
const opportunityController = require("../controllers/opportunityController");

const router = express.Router();

router.get("/", opportunityController.list);
router.post("/", opportunityController.create);
router.patch("/:id", opportunityController.update);
router.get("/metrics", opportunityController.metrics);

module.exports = router;
