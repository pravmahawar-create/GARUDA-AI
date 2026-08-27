const path = require("path");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

let pipelinePromise = null;
const MODEL = process.env.GARUDA_STT_MODEL || "Xenova/whisper-base";
const CACHE_DIR = path.join(__dirname, "..", "..", "models", "stt");

function getPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { env, pipeline } = await import("@huggingface/transformers");
      env.cacheDir = CACHE_DIR;
      env.allowRemoteModels = true;
      return pipeline("automatic-speech-recognition", MODEL);
    })();
  }
  return pipelinePromise;
}

function runFfmpeg(inputBuffer) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ["-y", "-i", "pipe:0", "-ar", "16000", "-ac", "1", "-f", "wav", "pipe:1"], { stdio: ["pipe", "pipe", "pipe"] });
    const out = [];
    const err = [];
    proc.stdout.on("data", (c) => out.push(c));
    proc.stderr.on("data", (c) => err.push(c));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(out));
      else reject(new Error("ffmpeg error: " + Buffer.concat(err).toString().slice(0, 300)));
    });
    proc.stdin.on("error", () => {});
    proc.stdin.end(inputBuffer);
  });
}

function wavToFloat32(buf) {
  let p = 12;
  let dataStart = -1;
  let dataLen = 0;
  while (p + 8 <= buf.length) {
    const id = buf.toString("ascii", p, p + 4);
    const sz = buf.readUInt32LE(p + 4);
    if (id === "data") {
      dataStart = p + 8;
      dataLen = sz;
      break;
    }
    p += 8 + sz + (sz % 2);
  }
  if (dataStart === -1) throw new Error("wav: no data chunk");
  const n = Math.floor(Math.min(dataLen, buf.length - dataStart) / 2);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = buf.readInt16LE(dataStart + i * 2) / 32768;
  return out;
}

async function transcribeAudio(inputBuffer) {
  const wav = await runFfmpeg(inputBuffer);
  const audio = wavToFloat32(wav);
  const transcriber = await getPipeline();
  const output = await transcriber(audio, { language: "hi", task: "transcribe", chunk_length_s: 30, stride_length_s: 5 });
  return String((output && output.text) || "").trim();
}

module.exports = { transcribeAudio, MODEL };