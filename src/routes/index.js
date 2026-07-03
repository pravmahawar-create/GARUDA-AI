const express = require("express");
const router = express.Router();

const healthController = require("../controllers/healthController");
const documentRoutes = require("./documentRoutes");

router.get("/health", healthController.healthCheck);

router.use("/documents", documentRoutes);

module.exports = router;
