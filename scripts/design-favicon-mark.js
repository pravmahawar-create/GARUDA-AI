const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ARTIFACTS_DIR = path.resolve(__dirname, "../scratch");
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

// SVG Candidate 1: Bold Sovereign Eagle Crest (Symmetrical, aerodynamic wings, sharp predatory crown & beak, high-contrast gold on obsidian black)
const svgCrestA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="96" fill="#05070b"/>
  <rect x="16" y="16" width="480" height="480" rx="80" fill="none" stroke="#b8860b" stroke-width="8" opacity="0.4"/>
  <!-- Central Majestic Eagle Shield / Crest -->
  <path d="M256 64 L296 148 L380 120 L330 200 L440 210 L330 290 L400 380 L256 340 L112 380 L182 290 L72 210 L182 200 L132 120 L216 148 Z" fill="none"/>
  <!-- Authentic Simplified Garuda Falcon Geometry -->
  <g fill="url(#goldGrad)" stroke="#fef08a" stroke-width="4">
    <!-- Crown / Head -->
    <path d="M256 72 L278 128 L318 108 L288 164 L256 148 L224 164 L194 108 L234 128 Z"/>
    <!-- Central Fierce Beak & Core Chest -->
    <path d="M256 168 L288 232 L256 288 L224 232 Z"/>
    <path d="M256 248 L272 296 L256 344 L240 296 Z"/>
    <!-- Swept Upper Wings -->
    <path d="M296 176 L440 188 L348 244 L308 236 Z"/>
    <path d="M216 176 L72 188 L164 244 L204 236 Z"/>
    <!-- Swept Mid Wings -->
    <path d="M312 252 L424 284 L328 320 L292 300 Z"/>
    <path d="M200 252 L88 284 L184 320 L220 300 Z"/>
    <!-- Lower Tail Feathers -->
    <path d="M256 360 L296 424 L256 448 L216 424 Z"/>
  </g>
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="40%" stop-color="#f5d76e"/>
      <stop offset="80%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#aa820a"/>
    </linearGradient>
  </defs>
</svg>`;

// SVG Candidate 2: Modern Geometric Falcon / Eagle Head Silhouette (Profile & Wing - extremely recognizable at 16x16, luxury aviation / tech aesthetic)
const svgCrestB = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#04060a"/>
  <rect x="20" y="20" width="472" height="472" rx="84" fill="none" stroke="#f5d76e" stroke-width="12" stroke-opacity="0.3"/>
  <defs>
    <linearGradient id="goldB" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff176"/>
      <stop offset="35%" stop-color="#f5d76e"/>
      <stop offset="70%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#996515"/>
    </linearGradient>
  </defs>
  <!-- Bold Swept Eagle Monogram / Sigil -->
  <g fill="url(#goldB)">
    <!-- Crown Crest -->
    <polygon points="256,60 300,135 256,115 212,135"/>
    <!-- Top Wing Blade Left & Right -->
    <polygon points="200,135 60,175 220,215 240,165"/>
    <polygon points="312,135 452,175 292,215 272,165"/>
    <!-- Mid Wing Blade Left & Right -->
    <polygon points="215,225 90,265 230,295 245,245"/>
    <polygon points="297,225 422,265 282,295 267,245"/>
    <!-- Core Diamond Body & Sharp Beak -->
    <polygon points="256,135 285,215 256,310 227,215"/>
    <!-- Lower Tail Blade -->
    <polygon points="256,325 300,410 256,450 212,410"/>
    <!-- Outer Flank Wings -->
    <polygon points="230,305 130,345 235,375 245,330"/>
    <polygon points="282,305 382,345 277,375 267,330"/>
  </g>
</svg>`;

// SVG Candidate 3: The Pure High-Visibility Sovereign Eagle (Thick, solid, monolithic gold geometry engineered specifically for 16px - 48px clarity)
const svgCrestC = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="104" fill="#030508"/>
  <rect x="24" y="24" width="464" height="464" rx="84" fill="none" stroke="#f5d76e" stroke-width="16" stroke-opacity="0.4"/>
  <defs>
    <linearGradient id="goldPure" x1="15%" y1="10%" x2="85%" y2="90%">
      <stop offset="0%" stop-color="#fff59d"/>
      <stop offset="25%" stop-color="#fdd835"/>
      <stop offset="60%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#a67c00"/>
    </linearGradient>
    <filter id="crispGlow">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>
  <!-- Monolithic Soaring Falcon Iconography -->
  <g fill="url(#goldPure)" filter="url(#crispGlow)">
    <!-- Crown -->
    <path d="M 256 68 L 292 136 L 256 122 L 220 136 Z"/>
    <!-- Upper Wing Span (Sweeping Power) -->
    <path d="M 228 144 L 54 184 L 216 232 L 244 176 Z"/>
    <path d="M 284 144 L 458 184 L 296 232 L 268 176 Z"/>
    <!-- Core Chest & Talon Beak -->
    <path d="M 256 138 L 282 220 L 256 316 L 230 220 Z"/>
    <!-- Mid Wings -->
    <path d="M 218 242 L 96 284 L 220 318 L 238 266 Z"/>
    <path d="M 294 242 L 416 284 L 292 318 L 274 266 Z"/>
    <!-- Tail Fin -->
    <path d="M 256 332 L 296 426 L 256 452 L 216 426 Z"/>
  </g>
</svg>`;

// SVG Candidate 4: Golden Sovereign Eagle Crest (Streamlined Emblem - bold, solid wing blades, powerful central eagle head with clear beak, 100% eagle, 0% star)
const svgCrestD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="108" fill="#020408"/>
  <rect x="20" y="20" width="472" height="472" rx="90" fill="none" stroke="#f5d76e" stroke-width="14" stroke-opacity="0.35"/>
  <defs>
    <linearGradient id="goldApex" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="20%" stop-color="#fff176"/>
      <stop offset="50%" stop-color="#f5d76e"/>
      <stop offset="85%" stop-color="#c59b27"/>
      <stop offset="100%" stop-color="#8c6d15"/>
    </linearGradient>
  </defs>
  <!-- Iconic Solid Geometric Eagle Form -->
  <g fill="url(#goldApex)">
    <!-- Eagle Crown / Head with Forward Focus -->
    <polygon points="256,56 290,126 256,110 222,126"/>
    <!-- Top Massive Wings -->
    <polygon points="228,136 48,172 216,220 244,166"/>
    <polygon points="284,136 464,172 296,220 268,166"/>
    <!-- Secondary Lower Wing Feathers -->
    <polygon points="214,232 94,272 218,304 238,252"/>
    <polygon points="298,232 418,272 294,304 274,252"/>
    <!-- Central Powerful Diamond Torso -->
    <polygon points="256,130 286,218 256,330 226,218"/>
    <!-- Tail Feathers -->
    <polygon points="256,344 298,438 256,462 214,438"/>
  </g>
</svg>`;

async function renderTests() {
  const candidates = [
    { name: "cand_A", svg: svgCrestA },
    { name: "cand_B", svg: svgCrestB },
    { name: "cand_C", svg: svgCrestC },
    { name: "cand_D", svg: svgCrestD }
  ];

  const sizes = [512, 48, 32, 24, 16];

  for (const c of candidates) {
    const masterPng = await sharp(Buffer.from(c.svg)).png().toBuffer();
    fs.writeFileSync(path.join(ARTIFACTS_DIR, `${c.name}_512.png`), masterPng);

    for (const s of [48, 32, 24, 16]) {
      const resized = await sharp(masterPng)
        .resize(s, s, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();
      fs.writeFileSync(path.join(ARTIFACTS_DIR, `${c.name}_${s}.png`), resized);
    }
  }

  console.log("✔ Rendered all candidates across 512, 48, 32, 24, 16 px!");
}

renderTests().catch(console.error);
