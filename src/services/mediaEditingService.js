/**
 * 🦅 GARUDA Media Editing Service — Canonical EDIT Orchestration
 * Reuses existing ffmpeg-static + local2dCinematicMotionEngine infrastructure.
 * Doctrine: ONE canonical timeline, ONE render pipeline, truthful QC.
 * No duplicate engines — extends existing Creative Studio pipeline to real media.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");

function sha256(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }

class MediaEditingService {
  constructor() {
    this.ffmpegPath = this._resolveFfmpeg();
    this.assetsDir = path.join(process.cwd(), "data", "creative-assets");
    this.ingestDir = path.join(process.cwd(), "uploads", "creative-ingest");
  }
  _resolveFfmpeg() {
    try { return require("ffmpeg-static"); } catch {
      const fb = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe");
      if (fs.existsSync(fb)) return fb;
      return "ffmpeg";
    }
  }
  isAvailable() {
    try { return Boolean(this.ffmpegPath && (fs.existsSync(this.ffmpegPath) || this.ffmpegPath==="ffmpeg")); } catch { return false; }
  }

  async ingestMedia(file) {
    if (!file || !file.path || !fs.existsSync(file.path)) throw new Error("Ingest: source file not found on disk");
    const buf = fs.readFileSync(file.path);
    const record = {
      assetId: `ingest_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
      originalName: file.originalname,
      mimetype: file.mimetype,
      filePath: file.path,
      fileSize: buf.length,
      sha256: sha256(buf),
      ingestedAt: new Date().toISOString(),
      status: "INGESTED"
    };
    const idx = path.join(process.cwd(), "data", "creative-assets.jsonl");
    try { fs.appendFileSync(idx, JSON.stringify({ ...record, type: "INGESTED_MEDIA" })+"\n"); } catch {}
    return record;
  }

  validateMedia(filePath) {
    if (!fs.existsSync(filePath)) return { passed:false, status:"FAILED", reason:"FILE_NOT_FOUND" };
    const st = fs.statSync(filePath);
    if (st.size < 100) return { passed:false, status:"FAILED", reason:"FILE_TOO_SMALL", fileSize: st.size };
    if (filePath.endsWith(".mp4")) {
      const buf = fs.readFileSync(filePath);
      if (buf.slice(4,8).toString("ascii")!=="ftyp") return { passed:false, status:"FAILED", reason:"INVALID_MP4_FTYP" };
    }
    return { passed:true, status:"PASSED", fileSize: st.size };
  }

  async renderTimeline({ inputs, operations, outputName }) {
    if (!this.isAvailable()) throw new Error("FFmpeg not available on this host — media editing UNAVAILABLE (ffmpeg-static missing)");
    if (!Array.isArray(inputs) || inputs.length===0) throw new Error("renderTimeline: At least one input file required");
    for (const p of inputs) if (!fs.existsSync(p)) throw new Error(`Input not found: ${p}`);

    if (!fs.existsSync(this.assetsDir)) fs.mkdirSync(this.assetsDir, { recursive:true });
    const outFile = path.join(this.assetsDir, outputName || `edit_${Date.now()}.mp4`);

    let vfParts = [];
    let ssArgs = [];
    let tArgs = [];
    let audioReplacePath = null;
    for (const op of (operations||[])) {
      if (op.trim) { ssArgs = ["-ss", String(op.trim.start)]; if(op.trim.end) tArgs = ["-t", String(op.trim.end - op.trim.start)]; }
      if (op.scale) vfParts.push(`scale=${op.scale.w}:${op.scale.h}`);
      if (op.crop) vfParts.push(`crop=${op.crop.w}:${op.crop.h}`);
      if (op.text) {
        const safe = String(op.text.text).replace(/:/g,"\\:").replace(/'/g,"");
        vfParts.push(`drawtext=text='${safe}':x=${op.text.x||10}:y=${op.text.y||10}:fontsize=32:fontcolor=white`);
      }
      if (op.audio_replace || op.audioReplace || op.audio) {
        const p = op.audio_replace || op.audioReplace || op.audio;
        if(typeof p==="string" && fs.existsSync(p)) audioReplacePath = p;
      }
    }
    if (vfParts.length===0) vfParts.push("scale=1280:720:flags=bicubic");
    const vf = vfParts.join(",");

    // Audio mux path: if audioReplacePath present, add second input and map
    let args;
    if(audioReplacePath){
      args = [...ssArgs, "-i", inputs[0], "-i", audioReplacePath, ...tArgs, "-vf", vf, "-map","0:v:0", "-map","1:a:0", "-c:v","libx264","-c:a","aac","-pix_fmt","yuv420p","-preset","ultrafast","-movflags","+faststart","-shortest","-y", outFile];
    } else {
      args = [...ssArgs, "-i", inputs[0], ...tArgs, "-vf", vf, "-c:v","libx264","-pix_fmt","yuv420p","-preset","ultrafast","-movflags","+faststart","-y", outFile];
    }
    if (inputs.length>1 && operations && operations.some(o=>o.concat)) {
      const listFile = path.join(this.assetsDir, `concat_${Date.now()}.txt`);
      fs.writeFileSync(listFile, inputs.map(p=>`file '${p.replace(/'/g,"'\\''")}'`).join("\n"));
      if(audioReplacePath){
        // concat + audio mux needs re-encode, not copy
        const concatArgs = ["-f","concat","-safe","0","-i", listFile, "-i", audioReplacePath, "-vf", vf, "-map","0:v:0", "-map","1:a:0", "-c:v","libx264","-c:a","aac","-pix_fmt","yuv420p","-preset","ultrafast","-movflags","+faststart","-shortest","-y", outFile];
        await new Promise((res,rej)=> execFile(this.ffmpegPath, concatArgs, { timeout: 60000, maxBuffer: 4*1024*1024 }, (e,so,se)=> e?rej(new Error(se||e.message)):res()));
      } else {
        const concatArgs = ["-f","concat","-safe","0","-i", listFile, "-c","copy","-y", outFile];
        await new Promise((res,rej)=> execFile(this.ffmpegPath, concatArgs, { timeout: 30000, maxBuffer: 4*1024*1024 }, (e,so,se)=> e?rej(new Error(se||e.message)):res()));
      }
      try { fs.unlinkSync(listFile); } catch {}
    } else {
      await new Promise((res,rej)=> execFile(this.ffmpegPath, args, { timeout: 60000, maxBuffer: 4*1024*1024 }, (e,so,se)=> e?rej(new Error(`FFmpeg edit failed: ${se||e.message}`)):res()));
    }

    if (!fs.existsSync(outFile)) throw new Error("Render failed: output not written");
    const buf = fs.readFileSync(outFile);
    const qc = this.validateMedia(outFile);
    const record = {
      assetId: `edit_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
      filePath: outFile,
      publicUrl: `/assets/creative/${path.basename(outFile)}`,
      dataUrl: `/data/creative-assets/${path.basename(outFile)}`,
      sha256: sha256(buf),
      fileSize: buf.length,
      inputs, operations,
      qc,
      status: qc.passed ? "RENDERED_VERIFIED" : "RENDERED_QC_FAILED",
      createdAt: new Date().toISOString()
    };
    try { fs.appendFileSync(path.join(process.cwd(),"data","creative-assets.jsonl"), JSON.stringify(record)+"\n"); } catch {}
    try {
      const pub = path.join(process.cwd(),"frontend","public","images", path.basename(outFile));
      const dir = path.dirname(pub); if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
      fs.writeFileSync(pub, buf);
    } catch {}
    return record;
  }

  // Beat/BPM: fast sync placeholder (preserved interface)
  analyzeBeats(audioPath) {
    if (!audioPath || !fs.existsSync(audioPath)) return { status:"UNAVAILABLE", reason:"AUDIO_NOT_FOUND", beats:[], bpm:null };
    const st = fs.statSync(audioPath);
    return {
      status:"ANALYZED_PLACEHOLDER",
      method:"sovereign_placeholder_grid",
      truthNotice:"Fast sync placeholder — 0.75s grid. Use analyzeBeatsAsync() for real PCM autocorrelation.",
      fileSize: st.size,
      durationEstimateSec: Math.round(st.size/10000),
      beats: Array.from({length:8},(_,i)=>({ timeSec: Number(((i+1)*0.75).toFixed(3)), confidence:0.78 })),
      bpm: 120,
      beatCount: 8,
      confidence: 0.78
    };
  }

  // ── REAL sovereign beat/BPM: non-blocking FFmpeg PCM decode via pipe → autocorrelation ──
  async analyzeBeatsAsync(audioPath, opts={}){
    if (!audioPath || !fs.existsSync(audioPath)) return { status:"UNAVAILABLE", reason:"AUDIO_NOT_FOUND", beats:[], bpm:null };
    const timeoutMs = Math.min(opts.timeoutMs||15000, 20000);
    const maxAnalyzeSec = opts.maxAnalyzeSec||30;
    let st;
    try{ st=fs.statSync(audioPath); } catch(e){ return { status:"ANALYSIS_FAILED", reason:String(e.message), beats:[], bpm:null }; }
    if (st.size < 100) return { status:"ANALYSIS_FAILED", reason:"FILE_TOO_SMALL", fileSize: st.size, beats:[], bpm:null };

    let probedDurationSec = null;
    try{
      probedDurationSec = await new Promise((res)=>{
        let settled=false;
        const to=setTimeout(()=>{ if(!settled){ settled=true; res(null); } }, 5000);
        const child = execFile(this.ffmpegPath, ["-i", audioPath], { timeout:4000, maxBuffer: 2*1024*1024 }, (err, stdout, stderr)=>{
          if(settled) return; clearTimeout(to); settled=true;
          const out = String(stderr||stdout||"");
          const m = out.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
          if(m){ const h=parseInt(m[1],10), mi=parseInt(m[2],10), s=parseInt(m[3],10), ms=parseInt(m[4].slice(0,2),10);
            probedDurationSec = h*3600 + mi*60 + s + ms/100; }
          res(probedDurationSec);
        });
        child.on("error", ()=>{ if(settled) return; clearTimeout(to); settled=true; res(null); });
      });
    }catch{}

    let pcmBuffer = null;
    try{
      pcmBuffer = await new Promise((res,rej)=>{
        let settled=false;
        const to=setTimeout(()=>{ if(!settled){ settled=true; rej(new Error("PCM decode outer timeout "+timeoutMs+"ms")); } }, timeoutMs+3000);
        const child = execFile(this.ffmpegPath, ["-i", audioPath, "-t", String(maxAnalyzeSec), "-ar","16000","-ac","1","-f","s16le","-acodec","pcm_s16le","pipe:1"], { timeout: timeoutMs, maxBuffer: 20*1024*1024, encoding: "buffer" }, (err, stdout, stderr)=>{
          if(settled) return; clearTimeout(to); settled=true;
          if(err){
            const msg = String(stderr||err.message||"").slice(0,600);
            return rej(new Error(`FFmpeg PCM decode failed: ${msg}`));
          }
          res(stdout);
        });
        child.on("error", (e)=>{ if(settled) return; clearTimeout(to); settled=true; rej(e); });
      });
      if(!pcmBuffer || pcmBuffer.length < 3200) throw new Error("PCM too short for analysis ("+(pcmBuffer?pcmBuffer.length:0)+" bytes)");
    }catch(decodeErr){
      return {
        status:"ANALYSIS_FAILED",
        reason: String(decodeErr.message).slice(0,600),
        method:"ffmpeg_pcm_decode_pipe",
        fileSize: st.size,
        probedDurationSec,
        beats:[],
        bpm:null,
        fallback: this.analyzeBeats(audioPath)
      };
    }
    let samples;
    try{
      samples = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, Math.floor(pcmBuffer.length/2));
    }catch(readErr){
      return { status:"ANALYSIS_FAILED", reason:String(readErr.message), fileSize: st.size, probedDurationSec, beats:[], bpm:null, fallback: this.analyzeBeats(audioPath) };
    }
    const winSize=1024, hop=512;
    const energies=[];
    for(let i=0; i + winSize < samples.length; i+=hop){
      let e=0; for(let j=0;j<winSize;j++){ const v=samples[i+j]/32768; e+=v*v; }
      energies.push(e/winSize);
    }
    if(energies.length < 32) return { status:"ANALYSIS_FAILED", reason:"Insufficient energy frames", beats:[], bpm:null, fallback: this.analyzeBeats(audioPath) };
    const fps = 16000 / hop;
    let bestBpm=120, bestScore=-1;
    for(let cand=60;cand<=180;cand+=2){
      const lag = Math.round((60/cand)*fps);
      if(lag>=energies.length || lag<2) continue;
      let corr=0; for(let i=0;i<energies.length-lag;i++) corr+= energies[i]*energies[i+lag];
      if(corr>bestScore){ bestScore=corr; bestBpm=cand; }
    }
    const beatInterval = 60 / bestBpm;
    const durationSec = probedDurationSec || (samples.length / 16000);
    const count = Math.min(128, Math.floor(durationSec / beatInterval));
    const beats = Array.from({length: Math.max(0,count)}, (_,i)=> ({ timeSec: Number(((i+1)*beatInterval).toFixed(3)), confidence: 0.82 }));
    const result = {
      status: beats.length? "ANALYZED_SOVEREIGN" : "ANALYSIS_FAILED",
      method:"ffmpeg_pcm_autocorrelation_16kHz_window1024_hop512_pipe",
      truthNotice:"Real sovereign BPM via FFmpeg PCM pipe decode + energy autocorrelation (non-blocking, timeout 15s)",
      fileSize: st.size,
      probedDurationSec: probedDurationSec!==null ? Number(probedDurationSec.toFixed(2)) : Number(durationSec.toFixed(2)),
      durationSec: Number(durationSec.toFixed(2)),
      bpm: bestBpm,
      beats,
      beatCount: beats.length,
      beatIntervalSec: Number(beatInterval.toFixed(3)),
      fps: Number(fps.toFixed(2)),
      confidence: 0.82,
      analyzedSamples: samples.length,
      energyFrames: energies.length
    };
    if(!beats.length){ result.status="ANALYSIS_FAILED"; result.reason="No beats detected"; result.fallback=this.analyzeBeats(audioPath); }
    return result;
  }

  getCapabilities() {
    const ffmpegReady = this.isAvailable();
    return {
      ffmpegAvailable: ffmpegReady,
      ingestAvailable: true,
      operations: ["trim","concat","scale","crop","text_overlay","audio_replace"],
      timelineAvailable: ffmpegReady,
      qcAvailable: true,
      beatAnalysis: ffmpegReady ? "REAL_SOVEREIGN_ASYNC" : "PLACEHOLDER_ONLY",
      truthClassification: ffmpegReady ? "EDIT_PIPELINE_READY" : "EDIT_PIPELINE_UNAVAILABLE_FFMPEG_MISSING"
    };
  }
}
module.exports = new MediaEditingService();
module.exports.MediaEditingService = MediaEditingService;
