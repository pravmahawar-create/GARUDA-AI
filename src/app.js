try { require("dotenv").config(); } catch (err) { console.warn("[auto-recovery] suppressed error in app.js:", String(err.message).slice(0,80)); }
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const fs = require("fs");

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// Locked CORS — only GARUDA origins, expose X-Request-Id
const ALLOWED_ORIGINS = [
  "https://www.garudaos.in",
  "https://garudaos.in",
  "https://garuda-ai-v1.vercel.app",
  "https://garuda-ai-xfif.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173"
];
app.use(cors({
  origin: function(origin, cb) {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
  exposedHeaders: ["X-Request-Id"]
}));

// Rate limiters
const globalLimiter = rateLimit({ windowMs: 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false });
const ttsLimiter = rateLimit({ windowMs: 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false, message: { success:false, message:"TTS rate limit exceeded (15/min)" }});
const webhookLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
app.use("/api/", globalLimiter);

app.use("/api/webhook", webhookLimiter, require("./routes/webhookRoutes"));
app.use(express.json({
  limit: "1mb",
  verify: (req, _res, buffer) => {
    req.rawBody = buffer.toString("utf8");
  }
}));
app.use(express.urlencoded({ limit: "1mb", extended: true }));


const distPath = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.use(express.static(path.join(__dirname, "..", "public")));
// Serve Niravi attachment artifacts under /data/proposals (read-only, Founder gated previews)
const proposalsDataPath = path.join(__dirname, "..", "data", "proposals");
if (fs.existsSync(proposalsDataPath)) {
  app.use("/data/proposals", express.static(proposalsDataPath, { maxAge: "1d", etag: true }));
}
// GARUDA Creative Studio — serve sovereign vector + local 2.5D MP4 artifacts (website-first delivery)
const creativeAssetsPath = path.join(__dirname, "..", "data", "creative-assets");
if (!fs.existsSync(creativeAssetsPath)) { try { fs.mkdirSync(creativeAssetsPath, { recursive: true }); } catch (err) { console.warn("[auto-recovery] suppressed error in app.js:", String(err.message).slice(0,80)); } }
app.use("/data/creative-assets", express.static(creativeAssetsPath, { maxAge: "1d", etag: true }));
app.use("/assets/creative", express.static(creativeAssetsPath, { maxAge: "1d", etag: true }));
app.use(require("./middleware/authContextMiddleware"));

const healthResponse = (req, res) => {
  let database = "mongodb";
  try {
    const connectDB = require("./database/db");
    database = connectDB.isMongoConnected() ? "mongodb-connected" : "degraded";
  } catch (err) { console.warn("[health] DB check failed:", String(err.message).slice(0,120)); }
  // Prevent caching degraded health as healthy
  if (database === "degraded") res.setHeader("Cache-Control", "no-store, must-revalidate");
  res.json({
    success: true,
    service: "GARUDA AI Backend",
    status: database === "degraded" ? "degraded" : "healthy",
    database,
    timestamp: new Date().toISOString()
  });
};

app.get("/", (req, res) => {
  const distIndex = path.join(__dirname, "..", "frontend", "dist", "index.html");
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.get("/health", healthResponse);
app.get("/api/health", healthResponse);

app.use("/api/mother", require("./routes/motherAgentRoutes"));
app.use("/api/missions", require("./routes/missionRoutes"));
app.use("/api/knowledge", require("./routes/knowledgeRoutes"));
app.use("/api/rag", require("./routes/ragRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/opportunities", require("./routes/opportunityRoutes"));
app.use("/api/insurance-leads", require("./routes/insuranceLeadRoutes"));
app.use("/api/revenue", require("./routes/revenueRoutes"));
app.use("/api/income-goals", require("./routes/incomeGoalRoutes"));
app.use("/api/discovery", require("./routes/discoveryRoutes"));
app.use("/api/review-queue", require("./routes/permissionReviewRoutes"));
app.use("/api/capabilities", require("./routes/capabilityRoutes"));
app.use("/api/affiliate-pilot", require("./routes/affiliateRoutes"));
app.use("/api/public-chat", require("./routes/publicChatRoutes"));
app.use("/api/conversations", require("./routes/conversationRoutes"));
// Retail Dukandaar Merchant Billing (Cement + Steel, GST verify, Voice, OCR, STT)
app.use("/api/merchant-billing", require("./routes/billingRoutes"));
// Backward-compatibility router dispatch for legacy merchant endpoints under /api/billing
app.use("/api/billing", (req, res, next) => {
  if (["/voice", "/stt", "/gst-verify", "/sync", "/ocr"].some((p) => req.path.startsWith(p))) {
    return require("./routes/billingRoutes")(req, res, next);
  }
  next();
});
// GARUDA Core SaaS Subscription, Metering & API Keys
app.use("/api/billing", require("./routes/saasBillingRoutes"));
// GARUDA Multi-Tenant Workspaces, Seats & Team Invitations
app.use("/api/tenants", require("./routes/tenantRoutes"));
app.use("/api/proposals", require("./routes/proposalRoutes"));
app.use("/api/acquisition", require("./routes/acquisitionRoutes"));
// Cross-Universe Growth Command API (mounted BEFORE legacy /api router so explicit routes win)
app.use("/api/growth", require("./routes/growthCommandRoutes"));
// Repository Intelligence Engine — GARUDA's self-understanding layer
app.use("/api/repo-intel", require("./routes/repositoryIntelRoutes"));
app.use("/api/engineering", require("./routes/engineeringPipelineRoutes"));
app.use("/api/creative", require("./routes/creativeRoutes"));
app.use("/api/investor", require("./routes/investorPresentationRoutes"));
app.use("/api", require("./routes/growthCreativeRoutes"));
app.use("/api/bot-verse", require("./routes/botVerseRoutes"));
app.use("/api/auth", (req, res) => require("../api/auth")(req, res));
app.use("/api/customer", (req, res) => require("../api/customer")(req, res));
app.use("/api/founder", (req, res) => require("../api/founder")(req, res));
app.use("/api/founder-command", (req, res) => require("../api/founder")(req, res));
app.use("/api/project-scope", (req, res) => require("../api/project-scope")(req, res));
// GARUDA PAWAN Sovereign Autonomous Coding Agent
app.use("/api/pawan", require("./routes/astraRoutes"));
app.use("/api/astra", require("./routes/astraRoutes"));
// GARUDA Sovereign AI Starter Kit & Boilerplate Store API
app.use("/api/boilerplate", require("./routes/boilerplateRoutes"));

// 🎙️ Natural Indian Voice Speech Engine (Google Natural TTS stream) — rate-limited
app.get("/api/audio/tts", ttsLimiter, async (req, res) => {
  try {
    const text = (req.query.text || "").trim();
    const lang = req.query.lang || "hi";
    if (!text) return res.status(400).send("Text is required");
    const safeText = text.slice(0, 200);
    const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(safeText)}&tl=${lang}&client=tw-ob`;
    const response = await fetch(googleUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      return res.status(502).send("Upstream voice generation failed");
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length,
      "Cache-Control": "public, max-age=86400"
    });
    res.send(buffer);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const telegramBotService = require("./services/telegramBotService");
const abslKnowledgeService = require("./services/abslKnowledgeService");
const abslKnowledgeSeedService = require("./services/abslKnowledgeSeedService");
// Note: Revenue Operating Cycle workers boot via server.js only when MongoDB connection is verified.

// Overnight Serper Hunters — laptop band ke baad bhi subah tak (Render pe) — Founder YES tonight
try{
  const overnight = require("./workers/overnightSerperHuntersWorker");
  // Auto-start if env GARUDA_OVERNIGHT_HUNTERS === "true" or founder approved tonight (06:00)
  if(process.env.GARUDA_OVERNIGHT_HUNTERS === "true" || overnight.founderApprovedTonight()){
    console.log("[GARUDA] Overnight hunters loop starting (SERPER 2500, founder YES tonight)...");
    overnight.startOvernightLoop();
  }
  // Expose API for manual control
  const appRef = app;
  appRef.get("/api/hunters/overnight/status", (req,res)=> res.json({success:true, ...overnight.getOvernightStatus()}));
  appRef.post("/api/hunters/overnight/start", (req,res)=>{
    const r=overnight.startOvernightLoop();
    res.json({success:true, ...r, status: overnight.getOvernightStatus()});
  });
  appRef.post("/api/hunters/overnight/stop", (req,res)=>{
    overnight.stopOvernightLoop();
    res.json({success:true, stopped:true, status: overnight.getOvernightStatus()});
  });
}catch(e){ console.log("[Overnight] init failed", String(e.message).slice(0,100)); }

app.get("/api/telegram", async (req, res) => {
  try {
    if (req.query.url) {
      // Founder-only: require founder key to prevent anon webhook hijack
      const founderCheck = require("./services/authContextService").verifyFounderCredentials(req);
      if (!founderCheck.isFounder) return res.status(403).json({ ok:false, error:"Founder approval required to set webhook" });
      const result = await telegramBotService.setWebhook(req.query.url);
      return res.json({ ok: true, result });
    }
    const info = await telegramBotService.getWebhookInfo();
    return res.json({ ok: true, configured: telegramBotService.isConfigured(), webhook: info });
  } catch (error) {
    return res.status(500).json({ ok: false, error: String(error && error.message ? error.message : error) });
  }
});

// Knowledge status + governed one-time seed for the insurance Q&A worker.
app.get("/api/telegram/knowledge", async (req, res) => {
  try {
    const stats = abslKnowledgeService.knowledgeStats();
    const totalChunks = await abslKnowledgeSeedService.countKnowledge().catch(() => 0);
    const absliChunks = await abslKnowledgeSeedService.countByCategory("ABSLI").catch(() => 0);
    return res.json({
      ok: true,
      stats,
      mongoKnowledgeTotal: totalChunks,
      mongoAbsliChunks: absliChunks,
      deployedSource: absliChunks > 0 ? "mongo_knowledge" : "file_fallback"
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: String(error && error.message ? error.message : error) });
  }
});

app.post("/api/telegram/knowledge/seed", async (req, res) => {
  try {
    const dryRun = req.query.dryRun === "true";
    if (!dryRun && req.get("x-garuda-founder-approved") !== "true") {
      return res.status(403).json({ ok: false, error: "Founder approval required for non-dry-run knowledge seed" });
    }
    const result = await abslKnowledgeSeedService.seedAbslKnowledge({ dryRun });
    return res.json({ ok: true, data: result });
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

// Ensure /api 404 always returns JSON (never HTML <!DOCTYPE) — prevents frontend Unexpected token '<'
app.use("/api", (req, res) => res.status(404).json({ success:false, message:`API not found: ${req.method} ${req.path}`, status:404, hint:"Check vercel.json rewrite and ensure Render backend is awake (cold start ~30s)" }));
// Global error handler — for /api always JSON, never HTML
app.use((err, req, res, _next) => {
  if (req.path && req.path.startsWith("/api")) {
    const msg = String(err.message || err).slice(0,600).replace(/</g,'');
    return res.status(err.status || 500).json({ success:false, message: msg, status: err.status||500, error: msg });
  }
  // non-API errors fall through to SPA
  return res.status(500).send(err.message || "Internal error");
});

// SPA catch-all fallback for client-side routing (e.g. /experience, /investor, /command-center)
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/webhook")) {
    return next();
  }
  const distIndex = path.join(__dirname, "..", "frontend", "dist", "index.html");
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  return res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

module.exports = app;
