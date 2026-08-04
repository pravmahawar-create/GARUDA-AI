const express = require("express");
const router = express.Router();
const llmProvider = require("../services/llmProvider");

// POST /api/mother/chat - Conversational chat endpoint routed through Mother context
router.post("/chat", async (req, res) => {
  try {
    const systemContext = req.body.systemContext || "";
    const userMessage = req.body.message || req.body.userMessage || req.body.question || "";
    const conversationHistory = Array.isArray(req.body.history) ? req.body.history : [];

    const response = await llmProvider.ask({ systemContext, userMessage, conversationHistory });

    return res.json({ success: true, ...response });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "chat_error",
      error: String(error && error.message ? error.message : error)
    });
  }
});

module.exports = router;
