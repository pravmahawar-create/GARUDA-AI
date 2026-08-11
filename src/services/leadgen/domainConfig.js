// GARUDA Lead-gen multi-domain configuration.
// FD-107: lead-gen is NOT company-specific. Every domain defines its own topics,
// segment signals/weights, pitch hooks, brand line and data namespace. The generic
// engine in outreachEngine.js consumes these configs so ANY industry can run leads.
// Existing insurance services are intentionally NOT touched; "insurance" is the
// first domain config here and mirrors the locked ABSLI positioning.

const INSURANCE_TOPICS = [
  "family_protection",
  "savings_investment",
  "child_education",
  "cancer_health",
  "tax"
];

const INSURANCE_TOPIC_KEYWORDS = {
  family_protection: ["term", "protection", "death benefit", "sum assured", "family", "nominee", "life cover", "risk cover"],
  savings_investment: ["savings", "investment", "wealth", "guaranteed", "maturity", "returns", "annuity", "pension"],
  child_education: ["child", "education", "school", "college", "future", "kids"],
  cancer_health: ["cancer", "health", "critical illness", "hospital", "medical", "shield"],
  tax: ["tax", "section 80c", "income tax"]
};

const INSURANCE_SEGMENTS = {
  business_owner: {
    weight: 28,
    signals: [
      "shop", "store", "business", "owner", "propriet", "trader", "dealer", "enterprise",
      "manufacturer", "exporter", "importer", "wholesale", "retail", "gst", "msme",
      "sole", "partnership", "private limited", "pvt ltd", "llp", "founder", "director",
      "clinic", "studio", "salon", "parlour", "cold stor", "godown", "workshop",
      "restaurant", "cafe", "contractor", "builder", "auto", "garage", "trading",
      "traders", "textile", "garment", "handloom", "pharma", "distribution", "distributor",
      "agency", "firm", "industries", "processors", "mills", "agencies"
    ]
  },
  parent: { weight: 18, signals: ["children", "child", "kids", "son", "daughter", "family", "school", "college"] },
  salaried: { weight: 12, signals: ["employee", "salaried", "professional", "engineer", "manager", "officer", "bank", "it", "consultant", "chartered", "doctor", "lawyer"] },
  retiree: { weight: 8, signals: ["retired", "pension", "senior citizen"] }
};

const INSURANCE_HOOKS = {
  family_protection: "Aapke parivaar ki suraksha ka matlab sirf savings nahi — jab paisa sahi jagah rakha jaye, toh wo khud aapke family ka shield ban jata hai.",
  savings_investment: "Investment ₹30,000 se shuru hota hai — aur saath me aata hai growth, suraksha, aur flexibility.",
  child_education: "Bachpan ke sapne aapke saath aur aapke baad bhi pura ho sakein — isliye aaj ka smart investment kal ka shield banta hai.",
  cancer_health: "Health aur financial stability ek hi sikke ke do pehlu hain — medical emergency ke samay aapki taraf jo khada ho, wahi asli suraksha hai.",
  tax: "Tax bachana ek smart financial move hai — aur ye kuch plans ke saath naturally juda hua hai."
};

const INSURANCE_BRAND_LINES = [
  "Mai GARUDA hoon — ek AI Financial Advisor, aur Aditya Birla Sun Life (ABSLI) ka official financial partner.",
  "Ye figures ABSLI ke official documents se verified hain — par exact benefits aapke plan, terms & conditions aur underwriting par depend karte hain.",
  "Aur haan — poori detail aap garudaos.in par bhi dekh sakte hain.",
  "Koi pressure nahi, koi jhutha wada nahi. Sirf sahi jaankari — kyunki suraksha tabhi asli hai jab wo transparent ho."
];

function insuranceInferQuery(segments) {
  const primary = segments[0] ? segments[0].segment : "";
  const hasChildren = segments.some((s) => s.segment === "parent");
  if (primary === "business_owner" && hasChildren) return "child_education";
  if (primary === "business_owner") return "savings_investment";
  if (hasChildren) return "child_education";
  if (primary === "retiree") return "savings_investment";
  if (primary === "salaried") return "family_protection";
  return "family_protection";
}

// Generic domain registry. Add a new industry by appending a config here
// (topics, segments, hooks, brand lines, data namespace, inferQuery).

function genericInferQuery(segments) {
  const primary = segments[0] ? segments[0].segment : "";
  if (primary === "business_owner" || primary === "owner") return "growth";
  if (primary === "small_business") return "visibility";
  if (primary === "premium") return "conversion";
  return "awareness";
}

const DOMAINS = {
  insurance: {
    id: "insurance",
    label: "Insurance / ABSLI",
    namespace: "insurance",
    topics: INSURANCE_TOPICS,
    topicKeywords: INSURANCE_TOPIC_KEYWORDS,
    segments: INSURANCE_SEGMENTS,
    hooks: INSURANCE_HOOKS,
    brandLines: INSURANCE_BRAND_LINES,
    defaultTopic: "family_protection",
    inferQuery: insuranceInferQuery,
    knowledgeIndexPath: "data/knowledge-index.json",
    website: "garudaos.in"
  },

  hotel: {
    id: "hotel",
    label: "Hotels & Hospitality",
    namespace: "hotel",
    topics: ["direct_bookings", "online_presence", "reviews_google", "seasonal_packages", "wedding_events"],
    topicKeywords: {
      direct_bookings: ["booking", "book", "ota", "commission", "direct booking", "reservation"],
      online_presence: ["website", "google", "listing", "online", "presence", "discover"],
      reviews_google: ["reviews", "rating", "google reviews", "reputation", "stars"],
      seasonal_packages: ["package", "season", "peak", "offer", "discount", "stay"],
      wedding_events: ["wedding", "event", "banquet", "function", "conference"]
    },
    segments: {
      business_owner: { weight: 40, signals: ["hotel", "resort", "homestay", "inn", "lodge", "guesthouse", "owner", "manager", "propriet"] },
      premium: { weight: 20, signals: ["4 star", "5 star", "luxury", "premium", "boutique", "heritage"] },
      small_business: { weight: 25, signals: ["budget hotel", "small", "family run", "pgs", "local"] },
      chain: { weight: 15, signals: ["chain", "group", "multiple", "properties", "brand"] }
    },
    hooks: {
      direct_bookings: "Har OTA booking par 15-25% commission jaata hai. Direct bookings ek website se seedha aapke paas — wahi sabse sasta marketing hai.",
      online_presence: "Aaj ka tourist booking se pehle Google par check karta hai. Online presence na ho toh aap customer khote ho, commission ke saath.",
      reviews_google: "Google reviews aapka digital storefront hai. Reviews manage ho toh bookings khud badh jaati hain.",
      seasonal_packages: "Off-season ko on-season banao — sahi package offers se rooms empty na rahein.",
      wedding_events: "Wedding & event business hotels ka sabse bada revenue hai — ek proper event pitch page us game ko unlock karta hai."
    },
    brandLines: [
      "Mai GARUDA hoon — hotels ke liye direct bookings aur digital presence ka AI system.",
      "Koi pressure nahi, koi jhutha wada nahi — sirf sahi jaankari aur kaam."
    ],
    defaultTopic: "direct_bookings",
    inferQuery: genericInferQuery,
    knowledgeIndexPath: "data/hotel-knowledge-index.json",
    website: "garudaos.in"
  },

  hospital: {
    id: "hospital",
    label: "Hospitals & Clinics",
    namespace: "hospital",
    topics: ["patient_leads", "online_reputation", "appointment_booking", "health_awareness", "google_maps"],
    topicKeywords: {
      patient_leads: ["patient", "lead", "enquiry", "admission", "appointment", "consultation"],
      online_reputation: ["reviews", "rating", "reputation", "google", "trust"],
      appointment_booking: ["book", "appointment", "slot", "schedule", "online booking"],
      health_awareness: ["awareness", "health camp", "checkup", "prevention", "screening"],
      google_maps: ["google maps", "location", "map", "nearby", "direction"]
    },
    segments: {
      business_owner: { weight: 40, signals: ["hospital", "clinic", "nursing home", "polyclinic", "director", "owner", "md", "admin"] },
      small_business: { weight: 25, signals: ["clinic", "doctor", "small", "single", "practice"] },
      premium: { weight: 20, signals: ["multispecialty", "super speciality", "tertiary", "chain", "group"] },
      urgent: { weight: 15, signals: ["emergency", "24x7", "24/7", "critical"] }
    },
    hooks: {
      patient_leads: "Aaj 70% patients pehle online search karte hain phir hospital aate hain. Online present na ho toh woh lead kisi aur ko jaati hai.",
      online_reputation: "Patients reviews padh ke choose karte hain. Positive reputation = zyada admissions.",
      appointment_booking: "Online booking se reception ka load kam, patient experience behtar, aur koi lead miss nahi hota.",
      health_awareness: "Health camps aur checkup offers se aap area ke sabse zyada trusted provider bante ho.",
      google_maps: "Google Maps pe sahi presence = nearby patients turant aapko dhoondh lete hain."
    },
    brandLines: [
      "Mai GARUDA hoon — hospitals aur clinics ke liye patient growth ka AI system.",
      "Transparent, genuine, koi jhutha wada nahi."
    ],
    defaultTopic: "patient_leads",
    inferQuery: genericInferQuery,
    knowledgeIndexPath: "data/hospital-knowledge-index.json",
    website: "garudaos.in"
  },

  restaurant: {
    id: "restaurant",
    label: "Restaurants & Cafes",
    namespace: "restaurant",
    topics: ["direct_orders", "delivery_commission", "online_menu", "customer_reviews", "local_visibility"],
    topicKeywords: {
      direct_orders: ["order", "direct order", "call", "whatsapp order", "takeaway", "dine in"],
      delivery_commission: ["zomato", "swiggy", "commission", "delivery app", "platform fee"],
      online_menu: ["menu", "online menu", "photo", "dish", "website"],
      customer_reviews: ["reviews", "rating", "google", "repeat customer", "loyalty"],
      local_visibility: ["google", "nearby", "search", "local", "visibility", "found"]
    },
    segments: {
      business_owner: { weight: 45, signals: ["restaurant", "cafe", "owner", "chef", "propriet", "hotel restaurant", "dhaba", "fast food", "cloud kitchen"] },
      small_business: { weight: 25, signals: ["small", "family run", "single outlet", "local"] },
      premium: { weight: 15, signals: ["fine dining", "multi outlet", "chain", "bistro"] },
      cloud: { weight: 15, signals: ["cloud kitchen", "dark kitchen", "delivery only"] }
    },
    hooks: {
      direct_orders: "Zomato/Swiggy har order par 25-30% le jaate hain. Direct orders = profit seedha aapke paas.",
      delivery_commission: "Delivery apps commission kam karo — apni ordering line se profit margin badao.",
      online_menu: "Menu online me nahi hai toh hungry customer dhoondhte dhoondhte aapko chhod ke chala jaata hai.",
      customer_reviews: "Reviews aur ratings aapka menu se zyada farq deta hai — positive reviews = repeat customers.",
      local_visibility: "Aas paas ke log google par 'restaurant near me' search karte hain — unhe aap dikhna chahiye."
    },
    brandLines: [
      "Mai GARUDA hoon — restaurants ke liye direct orders aur profit margin ka AI system.",
      "Koi jhutha wada nahi, sirf kaam."
    ],
    defaultTopic: "direct_orders",
    inferQuery: genericInferQuery,
    knowledgeIndexPath: "data/restaurant-knowledge-index.json",
    website: "garudaos.in"
  },

  education: {
    id: "education",
    label: "Education & Coaching",
    namespace: "education",
    topics: ["student_admissions", "online_courses", "parent_trust", "admission_leads", "course_promotion"],
    topicKeywords: {
      student_admissions: ["admission", "enrolment", "enrollment", "student", "batch", "seat"],
      online_courses: ["course", "online course", "e-learning", "classes", "coaching", "tuition"],
      parent_trust: ["parent", "trust", "result", "topper", "success", "placement"],
      admission_leads: ["lead", "enquiry", "register", "enroll now", "apply"],
      course_promotion: ["promotion", "campaign", "awareness", "demo class", "webinar"]
    },
    segments: {
      business_owner: { weight: 40, signals: ["coaching", "institute", "academy", "school", "college", "director", "founder", "owner"] },
      small_business: { weight: 25, signals: ["tuition", "small", "home", "local", "single"] },
      premium: { weight: 20, signals: ["cbse", "icse", "competitive", "jee", "neet", "upsc", "international"] },
      chain: { weight: 15, signals: ["chain", "branch", "multiple", "group", "franchise"] }
    },
    hooks: {
      student_admissions: "Admission season me sahi digital presence hoti hai toh seats pehle bharte hain — bina discount ke.",
      online_courses: "Offline ke saath online course add karo — ek hi faculty se double revenue.",
      parent_trust: "Results aur success stories digital par sabse bada trust signal hain.",
      admission_leads: "Enquiry ko lead me badalna system se hota hai — form + follow-up = admission.",
      course_promotion: "Targeted campaigns se sahi students aate hain, sirf interested wale."
    },
    brandLines: [
      "Mai GARUDA hoon — coaching institutes ke liye admissions growth ka AI system.",
      "Transparent, result-focussed, koi jhutha wada nahi."
    ],
    defaultTopic: "student_admissions",
    inferQuery: genericInferQuery,
    knowledgeIndexPath: "data/education-knowledge-index.json",
    website: "garudaos.in"
  },

  realestate: {
    id: "realestate",
    label: "Real Estate & Property",
    namespace: "realestate",
    topics: ["buyer_leads", "project_visibility", "property_listings", "broker_outreach", "nri_investors"],
    topicKeywords: {
      buyer_leads: ["buyer", "buy", "leads", "customer", "inquiry", "enquiry", "interested"],
      project_visibility: ["project", "launch", "visibility", "online", "presence", "showcase"],
      property_listings: ["listing", "property", "flats", "plots", "apartments", "villa"],
      broker_outreach: ["broker", "channel", "partner", "agent", "outreach", "referral"],
      nri_investors: ["nri", "investment", "investor", "gulf", "abroad", "return"]
    },
    segments: {
      business_owner: { weight: 45, signals: ["builder", "developer", "realtor", "broker", "agency", "real estate", "property", "owner"] },
      premium: { weight: 20, signals: ["luxury", "premium", "gated", "high end", "commercial"] },
      small_business: { weight: 20, signals: ["small", "local", "independent", "single project"] },
      chain: { weight: 15, signals: ["chain", "group", "multiple projects", "franchise"] }
    },
    hooks: {
      buyer_leads: "Property business leads pe chalta hai — sahi source se verified buyer leads = booking closed.",
      project_visibility: "Project launch pe pehle 30 din online visibility decide karti hai booking speed.",
      property_listings: "Proper listings with quality photos online = zyada walk-ins, kam word-of-mouth dependency.",
      broker_outreach: "Channel partners system se manage karo — broker network = fast sales.",
      nri_investors: "NRIs property ka sabse bada investor base hain — unke liye sahi digital outreach game changer hai."
    },
    brandLines: [
      "Mai GARUDA hoon — real estate ke liye buyer leads aur project growth ka AI system.",
      "Verified leads, koi jhutha wada nahi."
    ],
    defaultTopic: "buyer_leads",
    inferQuery: genericInferQuery,
    knowledgeIndexPath: "data/realestate-knowledge-index.json",
    website: "garudaos.in"
  },

  gym: {
    id: "gym",
    label: "Gyms & Fitness",
    namespace: "gym",
    topics: ["membership_sales", "online_presence", "trial_signups", "retention", "local_leads"],
    topicKeywords: {
      membership_sales: ["membership", "join", "enroll", "plan", "fees", "monthly"],
      online_presence: ["website", "online", "google", "presence", "discover"],
      trial_signups: ["trial", "free", "demo session", "signup", "first class"],
      retention: ["retention", "renew", "dropout", "engage", "members"],
      local_leads: ["near me", "local", "nearby", "gym in", "fitness near"]
    },
    segments: {
      business_owner: { weight: 40, signals: ["gym", "fitness", "trainer", "owner", "studio", "crossfit", "yoga"] },
      small_business: { weight: 30, signals: ["small", "local", "independent", "single"] },
      premium: { weight: 15, signals: ["boutique", "premium", "luxury", "high end"] },
      chain: { weight: 15, signals: ["chain", "multiple", "franchise", "group"] }
    },
    hooks: {
      membership_sales: "Har mahine naye memberships chahiye hoti hain — digital funnel se trail se membership tak conversion.",
      online_presence: "Potential member pehle google karta hai phir gym aata hai — presence na ho toh woh competitor ko jaata hai.",
      trial_signups: "Trial signup system = aapko kabhi khali gym nahi milegi.",
      retention: "Existing member retain karna 5x sasta hai naya laane se — engagement system wo kaam karta hai.",
      local_leads: "'Gym near me' searches local customers ko aapke paas laati hain."
    },
    brandLines: [
      "Mai GARUDA hoon — gyms ke liye membership growth ka AI system.",
      "Koi jhutha wada nahi, sirf members."
    ],
    defaultTopic: "membership_sales",
    inferQuery: genericInferQuery,
    knowledgeIndexPath: "data/gym-knowledge-index.json",
    website: "garudaos.in"
  },

  clinic: {
    id: "clinic",
    label: "Clinics & Doctors",
    namespace: "clinic",
    topics: ["patient_appointments", "online_booking", "reputation", "local_patients", "followup"],
    topicKeywords: {
      patient_appointments: ["appointment", "patient", "consult", "visit", "opd", "slot"],
      online_booking: ["book", "online", "booking", "schedule", "calendar"],
      reputation: ["reviews", "rating", "trust", "reputation", "google"],
      local_patients: ["near me", "nearby", "local", "area", "locality"],
      followup: ["follow up", "follow-up", "recall", "reminder", "repeat"]
    },
    segments: {
      business_owner: { weight: 40, signals: ["clinic", "doctor", "dr", "practice", "physician", "dental", "dermatology"] },
      small_business: { weight: 30, signals: ["single", "independent", "small clinic", "general physician"] },
      premium: { weight: 15, signals: ["speciality", "multispeciality", "advanced", "chain"] },
      urgent: { weight: 15, signals: ["emergency", "24x7", "same day"] }
    },
    hooks: {
      patient_appointments: "OPD growth online presence se hoti hai — 70% patients pehle search karte hain.",
      online_booking: "Online appointment booking se koi patient miss nahi hota aur reception load kam hota hai.",
      reputation: "Doctor ke trust me reviews matter karte hain — positive digital reputation = zyada patients.",
      local_patients: "Aapke area ke patients 'doctor near me' search karte hain — unhe aap milne chahiye.",
      followup: "Follow-up reminders se repeat visits aur treatment completion dono badhte hain."
    },
    brandLines: [
      "Mai GARUDA hoon — clinics ke liye patient growth ka AI system.",
      "Genuine, transparent, koi jhutha wada nahi."
    ],
    defaultTopic: "patient_appointments",
    inferQuery: genericInferQuery,
    knowledgeIndexPath: "data/clinic-knowledge-index.json",
    website: "garudaos.in"
  },

  salon: {
    id: "salon",
    label: "Salons & Beauty",
    namespace: "salon",
    topics: ["booking_sales", "online_presence", "repeat_customers", "offers_packages", "local_visibility"],
    topicKeywords: {
      booking_sales: ["booking", "appointment", "service", "cut", "spa", "facial", "treatment"],
      online_presence: ["website", "online", "instagram", "google", "presence"],
      repeat_customers: ["repeat", "regular", "loyalty", "return", "member"],
      offers_packages: ["offer", "package", "discount", "combo", "deal"],
      local_visibility: ["near me", "local", "nearby", "area", "salon near"]
    },
    segments: {
      business_owner: { weight: 40, signals: ["salon", "beauty", "parlour", "spa", "unisex", "owner", "stylist"] },
      small_business: { weight: 30, signals: ["small", "local", "home", "single", "family run"] },
      premium: { weight: 20, signals: ["premium", "luxury", "boutique", "high end", "chain"] },
      chain: { weight: 10, signals: ["chain", "multiple", "franchise", "brand"] }
    },
    hooks: {
      booking_sales: "Salon business appointments pe chalta hai — digital booking se chair kabhi khali nahi rehti.",
      online_presence: "Clients instagram aur google par check karte hain — presence = naye clients.",
      repeat_customers: "Repeat customer salon ka asli revenue hai — loyalty system wo pakadta hai.",
      offers_packages: "Sahi packages off days ko busy karte hain — membership = predictable income.",
      local_visibility: "'Salon near me' searches aapke area ke clients ko aap tak laati hain."
    },
    brandLines: [
      "Mai GARUDA hoon — salons ke liye bookings growth ka AI system.",
      "Koi jhutha wada nahi, sirf booked appointments."
    ],
    defaultTopic: "booking_sales",
    inferQuery: genericInferQuery,
    knowledgeIndexPath: "data/salon-knowledge-index.json",
    website: "garudaos.in"
  }
};

function getDomain(domainId) {
  const domain = DOMAINS[domainId || "insurance"] || DOMAINS.insurance;
  return domain;
}

function listDomains() {
  return Object.values(DOMAINS).map((d) => ({
    id: d.id,
    label: d.label,
    namespace: d.namespace
  }));
}

// Standard intake questions for Business Profile generation (FD-106).
// GARUDA asks these to understand ANY business, then generates outreach from the profile.
const INTAKE_QUESTIONS = [
  { key: "businessName", question: "What is the business name?" },
  { key: "businessType", question: "What kind of business is it?" },
  { key: "offer", question: "What does the business offer / sell?" },
  { key: "targetCustomer", question: "Who is the ideal customer?" },
  { key: "price", question: "What is the typical price / package?" },
  { key: "channels", question: "Where do clients come from today?" },
  { key: "city", question: "Which city / area does it serve?" }
];

function buildBusinessProfile(answers = {}) {
  const profile = {};
  for (const q of INTAKE_QUESTIONS) {
    const value = String(answers[q.key] || "").trim();
    if (value) profile[q.key] = value;
  }
  profile.complete = profile.businessName && profile.offer;
  return profile;
}

module.exports = {
  DOMAINS,
  INTAKE_QUESTIONS,
  buildBusinessProfile,
  getDomain,
  listDomains
};
