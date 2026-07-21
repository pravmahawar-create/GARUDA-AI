const express = require("express");
const controller = require("../controllers/capabilityController");

const router = express.Router();

router.get("/", controller.list);
router.get("/summary", controller.summary);
router.post("/match", controller.match);

module.exports = router;
