try { require("dotenv").config(); } catch {}
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use("/api/webhook", require("./routes/webhookRoutes"));
app.use(express.json({
  verify: (req, _res, buffer) => {
    req.rawBody = buffer.toString("utf8");
  }
}));
app.use(express.static(path.join(__dirname, "..", "public")));

const healthResponse = (req, res) => {
  let database = "mongodb";
  try {
    const connectDB = require("./database/db");
    database = connectDB.isMongoConnected() ? "mongodb-connected" : "degraded";
  } catch {}
  res.json({
    success: true,
    service: "GARUDA AI Backend",
    status: "healthy",
    database,
    timestamp: new Date().toISOString()
  });
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.get("/health", healthResponse);
app.get("/api/health", healthResponse);

app.use("/api/mother", require("./routes/motherAgentRoutes"));
app.use("/api/knowledge", require("./routes/knowledgeRoutes"));
app.use("/api/rag", require("./routes/ragRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/opportunities", require("./routes/opportunityRoutes"));
app.use("/api/revenue", require("./routes/revenueRoutes"));
app.use("/api/income-goals", require("./routes/incomeGoalRoutes"));
app.use("/api/discovery", require("./routes/discoveryRoutes"));
app.use("/api/capabilities", require("./routes/capabilityRoutes"));
app.use("/api/affiliate-pilot", require("./routes/affiliateRoutes"));
app.use("/api/public-chat", require("./routes/publicChatRoutes"));
app.use("/api/conversations", require("./routes/conversationRoutes"));
app.use("/api/scout", require("./routes/scoutRoutes"));

const telegramBotService = require("./services/telegramBotService");

app.get("/api/telegram", async (req, res) => {
  try {
    if (req.query.url) {
      const result = await telegramBotService.setWebhook(req.query.url);
      return res.json({ ok: true, result });
    }
    const info = await telegramBotService.getWebhookInfo();
    return res.json({ ok: true, configured: telegramBotService.isConfigured(), webhook: info });
  } catch (error) {
    return res.status(500).json({ ok: false, error: String(error && error.message ? error.message : error) });
  }
});

app.post("/api/telegram", async (req, res) => {
  try {
    const result = await telegramBotService.handleUpdate(req.body || {});
    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(200).json({ ok: true, error: String(error && error.message ? error.message : error) });
  }
});

module.exports = app;
