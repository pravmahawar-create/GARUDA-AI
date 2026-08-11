// Seed real public prospects (publicly-listed business contact info) into GARUDA lead pipeline.
// Usage: npm run leads:seed
// Source: each business's own public website/listing. No scraping.
require("dotenv").config();
const { addProspects } = require("../src/services/leadgen/genericLeadGenEngine");

const prospects = [
  // --- Hotels & Hospitality ---
  { domain: "hotel", businessName: "Niravi Jaipur", city: "Jaipur", email: "contact@niravijaipur.com", phone: "9266106180", website: "niravijaipur.com", businessType: "Boutique hotel", notes: "boutique garden hotel, owner-run", source: "public_website" },
  { domain: "hotel", businessName: "Dera Mandawa", city: "Jaipur", email: "deramandawa@gmail.com", phone: "01414037377", website: "deramandawa.com", businessType: "Heritage hotel", notes: "luxury heritage hotel", source: "public_website" },
  { domain: "hotel", businessName: "Hotel Kanak Niwas", city: "Udaipur", email: "stay@kanakniwas.com", phone: "2945550199", website: "kanakniwas.in", businessType: "Heritage hotel", notes: "heritage hotel in old city, direct booking push", source: "public_website" },
  { domain: "hotel", businessName: "Jaiwana Haveli", city: "Udaipur", email: "stay@jaiwanahaveli.com", phone: "9829005859", website: "jaiwanahaveli.com", businessType: "Heritage haveli hotel", notes: "family-run, lake pichola, prefers email/whatsapp", source: "public_website" },
  { domain: "hotel", businessName: "Mountbatten Lodge", city: "Udaipur", email: "info@mountbattenlodge.com", phone: "9928009216", website: "mountbattenlodge.com", businessType: "Boutique mountain lodge", notes: "not on booking engines, direct only", source: "public_website" },
  { domain: "hotel", businessName: "Grandeur Boutique Staycation", city: "Udaipur", email: "hello@grandeurudaipur.com", phone: "9928322922", website: "grandeurudaipur.com", businessType: "Boutique staycation hotel", notes: "boutique staycation", source: "public_website" },

  // --- Restaurants ---
  { domain: "restaurant", businessName: "Dwarka Garden Restaurant", city: "Nagpur", email: "dwarkagardenresturant1999@gmail.com", phone: "7083815811", website: "dwarkagardenrestaurant.com", businessType: "Family restaurant", notes: "26 years, garden restaurant", source: "public_website" },
  { domain: "restaurant", businessName: "Cafe Brown Cube & Grill", city: "Indore", email: "cafebrowncube@gmail.com", phone: "", website: "", businessType: "Cafe & grill", notes: "hangout cafe, owner-run", source: "public_listing" },
  { domain: "restaurant", businessName: "Masala Nation", city: "Indore", email: "hello@masalanation.in", phone: "8109090101", website: "masalanation.in", businessType: "Dhaba restaurant", notes: "authentic dhaba dining", source: "public_website" },
  { domain: "restaurant", businessName: "Satkar Pure Veg", city: "Indore", email: "order@satkarpureveg.com", phone: "9479313713", website: "satkarpureveg.com", businessType: "Pure veg dhaba", notes: "order email listed", source: "public_website" },

  // --- Gyms ---
  { domain: "gym", businessName: "The World Gym & Fitness Centre", city: "Indore", email: "info@theworldgym.net", phone: "07314222344", website: "theworldgym.net", businessType: "Gym & fitness centre", notes: "26 years, owner Manish Arya", source: "public_listing" },
  { domain: "gym", businessName: "GYM Beast", city: "Indore", email: "contact@gymbeastindore.com", phone: "9993100682", website: "gymbeastindore.com", businessType: "Gym & fitness", notes: "new gym, partnership", source: "public_website" },

  // --- Coaching / Education ---
  { domain: "education", businessName: "IMS Indore", city: "Indore", email: "indore@imsindia.com", phone: "8291966988", website: "imsindore.com", businessType: "CAT/IPMAT coaching", notes: "CAT IPMAT BBA CUET coaching", source: "public_website" },
  { domain: "education", businessName: "MG Coaching Institute", city: "Indore", email: "mginstituteindore@mgci.co.in", phone: "9329911449", website: "mgci.co.in", businessType: "NEET & IIT-JEE coaching", notes: "NEET IIT-JEE coaching", source: "public_website" },

  // --- Clinics ---
  { domain: "clinic", businessName: "Medident Clinic", city: "Indore", email: "drpriyajoshi2010@gmail.com", phone: "7314969589", website: "medidentclinic.com", businessType: "Multispeciality dental & medical clinic", notes: "dental + physician, Dr Priya & Dr Prakash Joshi", source: "public_website" },
  { domain: "clinic", businessName: "Indore Dental Clinic", city: "Indore", email: "contact@indoredentalclinic.com", phone: "8461966613", website: "indoredentalclinic.com", businessType: "Dental clinic", notes: "dental clinic", source: "public_website" },
  { domain: "clinic", businessName: "Smile Dental Clinic", city: "Indore", email: "smiledental364@gmail.com", phone: "", website: "smiledentalclinicindore.in", businessType: "Dental clinic", notes: "24/7 dental, Dr Ashish Jain", source: "public_website" },
  { domain: "clinic", businessName: "Suraj Vision Centre", city: "Indore", email: "surajvision2006@gmail.com", phone: "7314044846", website: "surajvisioncentre.in", businessType: "Eye & dental centre", notes: "laser eye + dental, since 2006", source: "public_website" }
];

let added = 0;
let skipped = 0;
for (const p of prospects) {
  const domain = p.domain;
  delete p.domain;
  const result = addProspects([p], { domain });
  if (result.added[0]) {
    added++;
    const a = result.added[0];
    console.log(`ny [${domain}] ${a.score} ${a.grade} | ${a.email} | ${a.businessName} | query:${a.query}`);
  } else {
    skipped++;
    console.log(`xx [${domain}] ${p.email} | ${p.businessName} | ${result.skipped[0] ? result.skipped[0].reason : "unknown"}`);
  }
}
console.log(`\n[GARUDA] Seeded ${added} | Skipped ${skipped}`);
