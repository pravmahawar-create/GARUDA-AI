#!/usr/bin/env node
require("dotenv").config();
const TOKEN = process.env.GUMROAD_ACCESS_TOKEN || "M5-BZLrv-bgFci-GDcOrEltv8vYjEtNbYwtQXXuZ0xM";

async function updateGumroadSEO() {
  console.log("🦅 Gumroad SEO Boost — Driving traffic to GARUDA...");
  // First, list products to get IDs
  const listRes = await fetch("https://api.gumroad.com/v2/products", { headers: { "Authorization": `Bearer ${TOKEN}` } });
  const listData = await listRes.json();
  console.log(`Found ${listData.products?.length || 0} products`);
  for (const p of (listData.products || [])) {
    console.log(`- ${p.name} → ${p.short_url} (${p.custom_permalink}) ID:${p.id}`);
  }

  const seoUpdates = [
    {
      id: listData.products?.find(p => p.name.includes("Standard"))?.id,
      name: "GARUDA Sovereign AI Starter Kit — Standard License",
      description: `Launch a production WhatsApp AI receptionist in 60 minutes. Next.js 14 + Supabase + Razorpay 50/50 escrow — 17 files, SHA-256 verified. Single client license.\n\n🚀 Live Demo: https://www.garudaos.in/boilerplate\n💬 Scoping Chat: https://www.garudaos.in/chat\n🏠 Official Store: https://www.garudaos.in\n\nSEO: Next.js boilerplate, WhatsApp bot, AI SaaS, Supabase, Razorpay — garudaos.in`,
      summary: "Next.js 14 WhatsApp AI Starter Kit — Standard — garudaos.in",
      tags: ["nextjs", "whatsapp", "ai", "supabase", "razorpay", "boilerplate", "garuda"],
    },
    {
      id: listData.products?.find(p => p.name.includes("Extended") || p.name.includes("Agency"))?.id,
      name: "GARUDA Sovereign AI Starter Kit — Extended Agency License",
      description: `Agency favorite — unlimited white-label. Same verified kit, resell to any client. Keep ₹25k-50k margin per project. Priority founder support.\n\n🚀 Live Demo: https://www.garudaos.in/boilerplate\n🏢 Agency Pitch: https://www.garudaos.in/chat?ref=gumroad_agency\n🏠 Official: https://www.garudaos.in\n\nSEO: White-label SaaS, agency boilerplate, Next.js, garudaos.in`,
      summary: "Unlimited white-label — Extended Agency — garudaos.in",
      tags: ["agency", "white-label", "nextjs", "saas", "garuda"],
    },
  ];

  for (const upd of seoUpdates) {
    if (!upd.id) { console.log(`⚠ No ID for ${upd.name}, skipping`); continue; }
    const form = new URLSearchParams({
      name: upd.name,
      description: upd.description,
      summary: upd.summary,
      access_token: TOKEN,
    });
    const res = await fetch(`https://api.gumroad.com/v2/products/${upd.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const data = await res.json().catch(() => ({}));
    console.log(`\nUpdated ${upd.name} → Status ${res.status}:`, JSON.stringify(data).slice(0, 300));
    await new Promise(r => setTimeout(r, 800));
  }

  console.log("\n✔ Gumroad SEO boost complete — all products now drive traffic to garudaos.in");
}

if (require.main === module) updateGumroadSEO().catch(e => { console.error(e); process.exit(1); });
module.exports = { updateGumroadSEO };
