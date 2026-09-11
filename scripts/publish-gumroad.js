#!/usr/bin/env node
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.GUMROAD_ACCESS_TOKEN || "M5-BZLrv-bgFci-GDcOrEltv8vYjEtNbYwtQXXuZ0xM";

async function createGumroadProduct({ name, price, description, summary }) {
  const form = new URLSearchParams({
    name,
    price: String(price * 100), // Gumroad expects cents
    description,
    summary,
    access_token: TOKEN,
  });
  const res = await fetch("https://api.gumroad.com/v2/products", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  console.log("🦅 Publishing to Gumroad via API...");
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "boilerplate-store-manifest.json"), "utf8"));
  const standard = {
    name: "GARUDA Sovereign AI Starter Kit — Standard License",
    price: 49,
    description: `Launch a production WhatsApp AI receptionist in 60 minutes. Next.js 14 + Supabase + Razorpay 50/50 escrow — 17 files, SHA-256 ${manifest.sha256.slice(0, 12)}... Single client license. Includes: Next.js 14 App Router, Tailwind, WhatsApp Cloud API, Gemini 2.5 Flash, Supabase schema, Razorpay/Stripe.`,
    summary: "Next.js 14 WhatsApp AI Starter Kit — Standard",
  };
  const extended = {
    name: "GARUDA Sovereign AI Starter Kit — Extended Agency License",
    price: 99,
    description: `Agency favorite — unlimited white-label. Same verified kit, resell to any client. Keep ₹25k-50k margin per project. Priority founder support. SHA ${manifest.sha256.slice(0, 12)}...`,
    summary: "Unlimited white-label — Extended Agency",
  };

  for (const p of [standard, extended]) {
    console.log(`\nCreating ${p.name} $${p.price}...`);
    const r = await createGumroadProduct(p);
    console.log(`Status ${r.status}:`, JSON.stringify(r.data).slice(0, 400));
    if (r.status === 200 && r.data.success) {
      console.log(`✔ Created: ${r.data.product?.short_url || r.data.product?.custom_permalink || "ok"}`);
    } else {
      console.log(`✖ Failed:`, r.data);
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { createGumroadProduct };
