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
  retiree: { weight: 8, signals: ["retired", "pension", "senior citizen"] },
  car_owner: {
    weight: 16,
    signals: [
      "car owner", "car hai", "car rakhta", "car rakhti", "4 wheeler", "four wheeler",
      "4-wheeler", "four-wheel", "hatchback", "suv", "sedan", "vehicle insurance",
      "car insurance", "insured car", "own a car", "car ke", "car ki", "car value"
    ]
  }
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
  if (primary === "car_owner") return "family_protection";
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

// Tutoring outreach is a single consistent B2B partner pitch to centres.
function tutoringInferQuery() {
  return "partner_maths_tutor";
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
    hooksEn: {
      direct_bookings: "Every OTA booking costs you 15-25% in commission. Direct bookings from a proper website go straight to you — the most cost-effective marketing there is.",
      online_presence: "Today's traveller checks Google before booking. Without an online presence you lose customers to competitors — and still pay commission.",
      reviews_google: "Google reviews are your digital storefront. Managed well, they bring bookings on their own.",
      seasonal_packages: "Turn off-season into on-season — the right packages and offers keep your rooms full all year.",
      wedding_events: "Weddings & events are the biggest revenue stream for hotels — a proper event page unlocks that game."
    },
    brandLines: [
      "Mai GARUDA hoon — hotels ke liye direct bookings aur digital presence ka AI system.",
      "Koi pressure nahi, koi jhutha wada nahi — sirf sahi jaankari aur kaam."
    ],
    brandLinesEn: [
      "I'm GARUDA — an AI system for hotels that grows direct bookings and online presence.",
      "No pressure, no false promises — just the right information and real work."
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
    hooksEn: {
      patient_leads: "Today 70% of patients search online before they visit a hospital. If you're not present online, that lead goes to someone else.",
      online_reputation: "Patients choose based on reviews. A positive reputation means more admissions.",
      appointment_booking: "Online booking reduces reception load, improves patient experience, and means no lead is ever missed.",
      health_awareness: "Health camps and checkup offers make you the most trusted provider in your area.",
      google_maps: "The right Google Maps presence lets nearby patients find you instantly."
    },
    brandLines: [
      "Mai GARUDA hoon — hospitals aur clinics ke liye patient growth ka AI system.",
      "Transparent, genuine, koi jhutha wada nahi."
    ],
    brandLinesEn: [
      "I'm GARUDA — an AI system that grows patient volume for hospitals and clinics.",
      "Transparent, genuine, and no false promises."
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
    hooksEn: {
      direct_orders: "Delivery platforms take 25-30% of every order. Direct orders mean the profit stays with you.",
      delivery_commission: "Cut delivery-app commission down — build your own ordering line and grow your margin.",
      online_menu: "If your menu isn't online, a hungry customer moves on before finding you.",
      customer_reviews: "Reviews and ratings matter more than your menu — positive reviews create repeat customers.",
      local_visibility: "People nearby search 'restaurant near me' — you should be what they find."
    },
    brandLines: [
      "Mai GARUDA hoon — restaurants ke liye direct orders aur profit margin ka AI system.",
      "Koi jhutha wada nahi, sirf kaam."
    ],
    brandLinesEn: [
      "I'm GARUDA — an AI system that drives direct orders and profit margins for restaurants.",
      "No false promises, just results."
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
    hooksEn: {
      student_admissions: "With the right digital presence, seats fill faster in admission season — without offering discounts.",
      online_courses: "Add an online course alongside offline classes — double the revenue from the same faculty.",
      parent_trust: "Results and success stories are the strongest trust signals online.",
      admission_leads: "Converting enquiries into admissions is a system — forms plus follow-up equals admissions.",
      course_promotion: "Targeted campaigns bring the right students — only the ones genuinely interested."
    },
    brandLines: [
      "Mai GARUDA hoon — coaching institutes ke liye admissions growth ka AI system.",
      "Transparent, result-focussed, koi jhutha wada nahi."
    ],
    brandLinesEn: [
      "I'm GARUDA — an AI system that grows admissions for coaching institutes.",
      "Transparent, result-focused, and no false promises."
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
    hooksEn: {
      buyer_leads: "The property business runs on leads — verified buyer leads from the right source close bookings.",
      project_visibility: "The first 30 days of online visibility after a launch decide how fast you sell.",
      property_listings: "Quality listings with strong photos online mean more walk-ins and less reliance on word of mouth.",
      broker_outreach: "Manage channel partners with a system — a broker network means faster sales.",
      nri_investors: "NRIs are the biggest investor base in property — the right digital outreach is a game changer with them."
    },
    brandLines: [
      "Mai GARUDA hoon — real estate ke liye buyer leads aur project growth ka AI system.",
      "Verified leads, koi jhutha wada nahi."
    ],
    brandLinesEn: [
      "I'm GARUDA — an AI system for buyer leads and project growth in real estate.",
      "Verified leads, no false promises."
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
      trial_signups: "Trial signup system = aapko kabhi khali gym nahi millegi.",
      retention: "Existing member retain karna 5x sasta hai naya laane se — engagement system wo kaam karta hai.",
      local_leads: "'Gym near me' searches local customers ko aapke paas laati hain."
    },
    hooksEn: {
      membership_sales: "Every month you need new memberships — a digital funnel converts trials into members.",
      online_presence: "A potential member Googles before walking in. Without presence, they go to your competitor.",
      trial_signups: "A trial signup system means you'll never have an empty floor.",
      retention: "Retaining an existing member is 5x cheaper than acquiring a new one — an engagement system does that work.",
      local_leads: "'Gym near me' searches bring local customers straight to your door."
    },
    brandLines: [
      "Mai GARUDA hoon — gyms ke liye membership growth ka AI system.",
      "Koi jhutha wada nahi, sirf members."
    ],
    brandLinesEn: [
      "I'm GARUDA — an AI system that grows memberships for gyms.",
      "No false promises, just members."
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
    hooksEn: {
      patient_appointments: "OPD growth happens through online presence — 70% of patients search first.",
      online_booking: "Online appointment booking means no patient is missed and less reception load.",
      reputation: "Reviews matter for a doctor's trust — a positive digital reputation means more patients.",
      local_patients: "Patients in your area search 'doctor near me' — they should find you.",
      followup: "Follow-up reminders increase repeat visits and treatment completion."
    },
    brandLines: [
      "Mai GARUDA hoon — clinics ke liye patient growth ka AI system.",
      "Genuine, transparent, koi jhutha wada nahi."
    ],
    brandLinesEn: [
      "I'm GARUDA — an AI system that grows patients for clinics.",
      "Genuine, transparent, and no false promises."
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
    hooksEn: {
      booking_sales: "Salon business runs on appointments — digital booking means the chair is never empty.",
      online_presence: "Clients check Instagram and Google first — presence means new clients.",
      repeat_customers: "Repeat customers are a salon's real revenue — a loyalty system holds onto them.",
      offers_packages: "The right packages fill slow days — memberships mean predictable income.",
      local_visibility: "'Salon near me' searches bring clients from your area straight to you."
    },
    brandLines: [
      "Mai GARUDA hoon — salons ke liye bookings growth ka AI system.",
      "Koi jhutha wada nahi, sirf booked appointments."
    ],
    brandLinesEn: [
      "I'm GARUDA — an AI system that grows bookings for salons.",
      "No false promises, just booked appointments."
    ],
    defaultTopic: "booking_sales",
    inferQuery: genericInferQuery,
    knowledgeIndexPath: "data/salon-knowledge-index.json",
    website: "garudaos.in"
  },

  web_services: {
    id: "web_services",
    label: "Website / Content / Social Services",
    namespace: "web_services",
    topics: ["website_build", "content_writing", "social_media", "redesign", "digital_presence"],
    topicKeywords: {
      website_build: ["website", "site", "build", "create", "web design", "web designer", "landing page", "webpage"],
      content_writing: ["content", "writer", "copy", "blog", "seo", "article", "writing"],
      social_media: ["social media", "instagram", "facebook", "marketing", "content calendar", "posts"],
      redesign: ["redesign", "rebuild", "rework", "improve", "update site", "modernize"],
      digital_presence: ["presence", "online", "digital", "grow", "visibility", "found"]
    },
    segments: {
      business_owner: { weight: 45, signals: ["business", "owner", "founder", "director", "company", "firm", "studio", "agency", "restaurant", "hotel", "shop", "clinic", "chamber"] },
      small_business: { weight: 25, signals: ["small", "local", "independent", "sme", "startup", "family"] },
      non_profit: { weight: 15, signals: ["nonprofit", "non-profit", "ngo", "chamber", "visitors bureau", "association"] },
      urgent: { weight: 15, signals: ["rfp", "proposal", "bidding", "hiring", "seeking", "looking for", "contractor"] }
    },
    hooks: {
      website_build: "Ek professional website aapke business ka digital storefront hai — sahi build se customers pehli nazar me trust karte hain.",
      content_writing: "Content wahi hai jo Google par aapko dikhata hai — sahi copy customers ko action par le jaati hai.",
      social_media: "Social presence consistent na ho toh brand yad nahi rehta — sahi strategy se posts sales ban jati hain.",
      redesign: "Purana website customers ko door bhagata hai — modern redesign se conversions turant badhti hain.",
      digital_presence: "Aaj customer pehle online check karta hai — complete digital presence hi asli growth hai."
    },
    hooksEn: {
      website_build: "A professional website is your business's digital storefront — the right build earns trust at first glance.",
      content_writing: "Content is what makes you visible on Google — the right copy moves people to act.",
      social_media: "An inconsistent social presence makes a brand forgettable — the right strategy turns posts into sales.",
      redesign: "An outdated website drives customers away — a modern redesign lifts conversions immediately.",
      digital_presence: "Customers check online first today — a complete digital presence is real growth."
    },
    brandLines: [
      "Mai GARUDA hoon — websites, content aur social media se business growth ka AI system.",
      "Koi jhutha wada nahi, sirf deliver karta hoon."
    ],
    brandLinesEn: [
      "I'm GARUDA — an AI system that grows businesses through websites, content, and social media.",
      "No false promises — I just deliver."
    ],
    defaultTopic: "digital_presence",
    inferQuery: genericInferQuery,
    knowledgeIndexPath: "data/web-services-knowledge-index.json",
    website: "garudaos.in"
  },

  tutoring: {
    id: "tutoring",
    label: "Tutoring Centers (USA/UAE/Australia) — Online Maths Tutor Partnership — Videshi & Australia",
    namespace: "tutoring",
    topics: ["partner_maths_tutor", "online_tutor_network", "curriculum_maths", "quality_and_reports", "australia_hsc", "videshi_parents", "foreign_students"],
    topicKeywords: {
      partner_maths_tutor: ["partner", "tutor", "maths", "math", "teacher", "faculty", "staff", "hire", "add"],
      online_tutor_network: ["online", "virtual", "remote", "zoom", "live class", "network", "capacity"],
      curriculum_maths: ["cbse", "icse", "grade 8", "class 8", "middle school", "curriculum", "syllabus"],
      quality_and_reports: ["quality", "results", "retention", "progress", "reports", "admin"],
      australia_hsc: ["hsc", "atar", "naplan", "victorian curriculum", "australia", "sydney", "melbourne", "brisbane"],
      videshi_parents: ["videshi", "foreign", "expat", "nri", "overseas", "indian community", "parents looking", "parent"],
      foreign_students: ["foreign student", "international student", "expat family", "videshi", "australia", "america", "dubai"]
    },
    segments: {
      tutoring_center: {
        weight: 45,
        signals: [
          "tutoring", "tutoring center", "learning center", "academy", "tuition",
          "after school", "afterschool", "test prep", "education center", "study center",
          "mathnasium", "kumon", "tuition centre", "learning centre", "coaching"
        ]
      },
      small_business: { weight: 25, signals: ["small", "local", "independent", "family run", "mom and pop", "home tuition", "single location"] },
      premium: { weight: 20, signals: ["international", "cbse", "icse", "american curriculum", "british curriculum", "premium", "elite", "private school", "hsc", "atar", "australia"] },
      chain: { weight: 15, signals: ["chain", "franchise", "multiple", "group", "locations", "brand", "network"] },
      parent_foreign: { weight: 35, signals: ["foreign parent", "expat", "expat family", "foreign student", "international student", "videshi", "overseas parent", "parents looking"] },
      parent_videshi: { weight: 35, signals: ["videshi", "videshi parents", "foreign parents", "expat parents", "indian parents australia", "nri parents"] },
      australia_centre: { weight: 30, signals: ["australia", "sydney", "melbourne", "brisbane", "perth", "hsc", "atar", "naplan"] }
    },
    hooks: {
      partner_maths_tutor: "We have a verified online maths tutor for Class 8 and below ready to join your roster — you pay only for the classes you use, no fixed salary, no recruitment cost.",
      online_tutor_network: "Expand your centre's capacity without hiring — an on-demand online maths tutor covers extra batches and waitlists instantly.",
      curriculum_maths: "Class 8 maths (CBSE, ICSE, or US curriculum) covered by a dedicated online tutor — a clean add-on to your existing batches.",
      quality_and_reports: "Every class comes with a structured progress report — better results and retention for your families, zero extra admin for your staff.",
      australia_hsc: "Australia HSC/ATAR maths (Sydney, Melbourne, Brisbane) — verified online tutor for Year 7-8, NAPLAN aligned, weekly reports for Aussie parents.",
      videshi_parents: "Parents in Australia/Dubai/America looking for maths tutor for their kids — patient, English-fluent online teacher, IEP-aligned for every child.",
      foreign_students: "Parents in Australia, America and Dubai — your child gets a dedicated online maths tutor, any curriculum (CBSE/ICSE/HSC/Common Core), pay per class."
    },
    hooksEn: {
      partner_maths_tutor: "We have Vaishali (@vaishali_m16) — verified online maths tutor for Class 8 and below ready to join your roster — you pay only for the classes you use, no fixed salary. Contact her on Instagram: @vaishali_m16.",
      online_tutor_network: "Expand your centre's capacity with Vaishali (@vaishali_m16) — an on-demand online maths tutor for Class 8 and below covers extra batches instantly. Instagram: @vaishali_m16.",
      curriculum_maths: "Class 8 maths (CBSE, ICSE, US, HSC, Australia) with Vaishali (@vaishali_m16) — a dedicated online tutor for your batches. Contact on Instagram: @vaishali_m16.",
      quality_and_reports: "Every class with Vaishali (@vaishali_m16) comes with a structured progress report — better results for your families, zero extra admin.",
      australia_hsc: "Australia HSC/ATAR maths (Sydney, Melbourne, Brisbane) — Vaishali (@vaishali_m16), verified for Year 7-8, NAPLAN aligned. Contact on Instagram: @vaishali_m16.",
      videshi_parents: "Parents in Australia, Dubai and America — Vaishali (@vaishali_m16) teaches maths up to 8th class for your child, any curriculum, English-fluent and patient. Please contact her on Instagram: @vaishali_m16.",
      foreign_students: "Parents in Australia, America and Dubai — Vaishali (@vaishali_m16) teaches maths up to 8th class, any curriculum (CBSE/ICSE/HSC/Common Core), pay per class. Instagram: @vaishali_m16."
    },
    brandLines: [
      "I'm GARUDA — connecting tutoring centres with verified online maths tutor Vaishali (Instagram: @vaishali_m16) for Class 8 and below.",
      "Vaishali teaches maths up to 8th class — for students in Australia, Dubai and America, any curriculum. Contact her on Instagram: @vaishali_m16. Parents will let Vaishali know that GARUDA gave them her information, so they contacted her.",
      "Leads generated by GARUDA — your centre/parents data is never shared with anyone."
    ],
    brandLinesEn: [
      "I'm GARUDA — connecting you to Vaishali (Instagram: @vaishali_m16), verified online maths tutor for Class 8 and below.",
      "Vaishali teaches maths up to 8th class for your child — Australia, Dubai and America, any curriculum. Please contact her on Instagram: @vaishali_m16. When parents contact Vaishali, they will let her know that GARUDA gave them her information.",
      "Leads generated by GARUDA — your data is never shared."
    ],
    defaultTopic: "partner_maths_tutor",
    inferQuery: tutoringInferQuery,
    knowledgeIndexPath: "data/tutoring-knowledge-index.json",
    website: "garudaos.in",
    locale: "en"
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
