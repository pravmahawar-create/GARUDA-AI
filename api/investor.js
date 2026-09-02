/**
 * 🦅 GARUDA Serverless Investor Presentation API Gateway
 * Phase: Investor Autonomous Presentation Experience (V3)
 * Proxies incoming investor requests to Render Production Backend.
 */

const RENDER_BACKEND = "https://garuda-ai-xfif.onrender.com";

async function parseBody(req) {
  if (!req) return {};
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (typeof req.on !== "function") return {};
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

module.exports = async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-founder-key");

    if (req.method === "OPTIONS") {
      res.statusCode = 200;
      return res.end();
    }

    const host = req.headers?.host || "garudaos.in";
    const url = new URL(req.url || "/", `https://${host}`);
    let pathname = url.pathname.replace(/^\/api\/investor\/?/, "").replace(/^\//, "").toLowerCase();
    if (!pathname) {
      const queryPath = url.searchParams.get("path") || (req.query && req.query.path);
      if (queryPath) {
        pathname = Array.isArray(queryPath) ? queryPath.join("/") : String(queryPath);
      }
    }
    const cleanPath = (pathname || "").replace(/^\//, "");

    const body = await parseBody(req);
    const targetUrl = `${RENDER_BACKEND}/api/investor/${cleanPath}`;

    // Proxy request to Render Backend
    const fetchOptions = {
      method: req.method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    if (req.method === "POST" && Object.keys(body).length > 0) {
      fetchOptions.body = JSON.stringify(body);
    }

    const backendRes = await fetch(targetUrl, fetchOptions);
    const data = await backendRes.json();
    return sendJson(res, backendRes.status, data);
  } catch (globalErr) {
    return sendJson(res, 500, {
      success: false,
      error: globalErr.message || "Internal server error connecting to GARUDA backend"
    });
  }
};
