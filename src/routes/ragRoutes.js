const express = require("express");
const router = express.Router();

const ragController = require("../controllers/ragController");

router.get("/answer", ragController.answer);
router.post("/answer", ragController.answer);

module.exports = router;
