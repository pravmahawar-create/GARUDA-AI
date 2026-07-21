const express = require("express");
const controller = require("../controllers/discoveryController");
const router = express.Router();
router.get("/candidates", controller.list);
router.post("/run", controller.run);
router.patch("/candidates/:id/decision", controller.decide);
module.exports = router;
