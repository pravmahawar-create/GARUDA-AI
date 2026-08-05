const express = require("express");
const http = require("http");

/**
 * GARUDA Sovereign Local Inference Gateway
 *
 * Responsibilities:
 * - Provides an authenticated security boundary between remote bridges (Render / Tunnels) and local Ollama.
 * - Protects raw Ollama port (11434) from public internet exposure.
 * - Enforces M2M secret authentication (X-GARUDA-NODE-KEY).
 * - Restricts requests to allowed models (qwen2.5-coder:3b) and permitted endpoints (/health, /generate).
 */

const ALLOWED_MODEL = process.env.GARUDA_LLM_MODEL || "qwen2.5-coder:3b";
const OLLAMA_BASE_URL = process.env.GARUDA_OLLAMA_URL || "http://127.0.0.1:11434";
const GATEWAY_PORT = parseInt(process.env.GARUDA_GATEWAY_PORT || "11435", 10);

function createGatewayApp(customSecret) {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  // Machine-to-Machine Secret Middleware
  app.use((req, res, next) => {
    const secret = customSecret || process.env.GARUDA_NODE_KEY;

    // Allow unauthenticated OPTIONS preflight if needed
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    if (!secret) {
      return res.status(500).json({
        error: "GATEWAY_CONFIG_ERROR",
        message: "GARUDA_NODE_KEY environment variable is not configured on gateway node."
      });
    }

    const clientKey = req.headers["x-garuda-node-key"];
    if (!clientKey || clientKey !== secret) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Invalid or missing X-GARUDA-NODE-KEY header."
      });
    }

    next();
  });

  // GET /health - Authenticated gateway and local Ollama probe
  app.get("/health", async (req, res) => {
    try {
      const probeRes = await fetch(`${OLLAMA_BASE_URL.replace(/\/$/, "")}/api/tags`);
      if (probeRes.ok) {
        const data = await probeRes.json();
        const models = Array.isArray(data.models) ? data.models.map((m) => m.name || m.model) : [];
        return res.json({
          status: "ONLINE",
          gateway: "GARUDA_AUTHENTICATED_GATEWAY_V1",
          nodeProvider: "ollama",
          configuredModel: ALLOWED_MODEL,
          modelPresent: models.some((m) => m.includes(ALLOWED_MODEL))
        });
      }
      return res.status(503).json({
        status: "DEGRADED",
        gateway: "GARUDA_AUTHENTICATED_GATEWAY_V1",
        error: "ollama_unresponsive"
      });
    } catch (err) {
      return res.status(503).json({
        status: "OFFLINE",
        gateway: "GARUDA_AUTHENTICATED_GATEWAY_V1",
        error: err.message
      });
    }
  });

  // POST /generate - Authenticated model inference proxy
  app.post("/generate", async (req, res) => {
    const { model, prompt, options } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "BAD_REQUEST",
        message: "Prompt string is required."
      });
    }

    // Model enforcement: restrict callers from requesting arbitrary models or admin APIs
    const requestedModel = model || ALLOWED_MODEL;
    if (!requestedModel.includes(ALLOWED_MODEL.split(":")[0])) {
      return res.status(403).json({
        error: "FORBIDDEN_MODEL",
        message: `Gateway restricts execution to configured model capability: ${ALLOWED_MODEL}`
      });
    }

    try {
      const ollamaRes = await fetch(`${OLLAMA_BASE_URL.replace(/\/$/, "")}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ALLOWED_MODEL,
          prompt,
          stream: false,
          options: options || { num_predict: 150 }
        })
      });

      if (!ollamaRes.ok) {
        return res.status(ollamaRes.status).json({
          error: `OLLAMA_HTTP_${ollamaRes.status}`,
          message: "Local Ollama daemon returned non-200 status."
        });
      }

      const data = await ollamaRes.json();
      return res.json(data);
    } catch (err) {
      return res.status(502).json({
        error: "GATEWAY_BAD_GATEWAY",
        message: err.message
      });
    }
  });

  return app;
}

function startGateway(port = GATEWAY_PORT, secret) {
  const app = createGatewayApp(secret);
  const server = http.createServer(app);
  server.listen(port, "127.0.0.1", () => {
    console.log(`GARUDA Authenticated Local Gateway active on http://127.0.0.1:${port}`);
  });
  return server;
}

module.exports = {
  createGatewayApp,
  startGateway
};

if (require.main === module) {
  const secret = process.env.GARUDA_NODE_KEY || process.argv[2];
  startGateway(GATEWAY_PORT, secret);
}
