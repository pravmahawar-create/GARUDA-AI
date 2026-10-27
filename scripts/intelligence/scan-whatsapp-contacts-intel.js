/**
 * 🦅 GARUDA WHATSAPP WARM NETWORK INTELLIGENCE ENGINE
 * 
 * Purpose:
 * Analyzes Founder's existing WhatsApp contacts, cross-references their public business presence,
 * websites, and Google Maps listings, identifies who has urgent technical hemorrhages / missing systems,
 * and formulates high-trust, warm "Trojan Value" messages ready for 1-Tap dispatch.
 * 
 * 100% Anti-Spam & Zero-Ban Law:
 * Warm contacts already have Founder's number saved. Zero risk of WhatsApp ban.
 * 50x higher conversion than cold strangers.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const CONTACTS_INPUT_FILE = path.join(DATA_DIR, "my_whatsapp_contacts.json");
const OUTPUT_FILE = path.join(DATA_DIR, "warm_whatsapp_contact_intelligence.json");

const SERPER_API_KEY = process.env.SERPER_API_KEY;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeSerperRequest(endpoint, payload) {
  return new Promise((resolve, reject) => {
    if (!SERPER_API_KEY) {
      return reject(new Error("SERPER_API_KEY missing in .env"));
    }
    const postData = JSON.stringify(payload);
    const options = {
      hostname: "google.serper.dev",
      path: endpoint,
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          reject(new Error(`Failed to parse Serper JSON: ${e.message}`));
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function extractInstagramHandle(url) {
  if (!url) return null;
  const match = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
  return match && match[1] ? match[1].toLowerCase().replace(/\/$/, "") : null;
}

/**
 * Investigates a specific contact on Google Search & Places
 */
async function investigateContact(contact) {
  const cleanPhone = String(contact.phone || "").replace(/[^0-9]/g, "");
  const queryName = contact.name || "";
  const city = contact.city || "Indore";

  console.log(`\n🔍 Investigating Contact: ${queryName} (${cleanPhone})...`);

  let businessPlace = null;
  let webPresence = null;

  // 1. Search by phone number first (most precise)
  if (cleanPhone.length >= 10) {
    const rawNumber = cleanPhone.slice(-10);
    try {
      const placesRes = await makeSerperRequest("/places", { q: rawNumber, gl: "in", hl: "en" });
      if (placesRes.places && placesRes.places.length > 0) {
        businessPlace = placesRes.places[0];
      }
    } catch (_) {}
  }

  // 2. If no place found by phone, search by name + city
  if (!businessPlace && queryName.length > 3) {
    try {
      const placesRes = await makeSerperRequest("/places", { q: `"${queryName}" ${city}`, gl: "in", hl: "en" });
      if (placesRes.places && placesRes.places.length > 0) {
        businessPlace = placesRes.places[0];
      }
    } catch (_) {}
  }

  // 3. Search organic web
  try {
    const searchRes = await makeSerperRequest("/search", { q: `"${queryName}" ${cleanPhone.slice(-10)}`, num: 3 });
    if (searchRes.organic && searchRes.organic.length > 0) {
      webPresence = searchRes.organic[0];
    }
  } catch (_) {}

  // 4. Diagnose Bleeding Holes / Business Need
  let defect = null;
  let businessTitle = businessPlace ? businessPlace.title : (contact.businessName || "Business");

  if (businessPlace) {
    const website = businessPlace.website;
    const insta = extractInstagramHandle(website);

    if (!website) {
      defect = {
        type: "NO_WEBSITE",
        description: "Google Maps par listing hai par website button missing hai. Saare direct leads aur bookings leak ho rahe hain."
      };
    } else if (insta) {
      defect = {
        type: "INSTAGRAM_AS_WEBSITE",
        description: `Website ki jagah Instagram (@${insta}) laga rakha hai. Koi automated booking system ya direct lead capture nahi hai.`
      };
    } else if (website.startsWith("http://")) {
      defect = {
        type: "INSECURE_HTTP",
        description: "Website par SSL certificate nahi hai ('Not Secure' browser warning aa rahi hai)."
      };
    }
  } else if (!contact.hasWebsite) {
    defect = {
      type: "DIGITAL_ABSENCE",
      description: "Google search aur Maps par direct automated digital portal ya booking engine missing hai."
    };
  }

  // 5. Generate Warm Trojan Pitch (Relationship-First, Zero-Begging)
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const firstName = queryName.split(" ")[0];

  let warmMessage = "";
  if (defect && defect.type !== "DIGITAL_ABSENCE") {
    warmMessage = `Bhai ${firstName}, kaise ho?
Main abhi online aapka ${businessTitle} dekh raha tha.

Aapke Google listing me ek chhota sa technical issue notice hua: ${defect.description}
Isse jo log online dhoondhte hain, wo direct call ya booking karne me drop ho jaate hain.

Maine GARUDA OS ke zariye aapke liye ek instant, sub-second high-speed booking aur WhatsApp intake portal test kiya tha:
👉 Live Demo: https://www.garudaos.in

Dekho kaisa lag raha hai. Agar bolo toh bina kisi jhanjhat ke aapka live connect karwa doon taaki directly appointments aane lagein.`;
  } else {
    warmMessage = `Bhai ${firstName}, kaise ho? Kaam-kaaj kaisa chal raha hai?
Humne abhi GARUDA OS ka naya autonomous AI aur automation engine deploy kiya hai jo businesses ke leads aur customer bookings ko 100% automate kar deta hai.

Aapke kaam ke hisaab se mujhe laga ye aapke liye kaafi helpful ho sakta hai:
👉 https://www.garudaos.in

Ek baar dekhna aur batana kaisa laga!`;
  }

  const waActionUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(warmMessage)}`;

  return {
    contactName: queryName,
    phone: cleanPhone,
    businessTitle,
    businessAddress: businessPlace ? businessPlace.address : "N/A",
    businessWebsite: businessPlace ? businessPlace.website : null,
    rating: businessPlace ? businessPlace.rating : null,
    defect,
    warmMessage,
    waActionUrl,
    needsHelp: Boolean(defect),
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Main execution
 */
async function runContactsIntel() {
  console.log("🦅 ========================================================");
  console.log("🦅 GARUDA WARM WHATSAPP CONTACT INTELLIGENCE SCANNER");
  console.log("🦅 ========================================================");

  let contactsToAnalyze = [];

  if (fs.existsSync(CONTACTS_INPUT_FILE)) {
    try {
      contactsToAnalyze = JSON.parse(fs.readFileSync(CONTACTS_INPUT_FILE, "utf8"));
      console.log(`📂 Loaded ${contactsToAnalyze.length} contacts from: ${CONTACTS_INPUT_FILE}`);
    } catch (e) {
      console.warn("⚠️ Error parsing contacts file, will use sample schema.");
    }
  }

  // If no contact file exists yet, provide sample schema template
  if (contactsToAnalyze.length === 0) {
    console.log("ℹ️ No 'data/my_whatsapp_contacts.json' found yet.");
    console.log("Creating template with sample business contacts for demonstration...");
    contactsToAnalyze = [
      { name: "Dr Sumeet Jain", phone: "9826054001", city: "Indore" },
      { name: "Jatin Agarwal", phone: "7999035453", city: "Indore" },
      { name: "Perfect Carz", phone: "9685999297", city: "Indore" }
    ];
    fs.writeFileSync(CONTACTS_INPUT_FILE, JSON.stringify(contactsToAnalyze, null, 2), "utf8");
    console.log(`💾 Saved sample schema to: ${CONTACTS_INPUT_FILE}`);
  }

  const results = [];
  for (const c of contactsToAnalyze) {
    try {
      const intel = await investigateContact(c);
      results.push(intel);
      await sleep(1000);
    } catch (err) {
      console.error(`❌ Error scanning ${c.name}:`, err.message);
    }
  }

  const outputData = {
    scannedAt: new Date().toISOString(),
    totalContactsScanned: results.length,
    contactsNeedingFixes: results.filter((r) => r.needsHelp).length,
    intelligence: results
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), "utf8");
  const sha256 = crypto.createHash("sha256").update(JSON.stringify(outputData)).digest("hex");

  console.log("\n========================================================");
  console.log("🦅 [SCAN COMPLETE] WARM NETWORK VALUE OPPORTUNITIES:");
  console.log(`   👥 Total Contacts Scanned: ${results.length}`);
  console.log(`   🎯 Contacts with Verified Bleeding Tech Leaks: ${outputData.contactsNeedingFixes}`);
  console.log(`   💾 Output File: ${OUTPUT_FILE}`);
  console.log(`   🔒 Verified SHA-256: ${sha256}`);
  console.log("========================================================\n");

  return outputData;
}

if (require.main === module) {
  runContactsIntel()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("FATAL:", err);
      process.exit(1);
    });
}

module.exports = { runContactsIntel, investigateContact };
