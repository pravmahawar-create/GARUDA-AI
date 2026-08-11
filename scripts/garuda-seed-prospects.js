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
  { domain: "clinic", businessName: "Suraj Vision Centre", city: "Indore", email: "surajvision2006@gmail.com", phone: "7314044846", website: "surajvisioncentre.in", businessType: "Eye & dental centre", notes: "laser eye + dental, since 2006", source: "public_website" },

  // --- Batch 2: ALL-INDIA EXPANSION (public websites, MCA, verified listings) ---

  // Delhi — Hotels
  { domain: "hotel", businessName: "Hotel Diplomat", city: "Delhi", email: "reservations@thehoteldiplomat.com", phone: "1146050200", website: "thehoteldiplomat.com", businessType: "Boutique hotel", notes: "boutique luxury hotel, Chanakyapuri", source: "public_website" },
  { domain: "hotel", businessName: "Mizpah Delhi", city: "Delhi", email: "reservations@mizpahdelhi.co.in", phone: "", website: "mizpahdelhi.co.in", businessType: "Boutique bed & breakfast", notes: "4-room boutique B&B, Safdarjung Enclave", source: "public_website" },
  { domain: "hotel", businessName: "Jasmine Boutique Hotel", city: "Delhi", email: "jasminebh50@gmail.com", phone: "1141641601", website: "jasmineboutiquehotel.com", businessType: "Boutique hotel", notes: "affordable boutique, Jasola", source: "public_website" },

  // Hyderabad — Hotels
  { domain: "hotel", businessName: "Avana A Boutique Hotel", city: "Hyderabad", email: "reservations@avana-hotels.com", phone: "", website: "avana-hotels.com", businessType: "Boutique hotel", notes: "boutique, Financial District, pushes direct booking", source: "public_website" },
  { domain: "hotel", businessName: "Hotel Tanisha", city: "Hyderabad", email: "tanishahotels@gmail.com", phone: "4044774444", website: "tanishahotels.com", businessType: "Business hotel", notes: "meetings & event space, Ameerpet", source: "public_listing" },
  { domain: "hotel", businessName: "Kakaku Boutique Hotel", city: "Adilabad", email: "kakakutheguesthouse@gmail.com", phone: "8179475753", website: "kakakuboutiquehotel.com", businessType: "Boutique guest house", notes: "guest house, family-run", source: "public_website" },

  // Bangalore — Restaurants
  { domain: "restaurant", businessName: "Nisha Home Foods", city: "Bangalore", email: "nishahomefoods2023@gmail.com", phone: "8618598319", website: "nishahomefoods.in", businessType: "Family restaurant", notes: "authentic Andhra home-style family restaurant", source: "public_website" },
  { domain: "restaurant", businessName: "Spices Restaurant", city: "Bangalore", email: "info@spicesrestaurant.in", phone: "8042183267", website: "spicesrestaurant.in", businessType: "Multi-cuisine restaurant", notes: "Sarjapur Road, full-service", source: "public_listing" },
  { domain: "restaurant", businessName: "Zed The Baker", city: "Bangalore", email: "info@zedthebaker.com", phone: "", website: "zedthebaker.com", businessType: "Bakery & cafe", notes: "father-son duo brand, Vasanth Nagar", source: "public_website" },

  // Pune — Restaurants
  { domain: "restaurant", businessName: "Caarwa Family Resto Bar", city: "Pune", email: "sales.cfkb@gmail.com", phone: "8292798081", website: "caarwafamilykitchenandbar.com", businessType: "Family restaurant & bar", notes: "family resto bar, Sadashiv Peth", source: "public_website" },
  { domain: "restaurant", businessName: "Shubh Tatva Restaurant", city: "Pune", email: "shubhtatva111@gmail.com", phone: "", website: "shubhtatvarestaurant.com", businessType: "Pure veg restaurant", notes: "Rajasthani dal bati, Pimple Saudagar", source: "public_website" },
  { domain: "restaurant", businessName: "Curry Nirvana", city: "Pune", email: "sales.currynirvana@gmail.com", phone: "7757959901", website: "currynirvana.in", businessType: "South Indian restaurant", notes: "Tamil & Kerala cuisine, Viman Nagar", source: "public_website" },

  // Kolkata — Restaurants
  { domain: "restaurant", businessName: "Jiban Jamuna Restaurant", city: "Kolkata", email: "sdas45551@gmail.com", phone: "9830345129", website: "", businessType: "Family restaurant", notes: "near City Center 2", source: "public_listing" },
  { domain: "restaurant", businessName: "Sushmita's Kitchen", city: "Kolkata", email: "sushmita.kitchen@gmail.com", phone: "9433824496", website: "", businessType: "Family restaurant", notes: "proprietor Paritosh Das", source: "public_listing" },
  { domain: "restaurant", businessName: "Gupta Brothers Restaurant", city: "Kolkata", email: "sg518833@gmail.com", phone: "9163716172", website: "guptabrotherssaltlake.com", businessType: "Restaurant", notes: "proprietor Shubham Gupta, Esplanade + Salt Lake", source: "public_listing" },

  // Chennai — Restaurants
  { domain: "restaurant", businessName: "Italiano Pure Veg", city: "Chennai", email: "italianotn@gmail.com", phone: "6363595400", website: "italianochennai.in", businessType: "Pure veg multi-cuisine restaurant", notes: "cafe + catering + grazing tables, Anna Nagar", source: "public_website" },
  { domain: "restaurant", businessName: "Delight Restaurant", city: "Chennai", email: "amaravathirangervijay@gmail.com", phone: "", website: "", businessType: "Family restaurant", notes: "owner Vijaya Kumar, Sembakkam", source: "public_listing" },

  // Hyderabad — Gyms
  { domain: "gym", businessName: "360 Degree Fitness", city: "Hyderabad", email: "360degreefitness@gmail.com", phone: "9000551360", website: "360fitnesshyd.com", businessType: "Gym & fitness center", notes: "Jubilee Hills + Kondapur branches", source: "public_website" },
  { domain: "gym", businessName: "SOC Fit", city: "Hyderabad", email: "socfitgym@gmail.com", phone: "", website: "", businessType: "Gym", notes: "Kondapur", source: "public_listing" },
  { domain: "gym", businessName: "BodyBeast Gym & Fitness", city: "Hyderabad", email: "info@bodybeast.in", phone: "9966000616", website: "bodybeast.in", businessType: "Warehouse gym", notes: "premium warehouse gym, since 2019", source: "public_listing" },

  // Pune — Gyms
  { domain: "gym", businessName: "Life Fitness Club", city: "Pune", email: "ashthopte@gmail.com", phone: "2025290153", website: "", businessType: "Gym", notes: "owner Rakesh Dangat, Shivane", source: "public_listing" },
  { domain: "gym", businessName: "Kratos Fitness", city: "Delhi", email: "aashichopra@gmail.com", phone: "", website: "", businessType: "Gym", notes: "Greater Kailash-2", source: "public_listing" },

  // Delhi — Education
  { domain: "education", businessName: "MEC Institute", city: "Delhi", email: "mecinstitute@gmail.com", phone: "7892911723", website: "mecinstitute.in", businessType: "JEE/NEET coaching", notes: "CBSE + JEE/NEET, Krishna Nagar", source: "public_website" },
  { domain: "education", businessName: "Ciel Knowledge", city: "Delhi", email: "cielknowledge@gmail.com", phone: "", website: "cielknowledge.com", businessType: "JEE/NEET coaching", notes: "classes 8-12, Ashok Vihar", source: "public_website" },
  { domain: "education", businessName: "CrackPe", city: "Delhi", email: "crackpeindia@gmail.com", phone: "9311668899", website: "crackpe.com", businessType: "IIT-JEE & NEET coaching", notes: "pay-after-success model, 3 centres", source: "public_website" },
  { domain: "education", businessName: "Aviyan Institute", city: "Delhi", email: "aviyaninstitute@gmail.com", phone: "8178403339", website: "aviyaninstitute.com", businessType: "JEE/NEET coaching", notes: "Palam Raj Nagar", source: "public_website" },

  // Chennai — Education
  { domain: "education", businessName: "SITJEE Classes", city: "Chennai", email: "sitjeechennai@gmail.com", phone: "9710110142", website: "sitjee.in", businessType: "NEET/JEE coaching", notes: "Mandaveli head office + Tirupur", source: "public_website" },
  { domain: "education", businessName: "Kadigai Academy", city: "Chennai", email: "kadigaiacademy@gmail.com", phone: "9150100339", website: "kadigaiacademy.com", businessType: "NEET/JEE coaching", notes: "Anna Nagar", source: "public_website" },
  { domain: "education", businessName: "Focus Education", city: "Chennai", email: "info.focuseducation@gmail.com", phone: "8190064877", website: "focuseducationindia.com", businessType: "NEET/IIT-JEE coaching", notes: "tamil medium + online tuition", source: "public_website" },
  { domain: "education", businessName: "RK Vision Academy", city: "Chennai", email: "rkvisionacademyjeeneet@gmail.com", phone: "9962687633", website: "rkvisionacademy.com", businessType: "NEET/JEE coaching", notes: "Anna Nagar, classes 8-12", source: "public_website" },

  // Bangalore — Education
  { domain: "education", businessName: "Excel Academics", city: "Bangalore", email: "excel.neet@gmail.com", phone: "9036357499", website: "excelac.in", businessType: "NEET/KCET/JEE coaching", notes: "15 years, PU integrated classes", source: "public_website" },
  { domain: "education", businessName: "IITIANS Way", city: "Bangalore", email: "iitiansway@gmail.com", phone: "7411000111", website: "iitiansway.com", businessType: "NEET/JEE coaching", notes: "Panathur", source: "public_website" },
  { domain: "education", businessName: "Centum Academy", city: "Bangalore", email: "contactus@centumacademy.com", phone: "", website: "centumacademy.com", businessType: "JEE/NEET coaching", notes: "grades 8-12, multiple locations", source: "public_website" },

  // Mumbai — Clinics
  { domain: "clinic", businessName: "Sanghvi's Dental Clinic", city: "Mumbai", email: "draashalsanghvi@gmail.com", phone: "9819801940", website: "sanghvisdentalclinic.com", businessType: "Dental clinic", notes: "Santacruz West", source: "public_website" },
  { domain: "clinic", businessName: "Giggles & Grins Kids Dentistry", city: "Mumbai", email: "gigglesgrinsmumbai@gmail.com", phone: "8072710242", website: "gigglesgrins.org", businessType: "Pediatric dental clinic", notes: "airway-focused kids dentistry, Dadar", source: "public_website" },
  { domain: "clinic", businessName: "One Dental Solutions", city: "Mumbai", email: "aseem.dr@gmail.com", phone: "8779376034", website: "", businessType: "Orthodontics & kids dentistry", notes: "Dr Aseem Agrawal, Malad West", source: "public_listing" },

  // Kolkata — Clinics
  { domain: "clinic", businessName: "Dentistree Kolkata", city: "Kolkata", email: "dentistreekolkata@gmail.com", phone: "3322650692", website: "dentistreekolkata.com", businessType: "Dental clinic", notes: "Park Street, implants/RCT/cosmetic", source: "public_website" },
  { domain: "clinic", businessName: "Dr Sofia Hawelia Orthodontics", city: "Kolkata", email: "drsofiahawelia@gmail.com", phone: "", website: "drsofiahawelia.in", businessType: "Orthodontic clinic", notes: "Brace Up Dentistry, Salt Lake", source: "public_website" },
  { domain: "clinic", businessName: "Dr Kanupriya Advanced Dentistry", city: "Kolkata", email: "care@drkanupriya.in", phone: "9831246464", website: "drkanupriya.in", businessType: "Dental clinic", notes: "AJC Bose Road", source: "public_website" },

  // Bangalore — Hospitals
  { domain: "hospital", businessName: "Trust-In Multispeciality Hospital", city: "Bangalore", email: "trustinhospital1@gmail.com", phone: "", website: "trustinhospital.com", businessType: "Multispeciality hospital", notes: "Horamavu", source: "public_website" },
  { domain: "hospital", businessName: "Vimalalaya Super Speciality Hospital", city: "Bangalore", email: "vimalalayahospital@gmail.com", phone: "", website: "vimalalayahospital.com", businessType: "Super-speciality hospital", notes: "Electronic City", source: "public_website" },
  { domain: "hospital", businessName: "HIMAS Institute", city: "Bangalore", email: "himasglobalhospitals@gmail.com", phone: "7899824417", website: "himasindia.com", businessType: "Hospital & institute", notes: "Basavanagudi", source: "public_website" },

  // Delhi — Salons
  { domain: "salon", businessName: "Krushhh By Konica", city: "Delhi", email: "krushhbykonica@gmail.com", phone: "9811296961", website: "krushhhbykonica.com", businessType: "Premium beauty salon", notes: "upmarket salon + makeup academy", source: "public_listing" }
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
