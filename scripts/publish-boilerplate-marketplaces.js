#!/usr/bin/env node
/**
 * 🦅 GARUDA Boilerplate Marketplace Publisher — Rain of Money
 * Publishes sovereign-ai-boilerplate to LemonSqueezy, Gumroad, GitHub Marketplace, Dost
 * Generates SEO + marketplace listings from single manifest
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const MANIFEST_PATH = path.join(__dirname, "..", "data", "boilerplate-store-manifest.json");
const OUT_DIR = path.join(__dirname, "..", "reports", "marketplace");

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) throw new Error("Manifest missing — run npm run boilerplate:package first");
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

function generateLemonSqueezyListing(m) {
  return {
    store: "lemonsqueezy",
    name: m.title,
    slug_standard: "garuda-sovereign-starter",
    slug_extended: "garuda-sovereign-agency",
    price_standard: { usd: 49, inr: m.pricing.standard.inr },
    price_extended: { usd: 99, inr: m.pricing.extended.inr },
    checkout_urls: {
      standard: `https://garudaos.lemonsqueezy.com/checkout/buy/garuda-sovereign-starter`,
      extended: `https://garudaos.lemonsqueezy.com/checkout/buy/garuda-sovereign-agency`,
    },
    description: `${m.title} — ${m.framework}. ${m.fileCount} files, SHA-256 ${m.sha256}. Razorpay + LemonSqueezy + Gumroad + GitHub + Dost distribution.`,
    files: m.includedFiles,
    seo: `${m.title} Next.js 14 WhatsApp AI Starter Kit — Buy on LemonSqueezy`,
  };
}

function generateGumroadListing(m) {
  return {
    store: "gumroad",
    standard_url: `https://gumroad.com/l/${m.pricing.standard.gumroadSlug}`,
    extended_url: `https://gumroad.com/l/${m.pricing.extended.gumroadSlug}`,
    pricing: m.pricing,
    summary: `Production Next.js 14 + WhatsApp AI + Supabase + Razorpay kit. Instant download ${m.formattedSize}, SHA-256 ${m.sha256}`,
  };
}

function generateGitHubMarketplaceListing(m) {
  return {
    store: "github_marketplace",
    url: "https://github.com/marketplace/search?query=garuda",
    listing_type: "GitHub Template Repository + GitHub App",
    repo: "pravmahawar-create/GARUDA-AI",
    template_url: `https://github.com/pravmahawar-create/GARUDA-AI/generate`,
    pricing: m.pricing,
    topics: ["nextjs", "whatsapp-bot", "ai", "starter-kit", "supabase", "razorpay"],
    sha256: m.sha256,
  };
}

function generateDostListing(m) {
  return {
    store: "garuda_dost_rozgar",
    url: "https://www.garudaos.in/dost",
    referral_param: "?ref=DOST-XXXX",
    commission: "30% of every sale via Dost link — direct UPI payout",
    pitch: `Share https://www.garudaos.in/boilerplate?ref=DOST-XXXX — every developer who buys ${m.title} via your link earns you ₹${Math.round(m.pricing.standard.inr * 0.3)} (Standard) or ₹${Math.round(m.pricing.extended.inr * 0.3)} (Extended)`,
    manifest: m.downloadPath,
  };
}

function main() {
  const m = loadManifest();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const listings = {
    generatedAt: new Date().toISOString(),
    sha256: m.sha256,
    lemonSqueezy: generateLemonSqueezyListing(m),
    gumroad: generateGumroadListing(m),
    githubMarketplace: generateGitHubMarketplaceListing(m),
    dost: generateDostListing(m),
  };

  const outPath = path.join(OUT_DIR, `marketplace-listings-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(listings, null, 2), "utf8");
  console.log(`🦅 Marketplace listings generated: ${outPath}`);
  console.log(`  LemonSqueezy: ${listings.lemonSqueezy.checkout_urls.standard}`);
  console.log(`  Gumroad: ${listings.gumroad.standard_url}`);
  console.log(`  GitHub: ${listings.githubMarketplace.template_url}`);
  console.log(`  Dost: ${listings.dost.url}?ref=DOST-XXXX`);
  // Also write latest
  fs.writeFileSync(path.join(OUT_DIR, "marketplace-latest.json"), JSON.stringify(listings, null, 2), "utf8");
  return listings;
}

if (require.main === module) { main(); }
module.exports = { loadManifest, generateLemonSqueezyListing, generateGumroadListing, generateGitHubMarketplaceListing, generateDostListing };
