#!/usr/bin/env node
require("dotenv").config();

const TOKEN = process.env.GUMROAD_ACCESS_TOKEN || "M5-BZLrv-bgFci-GDcOrEltv8vYjEtNbYwtQXXuZ0xM";

async function createVaultProduct() {
  console.log("🦅 Publishing 'GARUDA 2026 AI Cash Flow & Automation Vault' to Gumroad...");

  const description = [
    "The ultimate 2026 sovereign toolkit for creators, freelancers, and builders wanting to launch high-retention faceless channels and AI digital assets with ₹0 operational cost.",
    "",
    "🔥 WHAT YOU GET INSIDE:",
    "1. 500+ High-Conversion AI Prompts: Tested frameworks for Cold Outreach, Sales, Copywriting, and Trojan Comments.",
    "2. 200+ Photorealistic Image Prompts: 8K cinematic prompts optimized for Flux, Midjourney, and Stable Diffusion.",
    "3. Faceless YouTube Automation Blueprint: Step-by-step zero-dollar documentary creation workflow.",
    "4. 100% Free AI Audio Guide: Unlimited realistic voiceover production with Edge-TTS (No ElevenLabs subscription required).",
    "5. Autonomous Video Assembly: Batch scripts to automate Ken Burns zoom, subtitles, and rendering.",
    "6. Full Commercial Resell & Agency Rights: Deploy for yourself or client accounts.",
    "",
    "⚡ INSTANT ACCESS & DIRECT DOWNLOAD:",
    "Direct download is unlocked immediately upon checkout.",
    "",
    "🇮🇳 INDIA DIRECT UPI ALTERNATIVE:",
    "If you prefer UPI payment directly in INR (₹749):",
    "👉 https://razorpay.me/@garudaosincompany",
    "",
    "🌐 OFFICIAL PLATFORM:",
    "Explore our enterprise systems: https://www.garudaos.in",
    "Architect & Founder: Praveen Mahawar (praveen@garudaos.in)"
  ].join("\n");

  const form = new URLSearchParams({
    name: "GARUDA 2026 AI Cash Flow & Faceless Automation Master Vault",
    price: "900", // $9.00 USD
    summary: "500+ AI Prompts, Faceless YouTube Blueprints & Free Audio Pipeline",
    description: description,
    access_token: TOKEN
  });

  const res = await fetch("https://api.gumroad.com/v2/products", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString()
  });

  const data = await res.json().catch(() => ({}));
  console.log(`Status: ${res.status}`);
  console.log("Response:", JSON.stringify(data, null, 2));

  if (res.status === 200 && data.success) {
    console.log(`\n✔ Successfully Created on Gumroad!`);
    console.log(`URL: ${data.product?.short_url}`);
    console.log(`ID: ${data.product?.id}`);
    return data.product;
  } else {
    console.error("✖ Creation failed:", data);
  }
}

if (require.main === module) {
  createVaultProduct().catch(console.error);
}

module.exports = { createVaultProduct };
