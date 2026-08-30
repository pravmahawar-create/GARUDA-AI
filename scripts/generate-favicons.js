const fs = require("fs");
const path = require("path");

let sharp = null;
try {
  sharp = require("sharp");
} catch (e) {
  // sharp is optional in serverless/CI environments where pre-built assets exist
}

/**
 * GARUDA Favicon & Brand Icon Generator (Tiny-Size Optimized)
 * Generates ultra-crisp, multi-resolution, high-contrast favicon assets
 * from the authentic master GARUDA Golden Eagle Sigil.
 *
 * - High-res icons (512, 192, 180): Full majestic eagle wingspan & sigil.
 * - Tiny-scale icons (48, 32, 24, 16, ico): Maximized high-contrast eagle crest with razor-sharp silhouette.
 */

const REPO_ROOT = path.resolve(__dirname, "..");
const SOURCE_IMAGE = path.join(REPO_ROOT, "frontend", "public", "assets", "icons", "garuda-sigil.png");
const PUBLIC_DIR = path.join(REPO_ROOT, "frontend", "public");
const DIST_DIR = path.join(REPO_ROOT, "frontend", "dist");

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

  if (!sharp) {
    console.log("ℹ sharp not installed. Copying pre-built favicons from frontend/public to frontend/dist...");
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
    console.log("✔ Copied existing favicon suite to frontend/dist.");
    return;
  }

  if (!fs.existsSync(SOURCE_IMAGE)) {
    throw new Error(`Source image not found: ${SOURCE_IMAGE}`);
  }

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
          .resize(236, 212, { fit: "contain" })
          .modulate({ brightness: 1.22, saturation: 1.35 })
          .sharpen({ sigma: 1.8 })
          .toBuffer(),
        gravity: "center"
      }
    ])
    .png()
    .toBuffer();

  // Generate tiny PNGs with lanczos3 downsampling
  const p64 = await sharp(tinyMaster).resize(64, 64, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();
  const p48 = await sharp(tinyMaster).resize(48, 48, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();
  const p32 = await sharp(tinyMaster).resize(32, 32, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();
  const p24 = await sharp(tinyMaster).resize(24, 24, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();
  const p16 = await sharp(tinyMaster).resize(16, 16, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();

  // 3. Generate multi-resolution favicon.ico containing 16x16, 32x32, 48x48
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: p16 },
    { width: 32, height: 32, buffer: p32 },
    { width: 48, height: 48, buffer: p48 }
  ]);

  // 4. Generate SVG wrapping the high-res gold mark with zero loss
  const base64Png = p512.toString("base64");
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="64" fill="#04060a" stroke="#f5d76e" stroke-width="4" />
  <image href="data:image/png;base64,${base64Png}" width="512" height="512" />
</svg>`;

  // 5. Generate site.webmanifest
  const webManifest = {
    name: "GARUDA AI Operating System",
    short_name: "GARUDA AI",
    description: "Autonomous AI Operating System for governed business automation and software execution.",
    icons: [
      {
        src: "/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    theme_color: "#04060a",
    background_color: "#04060a",
    display: "standalone",
    start_url: "/"
  };

  // Write targets
  const targets = [
    { dest: PUBLIC_DIR, isPublic: true }
  ];
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
}

if (require.main === module) {
  generateFavicons().catch((err) => {
    console.error("Error generating favicons:", err);
    process.exit(1);
  });
}

module.exports = { generateFavicons };
