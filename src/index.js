const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    service: "GARUDA AI Backend",
    status: "running"
  });
});

router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "GARUDA AI",
    status: "healthy",
    database: "mongodb",
    timestamp: new Date().toISOString()
  });
});

router.use("/knowledge", require("./routes/knowledgeRoutes"));

module.exports = router;
