const telegramBotService = require("../src/services/telegramBotService");

function cors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const webhookUrl = req.query.url || "";
    if (webhookUrl) {
      const result = await telegramBotService.setWebhook(webhookUrl);
      return res.status(200).json({ ok: true, result });
    }
    const info = await telegramBotService.getWebhookInfo();
    return res.status(200).json({
      ok: true,
      configured: telegramBotService.isConfigured(),
      webhook: info
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const update = req.body || {};
  const result = await telegramBotService.handleUpdate(update);

  // Telegram requires a fast 200 to acknowledge receipt.
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({ ok: true, result });
};
