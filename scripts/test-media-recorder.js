const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function testMediaRecorder() {
  console.log("Testing Chromium MediaRecorder on Canvas...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 720, height: 1280 });

  const webmBase64 = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 1280;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });
    const chunks = [];

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    const recordPromise = new Promise(resolve => {
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(blob);
      };
    });

    recorder.start();

    // Draw 30 frames (1 second)
    for (let f = 0; f < 30; f++) {
      ctx.fillStyle = f % 2 === 0 ? "#030712" : "#0f172a";
      ctx.fillRect(0, 0, 720, 1280);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 40px sans-serif";
      ctx.fillText("FRAME " + f, 100, 600);
      await new Promise(r => setTimeout(r, 33));
    }

    recorder.stop();
    return recordPromise;
  });

  await browser.close();
  const buffer = Buffer.from(webmBase64, "base64");
  const testPath = path.join(__dirname, "test_record.webm");
  fs.writeFileSync(testPath, buffer);
  console.log("Recorded test WebM:", buffer.length, "bytes at", testPath);
  if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
}

testMediaRecorder().catch(console.error);
