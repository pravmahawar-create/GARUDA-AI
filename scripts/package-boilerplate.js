/**
 * 🦅 GARUDA Sovereign AI Starter Kit Packager & Distribution Engine
 * Creates cryptographically verified distribution zip and generates store manifest.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const BOILERPLATE_DIR = path.join(ROOT_DIR, "packages", "sovereign-ai-boilerplate");
const PUBLIC_DOWNLOADS = path.join(ROOT_DIR, "public", "downloads");
const FRONTEND_DOWNLOADS = path.join(ROOT_DIR, "frontend", "public", "downloads");
const DATA_DIR = path.join(ROOT_DIR, "data");
const MANIFEST_FILE = path.join(DATA_DIR, "boilerplate-store-manifest.json");

const ZIP_FILENAME = "garuda-sovereign-ai-starter.zip";

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getFileList(dir, base = "") {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (["node_modules", ".git", ".next", ".DS_Store"].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results = results.concat(getFileList(fullPath, relPath));
    } else {
      results.push(relPath);
    }
  }
  return results;
}

function packageBoilerplate() {
  console.log("🦅 [GARUDA Boilerplate Engine] Initiating distribution packaging...");

  if (!fs.existsSync(BOILERPLATE_DIR)) {
    throw new Error(`Boilerplate directory not found at: ${BOILERPLATE_DIR}`);
  }

  ensureDirectory(PUBLIC_DOWNLOADS);
  ensureDirectory(FRONTEND_DOWNLOADS);
  ensureDirectory(DATA_DIR);

  const publicZipPath = path.join(PUBLIC_DOWNLOADS, ZIP_FILENAME);
  const frontendZipPath = path.join(FRONTEND_DOWNLOADS, ZIP_FILENAME);

  // Remove existing archives if present
  if (fs.existsSync(publicZipPath)) fs.unlinkSync(publicZipPath);
  if (fs.existsSync(frontendZipPath)) fs.unlinkSync(frontendZipPath);

  // Use Windows built-in tar or PowerShell Compress-Archive to build zip
  console.log(`📦 Packaging files from: ${BOILERPLATE_DIR}`);

  const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${BOILERPLATE_DIR}\\*' -DestinationPath '${publicZipPath}' -Force"`;
  execSync(psCommand, { stdio: "inherit" });

  if (!fs.existsSync(publicZipPath)) {
    throw new Error(`Failed to create archive at ${publicZipPath}`);
  }

  // Copy to frontend public downloads as well
  fs.copyFileSync(publicZipPath, frontendZipPath);

  // Compute SHA-256
  const zipBuffer = fs.readFileSync(publicZipPath);
  const sha256 = crypto.createHash("sha256").update(zipBuffer).digest("hex");
  const sizeBytes = zipBuffer.length;
  const formattedSize = `${(sizeBytes / 1024).toFixed(1)} KB`;

  const files = getFileList(BOILERPLATE_DIR);

  const manifest = {
    packageName: "@garudaos/sovereign-ai-starter",
    version: "1.0.0",
    title: "GARUDA Sovereign AI & WhatsApp Bot Starter Kit",
    framework: "Next.js 14 App Router + Tailwind CSS + Supabase + Razorpay/Stripe",
    sha256,
    sizeBytes,
    formattedSize,
    downloadPath: `/downloads/${ZIP_FILENAME}`,
    generatedAt: new Date().toISOString(),
    pricing: {
      standard: {
        usd: 49,
        inr: 3999,
        license: "Single Client Production Deployment",
        gumroadSlug: "garuda-sovereign-starter"
      },
      extended: {
        usd: 99,
        inr: 7999,
        license: "Unlimited Agency White-Label Deployments",
        gumroadSlug: "garuda-sovereign-agency"
      },
      hosted: {
        usd: 19,
        inr: 1599,
        per: "month",
        license: "Hosted SaaS — 1-Click Vercel Deploy + Managed Supabase + Auto Updates",
        gumroadSlug: "garuda-sovereign-hosted",
        recurring: true
      }
    },
    paymentGatewayUrl: "https://razorpay.me/@garudaosincompany",
    founderContact: {
      name: "Praveen Mahawar",
      role: "Principal Architect & Founder",
      email: "praveen@garudaos.in",
      portal: "https://www.garudaos.in",
      scopingChat: "https://www.garudaos.in/chat"
    },
    fileCount: files.length,
    includedFiles: files
  };

  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), "utf8");

  console.log("✅ [Packaging Complete]");
  console.log(`   SHA-256: ${sha256}`);
  console.log(`   Size:    ${formattedSize}`);
  console.log(`   Files:   ${files.length} files included`);
  console.log(`   Saved:   ${publicZipPath}`);
  console.log(`   Saved:   ${frontendZipPath}`);
  console.log(`   Manifest: ${MANIFEST_FILE}`);

  return manifest;
}

if (require.main === module) {
  try {
    packageBoilerplate();
  } catch (err) {
    console.error("❌ [Packaging Failed]:", err.message);
    process.exit(1);
  }
}

module.exports = { packageBoilerplate };
