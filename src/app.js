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
app.use("/api/opportunities", require("./routes/opportunityRoutes"));
app.use("/api/revenue", require("./routes/revenueRoutes"));
app.use("/api/income-goals", require("./routes/incomeGoalRoutes"));
app.use("/api/discovery", require("./routes/discoveryRoutes"));
app.use("/api/capabilities", require("./routes/capabilityRoutes"));

module.exports = app;
