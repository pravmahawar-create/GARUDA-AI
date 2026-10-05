const puppeteer = require("puppeteer");
const path = require("path");

const POSTER_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Manrope:wght@500;700;800&family=JetBrains+Mono:wght@600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:675px;overflow:hidden;position:relative;background:#04050c;color:#e8ecff;font-family:Manrope,sans-serif}
  .glow{position:absolute;inset:0;background:
    radial-gradient(ellipse 60% 50% at 75% 20%,rgba(255,138,0,.18),transparent 60%),
    radial-gradient(ellipse 50% 45% at 15% 85%,rgba(77,227,255,.12),transparent 60%),
    radial-gradient(ellipse 40% 40% at 90% 90%,rgba(139,123,255,.12),transparent 60%)}
  .grid{position:absolute;inset:0;opacity:.4;background-image:linear-gradient(rgba(120,160,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(120,160,255,.07) 1px,transparent 1px);background-size:60px 60px;
    -webkit-mask-image:radial-gradient(ellipse 90% 80% at 50% 45%,#000 40%,transparent 90%)}
  .wrap{position:relative;z-index:5;padding:54px 64px;height:100%;display:flex;flex-direction:column;justify-content:space-between}
  .top{display:flex;justify-content:space-between;align-items:center}
  .badge{font-family:'JetBrains Mono',monospace;font-size:15px;letter-spacing:.35em;color:#4de3ff;border:1px solid rgba(77,227,255,.35);padding:10px 20px;border-radius:999px;background:rgba(77,227,255,.07)}
  .brand{display:flex;align-items:center;gap:16px}
  .brand img{width:64px;height:64px;filter:drop-shadow(0 0 16px rgba(255,179,71,.6))}
  .brand .bn{font-family:'JetBrains Mono',monospace;font-size:15px;letter-spacing:.3em;color:#8a93b8}
  h1{font-family:'Playfair Display',serif;font-size:96px;line-height:1.02;letter-spacing:.02em;
    background:linear-gradient(115deg,#fff 12%,#ffb347 48%,#ff8a00 75%,#fff 96%);background-size:200% auto;
    -webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 6px 40px rgba(255,179,71,.28))}
  .sub{font-family:'Playfair Display',serif;font-style:italic;font-size:34px;color:#cfd6f5;margin-top:14px;opacity:.92}
  .stats{display:flex;gap:18px}
  .st{flex:1;background:rgba(12,16,34,.75);border:1px solid rgba(120,160,255,.18);border-radius:18px;padding:22px 26px;backdrop-filter:blur(6px)}
  .st .n{font-family:'JetBrains Mono',monospace;font-size:44px;font-weight:600;color:#ffb347}
  .st .l{font-size:15px;color:#8a93b8;letter-spacing:.08em;margin-top:6px}
  .bot{display:flex;justify-content:space-between;align-items:flex-end}
  .url{font-family:'JetBrains Mono',monospace;font-size:24px;color:#4de3ff;letter-spacing:.12em}
  .tag{font-size:17px;color:#8a93b8}
  .wing{position:absolute;right:-40px;top:120px;width:520px;opacity:.16;filter:saturate(1.3)}
</style></head><body>
  <div class="glow"></div><div class="grid"></div>
  <img class="wing" src="https://www.garudaos.in/favicon-512x512.png" onerror="this.style.display='none'"/>
  <div class="wrap">
    <div class="top">
      <div class="badge">SOVEREIGN · LIVE NOW</div>
      <div class="brand"><span class="bn">INDIA'S SOVEREIGN AI OPERATING SYSTEM</span></div>
    </div>
    <div>
      <h1>1000 AGENTS.<br>ONE WILL.</h1>
      <div class="sub">The 6-month delivery era just ended.</div>
    </div>
    <div class="stats">
      <div class="st"><div class="n">48 HRS</div><div class="l">FULL-STACK DELIVERY</div></div>
      <div class="st"><div class="n">24×7</div><div class="l">AUTONOMOUS EXECUTION</div></div>
      <div class="st"><div class="n">SHA-256</div><div class="l">EVERY CLAIM PROVEN</div></div>
      <div class="st"><div class="n">ZERO</div><div class="l">MANUAL BOTTLENECKS</div></div>
    </div>
    <div class="bot">
      <div class="url">👉 garudaos.in</div>
      <div class="tag">GARUDA OS · Build on sovereign infrastructure.</div>
    </div>
  </div>
</body></html>`;

(async () => {
  const out = path.resolve(__dirname, "../output/garuda_poster.png");
  const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 1200, height: 675 });
  await pg.setContent(POSTER_HTML, { waitUntil: "networkidle0", timeout: 45000 }).catch(() => pg.setContent(POSTER_HTML, { waitUntil: "load" }));
  await new Promise((r) => setTimeout(r, 2500));
  await pg.screenshot({ path: out });
  await b.close();
  console.log("POSTER_SAVED:", out);
})().catch((e) => { console.error("ERR", e.message); process.exit(1); });
