const express = require("express");
const controller = require("../controllers/insuranceLeadController");
const router = express.Router();
router.get("/", controller.list);
router.post("/:id/promote", controller.promote);
router.post("/import-contacts", controller.importContacts);
router.post("/prepare-pitches", controller.preparePitches);
module.exports = router;