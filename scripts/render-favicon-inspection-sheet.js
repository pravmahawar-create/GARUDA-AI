const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const REPO_ROOT = path.resolve(__dirname, "..");
const SCRATCH_DIR = path.join(REPO_ROOT, "scratch");

async function generateInspectionSheet() {
  const candidates = [
    { id: "v1_master", label: "V1: Full Authentic Sigil" },
    { id: "v2_zoomed", label: "V2: High-Impact Eagle Crest (Maximized Silhouette)" },
    { id: "v3_vector", label: "V3: Geometric Vector Sigil" }
  ];

  const targetSizes = [48, 32, 24, 16];

  for (const c of candidates) {
    const rawMaster = fs.readFileSync(path.join(SCRATCH_DIR, `${c.id}_512.png`));

    // Generate accurate unsharpened/optimized lanczos3 downsamples
    const p48 = await sharp(rawMaster).resize(48, 48, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();
    const p32 = await sharp(rawMaster).resize(32, 32, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();
    const p24 = await sharp(rawMaster).resize(24, 24, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();
    const p16 = await sharp(rawMaster).resize(16, 16, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();

    // Scale them up with nearest-neighbor to visualize exact pixel grid
    const zoom48 = await sharp(p48).resize(144, 144, { kernel: sharp.kernel.nearest }).png().toBuffer();
    const zoom32 = await sharp(p32).resize(128, 128, { kernel: sharp.kernel.nearest }).png().toBuffer();
    const zoom24 = await sharp(p24).resize(120, 120, { kernel: sharp.kernel.nearest }).png().toBuffer();
    const zoom16 = await sharp(p16).resize(128, 128, { kernel: sharp.kernel.nearest }).png().toBuffer();

    // Composite side-by-side card
    const card = await sharp({
      create: {
        width: 600,
        height: 180,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      }
    })
      .composite([
        { input: zoom48, left: 20, top: 20 },
        { input: zoom32, left: 185, top: 26 },
        { input: zoom24, left: 335, top: 30 },
        { input: zoom16, left: 475, top: 26 }
      ])
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(SCRATCH_DIR, `inspection_${c.id}.png`), card);
  }

  console.log("✔ Generated pixel inspection sheets for V1, V2, and V3!");
}

generateInspectionSheet().catch(console.error);
