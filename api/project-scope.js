const { revenueFunnelSecurityService } = require("../src/services/revenueFunnelSecurityService");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Garuda-Founder-Approved, X-Garuda-Test-Mode"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const scopeId = (req.query && req.query.id) || (req.url && req.url.split("?")[0].split("/").pop());
    const scope = await revenueFunnelSecurityService.getScopeById(scopeId);
    if (!scope) {
      return res.status(404).json({ success: false, message: "Project scope not found." });
    }
    return res.status(200).json({ success: true, proposal: scope });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await revenueFunnelSecurityService.handleInboundSubmission(req.body, {
      req,
      headers: req.headers
    });
    return res.status(result.statusCode || 201).json(result.body);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to generate project scope."
    });
  }
};
