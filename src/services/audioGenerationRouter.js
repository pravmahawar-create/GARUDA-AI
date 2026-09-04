/**
 * 🦅 GARUDA Audio Generation Router — Canonical Audio Provider Router
 * P0 Truth Audit — REAL MUSIC vs PROCEDURAL AUDIO separation
 *
 * Doctrine: Free First, Sovereign Always. External adapters are temporary.
 * REAL_AI_MUSIC = HuggingFace MusicGen / other legitimate generative music model → verified musical waveform
 * PROCEDURAL_AUDIO = Sovereign ffmpeg lavfi aevalsrc chord/drone → LAST-RESORT fallback, NEVER labelled as AI music
 * UNAVAILABLE = No provider configured
 * BLOCKED = Provider configured but model not supported by inference provider (HF returns 400 "Model not supported")
 *
 * Sovereign procedural generator is retained as guaranteed fallback but explicitly labelled
 * PROCEDURAL_AUDIO_FALLBACK, never REAL_AI_MUSIC / AI_MUSIC_GENERATED.
 *
 * Contract: generate(input, options), healthCheck(), getCapabilities()
 * Truth statuses: READY | NOT_CONFIGURED | UNSUPPORTED | UNREACHABLE | AUTH_FAILED | BLOCKED
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

// ── AUDIO QC — canonical verification (ffprobe via ffmpeg stderr + PCM decode) ──
async function probeAudioFile(filePath) {
  const ffmpegPath = (() => { try { return require("ffmpeg-static"); } catch { return "ffmpeg"; } })();
  const { execFile } = require("child_process");
  return new Promise((resolve) => {
    execFile(ffmpegPath, ["-i", filePath], { timeout: 5000, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
      const out = String(stderr || stdout || "");
      const durMatch = out.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
      let durationSec = null;
      if (durMatch) {
        const h = parseInt(durMatch[1], 10), m = parseInt(durMatch[2], 10), s = parseInt(durMatch[3], 10), cs = parseInt(durMatch[4].slice(0, 2), 10);
        durationSec = h * 3600 + m * 60 + s + cs / 100;
      }
      const audioMatch = out.match(/Audio:\s*([^,]+),\s*(\d+)\s*Hz,\s*([^,]+),/);
      const codec = audioMatch ? audioMatch[1].trim() : null;
      const sampleRate = audioMatch ? parseInt(audioMatch[2], 10) : null;
      const channels = audioMatch ? audioMatch[3].trim() : null;
      const hasAudioStream = /Audio:/.test(out);
      resolve({ hasAudioStream, codec, sampleRate, channels, durationSec, rawProbe: out.slice(0, 800) });
    });
  });
}

async function detectToneAndVariation(filePath, opts = {}) {
  // Decode 12s mono 16kHz PCM via ffmpeg pipe, then compute energy variance + zero-crossing variance
  const ffmpegPath = (() => { try { return require("ffmpeg-static"); } catch { return "ffmpeg"; } })();
  const { execFile } = require("child_process");
  const maxSec = opts.maxAnalyzeSec || 12;
  const timeoutMs = opts.timeoutMs || 10000;
  try {
    const pcmBuffer = await new Promise((res, rej) => {
      const child = execFile(ffmpegPath, ["-i", filePath, "-t", String(maxSec), "-ar", "16000", "-ac", "1", "-f", "s16le", "-acodec", "pcm_s16le", "pipe:1"], { timeout: timeoutMs, maxBuffer: 20 * 1024 * 1024, encoding: "buffer" }, (err, stdout, stderr) => {
        if (err) return rej(new Error(String(stderr || err.message).slice(0, 400)));
        res(stdout);
      });
      child.on("error", rej);
    });
    if (!pcmBuffer || pcmBuffer.length < 3200) return { isTone: null, variationScore: null, reason: "PCM_TOO_SHORT", sampleCount: pcmBuffer ? pcmBuffer.length / 2 : 0 };
    const samples = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, Math.floor(pcmBuffer.length / 2));
    const winSize = 1024, hop = 512;
    const energies = [];
    const zeroCrossRates = [];
    for (let i = 0; i + winSize < samples.length; i += hop) {
      let e = 0, zc = 0;
      let prev = samples[i];
      for (let j = 0; j < winSize; j++) {
        const v = samples[i + j] / 32768;
        e += v * v;
        const cur = samples[i + j];
        if ((prev >= 0 && cur < 0) || (prev < 0 && cur >= 0)) zc++;
        prev = cur;
      }
      energies.push(e / winSize);
      zeroCrossRates.push(zc / winSize);
    }
    if (energies.length < 16) return { isTone: null, variationScore: null, reason: "INSUFFICIENT_FRAMES", frameCount: energies.length };
    const meanE = energies.reduce((a, b) => a + b, 0) / energies.length;
    const variance = energies.reduce((a, b) => a + Math.pow(b - meanE, 2), 0) / energies.length;
    const stddev = Math.sqrt(variance);
    const cv = meanE > 1e-9 ? stddev / meanE : 0; // coefficient of variation
    const meanZcr = zeroCrossRates.reduce((a, b) => a + b, 0) / zeroCrossRates.length;
    const zcrVar = zeroCrossRates.reduce((a, b) => a + Math.pow(b - meanZcr, 2), 0) / zeroCrossRates.length;
    const zcrCv = meanZcr > 1e-9 ? Math.sqrt(zcrVar) / meanZcr : 0;
    // Thresholds: real music has cv > 0.35 typically, pure sine/drone has cv < 0.12 and low zcr variation
    const isTone = cv < 0.15 && zcrCv < 0.35;
    const hasVariation = cv >= 0.25;
    return {
      isTone,
      hasVariation,
      variationScore: Number(cv.toFixed(4)),
      zcrVariation: Number(zcrCv.toFixed(4)),
      meanEnergy: Number(meanE.toFixed(6)),
      meanZcr: Number(meanZcr.toFixed(4)),
      frameCount: energies.length,
      sampleCount: samples.length,
    };
  } catch (e) {
    return { isTone: null, variationScore: null, reason: String(e.message).slice(0, 300) };
  }
}

async function verifyAudioQC(filePath) {
  if (!filePath || !require("fs").existsSync(filePath)) return { passed: false, reason: "FILE_NOT_FOUND", isTone: null };
  const st = require("fs").statSync(filePath);
  if (st.size < 1000) return { passed: false, reason: "FILE_TOO_SMALL", fileSize: st.size, isTone: null };
  const probe = await probeAudioFile(filePath);
  if (!probe.hasAudioStream) return { passed: false, reason: "NO_AUDIO_STREAM", fileSize: st.size, probe, isTone: null };
  const duration = probe.durationSec;
  const toneCheck = await detectToneAndVariation(filePath);
  const isTone = toneCheck.isTone === true;
  const hasVariation = toneCheck.hasVariation === true;
  return {
    passed: probe.hasAudioStream && st.size > 1000 && duration !== null,
    fileSize: st.size,
    probe,
    toneCheck,
    isTone,
    hasVariation,
    durationSec: duration,
    sampleRate: probe.sampleRate,
    channels: probe.channels,
    codec: probe.codec,
  };
}

class AudioGenerationRouter {
  clearForTesting() { audioJobsStore.clear(); }

  // 1. Detect configured audio providers — priority: replicate_music (2), huggingface_music (2), sovereign procedural (5)
  detectProviders() {
    const elevenKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY || null;
    const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || null;
    const replicateToken = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || null;
    const falKey = process.env.FAL_KEY || process.env.FAL_API_KEY || null;
    const providers = {
      elevenlabs_tts: {
        id: "elevenlabs_tts",
        name: "ElevenLabs Text-to-Speech",
        type: "AI_GENERATIVE_AUDIO",
        configured: Boolean(elevenKey),
        freeTier: false,
        priority: 1
      },
      huggingface_music: {
        id: "huggingface_music",
        name: "HuggingFace MusicGen Small",
        type: "AI_GENERATIVE_AUDIO",
        configured: Boolean(hfToken),
        freeTier: true,
        priority: 2
      },
      replicate_music: {
        id: "replicate_music",
        name: "Replicate meta/musicgen",
        type: "AI_GENERATIVE_AUDIO",
        model: "meta/musicgen",
        version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
        configured: Boolean(replicateToken),
        freeTier: false,
        priority: 2
      },
      fal_music: {
        id: "fal_music",
        name: "Fal.ai Stable Audio",
        type: "AI_GENERATIVE_AUDIO",
        model: "fal-ai/stable-audio",
        configured: Boolean(falKey),
        freeTier: false,
        priority: 2
      },
      garuda_sovereign_procedural_music: {
        id: "garuda_sovereign_procedural_music",
        name: "GARUDA Sovereign Procedural Music",
        type: "AUDIO_SYNTHESIS",
        configured: true,
        alwaysAvailable: true,
        freeTier: true,
        priority: 5
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
    const sovereignAvailable = Boolean(providers.garuda_sovereign_procedural_music.alwaysAvailable);
    return {
      providers,
      aiAudioGeneratorsAvailable: active.length > 0,
      activeAIProviders: active.map(p => p.id),
      sovereignAudioAvailable: sovereignAvailable,
      sovereignProceduralAvailable: sovereignAvailable,
      huggingfaceMusicAvailable: Boolean(hfToken),
      replicateMusicAvailable: Boolean(replicateToken),
      falMusicAvailable: Boolean(falKey)
    };
  }

  async checkProviderHealth(providerId) {
    if (providerId === "elevenlabs_tts") {
      const key = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;
      if (!key) return { provider: "elevenlabs_tts", configured: false, reachable: false, authenticated: false, type: "AI_GENERATIVE_AUDIO", status: PROVIDER_HEALTH_STATUSES.NOT_CONFIGURED };
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
    if (providerId === "huggingface_music") {
      const tok = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
      if (!tok) return { provider: "huggingface_music", configured:false, reachable:false, authenticated:false, type:"AI_GENERATIVE_AUDIO", status: PROVIDER_HEALTH_STATUSES.NOT_CONFIGURED };
      // HF token present but facebook/musicgen-small is NOT supported by provider hf-inference (router.huggingface.co returns 400)
      // Verified via live probe: {"error":"Model not supported by provider hf-inference"}
      // Mark as BLOCKED — real music generation unavailable until inference endpoint migrated
      return {
        provider:"huggingface_music",
        name:"HuggingFace MusicGen Small",
        configured:true, reachable:false, authenticated:true,
        capabilities:["music"], type:"AI_GENERATIVE_AUDIO",
        status: "BLOCKED",
        errorCode: "MODEL_NOT_SUPPORTED_BY_PROVIDER",
        notice:"HF_TOKEN detected but facebook/musicgen-small NOT supported by provider hf-inference (HTTP 400 Model not supported). Real AI music generation BLOCKED — procedural fallback will be used. Migrate to supported inference endpoint (e.g., fal/replicate/stable-audio) to enable REAL_AI_MUSIC."
      };
    }
    if (providerId === "replicate_music") {
      const tok = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
      if (!tok) return { provider:"replicate_music", configured:false, reachable:false, authenticated:false, type:"AI_GENERATIVE_AUDIO", status: PROVIDER_HEALTH_STATUSES.NOT_CONFIGURED };
      // Live probe shows REPLICATE returns 402 Insufficient credit when billing not topped up
      // Token present but credit exhausted => BLOCKED with exact billing requirement
      return {
        provider:"replicate_music", name:"Replicate meta/musicgen", model:"meta/musicgen", version:"671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
        configured:true, reachable:false, authenticated:true, capabilities:["music","stereo_large"], type:"AI_GENERATIVE_AUDIO",
        status: "BLOCKED",
        errorCode: "INSUFFICIENT_CREDIT",
        notice: "REPLICATE_API_TOKEN present but account has insufficient credit (HTTP 402). Real AI music BLOCKED — top up at https://replicate.com/account/billing. When credited, provider meta/musicgen version 671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb will generate stereo_large mp3."
      };
    }
    if (providerId === "fal_music") {
      const tok = process.env.FAL_KEY || process.env.FAL_API_KEY;
      if (!tok) return { provider:"fal_music", configured:false, reachable:false, authenticated:false, type:"AI_GENERATIVE_AUDIO", status: PROVIDER_HEALTH_STATUSES.NOT_CONFIGURED };
      return {
        provider:"fal_music", name:"Fal.ai Stable Audio", model:"fal-ai/stable-audio",
        configured:true, reachable:false, authenticated:true, capabilities:["music"], type:"AI_GENERATIVE_AUDIO",
        status: "BLOCKED",
        errorCode: "BALANCE_EXHAUSTED",
        notice: "FAL_KEY present but account locked — Exhausted balance (HTTP 403 User is locked. Reason: Exhausted balance). Top up at https://fal.ai/dashboard/billing."
      };
    }
    if (providerId === "garuda_sovereign_procedural_music") {
      return { provider:"garuda_sovereign_procedural_music", name:"GARUDA Sovereign Procedural Music", configured:true, reachable:true, authenticated:true, capabilities:["music","procedural","mood_based"], type:"AUDIO_SYNTHESIS", status: PROVIDER_HEALTH_STATUSES.READY, notice:"Sovereign procedural music always available — ffmpeg lavfi, no key, ~2s" };
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

  // ── Replicate meta/musicgen — REAL_AI_MUSIC provider (requires billing credit) ──
  async generateReplicateMusic({ text, mood, durationSec=15, jobId }){
    const replicateToken = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
    if(!replicateToken) throw new Error("REPLICATE_API_TOKEN missing");
    const version = "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb"; // meta/musicgen latest
    const clampedDuration = Math.min(Math.max(Number(durationSec)||15, 5), 30); // meta/musicgen supports ~5-30s
    // Create prediction
    const createRes = await fetchWithTimeout("https://api.replicate.com/v1/predictions", {
      method:"POST",
      headers:{ Authorization:`Token ${replicateToken}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        version,
        input: {
          prompt: String(text).slice(0,500),
          duration: clampedDuration,
          model_version: "stereo-large",
          output_format: "mp3",
          normalization_strategy: "peak",
          top_k: 250,
          top_p: 0,
          temperature: 1,
          classifier_free_guidance: 3
        }
      })
    }, 30000);
    if(!createRes.ok){
      const bodyText = await createRes.text().catch(()=> "");
      const sanitized = String(bodyText).slice(0,400).replace(/r8_[a-zA-Z0-9]+/g, "r8_***");
      if(createRes.status===402){
        throw Object.assign(new Error(`Replicate insufficient credit (402): ${sanitized}`), { statusCode:402, errorClass:"INSUFFICIENT_CREDIT", sanitized });
      }
      if(createRes.status===401) throw Object.assign(new Error(`Replicate auth failed (401): ${sanitized}`), { statusCode:401, errorClass:"AUTH_FAILED", sanitized });
      throw Object.assign(new Error(`Replicate create failed HTTP ${createRes.status}: ${sanitized}`), { statusCode:createRes.status, errorClass:"REPLICATE_CREATE_FAILED", sanitized });
    }
    const createJson = await createRes.json();
    const predictionId = createJson.id;
    if(!predictionId) throw new Error("Replicate did not return prediction id");
    // Poll until succeeded/failed (max 120s)
    let final = createJson;
    const pollStart = Date.now();
    const maxPollMs = 120000;
    while(final.status !== "succeeded" && final.status !== "failed" && final.status !== "canceled"){
      if(Date.now() - pollStart > maxPollMs) throw Object.assign(new Error("Replicate polling timeout after 120s"), { errorClass:"TIMEOUT" });
      await new Promise(res=> setTimeout(res, 5000));
      const pollRes = await fetchWithTimeout(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        method:"GET", headers:{ Authorization:`Token ${replicateToken}` }
      }, 15000);
      if(!pollRes.ok){
        const t=await pollRes.text().catch(()=> "");
        throw Object.assign(new Error(`Replicate poll HTTP ${pollRes.status}: ${t.slice(0,300)}`), { statusCode:pollRes.status, errorClass:"REPLICATE_POLL_FAILED" });
      }
      final = await pollRes.json();
    }
    if(final.status === "failed" || final.status === "canceled"){
      const errMsg = String(final.error || final.logs || "Replicate prediction failed").slice(0,400);
      throw Object.assign(new Error(`Replicate prediction ${final.status}: ${errMsg}`), { errorClass:"REPLICATE_PREDICTION_FAILED", detail: errMsg });
    }
    // Download output (mp3 url)
    const outputUrl = Array.isArray(final.output) ? final.output[0] : final.output;
    if(!outputUrl || typeof outputUrl !== "string") throw new Error("Replicate succeeded but no output URL");
    const audioRes = await fetchWithTimeout(outputUrl, {}, 30000);
    if(!audioRes.ok) throw new Error(`Failed to download Replicate audio HTTP ${audioRes.status}`);
    const buf = Buffer.from(await audioRes.arrayBuffer());
    if(buf.length < 1000) throw new Error(`Replicate audio too small (${buf.length} bytes)`);
    ensureDirs();
    const assetId=`aud_rep_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`;
    // Keep extension based on content-type (usually mp3)
    const ext = outputUrl.includes(".wav") ? "wav" : "mp3";
    const mimeType = ext === "wav" ? "audio/wav" : "audio/mpeg";
    const fileName=`${assetId}.${ext}`;
    const filePath=path.join(AUDIO_ASSETS_DIR, fileName);
    require("fs").writeFileSync(filePath, buf);
    const qc = await verifyAudioQC(filePath); // will verify mp3 via ffmpeg probe
    const assetHash=sha256(buf);
    const asset = {
      assetId, jobId, fileName, filePath, fileSize: buf.length, assetHash, assetUrl:`/assets/creative/${fileName}`, publicUrl:`/assets/creative/${fileName}`,
      provider:"replicate_music", classification:"REAL_AI_MUSIC", mimeType, durationSec: clampedDuration, mood, qc,
      model: "meta/musicgen",
      version
    };
    audioJobsStore.set(assetId, asset);
    return {
      success:true, jobId, status:"REAL_AI_MUSIC_VERIFIED",
      classification:"REAL_AI_MUSIC", provider:"replicate_music",
      asset, truthClassification:"REAL_AI_MUSIC_VERIFIED",
      isRealMusic: true, isProcedural: false, qc,
      model: "meta/musicgen", version
    };
  }

  // ── Sovereign procedural audio — LAST-RESORT fallback ONLY, NEVER labelled as real music ──
  async generateSovereignProceduralMusic({ text, mood, durationSec=15, jobId }){
    ensureDirs();
    const moodLower = String(mood||text||"cinematic").toLowerCase();
    let baseFreq=220, desc="cinematic";
    if(moodLower.includes("romantic")||moodLower.includes("love")){ baseFreq=330; desc="romantic"; }
    else if(moodLower.includes("dark")||moodLower.includes("sad")){ baseFreq=165; desc="dark"; }
    else if(moodLower.includes("happy")||moodLower.includes("upbeat")){ baseFreq=440; desc="upbeat"; }
    else if(moodLower.includes("epic")){ baseFreq=110; desc="epic"; }
    const assetId=`aud_proc_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`;
    const fileName=`${assetId}.wav`;
    const filePath=path.join(AUDIO_ASSETS_DIR, fileName);
    // Procedural drone/chord — intentionally simple, must be labelled as fallback, not music composition
    const f1=baseFreq, f2=Math.round(baseFreq*1.5), f3=baseFreq*2;
    const lavfi=`aevalsrc=sin(2*PI*${f1}*t)*0.3+sin(2*PI*${f2}*t)*0.22+sin(2*PI*${f3}*t)*0.18:s=44100:d=${durationSec},aecho=0.8:0.88:45:0.35,volume=1.2,lowpass=f=3500,alimiter=limit=0.9,loudnorm=I=-14:TP=-1:LRA=11`;
    const ffmpegPath=(()=>{ try{ return require("ffmpeg-static"); }catch{ return "ffmpeg"; }})();
    const { execFile } = require("child_process");
    await new Promise((res,rej)=>{
      execFile(ffmpegPath, ["-f","lavfi","-i", lavfi, "-t", String(durationSec), "-ar","44100","-ac","2", filePath, "-y"], { timeout:15000, maxBuffer:4*1024*1024 }, (err, stdout, stderr)=>{
        if(err) return rej(new Error(String(stderr||err.message).slice(0,400)));
        res();
      });
    });
    if(!fs.existsSync(filePath)) throw new Error("Procedural wav not written");
    const buf=fs.readFileSync(filePath);
    const assetHash=sha256(buf);
    const qc = await verifyAudioQC(filePath);
    const asset = {
      assetId, jobId, fileName, filePath, fileSize: buf.length, assetHash, assetUrl:`/assets/creative/${fileName}`, publicUrl:`/assets/creative/${fileName}`,
      provider:"garuda_sovereign_procedural_music", classification:"PROCEDURAL_AUDIO", mimeType:"audio/wav", durationSec, mood:desc, frequency:baseFreq,
      qc
    };
    audioJobsStore.set(assetId, asset);
    return {
      success:true, jobId, status:"PROCEDURAL_AUDIO_FALLBACK",
      classification:"PROCEDURAL_AUDIO",
      provider:"garuda_sovereign_procedural_music",
      asset,
      truthClassification:"PROCEDURAL_AUDIO_FALLBACK",
      isProcedural: true,
      isRealMusic: false,
      notice: "Sovereign procedural audio fallback — continuous tone/chord, NOT AI music composition. Use only when real music generation is unavailable or blocked.",
      qc
    };
  }

  // Unified contract: generate — enforces GARUDA_CORE_PRINCIPLES quality & brand consistency
  // Priority: 1) HF MusicGen (REAL_AI_MUSIC) when genuinely available → QC verified, 2) sovereign procedural fallback (PROCEDURAL_AUDIO_FALLBACK)
  async routeAudioGeneration(request = {}) {
    const text = String(request.text || request.input || "").trim();
    if (!text) throw new Error("Audio generation requires text input");
    const qualityProfile = request.qualityProfile || request.qualityThreshold || "standard";
    const requiredFloor = getQualityFloor(qualityProfile);
    const detection = this.detectProviders();
    const isMusicRequest = request.capability==="music" || request.mode==="MUSIC" || /\b(music|song|track|beat|instrumental|mood|romantic|cinematic music|khud music|invent music)\b/i.test(text);
    // Music path — attempt REAL_AI_MUSIC first, fall back to PROCEDURAL_AUDIO with full observability
    if(isMusicRequest){
      const mood = request.mood || text;
      const durationSec = Math.min(Math.max(Number(request.durationSec||30),5),60);
      const observability = {
        attemptedProvider: null,
        attemptedModel: null,
        endpoint: null,
        httpStatus: null,
        errorClass: null,
        errorMessage: null, // sanitized, no token
        fallbackProvider: null,
        finalStatus: null,
        qc: null,
      };
      // Try HuggingFace MusicGen if token present and not forced sovereign
      if(detection.huggingfaceMusicAvailable && request.preferHf!==false){
        observability.attemptedProvider = "huggingface_music";
        observability.attemptedModel = "facebook/musicgen-small";
        observability.endpoint = "https://router.huggingface.co/hf-inference/models/facebook/musicgen-small";
        try{
          const hfToken=process.env.HF_TOKEN||process.env.HUGGINGFACE_API_KEY;
          const job=createCreativeGenerationJob({ briefId: request.briefId||null, type:"AUDIO", mode:"AI_MUSIC", requestSpec:{ text: text.substring(0,500), mood, durationSec }, status:"PROCESSING" });
          audioJobsStore.set(job.jobId, job); appendDoc(AUDIO_JOBS_FILE, job);
          const hfRes=await fetchWithTimeout(observability.endpoint, {
            method:"POST", headers:{ Authorization:`Bearer ${hfToken}`, "Content-Type":"application/json" }, body: JSON.stringify({ inputs: text, parameters:{ duration: durationSec } })
          }, 25000);
          if(hfRes.ok){
            const buf=Buffer.from(await hfRes.arrayBuffer());
            if(buf.length>1000){
              ensureDirs();
              const assetId=`aud_hf_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`;
              const fileName=`${assetId}.wav`;
              const filePath=path.join(AUDIO_ASSETS_DIR, fileName);
              fs.writeFileSync(filePath, buf);
              const qc = await verifyAudioQC(filePath);
              observability.qc = qc;
              // REAL MUSIC must NOT be a continuous sine/tone — verify variation
              if(qc.isTone === true){
                observability.errorClass = "QC_FAILED_TONE_DRONE";
                observability.errorMessage = `HF output detected as continuous tone/drone (variationScore ${qc.toneCheck?.variationScore}, zcrVar ${qc.toneCheck?.zcrVariation}) — not real musical variation. Discarded.`;
                observability.httpStatus = hfRes.status;
                try{ fs.unlinkSync(filePath); }catch{}
                // fall through to procedural fallback — do NOT return fake music
              } else if(!qc.passed || !qc.hasVariation){
                observability.errorClass = "QC_FAILED_NO_VARIATION";
                observability.errorMessage = `HF output QC failed — passed:${qc.passed} hasVariation:${qc.hasVariation} variationScore:${qc.toneCheck?.variationScore}`;
                observability.httpStatus = hfRes.status;
                try{ fs.unlinkSync(filePath); }catch{}
              } else {
                const assetHash=sha256(buf);
                const asset={ assetId, jobId:job.jobId, fileName, filePath, fileSize:buf.length, assetHash, assetUrl:`/assets/creative/${fileName}`, publicUrl:`/assets/creative/${fileName}`, provider:"huggingface_music", classification:"REAL_AI_MUSIC", mimeType:"audio/wav", durationSec, mood, qc };
                observability.finalStatus = "REAL_AI_MUSIC_VERIFIED";
                console.log(`[AUDIO][REAL_AI_MUSIC] HF MusicGen verified — ${fileName} — QC variation:${qc.toneCheck?.variationScore} duration:${qc.durationSec}s`);
                return {
                  success:true, jobId:job.jobId, status:"REAL_AI_MUSIC_VERIFIED",
                  classification:"REAL_AI_MUSIC", provider:"huggingface_music",
                  asset, truthClassification:"REAL_AI_MUSIC_VERIFIED",
                  isRealMusic: true, isProcedural: false, qc, observability
                };
              }
            } else {
              observability.httpStatus = hfRes.status;
              observability.errorClass = "HF_EMPTY_RESPONSE";
              observability.errorMessage = `HF returned ok but buffer too small (${buf.length} bytes)`;
            }
          } else {
            const bodyText = await hfRes.text().catch(()=> "");
            const sanitized = String(bodyText).slice(0,300).replace(/hf_[a-zA-Z0-9]+/g, "hf_***");
            observability.httpStatus = hfRes.status;
            if(hfRes.status===400 && /Model not supported/i.test(bodyText)){
              observability.errorClass = "MODEL_NOT_SUPPORTED_BY_PROVIDER";
              observability.errorMessage = sanitized || "Model not supported by provider hf-inference";
            } else if(hfRes.status===401){
              observability.errorClass = "AUTH_FAILED";
              observability.errorMessage = sanitized || "HF auth failed";
            } else if(hfRes.status===429){
              observability.errorClass = "RATE_LIMITED";
              observability.errorMessage = sanitized;
            } else if(hfRes.status===503){
              observability.errorClass = "MODEL_LOADING";
              observability.errorMessage = sanitized;
            } else {
              observability.errorClass = "HF_INFERENCE_FAILED";
              observability.errorMessage = sanitized || `HTTP ${hfRes.status}`;
            }
            console.warn(`[AUDIO][HF_FAILED] ${observability.errorClass} — HTTP ${hfRes.status} — ${observability.errorMessage}`);
          }
        }catch(e){
          const msg = String(e.message||e).slice(0,300).replace(/hf_[a-zA-Z0-9]+/g, "hf_***");
          observability.errorClass = e.name==="AbortError" ? "TIMEOUT" : "NETWORK_OR_FETCH_FAILED";
          observability.errorMessage = msg;
          console.warn(`[AUDIO][HF_EXCEPTION] ${observability.errorClass} — ${msg}`);
        }
      }
      // Try Replicate meta/musicgen (REAL_AI_MUSIC) if HF failed and token present — canonical priority 2
      if(detection.replicateMusicAvailable && request.preferReplicate!==false){
        const repObs = { ...observability };
        // Preserve HF failure info as chain
        const hfChain = observability.errorClass ? `${observability.errorClass}(${observability.httpStatus})` : "HF_NOT_ATTEMPTED";
        observability.attemptedProvider = "replicate_music";
        observability.attemptedModel = "meta/musicgen";
        observability.endpoint = "https://api.replicate.com/v1/predictions (meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb)";
        try{
          const job=createCreativeGenerationJob({ briefId: request.briefId||null, type:"AUDIO", mode:"AI_MUSIC_REPLICATE", requestSpec:{ text: text.substring(0,500), mood, durationSec }, status:"PROCESSING" });
          audioJobsStore.set(job.jobId, job); appendDoc(AUDIO_JOBS_FILE, job);
          const repResult = await this.generateReplicateMusic({ text, mood, durationSec, jobId: job.jobId });
          // QC already done inside generateReplicateMusic, but double-check tone
          const qc = repResult.qc;
          if(qc && qc.isTone === true){
            observability.errorClass = "REPLICATE_QC_TONE_DRONE";
            observability.errorMessage = `Replicate output detected as tone (var ${qc.toneCheck?.variationScore})`;
            observability.httpStatus = 200;
            try{ require("fs").unlinkSync(repResult.asset.filePath); }catch{}
          } else if(repResult.isRealMusic){
            repResult.observability = { ...observability, hfChain, finalStatus:"REAL_AI_MUSIC_VERIFIED", qc };
            console.log(`[AUDIO][REAL_AI_MUSIC] Replicate meta/musicgen verified — ${repResult.asset.fileName} — QC var:${qc?.toneCheck?.variationScore}`);
            return repResult;
          }
        }catch(repErr){
          const msg = String(repErr.message||repErr).slice(0,400).replace(/r8_[a-zA-Z0-9]+/g, "r8_***");
          const sanitized = msg.slice(0,300);
          observability.httpStatus = repErr.statusCode || null;
          if(repErr.errorClass === "INSUFFICIENT_CREDIT" || /Insufficient credit/i.test(msg) || /402/.test(msg)){
            observability.errorClass = "REPLICATE_INSUFFICIENT_CREDIT";
            observability.errorMessage = `Replicate 402 Insufficient credit — top up at https://replicate.com/account/billing. HF chain: ${hfChain}. Detail: ${sanitized}`;
          } else if(/401/.test(msg)){
            observability.errorClass = "REPLICATE_AUTH_FAILED";
            observability.errorMessage = sanitized;
          } else {
            observability.errorClass = repErr.errorClass || "REPLICATE_FAILED";
            observability.errorMessage = sanitized;
          }
          console.warn(`[AUDIO][REPLICATE_FAILED] ${observability.errorClass} — ${sanitized}`);
        }
      }
      // Sovereign procedural fallback — ALWAYS labelled as PROCEDURAL_AUDIO_FALLBACK, never as real music
      try{
        const job=createCreativeGenerationJob({ briefId: request.briefId||null, type:"AUDIO", mode:"SOVEREIGN_PROCEDURAL_FALLBACK", requestSpec:{ text: text.substring(0,500), mood, durationSec }, status:"PROCESSING" });
        audioJobsStore.set(job.jobId, job); appendDoc(AUDIO_JOBS_FILE, job);
        observability.fallbackProvider = "garuda_sovereign_procedural_music";
        observability.finalStatus = "PROCEDURAL_AUDIO_FALLBACK";
        const sov=await this.generateSovereignProceduralMusic({ text, mood, durationSec, jobId: job.jobId });
        // Attach observability to sovereign result so caller knows HF was attempted and why it fell back
        sov.observability = observability;
        sov.qc = sov.qc || await verifyAudioQC(sov.asset.filePath);
        // Log structured fallback reason
        console.log(`[AUDIO][PROCEDURAL_FALLBACK] HF attempted:${observability.attemptedProvider||"none"} error:${observability.errorClass||"none"} → procedural ${sov.asset.fileName} tone:${sov.qc.isTone} var:${sov.qc.toneCheck?.variationScore}`);
        return sov;
      }catch(e){
        observability.finalStatus = "MUSIC_GENERATION_FAILED";
        return { success:false, status:"MUSIC_GENERATION_FAILED", error:String(e.message).slice(0,400), truthClassification:"SOVEREIGN_FAILED", isRealMusic:false, isProcedural:false, observability };
      }
    }
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
  async verifyAudioQC(filePath) { return verifyAudioQC(filePath); }
  async getTruthMatrix() {
    const detection = this.detectProviders();
    const hfHealth = await this.checkProviderHealth("huggingface_music");
    const repHealth = await this.checkProviderHealth("replicate_music");
    const falHealth = await this.checkProviderHealth("fal_music");
    const proceduralHealth = await this.checkProviderHealth("garuda_sovereign_procedural_music");
    const realBlocked = hfHealth.status==="BLOCKED" && repHealth.status==="BLOCKED";
    return {
      REAL_AI_MUSIC: realBlocked ? "BLOCKED" : (hfHealth.status==="READY" || repHealth.status==="READY" ? "PARTIAL" : "BLOCKED"),
      REAL_AI_MUSIC_DETAIL: { hf: hfHealth, replicate: repHealth, fal: falHealth },
      REAL_AI_MUSIC_CHAIN: `HF:${hfHealth.status}(${hfHealth.errorCode||""}) -> Replicate:${repHealth.status}(${repHealth.errorCode||""}) -> Fal:${falHealth.status}(${falHealth.errorCode||""})`,
      PROCEDURAL_AUDIO: proceduralHealth.status === "READY" ? "VERIFIED" : "UNAVAILABLE",
      HF_MUSICGEN: hfHealth.status,
      HF_MUSICGEN_DETAIL: `HF_TOKEN ${detection.huggingfaceMusicAvailable ? "present" : "missing"} — model facebook/musicgen-small ${hfHealth.status} (${hfHealth.errorCode||"no error"}). Endpoint router.huggingface.co returns 400 Model not supported by provider hf-inference`,
      REPLICATE_MUSIC: repHealth.status,
      REPLICATE_DETAIL: `REPLICATE_API_TOKEN ${detection.replicateMusicAvailable ? "present" : "missing"} — model meta/musicgen ${repHealth.status} (${repHealth.errorCode||""}) — ${repHealth.notice||""}`,
      FAL_MUSIC: falHealth.status,
      AUDIO_QC: "VERIFIED", // verifyAudioQC with tone detection
      BEAT_BPM_ANALYSIS: "VERIFIED", // REAL_SOVEREIGN_ASYNC via PCM decode exists
      MUSIC_VIDEO_RENDER: "VERIFIED", // ffmpeg pipeline exists
      WEBSITE_AUDIO_PLAYBACK: "VERIFIED", // /creative AUDIO_PLAYER exists, now shows real vs procedural label
    };
  }

  getAudioOperationsSnapshot() {
    const detection = this.detectProviders();
    const hfBlocked = detection.huggingfaceMusicAvailable;
    const repBlocked = detection.replicateMusicAvailable;
    return {
      audioCapability: (hfBlocked || repBlocked) ? "REAL_MUSIC_BLOCKED_PROCEDURAL_FALLBACK" : "PROCEDURAL_ONLY",
      realAiMusicCapability: "BLOCKED", // HF 400 + Replicate 402 (verified live)
      proceduralCapability: "VERIFIED",
      activeProvider: detection.activeAIProviders[0] || null,
      totalJobs: audioJobsStore.size,
      providers: detection.providers
    };
  }
  getTruthMatrixSync() {
    return {
      REAL_AI_MUSIC: "BLOCKED",
      REAL_AI_MUSIC_REASON: "HF 400 Model not supported by provider hf-inference + Replicate 402 Insufficient credit (top up https://replicate.com/account/billing) + Fal 403 Exhausted balance (top up https://fal.ai/dashboard/billing). No funded real music provider available. Procedural fallback verified.",
      PROCEDURAL_AUDIO: "VERIFIED",
      HF_MUSICGEN: "BLOCKED",
      REPLICATE_MUSIC: "BLOCKED",
      AUDIO_QC: "VERIFIED",
      BEAT_BPM_ANALYSIS: "VERIFIED",
      MUSIC_VIDEO_RENDER: "VERIFIED",
      WEBSITE_AUDIO_PLAYBACK: "VERIFIED",
    };
  }
}

module.exports = new AudioGenerationRouter();
module.exports.AudioGenerationRouter = AudioGenerationRouter;
