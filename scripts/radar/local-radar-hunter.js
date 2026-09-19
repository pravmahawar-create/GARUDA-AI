/**
 * 🦅 GARUDA SOVEREIGN RADAR: LOCAL BUSINESS HUNTER
 * Hunts high-intent local businesses via Google Places API (Serper),
 * qualifies them for missing/broken websites, extracts contact info & Instagram handles,
 * and formats them for autonomous outreach via official GARUDA channels.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
require("dotenv").config();

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "local_hunter_leads.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SEARCH_TARGETS = [
  { niche: "Car Detailing & PPF", query: "car detailing in Indore", city: "Indore", ticketSize: "High (₹15,000 - ₹80,000)" },
  { niche: "Luxury Salon & Spa", query: "luxury salon in Indore", city: "Indore", ticketSize: "High (₹3,000 - ₹25,000)" },
  { niche: "Aesthetic & Skin Clinic", query: "skin clinic in Indore", city: "Indore", ticketSize: "Ultra-High (₹10,000 - ₹50,000)" },
  { niche: "Dental & Implant Clinic", query: "dental clinic in Indore", city: "Indore", ticketSize: "High (₹5,000 - ₹1,00,000)" },
  { niche: "Car Detailing & Ceramic", query: "car detailing studio in Bhopal", city: "Bhopal", ticketSize: "High (₹15,000 - ₹75,000)" },
  { niche: "Luxury Salon & Studio", query: "luxury salon in Bhopal", city: "Bhopal", ticketSize: "High (₹3,000 - ₹20,000)" }
];

async function fetchGooglePlaces(query) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY missing in .env");
  }

  const payload = JSON.stringify({ q: query, gl: "in", hl: "en" });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "google.serper.dev",
      path: "/places",
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json.places || []);
        } catch (e) {
          reject(new Error(`Failed to parse Serper JSON: ${e.message}`));
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function extractInstagramHandle(url) {
  if (!url) return null;
  const match = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
  if (match && match[1]) {
    const handle = match[1].toLowerCase().replace(/\/$/, "");
    if (!["p", "reel", "explore", "stories", "direct"].includes(handle)) {
      return handle;
    }
  }
  return null;
}

function qualifyLead(place, target) {
  const website = place.website ? place.website.trim() : null;
  const phone = place.phoneNumber ? place.phoneNumber.trim() : null;
  const rating = place.rating || 4.5;
  const reviews = place.ratingCount || 10;
  
  let defectType = null;
  let defectDescription = null;
  let instaHandle = null;

  if (website) {
    instaHandle = extractInstagramHandle(website);
  }

  if (!website) {
    defectType = "NO_WEBSITE";
    defectDescription = "Google Maps listing has NO website button. Direct bookings leak to competitors.";
  } else if (instaHandle) {
    defectType = "INSTAGRAM_AS_WEBSITE";
    defectDescription = `Business uses Instagram (@${instaHandle}) as their website placeholder. No booking system, no SEO indexing.`;
  } else if (website.includes("whatsapp.com")) {
    defectType = "WHATSAPP_AS_WEBSITE";
    defectDescription = "Business uses generic WhatsApp link instead of an authoritative digital booking portal.";
  } else if (website.startsWith("http://")) {
    defectType = "INSECURE_HTTP";
    defectDescription = "Website lacks SSL security (Not Secure browser warning), destroying customer trust.";
  } else if (website.includes("facebook.com")) {
    defectType = "FACEBOOK_AS_WEBSITE";
    defectDescription = "Business redirects to outdated Facebook page rather than a branded responsive website.";
  }

  // Generate lead slug for instant demo
  const slug = place.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    businessName: place.title,
    slug,
    niche: target.niche,
    city: target.city,
    ticketSize: target.ticketSize,
    rating,
    reviews,
    phone,
    address: place.address || `${target.city}, India`,
    originalWebsite: website || null,
    instagramHandle: instaHandle,
    defectType,
    defectDescription,
    isQualified: Boolean(defectType && phone),
    detectedAt: new Date().toISOString()
  };
}

async function runHunter() {
  console.log("🦅 [GARUDA LOCAL RADAR] Starting high-intent local business hunter...");
  const qualifiedLeads = [];
  const allLeads = [];

  for (const target of SEARCH_TARGETS) {
    console.log(`\n🔍 Scanning: "${target.query}" (${target.niche} in ${target.city})...`);
    try {
      const places = await fetchGooglePlaces(target.query);
      console.log(`   Found ${places.length} places from Google Places.`);

      for (const p of places) {
        const qualified = qualifyLead(p, target);
        allLeads.push(qualified);
        if (qualified.isQualified) {
          console.log(`   🎯 QUALIFIED LEAD: [${qualified.defectType}] ${qualified.businessName}`);
          console.log(`      Phone: ${qualified.phone} | Insta: @${qualified.instagramHandle || "N/A"}`);
          qualifiedLeads.push(qualified);
        }
      }
      // polite delay
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`   ❌ Error querying ${target.query}:`, err.message);
    }
  }

  // Deduplicate by business name or phone
  const seen = new Set();
  const uniqueQualified = [];
  for (const lead of qualifiedLeads) {
    const key = lead.phone || lead.businessName;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueQualified.push(lead);
    }
  }

  console.log(`\n========================================`);
  console.log(`🦅 [RADAR HUNT COMPLETE]`);
  console.log(`Total Places Scanned: ${allLeads.length}`);
  console.log(`Hot Qualified High-Leakage Leads: ${uniqueQualified.length}`);
  console.log(`========================================`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniqueQualified, null, 2), "utf8");
  console.log(`💾 Saved qualified leads database to: ${OUTPUT_FILE}`);

  return uniqueQualified;
}

if (require.main === module) {
  runHunter()
    .then((leads) => {
      console.log(`✔ Ready for Instant Demo Generation & Multi-Channel Outreach.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("FATAL:", err);
      process.exit(1);
    });
}

module.exports = { runHunter, qualifyLead, fetchGooglePlaces };
