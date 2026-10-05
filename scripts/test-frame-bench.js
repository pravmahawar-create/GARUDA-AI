const puppeteer = require("puppeteer");

async function benchmark() {
  console.log("Testing frame rendering benchmark...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 720, height: 1280 }); // test at 720x1280

  await page.setContent(`
    <canvas id="c" width="720" height="1280" style="background:#030712;"></canvas>
    <script>
      const c = document.getElementById('c');
      const ctx = c.getContext('2d');
      window.drawFrame = function(f) {
        ctx.fillStyle = '#030712';
        ctx.fillRect(0,0,720,1280);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('FRAME ' + f, 50, 100 + f * 5);
        ctx.beginPath();
        ctx.arc(360, 640, 50 + Math.sin(f*0.1)*20, 0, Math.PI*2);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 4;
        ctx.stroke();
      };
    </script>
  `);

  const t0 = Date.now();
  for (let i = 0; i < 30; i++) {
    await page.evaluate((frame) => window.drawFrame(frame), i);
    await page.screenshot({ type: "jpeg", quality: 75 });
  }
  const elapsed = Date.now() - t0;
  console.log(`30 frames took ${elapsed}ms (${(elapsed/30).toFixed(1)}ms per frame)`);
  await browser.close();
}

benchmark().catch(console.error);
