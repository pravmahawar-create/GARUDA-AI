const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

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
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.get("/health", healthResponse);
app.get("/api/health", healthResponse);

app.use("/api/knowledge", require("./routes/knowledgeRoutes"));
app.use("/api/rag", require("./routes/ragRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

module.exports = app;
