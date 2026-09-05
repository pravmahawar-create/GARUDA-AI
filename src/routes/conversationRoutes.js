const express = require("express");
const router = express.Router();
const conversationService = require("../services/conversationService");

// GET /api/conversations - List recent conversation threads
router.get("/", async (req, res) => {
  try {
    const threads = await conversationService.listThreads(30);
    return res.json({ success: true, threads });
  } catch (error) {
    return res.status(500).json({ success: false, error: String(error.message || error) });
  }
});

// POST /api/conversations - Create a new conversation thread
router.post("/", async (req, res) => {
  try {
    const threadId = (req.body && req.body.threadId) || conversationService.generateThreadId();
    const thread = await conversationService.getOrCreateThread(threadId);
    return res.json({ success: true, thread });
  } catch (error) {
    return res.status(500).json({ success: false, error: String(error.message || error) });
  }
});

// GET /api/conversations/:threadId - Fetch single thread by ID
router.get("/:threadId", async (req, res) => {
  try {
    const thread = await conversationService.getOrCreateThread(req.params.threadId);
    return res.json({ success: true, thread });
  } catch (error) {
    return res.status(500).json({ success: false, error: String(error.message || error) });
  }
});

// POST /api/conversations/:threadId/messages - Append message(s) to thread
router.post("/:threadId/messages", async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [req.body];
    const thread = await conversationService.appendMessages(req.params.threadId, messages);
    return res.json({ success: true, thread });
  } catch (error) {
    return res.status(500).json({ success: false, error: String(error.message || error) });
  }
});

// DELETE /api/conversations/:threadId - Delete thread
router.delete("/:threadId", async (req, res) => {
  try {
    await conversationService.deleteThread(req.params.threadId);
    return res.json({ success: true, message: "Thread deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, error: String(error.message || error) });
  }
});

module.exports = router;
