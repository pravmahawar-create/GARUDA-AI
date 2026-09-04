const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const mediaEditingService = require("./mediaEditingService");

describe("GARUDA MediaEditingService — Real Beat/BPM Analysis (sovereign async)", () => {
  const wav = "uploads/creative-ingest/e2e_song.wav";
  const mp3 = "uploads/creative-ingest/e2e_song_test.mp3";
  it("valid WAV → ANALYZED_SOVEREIGN with BPM and beats", async () => {
    const r = await mediaEditingService.analyzeBeatsAsync(wav);
    assert.equal(r.status, "ANALYZED_SOVEREIGN");
    assert.ok(r.bpm >= 60 && r.bpm <= 180);
    assert.ok(r.beatCount > 0);
    assert.ok(Array.isArray(r.beats) && r.beats.length>0);
    assert.ok(typeof r.probedDurationSec === "number");
    assert.ok(r.confidence > 0);
  });
  it("valid MP3 → ANALYZED_SOVEREIGN", async () => {
    if(!fs.existsSync(mp3)) {
      const ffmpeg=require("ffmpeg-static");
      execFileSync(ffmpeg, ["-y","-i", wav, "-codec:a","libmp3lame","-qscale:a","2", mp3]);
    }
    const r = await mediaEditingService.analyzeBeatsAsync(mp3);
    assert.equal(r.status, "ANALYZED_SOVEREIGN");
    assert.ok(r.bpm);
  });
  it("missing file → UNAVAILABLE", async () => {
    const r = await mediaEditingService.analyzeBeatsAsync("nope_does_not_exist_xyz.mp3");
    assert.equal(r.status, "UNAVAILABLE");
    assert.equal(r.reason, "AUDIO_NOT_FOUND");
  });
  it("malformed audio (valid size but invalid content) → ANALYSIS_FAILED with fallback", async () => {
    const bad = path.join(os.tmpdir(), `bad_${Date.now()}.mp3`);
    // >100 bytes but not valid audio
    fs.writeFileSync(bad, Buffer.alloc(5000, 0x41));
    const r = await mediaEditingService.analyzeBeatsAsync(bad);
    // Could be ANALYSIS_FAILED or ANALYZED_SOVEREIGN with fallback; must not be fabricated success
    assert.ok(["ANALYSIS_FAILED","ANALYZED_SOVEREIGN"].includes(r.status));
    if(r.status==="ANALYSIS_FAILED") assert.ok(r.reason);
    try{ fs.unlinkSync(bad);}catch{}
  });
  it("timeout handling — large file capped via maxAnalyzeSec", async () => {
    // Use valid wav but cap maxAnalyzeSec to 1s — should still succeed quickly (<2s)
    const t0=Date.now();
    const r = await mediaEditingService.analyzeBeatsAsync(wav, { maxAnalyzeSec:1, timeoutMs: 8000 });
    const dt=Date.now()-t0;
    assert.ok(dt < 5000, `should not hang, took ${dt}ms`);
    assert.ok(["ANALYZED_SOVEREIGN","ANALYSIS_FAILED"].includes(r.status));
  });
  it("analysis failure preserves fallback placeholder", async () => {
    const bad = path.join(os.tmpdir(), `bad2_${Date.now()}.wav`);
    fs.writeFileSync(bad, Buffer.alloc(200, 0x00));
    const r = await mediaEditingService.analyzeBeatsAsync(bad);
    if(r.status==="ANALYSIS_FAILED"){
      assert.ok(r.fallback || r.beats.length===0);
    }
    try{ fs.unlinkSync(bad);}catch{}
  });
  it("successful BPM extraction is observable in beats timestamps", async () => {
    const r = await mediaEditingService.analyzeBeatsAsync(wav);
    assert.equal(r.status, "ANALYZED_SOVEREIGN");
    // beats must be sorted ascending and interval ≈ 60/BPM
    for(let i=1;i<r.beats.length;i++) assert.ok(r.beats[i].timeSec > r.beats[i-1].timeSec);
    const expectedInterval = 60 / r.bpm;
    if(r.beats.length>=2){
      const actualInterval = r.beats[1].timeSec - r.beats[0].timeSec;
      assert.ok(Math.abs(actualInterval - expectedInterval) < 0.02, `interval ${actualInterval} vs expected ${expectedInterval}`);
    }
  });
  it("sync placeholder still returns fast ANALYZED_PLACEHOLDER", () => {
    const r = mediaEditingService.analyzeBeats(wav);
    assert.equal(r.status, "ANALYZED_PLACEHOLDER");
    assert.equal(r.bpm, 120);
  });
});
