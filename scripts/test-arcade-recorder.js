const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const FFMPEG = path.join(__dirname, "..", "node_modules", "ffmpeg-static", "ffmpeg.exe");
const OUT_CLIP = path.join(__dirname, "..", "output", "shorts", "arcade_test_clip.mp4");

async function recordArcade() {
  console.log("🎮 Launching Puppeteer for Live Sovereign Defense Arcade recording...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  // 1080x1920 (Vertical 9:16)
  await page.setViewport({ width: 1080, height: 1920 });

  await page.goto("http://127.0.0.1:5173/play", { waitUntil: "networkidle0" });
  console.log("✔ Page loaded:", await page.title());

  await page.waitForSelector("canvas");

  const canvasEl = await page.$("canvas");
  const box = await canvasEl.boundingBox();
  console.log("Canvas box:", box);

  if (box) {
    // Place Turret 1 (Pawan Lightning)
    await page.mouse.click(box.x + 350, box.y + 250);
    await new Promise(r => setTimeout(r, 300));
    await page.mouse.click(box.x + 450, box.y + 350);
    await new Promise(r => setTimeout(r, 300));
    await page.mouse.click(box.x + 650, box.y + 250);
  }

  // Find and click START WAVE button
  const buttons = await page.$$("button");
  for (const b of buttons) {
    const txt = await page.evaluate(el => el.textContent, b);
    if (txt && txt.includes("START WAVE")) {
      console.log("▶ Clicking START WAVE button...");
      await b.click();
      break;
    }
  }

  // Setup ffmpeg process
  const ffmpegProc = spawn(FFMPEG, [
    "-y",
    "-f", "image2pipe",
    "-vcodec", "mjpeg",
    "-r", "30",
    "-i", "-",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-pix_fmt", "yuv420p",
    "-vf", "setsar=1",
    "-movflags", "+faststart",
    OUT_CLIP
  ]);

  const client = await page.target().createCDPSession();
  await client.send("Page.startScreencast", { format: "jpeg", quality: 85, everyNthFrame: 1 });

  let frames = 0;
  client.on("Page.screencastFrame", async ({ data, sessionId }) => {
    frames++;
    const buffer = Buffer.from(data, "base64");
    if (ffmpegProc.stdin.writable) {
      ffmpegProc.stdin.write(buffer);
    }
    await client.send("Page.screencastFrameAck", { sessionId });
  });

  console.log("🎬 Recording live 30 FPS battle action for 7 seconds...");
  await new Promise(r => setTimeout(r, 7000));

  await client.send("Page.stopScreencast");
  ffmpegProc.stdin.end();

  await new Promise((resolve) => ffmpegProc.on("close", resolve));
  await browser.close();

  console.log(`✔ Finished recording! Total frames: ${frames}. Saved: ${OUT_CLIP}`);
}

recordArcade().catch(console.error);
