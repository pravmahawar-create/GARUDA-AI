const express = require("express");
const controller = require("../controllers/insuranceLeadController");
const router = express.Router();
router.get("/", controller.list);
router.post("/:id/promote", controller.promote);
module.exports = router;