const express = require("express");
const router = express.Router();
const knowledgeController = require("../controllers/knowledgeController");

router.get("/search", knowledgeController.search);

module.exports = router;
