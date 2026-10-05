const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function testCanvasMediaRecorder() {
  console.log("Testing requestAnimationFrame + MediaRecorder in Chromium...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 720, height: 1280 });

  const webmBase64 = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 1280;
      document.body.appendChild(canvas);
      const ctx = canvas.getContext("2d");

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
      const chunks = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(blob);
      };

      recorder.start();

      let startTime = performance.now();
      const durationMs = 2000; // 2 seconds test

      function loop(now) {
        const elapsed = now - startTime;
        ctx.fillStyle = "#030712";
        ctx.fillRect(0, 0, 720, 1280);

        // Draw animated ball
        const x = 360 + Math.sin(elapsed / 200) * 150;
        const y = 640 + Math.cos(elapsed / 200) * 150;
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "bold 30px sans-serif";
        ctx.fillText("Time: " + (elapsed / 1000).toFixed(2) + "s", 100, 200);

        if (elapsed < durationMs) {
          requestAnimationFrame(loop);
        } else {
          recorder.stop();
        }
      }

      requestAnimationFrame(loop);
    });
  });

  await browser.close();
  const buffer = Buffer.from(webmBase64, "base64");
  const testPath = path.join(__dirname, "test_live_motion.webm");
  fs.writeFileSync(testPath, buffer);
  console.log("SUCCESS! Captured Live WebM size:", buffer.length, "bytes at", testPath);
  if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
}

testCanvasMediaRecorder().catch(console.error);
