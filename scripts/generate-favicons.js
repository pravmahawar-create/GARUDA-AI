const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

/**
 * GARUDA Favicon & Brand Icon Generator
 * Crops the authentic Golden Eagle Sigil from garuda-sigil.png and creates
 * high-contrast, multi-resolution, Google-compliant favicon and app icon assets.
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
  console.log("=== GENERATING AUTHENTIC GARUDA GOLDEN EAGLE FAVICONS ===");

  if (!fs.existsSync(SOURCE_IMAGE)) {
    throw new Error(`Source image not found: ${SOURCE_IMAGE}`);
  }

  // 1. Extract the crisp PRIMARY GOLD mark from garuda-sigil.png (left: 55, top: 924, width: 235, height: 216)
  const rawMark = await sharp(SOURCE_IMAGE)
    .extract({ left: 55, top: 924, width: 235, height: 216 })
    .toBuffer();

  // 2. Build 512x512 master on #05070b background
  const masterBuffer = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 5, g: 7, b: 11, alpha: 1 }
    }
  })
    .composite([
      {
        input: await sharp(rawMark)
          .resize(450, 414, { fit: "contain", background: { r: 5, g: 7, b: 11, alpha: 1 } })
          .toBuffer(),
        gravity: "center"
      }
    ])
    .png()
    .toBuffer();

  // 3. Generate PNG sizes
  const p512 = masterBuffer;
  const p192 = await sharp(masterBuffer).resize(192, 192).png().toBuffer();
  const p180 = await sharp(masterBuffer).resize(180, 180).png().toBuffer();
  const p64 = await sharp(masterBuffer).resize(64, 64).png().toBuffer();
  const p48 = await sharp(masterBuffer).resize(48, 48).png().toBuffer();
  const p32 = await sharp(masterBuffer).resize(32, 32).png().toBuffer();
  const p16 = await sharp(masterBuffer).resize(16, 16).png().toBuffer();

  // 4. Generate multi-resolution favicon.ico
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: p16 },
    { width: 32, height: 32, buffer: p32 },
    { width: 48, height: 48, buffer: p48 }
  ]);

  // 5. Generate SVG wrapping the high-res gold mark with zero loss
  const base64Png = p512.toString("base64");
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="64" fill="#05070b" stroke="#f5d76e" stroke-width="4" />
  <image href="data:image/png;base64,${base64Png}" width="512" height="512" />
</svg>`;

  // 6. Generate site.webmanifest
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
    theme_color: "#05070b",
    background_color: "#05070b",
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
    fs.writeFileSync(path.join(t.dest, "favicon-16x16.png"), p16);

    fs.writeFileSync(path.join(t.dest, "favicon", "garuda-sigil-icon.svg"), svgContent, "utf8");
    fs.writeFileSync(path.join(t.dest, "assets", "icons", "garuda-sigil-icon.svg"), svgContent, "utf8");
    fs.writeFileSync(path.join(t.dest, "assets", "splash", "garuda-sigil-splash.svg"), svgContent, "utf8");

    fs.writeFileSync(path.join(t.dest, "site.webmanifest"), JSON.stringify(webManifest, null, 2), "utf8");

    console.log(`✔ Generated favicon suite in ${path.relative(REPO_ROOT, t.dest)}`);
  }

  console.log("🎉 All authentic GARUDA favicon assets generated successfully!");
}

if (require.main === module) {
  generateFavicons().catch((err) => {
    console.error("Error generating favicons:", err);
    process.exit(1);
  });
}

module.exports = { generateFavicons };
