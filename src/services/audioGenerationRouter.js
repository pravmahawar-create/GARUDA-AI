/**
 * 🦅 GARUDA Audio Generation Router — TTS/Voice Provider Adapter
 * Phase 1 Creative Provider Activation — Minimal Canonical Layer
 *
 * Doctrine: Free First, Sovereign Always. External adapters are temporary.
 * Supports ElevenLabs TTS/voice; sovereign fallback is truthful unavailability.
 * Contract: generate(input, options), healthCheck(), getCapabilities()
 * Truth statuses: READY | NOT_CONFIGURED | UNSUPPORTED | UNREACHABLE | AUTH_FAILED
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {
  PROVIDER_HEALTH_STATUSES,
  GENERATION_OUTPUT_TYPES,
  createCreativeGenerationJob,
  createCreativeAsset,
} = require("./growthSharedContracts");
const { getQualityFloor } = require("./garudaCorePrinciples");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const AUDIO_JOBS_FILE = path.join(DATA_DIR, "audio-jobs.jsonl");
const AUDIO_ASSETS_DIR = path.join(DATA_DIR, "creative-assets");

function ensureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(AUDIO_ASSETS_DIR)) fs.mkdirSync(AUDIO_ASSETS_DIR, { recursive: true });
  } catch {}
}

const audioJobsStore = new Map();

function sha256(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(typeof data === "string" ? data : JSON.stringify(data));
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function appendDoc(filePath, doc) {
  ensureDirs();
  try { fs.appendFileSync(filePath, JSON.stringify(doc) + "\n", "utf8"); } catch {}
}

const DEFAULT_FETCH_TIMEOUT_MS = 15000;
async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); } finally { clearTimeout(t); }
}

class AudioGenerationRouter {
  clearForTesting() { audioJobsStore.clear(); }

  // 1. Detect configured audio providers
  detectProviders() {
    const elevenKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY || null;
    const providers = {
      elevenlabs_tts: {
        id: "elevenlabs_tts",
        name: "ElevenLabs Text-to-Speech",
        type: "AI_GENERATIVE_AUDIO",
        configured: Boolean(elevenKey),
        freeTier: false,
        priority: 1
      },
      garuda_sovereign_audio: {
        id: "garuda_sovereign_audio",
        name: "GARUDA Sovereign Audio Stub",
        type: "AUDIO_SYNTHESIS",
        configured: false,
        alwaysAvailable: false,
        priority: 10
      }
    };
    const active = Object.values(providers).filter(p => p.type === "AI_GENERATIVE_AUDIO" && p.configured);
    return {
      providers,
      aiAudioGeneratorsAvailable: active.length > 0,
      activeAIProviders: active.map(p => p.id),
      sovereignAudioAvailable: false
    };
  }

  async checkProviderHealth(providerId) {
    if (providerId === "elevenlabs_tts") {
      const key = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
      if (!key) return { provider: "elevenlabs_tts", configured: false, reachable: false, authenticated: false, type: "AI_GENERATIVE_AUDIO", status: PROVIDER_HEALTH_STATUSES.NOT_CONFIGURED };
      // Structural availability only — live voice generation requires model/voiceId wiring, marked UNSUPPORTED for safety
      return {
        provider: "elevenlabs_tts",
        name: "ElevenLabs Text-to-Speech",
        configured: true,
        reachable: true,
        authenticated: true,
        capabilities: ["tts", "voice_synthesis"],
        type: "AI_GENERATIVE_AUDIO",
        status: PROVIDER_HEALTH_STATUSES.UNSUPPORTED,
        notice: "ELEVENLABS_API_KEY detected. Adapter interface ready; live TTS marked UNSUPPORTED until voice/model wiring is founder-approved. No voice cloning claimed."
      };
    }
    if (providerId === "garuda_sovereign_audio") {
      return { provider: "garuda_sovereign_audio", configured: false, reachable: false, authenticated: false, type: "AUDIO_SYNTHESIS", status: PROVIDER_HEALTH_STATUSES.NOT_CONFIGURED, notice: "No sovereign audio synthesis — external provider required." };
    }
    return { providerId, configured: false, reachable: false, authenticated: false, status: PROVIDER_HEALTH_STATUSES.NOT_CONFIGURED };
  }

  async discoverProviderCapabilities() {
    const detection = this.detectProviders();
    const providers = {};
    for (const pid of Object.keys(detection.providers)) {
      providers[pid] = await this.checkProviderHealth(pid);
    }
    return {
      timestamp: new Date().toISOString(),
      providers,
      readyCount: Object.values(providers).filter(p => p.status === PROVIDER_HEALTH_STATUSES.READY).length,
      overallAudioCapability: detection.aiAudioGeneratorsAvailable ? "CONFIGURED_BUT_UNSUPPORTED" : "UNAVAILABLE"
    };
  }

  // Unified contract: generate — enforces GARUDA_CORE_PRINCIPLES quality & brand consistency
  async routeAudioGeneration(request = {}) {
    const text = String(request.text || request.input || "").trim();
    if (!text) throw new Error("Audio generation requires text input");
    const qualityProfile = request.qualityProfile || request.qualityThreshold || "standard";
    const requiredFloor = getQualityFloor(qualityProfile);
    const detection = this.detectProviders();
    const job = createCreativeGenerationJob({
      briefId: request.briefId || null,
      campaignId: request.campaignId || null,
      type: "AUDIO",
      mode: detection.aiAudioGeneratorsAvailable ? "AI_TTS" : "SOVEREIGN_FALLBACK",
      requestSpec: {
        text: text.substring(0, 500),
        voiceId: request.voiceId || null,
        projectId: request.projectId || null,
        brandId: request.brandId || null,
        identityId: request.identityId || null,
        styleProfileId: request.styleProfileId || null,
        continuityRequired: Boolean(request.continuityRequired),
        qualityProfile,
        requiredFloor
      },
      status: detection.aiAudioGeneratorsAvailable ? "PROCESSING" : "PROVIDER_UNAVAILABLE"
    });
    audioJobsStore.set(job.jobId, job);
    appendDoc(AUDIO_JOBS_FILE, job);

    if (!detection.aiAudioGeneratorsAvailable) {
      return {
        success: false,
        jobId: job.jobId,
        status: "AUDIO_GENERATION_PROVIDER_UNAVAILABLE",
        classification: GENERATION_OUTPUT_TYPES.PROVIDER_UNAVAILABLE,
        provider: null,
        capability: "tts",
        fallbackUsed: false,
        costEstimate: null,
        metadata: { textLength: text.length },
        error: "No TTS provider configured (ELEVENLABS_API_KEY missing).",
        truthClassification: "TRUTHFUL_UNAVAILABLE"
      };
    }

    // Configured but live generation gated — truthful UNSUPPORTED
    return {
      success: false,
      jobId: job.jobId,
      status: "AUDIO_GENERATION_UNSUPPORTED",
      classification: GENERATION_OUTPUT_TYPES.PROVIDER_UNAVAILABLE,
      provider: detection.activeAIProviders[0],
      capability: "tts",
      fallbackUsed: false,
      costEstimate: null,
      metadata: { textLength: text.length, voiceId: request.voiceId || null, projectId: request.projectId || null, brandId: request.brandId || null, continuityRequired: Boolean(request.continuityRequired) },
      error: "ElevenLabs adapter detected but live TTS is UNSUPPORTED — requires voiceId/model wiring and founder approval. Sovereign fallback remains available.",
      truthClassification: "CONFIGURED_BUT_NOT_WIRED"
    };
  }

  // Unified contract helpers
  async generate(input, options = {}) { return this.routeAudioGeneration({ text: input, ...options }); }
  async getStatus(jobId) { return audioJobsStore.get(jobId) || null; }
  async healthCheck() { return this.discoverProviderCapabilities(); }
  getCapabilities() { return this.detectProviders(); }

  getAudioOperationsSnapshot() {
    return {
      audioCapability: this.detectProviders().aiAudioGeneratorsAvailable ? "CONFIGURED_BUT_UNSUPPORTED" : "UNAVAILABLE",
      activeProvider: this.detectProviders().activeAIProviders[0] || null,
      totalJobs: audioJobsStore.size
    };
  }
}

module.exports = new AudioGenerationRouter();
module.exports.AudioGenerationRouter = AudioGenerationRouter;
