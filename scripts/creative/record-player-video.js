const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'output', 'creative-video');
const playerPath = path.join(OUTPUT_DIR, 'garuda_devin_vs_sovereign_player.html');
const videoOutputPath = path.join(OUTPUT_DIR, 'garuda_devin_vs_sovereign_showcase.webm');

async function recordVideo() {
  console.log('🎬 Recording high-FPS WebM video from showcase player...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1200,675']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 675 });
  await page.goto(`file://${playerPath.replace(/\\/g, '/')}`, { waitUntil: 'load' });

  // Use HTML5 MediaRecorder inside the browser to record the DOM / canvas at 60 FPS
  const videoBase64 = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const stream = document.getElementById('screen').captureStream ? document.getElementById('screen').captureStream(30) : null;
      // If element captureStream is not directly on div, we draw images onto a canvas and record that canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 675;
      const ctx = canvas.getContext('2d');
      document.body.appendChild(canvas);
      canvas.style.display = 'none';

      const imgs = Array.from(document.querySelectorAll('#screen img'));
      let frameIndex = 0;
      let sceneTime = 0;

      const canvasStream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm; codecs=vp9' });
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();

      const totalDurationSec = 14; // 3.5s per scene * 4 scenes = 14s
      const fps = 30;
      const totalFrames = totalDurationSec * fps;
      let currentFrame = 0;

      function renderLoop() {
        if (currentFrame >= totalFrames) {
          mediaRecorder.stop();
          return;
        }

        const sceneIdx = Math.floor(currentFrame / (fps * 3.5)) % imgs.length;
        const currentImg = imgs[sceneIdx];

        ctx.drawImage(currentImg, 0, 0, 1200, 675);

        // Add sleek dynamic scanning laser line
        const scanY = (currentFrame * 8) % 675;
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(1200, scanY);
        ctx.stroke();

        currentFrame++;
        requestAnimationFrame(renderLoop);
      }

      renderLoop();
    });
  });

  await browser.close();

  if (videoBase64) {
    fs.writeFileSync(videoOutputPath, Buffer.from(videoBase64, 'base64'));
    const stats = fs.statSync(videoOutputPath);
    console.log(`✅ WebM Video successfully exported: ${videoOutputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.warn('⚠️ MediaRecorder did not return video buffer');
  }
}

recordVideo().catch(console.error);
