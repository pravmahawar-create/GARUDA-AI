const fs = require("fs");
const path = require("path");

let sharp = null;
try {
  sharp = require("sharp");
} catch (e) {
  // sharp is optional in serverless/CI environments
}

const REPO_ROOT = path.resolve(__dirname, "..");
const SOURCE_IMAGE = path.join(REPO_ROOT, "frontend", "public", "assets", "icons", "garuda-sigil.png");
const PUBLIC_DIR = path.join(REPO_ROOT, "frontend", "public");
const DIST_DIR = path.join(REPO_ROOT, "frontend", "dist");

function copyPrebuiltAssets() {
  console.log("ℹ Copying pre-built favicons from frontend/public to frontend/dist...");
  if (fs.existsSync(DIST_DIR) && fs.existsSync(PUBLIC_DIR)) {
    const filesToCopy = [
      "favicon.ico", "favicon-512x512.png", "favicon-192x192.png",
      "apple-touch-icon.png", "favicon-64x64.png", "favicon-48x48.png",
      "favicon-32x32.png", "favicon-24x24.png", "favicon-16x16.png",
      "site.webmanifest"
    ];
    for (const file of filesToCopy) {
      const src = path.join(PUBLIC_DIR, file);
      const dst = path.join(DIST_DIR, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
      }
    }

    const subdirs = [
      path.join("favicon", "garuda-sigil-icon.svg"),
      path.join("assets", "icons", "garuda-sigil-icon.svg"),
      path.join("assets", "splash", "garuda-sigil-splash.svg")
    ];
    for (const sub of subdirs) {
      const src = path.join(PUBLIC_DIR, sub);
      const dst = path.join(DIST_DIR, sub);
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dst), { recursive: true });
        fs.copyFileSync(src, dst);
      }
    }
  }
  console.log("✔ Copied pre-built favicon suite to frontend/dist.");
}

function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // count

  const dirEntries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((p) => p.buffer)]);
}

async function generateFavicons() {
  console.log("=== GENERATING AUTHENTIC GARUDA GOLDEN EAGLE FAVICONS (TINY-SCALE OPTIMIZED) ===");

  if (!sharp || !fs.existsSync(SOURCE_IMAGE)) {
    copyPrebuiltAssets();
    return;
  }

  try {
    // 1. Extract Master Full Sigil from top center (x: 345, y: 155, w: 846, h: 672)
    const masterCrop = await sharp(SOURCE_IMAGE)
      .extract({ left: 345, top: 155, width: 846, height: 672 })
      .toBuffer();

    // 512x512 Master on #04060a obsidian black
    const p512 = await sharp({
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
            .sharpen({ sigma: 1.2 })
            .toBuffer(),
          gravity: "center"
        }
      ])
      .png()
      .toBuffer();

    const p192 = await sharp(p512).resize(192, 192, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();
    const p180 = await sharp(p512).resize(180, 180, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();

    // 2. Extract Maximized High-Impact Eagle Crest (x: 450, y: 190, w: 636, h: 570) for Tiny-Scale Recognizability
    const crestCrop = await sharp(SOURCE_IMAGE)
      .extract({ left: 450, top: 190, width: 636, height: 570 })
      .toBuffer();

    const tinyMaster = await sharp({
      create: {
        width: 256,
        height: 256,
        channels: 4,
        background: { r: 4, g: 6, b: 10, alpha: 1 }
      }
    })
      .composite([
        {
          input: await sharp(crestCrop)
            .resize(244, 218, { fit: "cover" })
            .modulate({ brightness: 1.35, saturation: 1.45 })
            .linear(1.3, -20)
            .sharpen({ sigma: 2.2, m1: 1.5, m2: 3.0 })
            .toBuffer(),
          gravity: "center"
        }
      ])
      .png()
      .toBuffer();

    const p64 = await sharp(tinyMaster).resize(64, 64, { kernel: sharp.kernel.lanczos3 }).sharpen({ sigma: 1.0 }).png().toBuffer();
    const p48 = await sharp(tinyMaster).resize(48, 48, { kernel: sharp.kernel.lanczos3 }).sharpen({ sigma: 1.1 }).png().toBuffer();
    const p32 = await sharp(tinyMaster).resize(32, 32, { kernel: sharp.kernel.lanczos3 }).sharpen({ sigma: 1.3 }).png().toBuffer();
    const p24 = await sharp(tinyMaster).resize(24, 24, { kernel: sharp.kernel.lanczos3 }).sharpen({ sigma: 1.4 }).png().toBuffer();
    const p16 = await sharp(tinyMaster).resize(16, 16, { kernel: sharp.kernel.lanczos3 }).sharpen({ sigma: 1.5 }).png().toBuffer();

    const icoBuffer = createIco([
      { width: 48, height: 48, buffer: p48 },
      { width: 32, height: 32, buffer: p32 },
      { width: 24, height: 24, buffer: p24 },
      { width: 16, height: 16, buffer: p16 }
    ]);

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <rect width="100" height="100" fill="#04060a" rx="20"/>
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff5c0" />
      <stop offset="30%" stop-color="#ffd700" />
      <stop offset="70%" stop-color="#d4af37" />
      <stop offset="100%" stop-color="#8a6d1c" />
    </linearGradient>
    <filter id="sigilGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <g filter="url(#sigilGlow)">
    <polygon points="50,14 62,38 78,42 66,54 70,72 50,60 30,72 34,54 22,42 38,38" fill="url(#goldGrad)" />
    <path d="M 50 20 L 76 34 L 88 56 L 76 60 L 64 48 L 50 64 L 36 48 L 24 60 L 12 56 L 24 34 Z" fill="url(#goldGrad)" opacity="0.9" />
    <polygon points="50,22 56,36 50,48 44,36" fill="#ffffff" opacity="0.95" />
    <circle cx="50" cy="34" r="3.5" fill="#04060a" />
    <circle cx="50" cy="34" r="1.8" fill="#ffd700" />
    <polygon points="50,56 60,78 50,72 40,78" fill="url(#goldGrad)" />
    <polygon points="50,68 55,88 50,83 45,88" fill="url(#goldGrad)" opacity="0.8" />
  </g>
</svg>`;

    const webManifest = {
      name: "GARUDA AI Operating System",
      short_name: "GARUDA",
      description: "Autonomous AI Operating System delivering custom enterprise software, SaaS MVPs, and multi-agent workflows.",
      icons: [
        { src: "/favicon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "/favicon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
      ],
      theme_color: "#04060a",
      background_color: "#04060a",
      display: "standalone",
      start_url: "/"
    };

    const targets = [{ dest: PUBLIC_DIR, isPublic: true }];
    if (fs.existsSync(DIST_DIR)) {
      targets.push({ dest: DIST_DIR, isPublic: false });
    }

    for (const t of targets) {
      fs.mkdirSync(path.join(t.dest, "favicon"), { recursive: true });
      fs.mkdirSync(path.join(t.dest, "assets", "icons"), { recursive: true });
      fs.mkdirSync(path.join(t.dest, "assets", "splash"), { recursive: true });

      fs.writeFileSync(path.join(t.dest, "favicon.ico"), icoBuffer);
      fs.writeFileSync(path.join(t.dest, "favicon-512x512.png"), p512);
      fs.writeFileSync(path.join(t.dest, "favicon-192x192.png"), p192);
      fs.writeFileSync(path.join(t.dest, "apple-touch-icon.png"), p180);
      fs.writeFileSync(path.join(t.dest, "favicon-64x64.png"), p64);
      fs.writeFileSync(path.join(t.dest, "favicon-48x48.png"), p48);
      fs.writeFileSync(path.join(t.dest, "favicon-32x32.png"), p32);
      fs.writeFileSync(path.join(t.dest, "favicon-24x24.png"), p24);
      fs.writeFileSync(path.join(t.dest, "favicon-16x16.png"), p16);

      fs.writeFileSync(path.join(t.dest, "favicon", "garuda-sigil-icon.svg"), svgContent, "utf8");
      fs.writeFileSync(path.join(t.dest, "assets", "icons", "garuda-sigil-icon.svg"), svgContent, "utf8");
      fs.writeFileSync(path.join(t.dest, "assets", "splash", "garuda-sigil-splash.svg"), svgContent, "utf8");

      fs.writeFileSync(path.join(t.dest, "site.webmanifest"), JSON.stringify(webManifest, null, 2), "utf8");

      console.log(`✔ Generated tiny-scale optimized favicon suite in ${path.relative(REPO_ROOT, t.dest)}`);
    }

    console.log("🎉 Tiny-scale optimized GARUDA favicon assets generated successfully!");
  } catch (err) {
    console.warn("⚠️ Warning: Dynamic favicon generation failed with sharp. Falling back to pre-built assets:", err.message);
    copyPrebuiltAssets();
  }
}

if (require.main === module) {
  generateFavicons()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.warn("Favicon script top-level catch (safe fallback):", err.message);
      copyPrebuiltAssets();
      process.exit(0);
    });
}

module.exports = { generateFavicons };
