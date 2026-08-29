const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const REPO_ROOT = path.resolve(__dirname, "..");
const SOURCE_IMAGE = path.join(REPO_ROOT, "frontend", "public", "assets", "icons", "garuda-sigil.png");
const SCRATCH_DIR = path.join(REPO_ROOT, "scratch");
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

async function buildTestMarks() {
  console.log("=== BUILDING OPTIMIZED GARUDA FAVICON CANDIDATES ===");

  // 1. Mark V1: Extract the Ultra-High-Res Master Sigil (Top Center: x: 345, y: 155, w: 846, h: 672)
  const masterCrop = await sharp(SOURCE_IMAGE)
    .extract({ left: 345, top: 155, width: 846, height: 672 })
    .toBuffer();

  const v1Master = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 4, g: 6, b: 10, alpha: 1 }
    }
  })
    .composite([
      {
        input: await sharp(masterCrop)
          .resize(470, 374, { fit: "contain" })
          .modulate({ brightness: 1.15, saturation: 1.25 })
          .sharpen({ sigma: 1.5, m1: 1.5, m2: 0.5 })
          .toBuffer(),
        gravity: "center"
      }
    ])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(SCRATCH_DIR, "v1_master_512.png"), v1Master);

  // 2. Mark V2: Zoomed-In High-Impact Eagle Crest (Head & Wing Chevron - maximized for 16px silhouette)
  const headChestCrop = await sharp(SOURCE_IMAGE)
    .extract({ left: 450, top: 190, width: 636, height: 570 })
    .toBuffer();

  const v2Master = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 4, g: 6, b: 10, alpha: 1 }
    }
  })
    .composite([
      {
        input: await sharp(headChestCrop)
          .resize(460, 412, { fit: "contain" })
          .modulate({ brightness: 1.2, saturation: 1.3 })
          .sharpen({ sigma: 2.0 })
          .toBuffer(),
        gravity: "center"
      }
    ])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(SCRATCH_DIR, "v2_zoomed_512.png"), v2Master);

  // 3. Mark V3: Pure Iconic Geometric GARUDA Eagle Vector (faithfully matching the authentic sigil)
  const svgV3 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="100" fill="#04060a"/>
  <!-- Gold Ambient Ring -->
  <circle cx="256" cy="245" r="190" fill="none" stroke="#b8860b" stroke-width="4" opacity="0.3"/>
  <defs>
    <linearGradient id="goldAuthentic" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff8bc"/>
      <stop offset="25%" stop-color="#f5d76e"/>
      <stop offset="60%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#aa820a"/>
    </linearGradient>
    <linearGradient id="goldLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f5d76e"/>
    </linearGradient>
  </defs>
  
  <g fill="url(#goldAuthentic)" stroke="#04060a" stroke-width="3" stroke-linejoin="round">
    <!-- Swept Wing Left 1 (Top) -->
    <path d="M 235 200 C 170 120 130 80 115 65 C 120 115 135 175 220 225 Z"/>
    <!-- Swept Wing Right 1 (Top) -->
    <path d="M 277 200 C 342 120 382 80 397 65 C 392 115 377 175 292 225 Z"/>

    <!-- Wing Feather Left 2 -->
    <path d="M 215 228 C 150 170 120 140 105 130 C 115 175 130 220 200 252 Z"/>
    <!-- Wing Feather Right 2 -->
    <path d="M 297 228 C 362 170 392 140 407 130 C 397 175 382 220 312 252 Z"/>

    <!-- Wing Feather Left 3 -->
    <path d="M 200 255 C 145 210 125 190 110 185 C 122 225 140 260 195 280 Z"/>
    <!-- Wing Feather Right 3 -->
    <path d="M 312 255 C 367 210 387 190 402 185 C 390 225 372 260 317 280 Z"/>

    <!-- Central Diamond Chevron Shield -->
    <polygon points="256,155 305,245 256,335 207,245" fill="url(#goldAuthentic)"/>
    <polygon points="256,190 285,245 256,300 227,245" fill="#04060a"/>
    <polygon points="256,215 270,245 256,275 242,245" fill="url(#goldAuthentic)"/>

    <!-- Lower Chevron Arrow Point -->
    <path d="M 256 345 L 290 295 L 305 310 L 256 385 L 207 310 L 222 295 Z"/>
    <!-- Bottom Tail Stinger -->
    <polygon points="256,395 272,440 256,470 240,440"/>

    <!-- The Majestic Eagle Head Facing Forward-Right with Sharp Beak -->
    <!-- Head Crest Feathers -->
    <path d="M 256 95 L 270 135 L 256 125 L 242 135 Z"/>
    <path d="M 256 100 C 275 105 295 120 295 140 C 295 155 285 168 270 172 L 275 160 C 290 155 285 135 268 128 Z"/>
    <!-- Curved Predatory Beak -->
    <path d="M 268 140 C 290 142 312 152 318 165 C 318 175 305 182 290 180 C 285 178 280 172 278 168 L 285 165 C 292 168 302 166 304 162 C 298 155 282 150 268 148 Z" fill="url(#goldLight)"/>
  </g>
</svg>`;

  const v3Master = await sharp(Buffer.from(svgV3)).png().toBuffer();
  fs.writeFileSync(path.join(SCRATCH_DIR, "v3_vector_512.png"), v3Master);

  // Render tiny size previews for V1, V2, V3
  const candidates = [
    { name: "v1_master", buffer: v1Master },
    { name: "v2_zoomed", buffer: v2Master },
    { name: "v3_vector", buffer: v3Master }
  ];

  for (const c of candidates) {
    for (const size of [48, 32, 24, 16]) {
      const resized = await sharp(c.buffer)
        .resize(size, size, { kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();
      fs.writeFileSync(path.join(SCRATCH_DIR, `${c.name}_${size}.png`), resized);
    }
  }

  // Create a composite preview side-by-side card showing 16, 24, 32, 48 for all 3
  console.log("✔ Generated V1, V2, V3 candidates across 512, 48, 32, 24, 16 px!");
}

buildTestMarks().catch(console.error);
