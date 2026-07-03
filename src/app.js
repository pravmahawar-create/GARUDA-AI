const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const healthResponse = (req, res) => {
  res.json({
    success: true,
    service: "GARUDA AI Backend",
    status: "healthy",
    database: "mongodb",
    timestamp: new Date().toISOString()
  });
};

app.get("/", (req, res) => {
  res.send("?? GARUDA AI Backend is running...");
});

app.get("/health", healthResponse);
app.get("/api/health", healthResponse);

app.use("/api/knowledge", require("./routes/knowledgeRoutes"));

module.exports = app;
