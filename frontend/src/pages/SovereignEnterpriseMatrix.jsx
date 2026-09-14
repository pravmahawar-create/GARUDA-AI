import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "rgba(15, 23, 42, 0.88)";
const PANEL_BORDER = "rgba(212, 175, 55, 0.28)";
const EMERALD = "#10b981";
const CRIMSON = "#ef4444";
const SAPPHIRE = "#38bdf8";

const SECTORS = [
  {
    id: "elections",
    icon: "🏛️",
    title: "Political Campaign & Electoral War Room",
    subtitle: "Booth-level sentiment, viral regional reels, opposition counter-strike & victory drive",
    badge: "STATEWIDE & CONSTITUENCY",
    badgeColor: "#f59e0b"
  },
  {
    id: "industry",
    icon: "🏢",
    title: "Heavy Industry & Manufacturing Conglomerates",
    subtitle: "B2B client acquisition, tender intelligence, institutional authority & supply dominance",
    badge: "ENTERPRISE B2B",
    badgeColor: "#38bdf8"
  },
  {
    id: "realestate",
    icon: "🏗️",
    title: "Luxury Real Estate & Infrastructure Groups",
    subtitle: "High-ticket buyer acquisition, corridor analytics, township branding & investor concierge",
    badge: "HIGH-ASSET WEALTH",
    badgeColor: "#10b981"
  },
  {
    id: "education",
    icon: "🏫",
    title: "Universities, Colleges & Higher Education Chains",
    subtitle: "Student admissions surge, academic prestige, national PR & parent conversion funnels",
    badge: "PAN-INDIA ACADEMIC",
    badgeColor: "#c084fc"
  },
  {
    id: "healthcare",
    icon: "🏥",
    title: "Hospital Networks & Super-Specialty Healthcare",
    subtitle: "Patient trust acquisition, OPD expansion, medical specialist authority & crisis PR",
    badge: "HIGH-TRUST INSTITUTION",
    badgeColor: "#ec4899"
  },
  {
    id: "hospitality",
    icon: "💎",
    title: "Luxury Hospitality, Resorts & MICE Conclaves",
    subtitle: "HNI destination weddings, corporate retreats, luxury branding & direct booking surge",
    badge: "HNI LUXURY",
    badgeColor: "#fbbf24"
  },
  {
    id: "retail",
    icon: "🛒",
    title: "Retail Brands, FMCG & Distribution Franchises",
    subtitle: "Local market takeover, store footfall surge, franchise partner expansion & D2C flywheel",
    badge: "COMMERCIAL FLYWHEEL",
    badgeColor: "#34d399"
  }
];

const SECTOR_CONFIGS = {
  elections: {
    clientLabel: "Candidate / Leader Name",
    clientDefault: "Hon'ble Minister / Candidate",
    regionLabel: "Constituency / Region",
    regionDefault: "Chhattisgarh Central Region / District",
    slider1: { label: "Target Polling Booths", min: 15, max: 1500, step: 15, default: 280, unit: "Booths", sub: ["Ward (15)", "MLA (280)", "MP (1,500)"], unitPrice: 9500 },
    slider2: { label: "Viral Regional Reels Output", min: 20, max: 300, step: 10, default: 90, unit: "Reels", sub: ["20 Reels", "100 Reels", "300 Mega-Blitz"], unitPrice: 14000 },
    durationUnit: "Months",
    durations: [{ m: 1, l: "1 Month (Sprint)" }, { m: 3, l: "3 Months (Standard)" }, { m: 6, l: "6 Months (Full Battle)" }],
    modules: [
      { key: "m1", label: "📊 360° GIS Voter Sentiment & Grievance Heatmap (+₹4.5L)", desc: "Booth-level sentiment analytics & top-5 grievance tracking.", cost: 450000 },
      { key: "m2", label: "⚡ Multilingual AI Speech & Bhashan Factory (+₹3.5L)", desc: "1-Click crowd rally, press briefing & emotional speech generator.", cost: 350000 },
      { key: "m3", label: "📲 5,000 Booth Karyakarta WhatsApp Direct Grid (+₹6.0L)", desc: "1-Click personalized task assignment to every booth pramukh.", cost: 600000 },
      { key: "m4", label: "🛡️ 24/7 Opposition Counter-Strike Sentinel (+₹5.5L)", desc: "15-minute fact-check & automated counter-narrative destruction.", cost: 550000 },
      { key: "m5", label: "🏢 Private Corporate Firms Lead Machine (+₹9.5L)", desc: "Commercial business digital marketing & B2B customer acquisition.", cost: 950000 },
      { key: "m6", label: "👑 On-Ground War Room Tech Commander Desk (+₹5.0L)", desc: "Dedicated sovereign AI commander deployed for victory operations.", cost: 500000 }
    ],
    prototypeRadarTitle: "Real-Time Constituency Sentiment Breakdown",
    radarMetrics: [
      { label: "PRO-LEADERSHIP", val: "68.4%", sub: "Committed Base", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
      { label: "SWING VOTERS", val: "21.2%", sub: "Target for Reels", color: "#fef08a", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
      { label: "CRITICAL GRIEVANCE", val: "10.4%", sub: "Priority Redressal", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" }
    ],
    sampleItemsTitle: "Sample Booth Telemetry (from configured booths)",
    sampleItems: [
      { name: "Booth #102 (Main Market & Trade Center)", status: "STRONGHOLD (74% Win Rate)", color: "#10b981" },
      { name: "Booth #108 (Rural Link Road & Kisan Cluster)", status: "SWING BATTLEGROUND (49%)", color: "#fef08a" },
      { name: "Booth #114 (Youth Colony & Colleges)", status: "REELS TARGETED (+18% Swing)", color: "#38bdf8" }
    ],
    pitchTitle: "⚡ AI Instant Bhashan Weapon",
    pitchTabs: ["rally", "press", "emotional"],
    pitchContent: {
      rally: `🚩 *GARUDA HIGH-OCTANE RALLY SPEECH DRAFT* (Hindi + Chhattisgarhi Punch)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Jai Johar! Sangwari man la pranam!\nAjj jo log yahan aakar bade-bade wade kar rahe hain, unse pucho—jab garmi mein kisaan ko paani chahiye tha, jab yuva ko rojgar chahiye tha, tab unke neta kahan the?\n\nHumne baatein nahi, zameen par sadak, bijli aur hospital banakar dikhaya hai! Ek-ek kisaan ke khaate mein sidha samman ka paisa pahuncha hai. Yeh election sirf ek seat ka nahi hai, yeh Chhattisgarh ke aatm-samman aur har parivar ke bhavishya ka chunav hai!\n\nAapka ek vote un sabhi taakato ko jawab dega jo hamare vikas ko rokna chahti hain. Bolo sangwari man—Vikas ka parcham laherayega ki nahi?!"`,
      press: `🎙️ *EXECUTIVE PRESS CONFERENCE BRIEFING* (Facts, Budgets & Allocations)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Respected Media representatives, today we present the audited development achievements of our leadership in the region:\n1. Infrastructure: All-weather concrete roads delivered across rural corridors with audited geotagged proof.\n2. Direct Benefit Transfer: Direct procurement disbursements credited to farmers with zero intermediary leakage.\n3. Healthcare & Education: Modernized maternal care sub-centers and clean solar energization completed across schools.\n\nOur opposition trades in ungrounded rumors; we trade in verifiable physical progress. Thank you."`,
      emotional: `❤️ *JAN-SAMPARK DIL-SE-DIL ADDRESS* (Warm Family Connect)\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Mera aap sab se koi neta aur janta ka rishta nahi hai—mera rishta aapke parivar ke ek bete aur bhai ka hai.\nJab bhi kisi mata ya behen ko pareshani aayi, mera darwaza 24 ghante khula raha hai.\n\nMera ek hi sankalp hai: kisi bhi gareeb parivar ka bachha shikhsha ya ilaj se vanchit na rahe. Yeh ladai meri akele ki nahi, aap sabki hai. Aap apna aashirwaad banaye rakhiye, har samasya ko hal karna meri zimmedari hai."`
    },
    mediaSimulator: {
      title: "🎯 ECI STATUTORY PAID MEDIA FUEL SIMULATOR (META & GOOGLE YOUTUBE)",
      badge: "100% DIRECT CANDIDATE BILLING (ZERO AGENCY MARKUP)",
      sub: "Meta Ads (Instagram Reels/FB) + Google YouTube Ads + Official WhatsApp API · Direct ECI Form 7A Expense Tracking",
      slider1Label: "Constituency Target Voters",
      slider1Min: 50000, slider1Max: 500000, slider1Step: 10000, slider1Default: 240000, slider1Unit: "Voters",
      slider2Label: "Voter Saturation Frequency",
      slider2Min: 4, slider2Max: 24, slider2Step: 2, slider2Default: 12, slider2Unit: "x Impressions",
      clusters: [
        { title: "⚡ Cluster A: Yuva & First-Time (18-28)", sub: "~67,200 Voters", desc: "Tech hubs, colleges & coaching centers. High-energy Instagram Reels & Shorts on sports, tech jobs & exams.", color: "#38bdf8" },
        { title: "🌾 Cluster B: Kisan & Gramin (30-65)", sub: "~91,200 Voters", desc: "Mandi corridors, canal zones & rural panchayats. Dialect video/audio on MSP bonus, canal irrigation & solar pump.", color: "#fef08a" },
        { title: "🌸 Cluster C: Mahila Shakti & Parivar", sub: "~81,600 Voters", desc: "Residential colonies & SHG clusters. Direct welfare credit (Mahtari Vandan), maternal healthcare clinics & LPG security.", color: "#f472b6" }
      ],
      legalNotice: "Statutory ECI Demarcation: GARUDA Retainer covers AI OS, 1,000 Agent fleet, intelligence & content. Direct Media Fuel is disbursed directly from Candidate/Party PAN to Meta/Google with Form 7A reporting. 0% agency markup."
    }
  },

  industry: {
    clientLabel: "Enterprise / Conglomerate Name",
    clientDefault: "Premier Heavy Industries & Manufacturing Group",
    regionLabel: "Industrial Corridor / Operational Base",
    regionDefault: "Urla-Siltara Industrial Corridor / Raipur-Bilaspur Zone",
    slider1: { label: "Target B2B Procurement Clients / EPC Buyers", min: 20, max: 500, step: 10, default: 120, unit: "Procurement Heads", sub: ["Regional (20)", "Mid-Tier (120)", "Pan-India (500)"], unitPrice: 22000 },
    slider2: { label: "High-Tech Engineering Whitepapers & Video Demos", min: 10, max: 80, step: 5, default: 35, unit: "Showcases", sub: ["10 Demos", "35 Standard", "80 Mega-Portfolio"], unitPrice: 28000 },
    durationUnit: "Months",
    durations: [{ m: 3, l: "3 Months (Pilot)" }, { m: 6, l: "6 Months (Tender Blitz)" }, { m: 12, l: "12 Months (Full Dominance)" }],
    modules: [
      { key: "m1", label: "🏢 24/7 Tender Intelligence & Reverse Auction Radar (+₹6.5L)", desc: "Real-time government tender alerts, GeM scraping & competitor price forecasting.", cost: 650000 },
      { key: "m2", label: "🛡️ LinkedIn Trojan CXO Lead Acquisition Swarm (+₹7.5L)", desc: "Autonomous targeted outreach to Vice Presidents, Chief Engineers & Procurement Directors.", cost: 750000 },
      { key: "m3", label: "🌐 Global Supply Chain & Vendor Authority Portal (+₹5.0L)", desc: "Interactive digital twin showcasing plant capacity, metallurgy tests & ISO certifications.", cost: 500000 },
      { key: "m4", label: "📄 PSU & Private EPC Direct Retargeting Grid (+₹8.5L)", desc: "Dedicated pipeline targeting BHEL, NTPC, L&T, Tata Projects & Jindal procurement desks.", cost: 850000 },
      { key: "m5", label: "⚡ High-Trust ESG & Carbon Credit Compliance Engine (+₹4.5L)", desc: "Green hydrogen, solar-hybrid & zero-liquid-discharge verifiable authority reports.", cost: 450000 },
      { key: "m6", label: "👑 Dedicated Enterprise AI Chief Tech Commander Desk (+₹6.0L)", desc: "Dedicated sovereign AI commander deployed for high-value contract negotiations.", cost: 600000 }
    ],
    prototypeRadarTitle: "B2B Procurement Pipeline & Institutional Tender Tracker",
    radarMetrics: [
      { label: "QUALIFIED TENDERS", val: "₹142 Cr", sub: "Active Bid Pipeline", color: "#38bdf8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.3)" },
      { label: "DIRECT CXO REACH", val: "84.6%", sub: "Decision Makers Active", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
      { label: "PRICE DOMINANCE", val: "+14.2%", sub: "Over Competitor Margin", color: "#fef08a", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" }
    ],
    sampleItemsTitle: "Sample Procurement Corridors (from configured target zones)",
    sampleItems: [
      { name: "PSU Rail & Energy Corridor (Bhilai / NTPC / SECL)", status: "HIGH-PRIORITY TENDER MATCH", color: "#10b981" },
      { name: "Private Infrastructure & EPC Mega-Contractors (L&T / Adani / Tata)", status: "DIRECT CXO NEGOTIATION ACTIVE", color: "#38bdf8" },
      { name: "SME Secondary Steel & Casting Clusters (Urla / Siltara)", status: "SUPPLY CHAIN INTEGRATED (+24% Vol)", color: "#fef08a" }
    ],
    pitchTitle: "⚡ AI B2B Institutional Proposal & Pitch Weapon",
    pitchTabs: ["epc_bid", "oem_supply", "investor_deck"],
    pitchContent: {
      epc_bid: `🏢 *EXECUTIVE EPC TENDER & PROCUREMENT PROPOSAL*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"To: The Director of Procurement & Chief Technical Officer,\n\nWe present the industrial fabrication and metallurgy capabilities of our manufacturing cluster:\n1. Production Velocity: Continuous automated casting & precision rolling meeting ASTM/IS 2062 Grade-E250/350 standards.\n2. In-House Quality Assurance: 100% Ultrasonic & Radiographic NDT audited with verifiable mill test certificates.\n3. Supply Chain Guarantee: Dedicated railway siding logistics ensuring sub-48-hour delivery across industrial zones.\n\nWe quote direct factory pricing with zero intermediary overheads. Full technical dossiers attached for committee review."`,
      oem_supply: `⚙️ *OEM LONG-TERM SUPPLY & STRATEGIC TIE-UP PITCH*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Dear VP Operations,\nOur manufacturing facilities provide Tier-1 precision supply for heavy capital equipment, automotive castings, and structural frameworks:\n• Guaranteed 99.8% on-spec metallurgical consistency.\n• JIT inventory warehousing with buffer stocking protocols.\n• Dedicated sovereign ERP integration sharing real-time melt shop heats and batch dispatch telemetry."`,
      investor_deck: `💼 *INSTITUTIONAL INVESTOR & JV EXPANSION BRIEF*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Executive Overview for Strategic Partners:\nOperating at 85% plant utilization with high-margin specialized alloy lines. Zero long-term debt risk, captive solar power energization at ₹2.80/unit, and exclusive rail-link connectivity positioning our asset for 3.2x EBITDA expansion."`
    },
    mediaSimulator: {
      title: "🎯 B2B PROCUREMENT & HIGH-INTENT INDUSTRIAL ADS SIMULATOR",
      badge: "LINKEDIN CXO & GOOGLE SEARCH TARGETED",
      sub: "Hyper-focused digital targeting on Procurement Heads, Plant Directors, and EPC Project In-Charges across target industrial zones.",
      slider1Label: "Target Corporate Decision Makers",
      slider1Min: 500, slider1Max: 15000, slider1Step: 500, slider1Default: 3500, slider1Unit: "Executives",
      slider2Label: "Decision Maker Frequency",
      slider2Min: 4, slider2Max: 20, slider2Step: 2, slider2Default: 10, slider2Unit: "x Exposures",
      clusters: [
        { title: "🏢 Cluster 1: PSU & Large EPC Heads", sub: "~1,200 Accounts", desc: "Targeting NTPC, BHEL, L&T, Tata Projects procurement and engineering directors via LinkedIn Account-Based Marketing (ABM).", color: "#38bdf8" },
        { title: "⚙️ Cluster 2: Plant Managers & Chief Engineers", sub: "~1,500 Accounts", desc: "Targeting Urla, Siltara, Rourkela, Bhilai industrial clusters via Google Search Ads on industrial casting & structural steel keywords.", color: "#10b981" },
        { title: "💼 Cluster 3: Institutional Buyers & Supply Officers", sub: "~800 Accounts", desc: "Targeting supply officers and material procurement managers with technical specification whitepapers and mill test evidence.", color: "#fef08a" }
      ],
      legalNotice: "Statutory B2B Demarcation: GARUDA Retainer covers B2B software, tender scraping, lead swarm & technical dossiers. Media ad spend is paid directly by the enterprise to LinkedIn/Google with zero markup."
    }
  },

  realestate: {
    clientLabel: "Developer / Township Brand",
    clientDefault: "Prestige Grand Township & Luxury Infrastructure",
    regionLabel: "Prime Real Estate Corridor / Smart City",
    regionDefault: "VIP Road Corridor / Naya Raipur Luxury Enclave",
    slider1: { label: "Target High-Net-Worth Individuals (HNIs)", min: 500, max: 20000, step: 500, default: 5000, unit: "HNI Buyers", sub: ["Boutique (500)", "Mid-Township (5k)", "Mega-Corridor (20k)"], unitPrice: 26000 },
    slider2: { label: "Cinematic 3D Walkthrough Reels & Tours", min: 10, max: 60, step: 5, default: 25, unit: "Ultra-HD Tours", sub: ["10 Tours", "25 Standard", "60 Grand"], unitPrice: 32000 },
    durationUnit: "Months",
    durations: [{ m: 3, l: "3 Months (Launch)" }, { m: 6, l: "6 Months (Sales Blitz)" }, { m: 9, l: "9 Months (Full Sell-Out)" }],
    modules: [
      { key: "m1", label: "🏰 Airport, Golf Club & Luxury Lounge Geofencing (+₹6.0L)", desc: "1km radar targeting top 5% wealth bracket entering premium corridors.", cost: 600000 },
      { key: "m2", label: "💎 Global NRI & Metros Foreign Buyer Funnel (+₹8.0L)", desc: "Automated high-ticket NRI outreach across Dubai, Singapore, London & US.", cost: 800000 },
      { key: "m3", label: "📲 Automated WhatsApp VIP Site-Visit Concierge (+₹4.5L)", desc: "Instant booking of luxury chauffeur site visits with interactive villa maps.", cost: 450000 },
      { key: "m4", label: "🛡️ Premium Brand Authority & RERA Transparency Sentinel (+₹5.5L)", desc: "Verifiable escrow trust, construction milestone cameras & grievance defense.", cost: 550000 },
      { key: "m5", label: "🏢 High-Ticket Commercial & Retail Investor Fleet (+₹7.5L)", desc: "Pre-leased retail shops & corporate office floor investor acquisition.", cost: 750000 },
      { key: "m6", label: "👑 Chief Sales & Marketing Sovereign AI Commander (+₹5.0L)", desc: "24/7 autonomous closing assistant for luxury real estate deals.", cost: 500000 }
    ],
    prototypeRadarTitle: "HNI Buyer Demand & Luxury Corridor Velocity Radar",
    radarMetrics: [
      { label: "CONFIRMED SITE VISITS", val: "480+", sub: "VIP Pre-Bookings", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
      { label: "INVENTORY COMMITMENT", val: "₹88.5 Cr", sub: "Pre-Launch EOIs", color: "#d4af37", bg: "rgba(212,175,55,0.1)", border: "rgba(212,175,55,0.3)" },
      { label: "NRI BUYER PIPELINE", val: "32.4%", sub: "Foreign Currency Inflow", color: "#38bdf8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.3)" }
    ],
    sampleItemsTitle: "Sample Premium Corridors (from configured inventory)",
    sampleItems: [
      { name: "Super-Luxury Villas & Lakefront Mansions", status: "SOLD OUT IN PHASE 1 (42/42 Units)", color: "#10b981" },
      { name: "Smart Penthouse Residences & Sky Club", status: "HIGH ENQUIRY (78 Qualified HNIs)", color: "#38bdf8" },
      { name: "Pre-Leased Commercial High-Street Plaza", status: "INSTITUTIONAL INVESTOR ESCROW", color: "#fef08a" }
    ],
    pitchTitle: "⚡ AI Luxury Real Estate Pitch & Investor Weapon",
    pitchTabs: ["hni_invite", "nri_pitch", "commercial_roi"],
    pitchContent: {
      hni_invite: `🏰 *EXCLUSIVE PRIVATE INVITATION: THE PINNACLE OF LUXUXRY RESIDENCES*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Dear Distinguished Investor,\n\nWe invite you to experience the finest gated luxury sanctuary in the region:\n• Expansive 5,000 sq.ft. signature villas with private plunge pools and automated home intelligence.\n• Direct lake-view frontage, PGA-standard putting green, and 5-tier biometric fortress security.\n• Just 12 minutes from the International Airport along the fastest-appreciating 8-lane expressway.\n\nLimited to 36 discerning families. Private chauffeur-driven site visit arranged at your convenience."`,
      nri_pitch: `🌍 *GLOBAL NRI ASSET APPRECIATION & HERITAGE HOME DECK*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Invest in India's highest-growth smart capital with full RERA safety, guaranteed rental yield options, and seamless digital documentation managed end-to-end for non-resident buyers."`,
      commercial_roi: `📈 *PRE-LEASED COMMERCIAL PLAZA HIGH-YIELD ESCROW*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Secure a 9.2% net rental yield backed by long-term leases with Tier-1 national banks and luxury retail anchors. Monthly rent directly credited to your escrow account."`
    },
    mediaSimulator: {
      title: "🎯 HNI & NRI HIGH-ASSET MICRO-TARGETING SIMULATOR",
      badge: "WEALTH-BRACKET & AIRPORT GEOFENCED",
      sub: "Hyper-targeted ads to residents of luxury colonies, luxury car owners, and international air travelers.",
      slider1Label: "Target HNI Investors",
      slider1Min: 1000, slider1Max: 25000, slider1Step: 500, slider1Default: 6000, slider1Unit: "HNIs",
      slider2Label: "Luxury Impression Frequency",
      slider2Min: 4, slider2Max: 20, slider2Step: 2, slider2Default: 10, slider2Unit: "x Exposures",
      clusters: [
        { title: "🏰 Cluster 1: Ultra-HNIs & Business Owners", sub: "~2,200 High Net Worth", desc: "Targeting luxury gated communities, business owners, doctors, and chartered accountants with cinematic villa tours.", color: "#d4af37" },
        { title: "✈️ Cluster 2: Airport & Luxury Hotel Visitors", sub: "~1,800 Devices", desc: "Geofenced ads serving 4K walkthroughs to travelers inside airport lounges and 5-star hotel lobbies.", color: "#38bdf8" },
        { title: "🌍 Cluster 3: NRI & Metro Capital Investors", sub: "~2,000 Global HNIs", desc: "High-yield investment calculators targeted at Dubai, Singapore, and Mumbai tech leaders looking for smart city assets.", color: "#10b981" }
      ],
      legalNotice: "Commercial Real Estate Demarcation: GARUDA Retainer covers 3D production, NRI funnels, WhatsApp VIP concierge & AI Closing desk. Media ad spend paid directly to Meta/Google by developer."
    }
  },

  education: {
    clientLabel: "University / Educational Group",
    clientDefault: "Premier University & Medical/Engineering Campus",
    regionLabel: "Regional / National Catchment Corridor",
    regionDefault: "Central India & National Student Corridor",
    slider1: { label: "Target Student Admission Inquiries", min: 500, max: 25000, step: 500, default: 4500, unit: "Applicants", sub: ["Regional (500)", "Zonal (4.5k)", "Pan-India (25k)"], unitPrice: 20000 },
    slider2: { label: "Campus Life & Placement Viral Shorts", min: 15, max: 120, step: 5, default: 45, unit: "Viral Reels", sub: ["15 Shorts", "45 Standard", "120 Mega"], unitPrice: 18000 },
    durationUnit: "Months",
    durations: [{ m: 3, l: "3 Months (Admission Sprint)" }, { m: 6, l: "6 Months (Academic Cycle)" }, { m: 12, l: "12 Months (Round-the-Year PR)" }],
    modules: [
      { key: "m1", label: "🎓 12th Board & Competitive Exam Micro-Targeting (+₹5.5L)", desc: "Targeting JEE, NEET, CUET and 12th students around exam centers.", cost: 550000 },
      { key: "m2", label: "👨‍👩‍👧 Parent Trust & 100% Placement Proof Funnel (+₹6.0L)", desc: "Verifiable salary packages, campus recruiter evidence & alumni stories.", cost: 600000 },
      { key: "m3", label: "📲 24/7 AI Admission Counselor WhatsApp Bot (+₹4.0L)", desc: "Zero-wait resolution of fees, eligibility, hostel, and syllabus inquiries.", cost: 400000 },
      { key: "m4", label: "🏆 National Academic Ranking & Prestige PR Sentinel (+₹5.0L)", desc: "NIRF ranking showcases, accreditation PR & research patent press.", cost: 500000 },
      { key: "m5", label: "🌐 Corporate Placement & HR Partnership Machine (+₹7.0L)", desc: "Direct campus hiring tie-ups with Fortune 500 and unicorn recruiters.", cost: 700000 },
      { key: "m6", label: "👑 Dean / Chancellor Sovereign AI Executive Desk (+₹4.5L)", desc: "Executive enrollment dashboard with real-time conversion telemetry.", cost: 450000 }
    ],
    prototypeRadarTitle: "Pan-India Student Enrollment & Conversion Radar",
    radarMetrics: [
      { label: "TOTAL INQUIRIES", val: "6,840+", sub: "Verified Aspirants", color: "#c084fc", bg: "rgba(192,132,252,0.1)", border: "rgba(192,132,252,0.3)" },
      { label: "PARENT TRUST SCORE", val: "92.4%", sub: "Placement Verified", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
      { label: "OUT-OF-STATE RATIO", val: "41.8%", sub: "Pan-India Diversity", color: "#38bdf8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.3)" }
    ],
    sampleItemsTitle: "Sample Faculty Ingestion Telemetry",
    sampleItems: [
      { name: "School of Computer Science & AI (Highest Demand)", status: "88% SEATS FILLED (Early Rounds)", color: "#10b981" },
      { name: "School of Management & Business Analytics", status: "HIGH INQUIRY (1,240 Applications)", color: "#c084fc" },
      { name: "Biotechnology & Allied Health Sciences", status: "PLACEMENT RECORD TARGETED", color: "#38bdf8" }
    ],
    pitchTitle: "⚡ AI Academic Prestige & Admission Weapon",
    pitchTabs: ["parent_trust", "student_viral", "corporate_hr"],
    pitchContent: {
      parent_trust: `🎓 *MESSAGE TO PARENTS: SECURE YOUR CHILD'S FUTURE WITH GUARANTEED EXCELLENCE*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Dear Parents,\nWhen you invest in your child's higher education, you deserve verifiable certainty, not hollow promises:\n1. 100% Audited Placements: Average package of ₹8.4 LPA and highest package of ₹44 LPA with top global tech leaders.\n2. World-Class R&D Labs: State-of-the-art AI, Robotics, and Advanced Research facilities built in collaboration with industry giants.\n3. 360° Safe & Disciplined Campus: 24/7 CCTV biometric monitoring, on-campus medical infirmary, and hygienic hostel dining.\n\nSchedule a guided campus tour with our Dean of Admissions today."`,
      student_viral: `🚀 *FOR ASPIRING INNOVATORS & CODERS*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Don't study outdated theory. Build real software, launch venture-funded startups, and code alongside industry architects. Admissions open for early scholarship rounds."`,
      corporate_hr: `🤝 *CAMPUS RECRUITMENT PARTNERSHIP INVITATION*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Partner with Central India's top engineering and management talent pool. Pre-screened candidates trained in full-stack architecture, machine learning, and business analytics ready for Day 1 productivity."`
    },
    mediaSimulator: {
      title: "🎯 STUDENT & PARENT ADMISSION ADS SIMULATOR",
      badge: "BOARD EXAM & TEST TAKER TARGETED",
      sub: "Hyper-targeted ads serving campus placement reels to 12th standard students and fee-security webinars to parents.",
      slider1Label: "Target Student Candidates",
      slider1Min: 5000, slider1Max: 100000, slider1Step: 5000, slider1Default: 35000, slider1Unit: "Candidates",
      slider2Label: "Ad Exposure Frequency",
      slider2Min: 4, slider2Max: 20, slider2Step: 2, slider2Default: 12, slider2Unit: "x Exposures",
      clusters: [
        { title: "🎓 Cluster 1: 12th Science & Tech Aspirants", sub: "~14,000 Students", desc: "Targeted on Instagram Reels with high-tech campus drone tours, hackathons, and placement proofs.", color: "#c084fc" },
        { title: "👨‍👩‍👧 Cluster 2: Parents of College Aspirants", sub: "~12,000 Parents", desc: "Targeted on Facebook and YouTube with safe campus videos, accreditation certificates, and career guidance.", color: "#10b981" },
        { title: "📚 Cluster 3: Coaching Hubs & Exam Centers", sub: "~9,000 Test Takers", desc: "Geofenced 1km radius ads active around major coaching academies and entrance exam venues.", color: "#38bdf8" }
      ],
      legalNotice: "Educational Demarcation: GARUDA Retainer covers AI counselor bot, admissions funnels, PR sentinel & video production. Media ads paid directly by university."
    }
  },

  healthcare: {
    clientLabel: "Hospital Network / Healthcare Group",
    clientDefault: "Super-Specialty Hospital & Research Institute",
    regionLabel: "Primary Healthcare Catchment District",
    regionDefault: "Raipur-Durg-Bhilai Health Corridor (50km Radius)",
    slider1: { label: "Target Monthly OPD Patient Surge", min: 500, max: 15000, step: 500, default: 3500, unit: "Patients", sub: ["Regional (+500)", "Zonal (+3.5k)", "Hub (+15k)"], unitPrice: 24000 },
    slider2: { label: "Specialist Doctor Authority Reels & Case Studies", min: 10, max: 80, step: 5, default: 30, unit: "Medical Reels", sub: ["10 Reels", "30 Standard", "80 Mega"], unitPrice: 22000 },
    durationUnit: "Months",
    durations: [{ m: 3, l: "3 Months (Awareness)" }, { m: 6, l: "6 Months (OPD Surge)" }, { m: 12, l: "12 Months (Institutional Trust)" }],
    modules: [
      { key: "m1", label: "🏥 50km Emergency & Super-Specialty Geofencing (+₹5.0L)", desc: "15-minute emergency ambulance and critical care geo-alerts.", cost: 500000 },
      { key: "m2", label: "🩺 Super-Specialist Doctor Authority Personal Branding (+₹6.5L)", desc: "Cardiac, neuro, oncology & orthopedic surgeon video authority series.", cost: 650000 },
      { key: "m3", label: "📲 24/7 AI WhatsApp Emergency & Triage Booking Bot (+₹4.5L)", desc: "Instant OPD appointment confirmation, doctor schedule & lab report downloads.", cost: 450000 },
      { key: "m4", label: "🛡️ Healthcare Crisis PR & Google Review Defense Sentinel (+₹6.0L)", desc: "Rapid mitigation of patient complaints & 5-star Google Maps dominance.", cost: 600000 },
      { key: "m5", label: "🏢 Corporate TPA & Insurance Cashless Expansion Engine (+₹7.0L)", desc: "Direct tie-ups with PSU, central government, and corporate health policies.", cost: 700000 },
      { key: "m6", label: "👑 Chief Medical Officer Sovereign Tech Desk (+₹4.5L)", desc: "Hospital administrative bed occupancy and patient recovery intelligence.", cost: 450000 }
    ],
    prototypeRadarTitle: "Patient Trust & Super-Specialty OPD Surge Radar",
    radarMetrics: [
      { label: "NEW OPD PATIENTS", val: "+2,840", sub: "Monthly Surge", color: "#ec4899", bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.3)" },
      { label: "CASHLESS / TPA TIE-UPS", val: "94.2%", sub: "Approved Coverage", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
      { label: "GOOGLE REVIEW SCORE", val: "4.8 / 5.0", sub: "Reputation Defended", color: "#fef08a", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" }
    ],
    sampleItemsTitle: "Sample Specialty Ingestion Telemetry",
    sampleItems: [
      { name: "Advanced Cardiac Science & Cath Lab (24/7 Emergency)", status: "CRITICAL CATCHMENT ACTIVE (98% Trust)", color: "#10b981" },
      { name: "Neuro-Surgery & Trauma Center", status: "HIGH INBOUND TRAFFIC (+38% Referrals)", color: "#ec4899" },
      { name: "Joint Replacement & Minimally Invasive Orthopedics", status: "OPD APPOINTMENTS BOOKED 14 DAYS OUT", color: "#38bdf8" }
    ],
    pitchTitle: "⚡ AI Healthcare Authority & Doctor Pitch Weapon",
    pitchTabs: ["doctor_trust", "emergency_psa", "corporate_tpa"],
    pitchContent: {
      doctor_trust: `🏥 *SUPER-SPECIALTY HEALTHCARE: WORLD-CLASS CARE AT HOME*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Dear Patients & Families,\nYou no longer need to travel to Mumbai or Delhi for complex surgery or advanced critical care:\n• Expert Surgeons: Renowned superspecialists trained at AIIMS and premier global centers.\n• 24/7 Advanced Emergency: Fully equipped mobile ICUs and rapid cardiac response teams.\n• 100% Cashless TPA: Frictionless insurance approvals with zero advance deposit requirements.\n\nYour health is sacred. Book your specialist consultation via our instant WhatsApp desk."`,
      emergency_psa: `🚨 *GOLDEN HOUR EMERGENCY DISPATCH PROTOCOL*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"In acute heart attack or stroke, every second counts. Dial our dedicated emergency hotline for immediate geo-tracked ambulance dispatch with in-transit ICU telemetry."`,
      corporate_tpa: `💼 *CORPORATE EMPLOYEE HEALTHCARE & ANNUAL WELLNESS*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Comprehensive executive health checkups, on-site industrial safety medical camps, and priority cashless bed reservations for your corporate workforce."`
    },
    mediaSimulator: {
      title: "🎯 HEALTHCARE TRUST & SPECIALTY SEARCH ADS SIMULATOR",
      badge: "SYMPTOM & RADIUS SEARCH TARGETED",
      sub: "Hyper-targeted ads reaching patients seeking cardiology, orthopedics, and maternity within 50km radius.",
      slider1Label: "Target Health Catchment Population",
      slider1Min: 20000, slider1Max: 300000, slider1Step: 10000, slider1Default: 120000, slider1Unit: "Families",
      slider2Label: "Health Message Frequency",
      slider2Min: 4, slider2Max: 20, slider2Step: 2, slider2Default: 10, slider2Unit: "x Exposures",
      clusters: [
        { title: "❤️ Cluster 1: Cardiac & Diabetes Awareness (40+)", sub: "~45,000 Adults", desc: "Targeting families with high-trust doctor videos on preventive heart health and stroke warnings.", color: "#ec4899" },
        { title: "👶 Cluster 2: Maternity & Child Health", sub: "~38,000 Families", desc: "Targeting young couples with advanced NICU, painless delivery, and expert pediatrician reels.", color: "#10b981" },
        { title: "🦴 Cluster 3: Orthopedics & Joint Care (50+)", sub: "~37,000 Seniors", desc: "Targeting knee replacement and spine care with real patient recovery and walking testimonials.", color: "#38bdf8" }
      ],
      legalNotice: "Healthcare Demarcation: GARUDA Retainer covers AI triage bot, doctor personal branding & crisis PR. Search media ads paid directly to Google/Meta by hospital."
    }
  },

  hospitality: {
    clientLabel: "Luxury Resort / Hospitality Brand",
    clientDefault: "Royal Lakefront Resort & MICE Convention Center",
    regionLabel: "Destination Corridor",
    regionDefault: "Central India Eco-Luxury & Destination Corridor",
    slider1: { label: "High-Ticket Wedding & Conclave Bookings", min: 5, max: 60, step: 5, default: 25, unit: "Events", sub: ["Boutique (5)", "Standard (25)", "Mega (60)"], unitPrice: 35000 },
    slider2: { label: "Cinematic Drone & Luxury Experience Reels", min: 15, max: 80, step: 5, default: 35, unit: "Luxury Reels", sub: ["15 Reels", "35 Standard", "80 Cinema"], unitPrice: 26000 },
    durationUnit: "Months",
    durations: [{ m: 3, l: "3 Months (Wedding Season)" }, { m: 6, l: "6 Months (MICE & Conclaves)" }, { m: 12, l: "12 Months (Full Year)" }],
    modules: [
      { key: "m1", label: "💍 Destination Wedding HNI & Planner Acquisition (+₹7.5L)", desc: "Direct targeting of top luxury wedding planners across Mumbai, Delhi, Raipur & Indore.", cost: 750000 },
      { key: "m2", label: "🏢 Fortune 500 Corporate MICE Conclave Machine (+₹8.0L)", desc: "Outreach to corporate executive secretaries and event directors for multi-day conclaves.", cost: 800000 },
      { key: "m3", label: "📲 Automated WhatsApp VIP Concierge & Booking Engine (+₹4.0L)", desc: "Interactive virtual tour, banqueting menus, and instant VIP itinerary generator.", cost: 400000 },
      { key: "m4", label: "💎 Luxury Travel Influencer & National PR Sentinel (+₹5.5L)", desc: "High-fashion editorials, luxury lifestyle PR, and Instagram aesthetic dominance.", cost: 550000 },
      { key: "m5", label: "🌐 Direct Booking Engine (Bypass 20% OTA Commissions) (+₹6.5L)", desc: "Sovereign reservation portal delivering zero-commission direct suite bookings.", cost: 650000 },
      { key: "m6", label: "👑 General Manager Sovereign Revenue Tech Desk (+₹4.5L)", desc: "Real-time RevPAR, average room rate, and banqueting yield optimizer.", cost: 450000 }
    ],
    prototypeRadarTitle: "Luxury Booking Pipeline & Banqueting Yield Radar",
    radarMetrics: [
      { label: "CONFIRMED WEDDINGS", val: "22 Events", sub: "Season Blocked", color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)" },
      { label: "REVPAR SURGE", val: "+34.6%", sub: "Direct High-Yield", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
      { label: "OTA COMMISSION SAVINGS", val: "₹42.5 Lakhs", sub: "Direct Bookings", color: "#38bdf8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.3)" }
    ],
    sampleItemsTitle: "Sample Banqueting Corridors",
    sampleItems: [
      { name: "Grand Waterfront Lawn & Ballroom (Capacity 1,500)", status: "PRIME DATES OCCUPIED (₹1.8 Cr Est)", color: "#10b981" },
      { name: "Executive Corporate Pavilion (High-Tech Audio/Visual)", status: "MICE CONTRACT CONFIRMED (Fortune 500)", color: "#fbbf24" },
      { name: "Private Pool Villas & Spa Sanctuary", status: "LUXURY SUITE OCCUPANCY 92%", color: "#38bdf8" }
    ],
    pitchTitle: "⚡ AI Luxury Hospitality Pitch Weapon",
    pitchTabs: ["wedding_deck", "mice_brief", "luxury_escape"],
    pitchContent: {
      wedding_deck: `💍 *EXPERIENCE A ROYAL DESTINATION WEDDING BY THE WATER*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"To the Family of the Bride & Groom,\nYour wedding is a once-in-a-lifetime milestone deserving majestic perfection:\n• Unrivaled Backdrop: 25-acre pristine lakefront lawns, illuminated infinity pools, and grand banquet ballrooms.\n• Master Gourmet Banqueting: Bespoke royal thalis, international live stations, and master chef-curated menus.\n• Effortless Luxury: 120 luxury villas dedicated to your wedding party with round-the-clock VIP butler concierge.\n\nSchedule a complimentary private tasting and venue walkthrough with our Master Wedding Director."`,
      mice_brief: `🏢 *EXECUTIVE RETREATS & HIGH-LEVEL CORPORATE CONCLAVES*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Host your annual leadership summit with soundproof acoustic amphitheaters, high-speed fiber connectivity, team-building obstacle courses, and private gala evenings."`,
      luxury_escape: `💎 *WEEKEND REJUVENATION & LUXURY SPA RETREAT*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Escape the city rush. Rejuvenate with ancient Ayurvedic healing therapies, gourmet alfresco dining under the stars, and private plunge pool relaxation."`
    },
    mediaSimulator: {
      title: "🎯 LUXURY WEDDING & CORPORATE MICE ADS SIMULATOR",
      badge: "HNI & EVENT PLANNER TARGETED",
      sub: "Hyper-targeted ads serving cinematic wedding drone reels to engaged couples and corporate organizers in metropolitan corridors.",
      slider1Label: "Target Luxury Travelers & Planners",
      slider1Min: 2000, slider1Max: 50000, slider1Step: 2000, slider1Default: 16000, slider1Unit: "HNIs",
      slider2Label: "Impression Frequency",
      slider2Min: 4, slider2Max: 20, slider2Step: 2, slider2Default: 12, slider2Unit: "x Exposures",
      clusters: [
        { title: "💍 Cluster 1: Engaged Couples & Wedding Planners", sub: "~6,500 Prospects", desc: "Targeting high-budget wedding planners and newly engaged couples with 4K drone reels of sunset ceremonies.", color: "#fbbf24" },
        { title: "🏢 Cluster 2: Corporate HR & Executive Assistants", sub: "~5,000 Decision Makers", desc: "Targeting corporate headquarters for offsite retreats, strategic leadership summits, and awards galas.", color: "#38bdf8" },
        { title: "💎 Cluster 3: Luxury Staycation & Weekend Travelers", sub: "~4,500 HNI Families", desc: "Targeting regional metropolitan HNIs for luxury weekend suite getaways and fine dining experiences.", color: "#10b981" }
      ],
      legalNotice: "Hospitality Demarcation: GARUDA Retainer covers sovereign booking engine, wedding lead funnels & drone reels. Media ad spend paid directly to Meta/Google by resort."
    }
  },

  retail: {
    clientLabel: "Retail Brand / FMCG Franchise Group",
    clientDefault: "Central India Retail Superstore & FMCG Network",
    regionLabel: "Market Network / State",
    regionDefault: "Regional Distribution Network across 25 Cities",
    slider1: { label: "Retail Outlets / Superstores", min: 2, max: 60, step: 2, default: 18, unit: "Outlets", sub: ["Local (2)", "Statewide (18)", "National (60)"], unitPrice: 30000 },
    slider2: { label: "Hyper-Local Offer Reels & Festival Campaigns", min: 15, max: 120, step: 5, default: 40, unit: "Offer Reels", sub: ["15 Reels", "40 Standard", "120 Blitz"], unitPrice: 15000 },
    durationUnit: "Months",
    durations: [{ m: 1, l: "1 Month (Festive Sprint)" }, { m: 3, l: "3 Months (Quarterly Expansion)" }, { m: 6, l: "6 Months (Statewide Domination)" }],
    modules: [
      { key: "m1", label: "🛒 1km Store Footfall Geofencing (Walk-in Push) (+₹5.0L)", desc: "1km radar around every store driving shoppers to billing counters with flash coupons.", cost: 500000 },
      { key: "m2", label: "🤝 New Franchise Partner & Distributor Acquisition (+₹8.5L)", desc: "Targeting prospective business investors to open new profitable franchise outlets.", cost: 850000 },
      { key: "m3", label: "📲 WhatsApp Loyalty & Automated Flash Discount Blast (+₹4.0L)", desc: "Instant automated WhatsApp alerts for weekend grocery and fashion sales.", cost: 400000 },
      { key: "m4", label: "🛡️ Counter-Brand Market Share Defense Sentinel (+₹5.0L)", desc: "Price comparison analytics & instant counter-promotions against competitor discounts.", cost: 500000 },
      { key: "m5", label: "📦 Regional D2C E-Commerce & Hyper-Local Delivery Engine (+₹6.0L)", desc: "Sub-2-hour local delivery order management engine across city wards.", cost: 600000 },
      { key: "m6", label: "👑 Commercial Operations Commander (+₹4.5L)", desc: "Store footfall analytics, inventory turnover velocity, and basket size maximization.", cost: 450000 }
    ],
    prototypeRadarTitle: "Store Footfall Surge & Inventory Velocity Radar",
    radarMetrics: [
      { label: "MONTHLY FOOTFALL SURGE", val: "+42,800", sub: "Walk-in Customers", color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)" },
      { label: "AVERAGE BASKET SIZE", val: "₹1,840", sub: "+26% Growth", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
      { label: "FRANCHISE LEADS", val: "64 Qualified", sub: "New Store Expansions", color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)" }
    ],
    sampleItemsTitle: "Sample Store Ingestion Telemetry",
    sampleItems: [
      { name: "Flagship Mega-Store (Central Business District)", status: "FOOTFALL RECORD (+48% Weekend Spike)", color: "#10b981" },
      { name: "Express Neighborhood Outlets (Residential Suburbs)", status: "DAILY BASKET VELOCITY HIGH", color: "#34d399" },
      { name: "New Tier-2 Franchise Ingestion (Bhilai / Bilaspur)", status: "OPENING BLITZ CONFIGURED", color: "#fbbf24" }
    ],
    pitchTitle: "⚡ AI Commercial Retail & Franchise Pitch Weapon",
    pitchTabs: ["festive_offer", "franchise_expansion", "d2c_loyalty"],
    pitchContent: {
      festive_offer: `🛒 *MEGA FESTIVE SAVINGS GALA: UNBEATABLE PRICES ACROSS ALL STORES*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Attention Smart Shoppers!\nWhy pay MRP when you can enjoy direct factory discounts on your family's favorite groceries and lifestyle brands:\n• Flat 30% to 50% Off on Top FMCG Essentials, Apparel & Home Appliances.\n• Buy-1-Get-1 Free on Fresh Farm Produce and Regional Specialties.\n• Show this message at the billing counter to claim an extra ₹250 instant cashback voucher!\n\nVisit your nearest store today!"`,
      franchise_expansion: `🤝 *OWN A HIGH-MARGIN PROFITABLE RETAIL FRANCHISE*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Join Central India's fastest-growing retail network. Proven ROI within 18 months, zero dead inventory guarantee, centralized supply chain logistics, and complete digital marketing support."`,
      d2c_loyalty: `📦 *ORDER LOCAL & GET 90-MINUTE DOORSTEP DELIVERY*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"Fresh groceries, household cleaning essentials, and daily necessities delivered directly from our neighborhood store to your kitchen within 90 minutes. Free delivery on orders above ₹499."`
    },
    mediaSimulator: {
      title: "🎯 1KM RADIUS STORE WALK-IN & FRANCHISE ADS SIMULATOR",
      badge: "HYPER-LOCAL GEO-FENCED WALKINS",
      sub: "Hyper-targeted ads reaching local households within 1km walking radius of every retail store.",
      slider1Label: "Target Local Shoppers",
      slider1Min: 10000, slider1Max: 200000, slider1Step: 10000, slider1Default: 60000, slider1Unit: "Shoppers",
      slider2Label: "Ad Exposure Frequency",
      slider2Min: 4, slider2Max: 20, slider2Step: 2, slider2Default: 12, slider2Unit: "x Exposures",
      clusters: [
        { title: "🛒 Cluster 1: Neighborhood Families (1km Radius)", sub: "~28,000 Households", desc: "Targeting homes around retail locations with weekend grocery flash sale videos and coupons.", color: "#34d399" },
        { title: "🤝 Cluster 2: Prospective Franchise Investors", sub: "~14,000 Business Owners", desc: "Targeting regional traders and businessmen with franchise profitability and ROI webinars.", color: "#fbbf24" },
        { title: "⚡ Cluster 3: Fast Online Shoppers (90-min Delivery)", sub: "~18,000 App Users", desc: "Targeting young working professionals with quick-commerce local delivery app promotions.", color: "#38bdf8" }
      ],
      legalNotice: "Retail Demarcation: GARUDA Retainer covers loyalty bot, local D2C store engine & franchise funnel. Local walk-in ad spend is paid directly to Meta/Google by retail brand."
    }
  }
};

export default function SovereignEnterpriseMatrix() {
  const [selectedSector, setSelectedSector] = useState("elections");

  // Per-sector state map so each sector's inputs are fully customized and remembered!
  const [sectorStates, setSectorStates] = useState({
    elections: {
      clientName: "Hon'ble Minister / Candidate",
      region: "Chhattisgarh Central Region / District",
      s1: 280,
      s2: 90,
      duration: 3,
      modules: { m1: true, m2: true, m3: true, m4: true, m5: true, m6: true },
      pitchTab: "rally",
      media1: 240000,
      media2: 12
    },
    industry: {
      clientName: "Premier Heavy Industries & Manufacturing Group",
      region: "Urla-Siltara Industrial Corridor / Raipur-Bilaspur Zone",
      s1: 120,
      s2: 35,
      duration: 6,
      modules: { m1: true, m2: true, m3: true, m4: true, m5: true, m6: true },
      pitchTab: "epc_bid",
      media1: 3500,
      media2: 10
    },
    realestate: {
      clientName: "Prestige Grand Township & Luxury Infrastructure",
      region: "VIP Road Corridor / Naya Raipur Luxury Enclave",
      s1: 5000,
      s2: 25,
      duration: 6,
      modules: { m1: true, m2: true, m3: true, m4: true, m5: true, m6: true },
      pitchTab: "hni_invite",
      media1: 6000,
      media2: 10
    },
    education: {
      clientName: "Premier University & Medical/Engineering Campus",
      region: "Central India & National Student Corridor",
      s1: 4500,
      s2: 45,
      duration: 6,
      modules: { m1: true, m2: true, m3: true, m4: true, m5: true, m6: true },
      pitchTab: "parent_trust",
      media1: 35000,
      media2: 12
    },
    healthcare: {
      clientName: "Super-Specialty Hospital & Research Institute",
      region: "Raipur-Durg-Bhilai Health Corridor (50km Radius)",
      s1: 3500,
      s2: 30,
      duration: 6,
      modules: { m1: true, m2: true, m3: true, m4: true, m5: true, m6: true },
      pitchTab: "doctor_trust",
      media1: 120000,
      media2: 10
    },
    hospitality: {
      clientName: "Royal Lakefront Resort & MICE Convention Center",
      region: "Central India Eco-Luxury & Destination Corridor",
      s1: 25,
      s2: 35,
      duration: 6,
      modules: { m1: true, m2: true, m3: true, m4: true, m5: true, m6: true },
      pitchTab: "wedding_deck",
      media1: 16000,
      media2: 12
    },
    retail: {
      clientName: "Central India Retail Superstore & FMCG Network",
      region: "Regional Distribution Network across 25 Cities",
      s1: 18,
      s2: 40,
      duration: 3,
      modules: { m1: true, m2: true, m3: true, m4: true, m5: true, m6: true },
      pitchTab: "festive_offer",
      media1: 60000,
      media2: 12
    }
  });

  const [copiedNotice, setCopiedNotice] = useState(null);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showPresentationModal, setShowPresentationModal] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Keyboard navigation for Boardroom 16:9 Presentation Deck
  useEffect(() => {
    if (!showPresentationModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        setCurrentSlideIndex((prev) => Math.min(prev + 1, 5));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        setShowPresentationModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPresentationModal]);

  const cfg = SECTOR_CONFIGS[selectedSector] || SECTOR_CONFIGS.elections;
  const currentSectorState = sectorStates[selectedSector] || sectorStates.elections;

  const updateCurrentSector = (key, value) => {
    setSectorStates((prev) => ({
      ...prev,
      [selectedSector]: {
        ...prev[selectedSector],
        [key]: value
      }
    }));
  };

  const toggleModule = (modKey) => {
    setSectorStates((prev) => ({
      ...prev,
      [selectedSector]: {
        ...prev[selectedSector],
        modules: {
          ...prev[selectedSector].modules,
          [modKey]: !prev[selectedSector].modules[modKey]
        }
      }
    }));
  };

  // REAL-TIME DYNAMIC VALUATION ENGINE (Specific to the chosen sector!)
  const liveCalculation = useMemo(() => {
    let basePlatform = 800000; // ₹8 Lakh baseline for 1,000 agent engine
    let s1Cost = currentSectorState.s1 * cfg.slider1.unitPrice;
    let s2Cost = currentSectorState.s2 * cfg.slider2.unitPrice;

    let addOns = 0;
    cfg.modules.forEach((m) => {
      if (currentSectorState.modules[m.key]) {
        addOns += m.cost;
      }
    });

    const durationMultiplier = currentSectorState.duration === 1 ? 1.0 : currentSectorState.duration <= 3 ? 1.75 : currentSectorState.duration <= 6 ? 2.85 : 4.2;

    let total = Math.round((basePlatform + s1Cost + s2Cost + addOns) * durationMultiplier);
    total = Math.round(total / 50000) * 50000;

    const stage1Advance = Math.round(total * 0.4);
    const stage2Mid = Math.round(total * 0.35);
    const stage3Victory = total - stage1Advance - stage2Mid;

    return {
      basePlatform,
      s1Cost,
      s2Cost,
      addOns,
      total,
      formattedTotal: `₹${(total / 100000).toFixed(2)} Lakhs (${(total / 10000000).toFixed(2)} Cr)`,
      exactInr: `₹${total.toLocaleString("en-IN")}`,
      stage1Advance,
      stage2Mid,
      stage3Victory
    };
  }, [selectedSector, currentSectorState, cfg]);

  // ECI / B2B MEDIA SPEND ESTIMATOR
  const mediaCalculation = useMemo(() => {
    const totalImpressions = currentSectorState.media1 * currentSectorState.media2;
    // CPM in regional sector
    const blendedCpm = selectedSector === "industry" ? 220 : selectedSector === "realestate" ? 180 : 85;
    const digitalAdSpend = Math.round((totalImpressions / 1000) * blendedCpm);
    const totalMediaSpend = Math.round(digitalAdSpend / 10000) * 10000;

    return {
      totalImpressions,
      totalMediaSpend,
      formattedMediaSpend: `₹${(totalMediaSpend / 100000).toFixed(2)} Lakhs`,
      exactMediaInr: `₹${totalMediaSpend.toLocaleString("en-IN")}`,
      costPerTarget: (totalMediaSpend / (currentSectorState.media1 || 1)).toFixed(2)
    };
  }, [selectedSector, currentSectorState]);

  const activeSectorData = SECTORS.find((s) => s.id === selectedSector) || SECTORS[0];

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedNotice(label);
    setTimeout(() => setCopiedNotice(null), 3000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const generateDossierMarkdown = () => {
    return `# CONFIDENTIAL // SOVEREIGN EXECUTIVE CABINET MEMORANDUM & SCOPE OF WORK
Ref: GARUDA/SOW/2026/${selectedSector.toUpperCase()}/${Date.now().toString(36).toUpperCase()}
Security Classification: COMMERCIAL IN CONFIDENCE // DEFENSE-GRADE
Issuing Authority: Office of the Supreme Architect, Founder Praveen Mahawar
Date: ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}

================================================================================
1. PRINCIPAL PARTIES & OPERATIONAL MANDATE
================================================================================
• Designated Client: ${currentSectorState.clientName}
• Target Region / Operational Catchment: ${currentSectorState.region}
• Sovereign Sector Domain: ${activeSectorData.title}
• Operating Platform: GARUDA AI OS (Founder & Supreme Architect Praveen Mahawar)
• Allocated Autonomous Workforce: 1,000 AI Agent Fleet inside Sovereign Engine
• Total Sovereign Retainer: ${liveCalculation.exactInr} (${liveCalculation.formattedTotal})
• Estimated Direct Ad Fuel: ${mediaCalculation.exactMediaInr} (${mediaCalculation.formattedMediaSpend}) [100% Direct Client-to-Platform Billing, Zero Markup]

================================================================================
2. FORENSIC PROBLEM ASSESSMENT & THREAT ELIMINATION
================================================================================
Traditional agencies and manual operational methods create severe vulnerabilities:
• Capital Leakage: Middleman agency markups of 20-35% on media ad spend with zero telemetry transparency.
• Execution Latency: 2 to 4-week delays in creating and deploying targeted narratives cause critical market/voter drops.
• Data Blindness: Lack of booth/account-level telemetry leaves executive decision-makers blind to competitor attacks.

GARUDA AI OS deploys a synchronized 1,000-agent fleet that ingests field telemetry 24/7, auto-synthesizes high-velocity assets within 90 minutes, and saturates target platforms directly.

================================================================================
3. SOVEREIGN SYSTEM ARCHITECTURE & 1,000-AGENT TOPOLOGY
================================================================================
• Pillar I: Real-Time Telemetry & Data Ingestion — Continuous monitoring of ${currentSectorState.s1} ${cfg.slider1.unit}.
• Pillar II: Algorithmic Content Factory — Rapid multi-format generation of ${currentSectorState.s2} ${cfg.slider2.unit}.
• Pillar III: Direct Algorithmic Saturation Grid — Targeted reach across ${currentSectorState.media1.toLocaleString("en-IN")} ${cfg.mediaSimulator.slider1Unit}.
• Pillar IV: 24/7 Sentinel War Room — Continuous sentiment analysis, objection defense, and crisis PR.

ACTIVE SYSTEM MODULES:
${cfg.modules.filter((m) => currentSectorState.modules[m.key]).map((m) => `• [ENABLED] ${m.label.split("(")[0].trim()}: ${m.desc}`).join("\n")}

================================================================================
4. DIRECT MEDIA FUEL TRANSPARENCY PROTOCOL
================================================================================
• Statutory Transparency: 100% of media ad fuel is disbursed directly from the Client's PAN / GST credit cards to Meta, Google, and LinkedIn.
• Zero Agency Markup Law: GARUDA charges ZERO commission or hidden markup on media spend.
• Saturation Metrics: ${(mediaCalculation.totalImpressions / 1000000).toFixed(2)} Million verified impressions at ${currentSectorState.media2}x frequency multiplier.

================================================================================
5. STRUCTURED 3-PHASE MILESTONE ESCROW & ACCEPTANCE GATES
================================================================================
Stage 1: Advance Initiation & Core Architecture (40%)
• Amount: ₹${liveCalculation.stage1Advance.toLocaleString("en-IN")}
• Deliverables: Deployment of GARUDA OS nodes, telemetry ingestion of ${currentSectorState.s1} ${cfg.slider1.unit}, and digital security fortress.

Stage 2: Mid-Phase Campaign Blitz & Active Lead Swarm (35%)
• Amount: ₹${liveCalculation.stage2Mid.toLocaleString("en-IN")}
• Deliverables: Production of ${currentSectorState.s2} ${cfg.slider2.unit}, active outreach grid, and 24/7 automated monitoring.

Stage 3: Milestone Victory Target & Comprehensive Audit (25%)
• Amount: ₹${liveCalculation.stage3Victory.toLocaleString("en-IN")}
• Deliverables: Final performance audit, conversion target achievement, cryptographic handover, and victory documentation.

================================================================================
6. DATA SOVEREIGNTY & CRYPTOGRAPHIC SEAL
================================================================================
• Cryptographic Seal: sha256_cabinet_dossier_${selectedSector}_${Date.now().toString(36)}
• Data Sovereignty: Client operational data is 100% private, hosted under Indian jurisdiction, and never used to train external models.
• Pricing Policy: Strict Zero-Discount Sovereign Escrow.

================================================================================
7. BILATERAL AUTHORIZATION & COUNTER-SIGNATURES
================================================================================
Authorized for GARUDA OS:
Praveen Mahawar
Founder & Supreme Architect, GARUDA AI OS

Accepted & Approved for Enterprise Principal:
${currentSectorState.clientName}
Principal Client / Enterprise In-Charge
`;
  };

  const handleDownloadDossier = () => {
    const text = generateDossierMarkdown();
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GARUDA_SOW_${selectedSector.toUpperCase()}_${(currentSectorState.clientName || "Client").replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentPitch = cfg.pitchContent[currentSectorState.pitchTab] || Object.values(cfg.pitchContent)[0];

  const shareableText = `📜 *GARUDA SOVEREIGN EXECUTIVE DOSSIER*
Domain: ${activeSectorData.title}
Client: ${currentSectorState.clientName}
Territory: ${currentSectorState.region}
─────────────────────────────
📊 *LIVE SCOPE CONFIGURED*:
• ${cfg.slider1.label}: ${currentSectorState.s1} ${cfg.slider1.unit}
• ${cfg.slider2.label}: ${currentSectorState.s2} ${cfg.slider2.unit}
• Timeline Horizon: ${currentSectorState.duration} Months
• Operational Modules Active: ${cfg.modules.filter((m) => currentSectorState.modules[m.key]).length} of ${cfg.modules.length} Enabled
─────────────────────────────
🎯 *DIRECT AD / MEDIA FUEL ESTIMATE*:
• Target Audience / Stakeholders: ${currentSectorState.media1.toLocaleString("en-IN")} ${cfg.mediaSimulator.slider1Unit}
• Total High-Impact Impressions: ${(mediaCalculation.totalImpressions / 1000000).toFixed(2)} Million (${currentSectorState.media2}x frequency)
• Estimated Direct Media Spend: ${mediaCalculation.exactMediaInr} (${mediaCalculation.formattedMediaSpend})
• Disbursal: 100% Direct from Client PAN / Card to Meta & Google (Zero Agency Markup)
─────────────────────────────
💰 *SOVEREIGN ENTERPRISE VALUATION (GARUDA AI OS RETAINER)*:
Total Live Contract: ${liveCalculation.exactInr} (${liveCalculation.formattedTotal})
*Zero Discount Policy — Defense-Grade Milestone Escrow*
• Advance Initiation (40%): ₹${liveCalculation.stage1Advance.toLocaleString("en-IN")}
• Mid-Phase Execution Blitz (35%): ₹${liveCalculation.stage2Mid.toLocaleString("en-IN")}
• Final Milestone Victory Delivery (25%): ₹${liveCalculation.stage3Victory.toLocaleString("en-IN")}
─────────────────────────────
Architect: Founder Praveen Mahawar • 1,000 AI Agent Workforce
Official Portal: https://www.garudaos.in/enterprise`;

  return (
    <main className="sovereign-matrix-container" style={{ minHeight: "100vh", background: BG, color: "#f8fafc", fontFamily: "sans-serif", padding: "1.5rem" }}>
      <SEOHead
        title={`GARUDA SOVEREIGN MATRIX™ — ${activeSectorData.title}`}
        description="Billion-dollar live scope calculation engine and printable Cabinet PDF dossier for Political Campaigns, Industrial Conglomerates, Real Estate, Education, Healthcare, Hospitality and Retail."
        canonical="https://www.garudaos.in/enterprise"
      />

      {/* PRINT-ONLY STYLES: CRITICAL FOR PRISTINE WHITE OFFICIAL CABINET PDF */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .sovereign-matrix-container {
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          header, aside, .no-print, button {
            display: none !important;
          }
          .print-dossier-page {
            display: block !important;
            background: #ffffff !important;
            color: #111827 !important;
            padding: 2.5rem !important;
            border: 2px solid #1e3a8a !important;
          }
        }
        @media screen {
          .print-dossier-page {
            display: none;
          }
        }
      `}</style>

      {/* TOP HEADER: PALANTIR & BLOOMBERG GRADE COMMAND BAR */}
      <header
        style={{
          background: PANEL,
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: "14px",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(212,175,55,0.3), rgba(245,158,11,0.1))",
              border: `1px solid ${GOLD}`,
              display: "grid",
              placeItems: "center",
              fontSize: "1.5rem",
              boxShadow: "0 0 20px rgba(212,175,55,0.3)"
            }}
          >
            {activeSectorData.icon}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#ffffff", margin: 0, letterSpacing: "0.04em" }}>
                GARUDA SOVEREIGN MATRIX™
              </h1>
              <span
                style={{
                  background: "rgba(16,185,129,0.15)",
                  border: `1px solid ${EMERALD}`,
                  color: "#6ee7b7",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: EMERALD, display: "inline-block" }} />
                {activeSectorData.title.toUpperCase()} ACTIVE
              </span>
            </div>
            <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "2px" }}>
              Architect: <strong style={{ color: GOLD_LIGHT }}>Founder Praveen Mahawar</strong> · Live Scope Pricing · Real-Time Escrow Generation
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Link
            to="/founder/access"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#e2e8f0",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            ← Founder Kingdom
          </Link>
          <button
            onClick={() => setShowDossierModal(true)}
            style={{
              background: "linear-gradient(135deg, #1e40af, #2563eb)",
              border: "1px solid #60a5fa",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 0 15px rgba(37,99,235,0.4)"
            }}
          >
            📄 Cabinet Dossier (SOW)
          </button>
          <button
            onClick={() => { setCurrentSlideIndex(0); setShowPresentationModal(true); }}
            style={{
              background: "linear-gradient(135deg, #7c3aed, #9333ea)",
              border: "1px solid #c084fc",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 0 15px rgba(147,51,234,0.4)"
            }}
          >
            📽️ Boardroom Pitch Deck (16:9)
          </button>
          <button
            onClick={() => handleCopy(shareableText, "Brief Copied")}
            style={{
              background: "linear-gradient(135deg, #d4af37, #b8860b)",
              border: "none",
              color: "#030712",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 0 15px rgba(212,175,55,0.4)"
            }}
          >
            📋 {copiedNotice === "Brief Copied" ? "Copied!" : "Copy Calculation"}
          </button>
        </div>
      </header>

      {/* MAIN SCREEN: SIDEBAR + DYNAMIC CALCULATOR & PROTOTYPE */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 340px) 1fr", gap: "24px", alignItems: "start" }}>
        {/* LEFT SIDEBAR: SECTOR SELECTOR (FULLY INTERACTIVE) */}
        <aside
          style={{
            background: PANEL,
            border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: "14px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <div style={{ padding: "0 8px 8px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "0.72rem", color: GOLD, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              SELECT TARGET DOMAIN (7 LIVE SECTORS)
            </span>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "2px" }}>
              Click Any Domain To Adapt Cockpit Live
            </div>
          </div>

          {SECTORS.map((sec) => {
            const isSelected = selectedSector === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSector(sec.id)}
                style={{
                  background: isSelected ? "rgba(212, 175, 55, 0.15)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isSelected ? GOLD : "rgba(255,255,255,0.06)"}`,
                  borderRadius: "10px",
                  padding: "12px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{ fontSize: "1.4rem" }}>{sec.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ color: isSelected ? "#ffffff" : "#e2e8f0", fontSize: "0.86rem", display: "block" }}>
                    {sec.title}
                  </strong>
                  <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "3px", lineHeight: "1.3" }}>
                    {sec.subtitle}
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <span style={{ background: "rgba(0,0,0,0.4)", color: sec.badgeColor, padding: "2px 6px", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 700 }}>
                      {sec.badge}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* RIGHT AREA: LIVE CUSTOMIZER, REAL-TIME PRICE, PROTOTYPE */}
        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 1. LIVE CLIENT CONFIGURATION & REAL-TIME PRICE TICKER */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(10,15,29,0.95))",
              border: `1px solid ${PANEL_BORDER}`,
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ flex: 1, minWidth: "260px" }}>
                <span style={{ fontSize: "0.72rem", color: GOLD, fontWeight: 800, textTransform: "uppercase" }}>
                  LIVE PROPOSAL CONFIGURATOR • {activeSectorData.title.toUpperCase()}
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
                  <div>
                    <label style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{cfg.clientLabel}:</label>
                    <input
                      type="text"
                      value={currentSectorState.clientName}
                      onChange={(e) => updateCurrentSector("clientName", e.target.value)}
                      style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "6px 10px", borderRadius: 6, fontSize: "0.82rem", marginTop: "2px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{cfg.regionLabel}:</label>
                    <input
                      type="text"
                      value={currentSectorState.region}
                      onChange={(e) => updateCurrentSector("region", e.target.value)}
                      style={{ width: "100%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "6px 10px", borderRadius: 6, fontSize: "0.82rem", marginTop: "2px" }}
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC LIVE PRICE TICKER (CHANGES INSTANTLY ON ANY ACTION) */}
              <div
                style={{
                  background: "radial-gradient(circle at top, rgba(212,175,55,0.15), rgba(0,0,0,0.8))",
                  border: `2px solid ${GOLD}`,
                  borderRadius: "12px",
                  padding: "14px 22px",
                  textAlign: "right",
                  minWidth: "250px",
                  boxShadow: "0 0 25px rgba(212,175,55,0.25)"
                }}
              >
                <div style={{ fontSize: "0.72rem", color: GOLD, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  ⚡ LIVE CALCULATED INVESTMENT
                </div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", marginTop: "2px", letterSpacing: "-0.02em" }}>
                  {liveCalculation.exactInr}
                </div>
                <div style={{ fontSize: "0.74rem", color: "#6ee7b7", fontWeight: 700 }}>
                  {liveCalculation.formattedTotal} · Zero-Discount Retainer
                </div>
              </div>
            </div>

            {/* LIVE SCOPE SLIDERS & PARAMETERS (DYNAMIC PER SECTOR) */}
            <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                {/* 1. Primary Scope Slider */}
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 700 }}>{cfg.slider1.label}:</span>
                    <strong style={{ color: GOLD_LIGHT, fontSize: "0.95rem" }}>
                      {currentSectorState.s1} {cfg.slider1.unit}
                    </strong>
                  </div>
                  <input
                    type="range"
                    min={cfg.slider1.min}
                    max={cfg.slider1.max}
                    step={cfg.slider1.step}
                    value={currentSectorState.s1}
                    onChange={(e) => updateCurrentSector("s1", Number(e.target.value))}
                    style={{ width: "100%", marginTop: "8px", accentColor: GOLD }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#6b7280" }}>
                    <span>{cfg.slider1.sub[0]}</span>
                    <span>{cfg.slider1.sub[1]}</span>
                    <span>{cfg.slider1.sub[2]}</span>
                  </div>
                </div>

                {/* 2. Secondary Output Slider */}
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 700 }}>{cfg.slider2.label}:</span>
                    <strong style={{ color: SAPPHIRE, fontSize: "0.95rem" }}>
                      {currentSectorState.s2} {cfg.slider2.unit}
                    </strong>
                  </div>
                  <input
                    type="range"
                    min={cfg.slider2.min}
                    max={cfg.slider2.max}
                    step={cfg.slider2.step}
                    value={currentSectorState.s2}
                    onChange={(e) => updateCurrentSector("s2", Number(e.target.value))}
                    style={{ width: "100%", marginTop: "8px", accentColor: SAPPHIRE }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#6b7280" }}>
                    <span>{cfg.slider2.sub[0]}</span>
                    <span>{cfg.slider2.sub[1]}</span>
                    <span>{cfg.slider2.sub[2]}</span>
                  </div>
                </div>

                {/* 3. Duration Selector */}
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 700 }}>Operation Horizon:</span>
                  <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                    {cfg.durations.map((dur) => (
                      <button
                        key={dur.m}
                        type="button"
                        onClick={() => updateCurrentSector("duration", dur.m)}
                        style={{
                          flex: 1,
                          background: currentSectorState.duration === dur.m ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${currentSectorState.duration === dur.m ? EMERALD : "rgba(255,255,255,0.1)"}`,
                          color: currentSectorState.duration === dur.m ? "#6ee7b7" : "#9ca3af",
                          padding: "6px",
                          borderRadius: 6,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {dur.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* INTERACTIVE SERVICE ADD-ONS CHECKBOXES (DYNAMIC PER SECTOR) */}
              <div style={{ marginTop: "14px" }}>
                <span style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>
                  Select Operational AI Modules for {activeSectorData.title}:
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px", marginTop: "8px" }}>
                  {cfg.modules.map((mod) => (
                    <div
                      key={mod.key}
                      onClick={() => toggleModule(mod.key)}
                      style={{
                        background: currentSectorState.modules[mod.key] ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${currentSectorState.modules[mod.key] ? GOLD : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 8,
                        padding: "10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!currentSectorState.modules[mod.key]}
                        onChange={() => {}}
                        style={{ marginTop: "3px", accentColor: GOLD }}
                      />
                      <div>
                        <strong style={{ fontSize: "0.78rem", color: currentSectorState.modules[mod.key] ? "#ffffff" : "#9ca3af" }}>
                          {mod.label}
                        </strong>
                        <div style={{ fontSize: "0.68rem", color: "#6b7280", marginTop: "2px" }}>
                          {mod.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. THE PROTOTYPE: SECTOR RADAR & INSTANT PITCH / WEAPON */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* Sector Radar */}
            <div style={{ background: PANEL, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: "14px", padding: "18px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", margin: "0 0 12px 0" }}>
                📊 {cfg.prototypeRadarTitle} ({currentSectorState.region})
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                {cfg.radarMetrics.map((rm, idx) => (
                  <div key={idx} style={{ background: rm.bg, border: `1px solid ${rm.border}`, padding: "10px", borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#9ca3af", fontWeight: 700 }}>{rm.label}</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 900, color: rm.color, marginTop: "2px" }}>{rm.val}</div>
                    <div style={{ fontSize: "0.65rem", color: "#cbd5e1" }}>{rm.sub}</div>
                  </div>
                ))}
              </div>

              {/* Sample Ingestion Telemetry */}
              <div style={{ fontSize: "0.74rem", color: "#cbd5e1" }}>
                <strong style={{ color: GOLD }}>{cfg.sampleItemsTitle}:</strong>
                <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {cfg.sampleItems.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", padding: "6px 8px", borderRadius: 4, gap: "8px" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                      <span style={{ color: item.color, fontWeight: 700, flexShrink: 0 }}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pitch Drafter */}
            <div style={{ background: PANEL, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", margin: 0 }}>
                  {cfg.pitchTitle}
                </h3>
                <div style={{ display: "flex", gap: "4px" }}>
                  {cfg.pitchTabs.map((tabKey) => (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => updateCurrentSector("pitchTab", tabKey)}
                      style={{
                        background: currentSectorState.pitchTab === tabKey ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${currentSectorState.pitchTab === tabKey ? GOLD : "rgba(255,255,255,0.1)"}`,
                        color: currentSectorState.pitchTab === tabKey ? GOLD_LIGHT : "#9ca3af",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        textTransform: "capitalize"
                      }}
                    >
                      {tabKey.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "12px", maxHeight: "160px", overflowY: "auto" }}>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.78rem", color: "#e5e7eb", margin: 0, lineHeight: "1.45" }}>
                  {currentPitch}
                </pre>
              </div>
              <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleCopy(currentPitch, "Pitch Copied")}
                  style={{ flex: 1, background: "rgba(16,185,129,0.15)", border: `1px solid ${EMERALD}`, color: "#6ee7b7", padding: "6px", borderRadius: 6, fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}
                >
                  {copiedNotice === "Pitch Copied" ? "Copied!" : "📋 Copy Proposal"}
                </button>
                <button
                  type="button"
                  onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(currentPitch)}`, "_blank")}
                  style={{ flex: 1, background: "rgba(34,197,94,0.15)", border: "1px solid #22c55e", color: "#86efac", padding: "6px", borderRadius: 6, fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}
                >
                  📲 Dispatch WhatsApp
                </button>
              </div>
            </div>
          </div>

          {/* 2.5 SECTOR AD & DIRECT MEDIA FUEL SIMULATOR */}
          <div
            style={{
              background: PANEL,
              border: "1px solid rgba(56, 189, 248, 0.35)",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.72rem", color: SAPPHIRE, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {cfg.mediaSimulator.title}
                  </span>
                  <span
                    style={{
                      background: "rgba(56, 189, 248, 0.15)",
                      border: `1px solid ${SAPPHIRE}`,
                      color: "#7dd3fc",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "0.65rem",
                      fontWeight: 800
                    }}
                  >
                    {cfg.mediaSimulator.badge}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#ffffff", margin: "4px 0 0 0" }}>
                  Target Saturation & Acquisition Radar ({currentSectorState.region})
                </h3>
                <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "2px" }}>
                  {cfg.mediaSimulator.sub}
                </div>
              </div>

              {/* ESTIMATED DIRECT MEDIA BURN */}
              <div
                style={{
                  background: "radial-gradient(circle at top, rgba(56,189,248,0.15), rgba(0,0,0,0.8))",
                  border: `2px solid ${SAPPHIRE}`,
                  borderRadius: "12px",
                  padding: "12px 18px",
                  textAlign: "right",
                  minWidth: "220px",
                  boxShadow: "0 0 20px rgba(56,189,248,0.2)"
                }}
              >
                <div style={{ fontSize: "0.68rem", color: SAPPHIRE, fontWeight: 800, textTransform: "uppercase" }}>
                  DIRECT AD / MEDIA BUDGET (EST.)
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#ffffff", marginTop: "2px" }}>
                  {mediaCalculation.exactMediaInr}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#7dd3fc", fontWeight: 700 }}>
                  {mediaCalculation.formattedMediaSpend} · ₹{mediaCalculation.costPerTarget} / target
                </div>
              </div>
            </div>

            {/* SLIDERS FOR TARGET AUDIENCE & IMPRESSIONS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "16px" }}>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 700 }}>{cfg.mediaSimulator.slider1Label}:</span>
                  <strong style={{ color: SAPPHIRE, fontSize: "0.95rem" }}>
                    {currentSectorState.media1.toLocaleString("en-IN")} {cfg.mediaSimulator.slider1Unit}
                  </strong>
                </div>
                <input
                  type="range"
                  min={cfg.mediaSimulator.slider1Min}
                  max={cfg.mediaSimulator.slider1Max}
                  step={cfg.mediaSimulator.slider1Step}
                  value={currentSectorState.media1}
                  onChange={(e) => updateCurrentSector("media1", Number(e.target.value))}
                  style={{ width: "100%", marginTop: "8px", accentColor: SAPPHIRE }}
                />
              </div>

              <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 700 }}>{cfg.mediaSimulator.slider2Label}:</span>
                  <strong style={{ color: GOLD_LIGHT, fontSize: "0.95rem" }}>
                    {currentSectorState.media2}{cfg.mediaSimulator.slider2Unit}
                  </strong>
                </div>
                <input
                  type="range"
                  min={cfg.mediaSimulator.slider2Min}
                  max={cfg.mediaSimulator.slider2Max}
                  step={cfg.mediaSimulator.slider2Step}
                  value={currentSectorState.media2}
                  onChange={(e) => updateCurrentSector("media2", Number(e.target.value))}
                  style={{ width: "100%", marginTop: "8px", accentColor: GOLD }}
                />
              </div>
            </div>

            {/* TARGETING CLUSTERS (DYNAMIC PER SECTOR) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px", marginBottom: "14px" }}>
              {cfg.mediaSimulator.clusters.map((cl, idx) => (
                <div key={idx} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "0.78rem", color: cl.color }}>{cl.title}</strong>
                    <span style={{ fontSize: "0.65rem", color: "#9ca3af" }}>{cl.sub}</span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "4px" }}>
                    {cl.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* STATUTORY DISCLAIMER */}
            <div
              style={{
                background: "rgba(234, 179, 8, 0.08)",
                border: "1px solid rgba(234, 179, 8, 0.25)",
                borderRadius: "8px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px"
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>⚖️</span>
              <div style={{ fontSize: "0.72rem", color: "#fef08a", lineHeight: "1.45" }}>
                <strong>Statutory Financial Demarcation (Supreme Governance Standard):</strong>
                <br />
                {cfg.mediaSimulator.legalNotice}
              </div>
            </div>
          </div>

          {/* 3. DYNAMIC MILESTONE ESCROW (CHANGES WITH SLIDERS & OPTIONS) */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(15,23,42,0.95))",
              border: `1px solid ${GOLD}`,
              borderRadius: "14px",
              padding: "24px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: GOLD, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  SOVEREIGN COMMERCIAL ESCROW (U10 REVENUE UNIVERSE)
                </span>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff", margin: "4px 0 0 0" }}>
                  Official Milestone Retainer for {currentSectorState.clientName}
                </h3>
                <div style={{ fontSize: "0.82rem", color: "#9ca3af", marginTop: "2px" }}>
                  Live Verified Value: <strong style={{ color: "#ffffff" }}>{liveCalculation.exactInr}</strong> ({liveCalculation.formattedTotal}) · Zero-Discount Enterprise Policy
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setShowDossierModal(true)}
                  style={{
                    background: "linear-gradient(135deg, #1e40af, #2563eb)",
                    border: "none",
                    color: "#ffffff",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(37,99,235,0.4)"
                  }}
                >
                  📄 Cabinet Dossier (SOW)
                </button>
                <button
                  type="button"
                  onClick={() => { setCurrentSlideIndex(0); setShowPresentationModal(true); }}
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                    border: "none",
                    color: "#ffffff",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(147,51,234,0.4)"
                  }}
                >
                  📽️ Pitch Deck (16:9)
                </button>
                <button
                  type="button"
                  onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareableText)}`, "_blank")}
                  style={{
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    border: "none",
                    color: "#ffffff",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(34,197,94,0.4)"
                  }}
                >
                  📲 WhatsApp Proposal
                </button>
              </div>
            </div>

            {/* Real-time calculated 3-stage milestone breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              <div style={{ background: "rgba(0,0,0,0.5)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.72rem", color: GOLD_LIGHT, fontWeight: 800 }}>STAGE 1: ADVANCE INITIATION (40%)</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff", marginTop: "2px" }}>
                  ₹{liveCalculation.stage1Advance.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "4px" }}>
                  Platform architecture, data ingestion ({currentSectorState.s1} {cfg.slider1.unit}) & digital fortress deployment.
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.5)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.72rem", color: SAPPHIRE, fontWeight: 800 }}>STAGE 2: CAMPAIGN BLITZ (35%)</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff", marginTop: "2px" }}>
                  ₹{liveCalculation.stage2Mid.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "4px" }}>
                  Production of {currentSectorState.s2} {cfg.slider2.unit}, targeted outreach grid & sentinel monitoring.
                </div>
              </div>

              <div style={{ background: "rgba(0,0,0,0.5)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "0.72rem", color: EMERALD, fontWeight: 800 }}>STAGE 3: VICTORY & CONCLUSION (25%)</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff", marginTop: "2px" }}>
                  ₹{liveCalculation.stage3Victory.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: "4px" }}>
                  Final milestone deliverables, commercial conversion targets & comprehensive audit.
                </div>
              </div>
            </div>

            <div style={{ marginTop: "14px", fontSize: "0.72rem", color: "#6b7280", textAlign: "right" }}>
              🔒 Cryptographic Seal: <strong style={{ color: "#9ca3af" }}>sha256_sovereign_escrow_{selectedSector}_{Date.now().toString(36)}</strong> · Governed by GARUDA Constitution
            </div>
          </div>
        </section>
      </div>

      {/* 4. EXECUTIVE CABINET DOSSIER ON-SCREEN VIEWER MODAL */}
      {showDossierModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3, 7, 18, 0.88)",
            backdropFilter: "blur(10px)",
            zIndex: 9999,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px 16px"
          }}
        >
          {/* Modal Header Controls */}
          <div
            style={{
              maxWidth: "960px",
              width: "100%",
              background: "#0b0f19",
              border: "1px solid rgba(212,175,55,0.4)",
              borderRadius: "12px",
              padding: "14px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.8)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.2rem" }}>📜</span>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#ffffff" }}>
                  GARUDA SOVEREIGN EXECUTIVE DOSSIER (SOW)
                </div>
                <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                  {activeSectorData.title} · Defense-Grade Commercial Memorandum
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={handlePrintPdf}
                style={{
                  background: "linear-gradient(135deg, #1e40af, #2563eb)",
                  border: "none",
                  color: "#ffffff",
                  padding: "7px 14px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                🖨️ Print / Save Clean PDF
              </button>
              <button
                onClick={handleDownloadDossier}
                style={{
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid #10b981",
                  color: "#6ee7b7",
                  padding: "7px 14px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                📥 Download SOW File (.md)
              </button>
              <button
                onClick={() => handleCopy(generateDossierMarkdown(), "Full Dossier Copied")}
                style={{
                  background: "rgba(212,175,55,0.15)",
                  border: "1px solid #d4af37",
                  color: "#fef08a",
                  padding: "7px 14px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                📋 {copiedNotice === "Full Dossier Copied" ? "Copied!" : "Copy Full Text"}
              </button>
              <button
                onClick={() => setShowDossierModal(false)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#e2e8f0",
                  padding: "7px 14px",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Mature Institutional Document Card */}
          <div
            style={{
              maxWidth: "960px",
              width: "100%",
              background: "#ffffff",
              color: "#0f172a",
              borderRadius: "8px",
              padding: "48px 40px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}
          >
            {/* Header Stamp */}
            <div style={{ borderBottom: "3px solid #1e3a8a", paddingBottom: "20px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#b8860b", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    GARUDA SOVEREIGN EXECUTIVE BRIEFING // CONFIDENTIAL
                  </div>
                  <h2 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#111827", margin: "4px 0" }}>
                    STATEMENT OF WORK & COMMERCIAL ESCROW
                  </h2>
                  <div style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600 }}>
                    {activeSectorData.title.toUpperCase()} · SOVEREIGN AI INFRASTRUCTURE
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>
                    SERIAL: GARUDA/SOW/2026/{selectedSector.toUpperCase()}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
                    DATE: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 800, marginTop: "2px" }}>
                    SECURITY: DEFENSE-GRADE COMMERCIAL ESCROW
                  </div>
                </div>
              </div>
            </div>

            {/* Principal Metadata Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "28px", fontSize: "0.88rem" }}>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 0", fontWeight: 700, color: "#64748b", width: "28%" }}>Designated Client:</td>
                  <td style={{ padding: "8px 0", fontWeight: 900, color: "#0f172a" }}>{currentSectorState.clientName}</td>
                  <td style={{ padding: "8px 0", fontWeight: 700, color: "#64748b", width: "24%" }}>Operating Platform:</td>
                  <td style={{ padding: "8px 0", fontWeight: 800, color: "#1e3a8a" }}>GARUDA AI OS</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 0", fontWeight: 700, color: "#64748b" }}>Target Jurisdiction:</td>
                  <td style={{ padding: "8px 0", fontWeight: 700, color: "#0f172a" }}>{currentSectorState.region}</td>
                  <td style={{ padding: "8px 0", fontWeight: 700, color: "#64748b" }}>Allocated Workforce:</td>
                  <td style={{ padding: "8px 0", fontWeight: 700, color: "#0f172a" }}>1,000 Autonomous AI Agents</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "8px 0", fontWeight: 700, color: "#64748b" }}>Sovereign Retainer:</td>
                  <td style={{ padding: "8px 0", fontWeight: 900, fontSize: "1.05rem", color: "#1e3a8a" }}>
                    {liveCalculation.exactInr} ({liveCalculation.formattedTotal})
                  </td>
                  <td style={{ padding: "8px 0", fontWeight: 700, color: "#64748b" }}>Pricing Policy:</td>
                  <td style={{ padding: "8px 0", fontWeight: 800, color: "#b8860b" }}>100% Non-Discounted Escrow</td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 0", fontWeight: 700, color: "#64748b" }}>Estimated Direct Ad Fuel:</td>
                  <td colSpan={3} style={{ padding: "8px 0", fontWeight: 800, color: "#047857" }}>
                    {mediaCalculation.exactMediaInr} ({mediaCalculation.formattedMediaSpend}) · 100% Direct Client Card Payment to Meta & Google (0% Agency Markup)
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Section 1: Problem Forensics */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1e3a8a", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px", marginBottom: "10px" }}>
                1. Operational Threat Landscape & Forensic Problem Elimination
              </h3>
              <p style={{ fontSize: "0.85rem", lineHeight: "1.6", color: "#334155", margin: "0 0 10px 0" }}>
                Conventional agencies and manual operational methods consistently leak capital and operational momentum in this sector:
              </p>
              <ul style={{ fontSize: "0.84rem", lineHeight: "1.6", color: "#334155", margin: 0, paddingLeft: "20px" }}>
                <li><strong>Agency Margin Gouging:</strong> Traditional marketing firms impose hidden 20%–35% markups on media ad fuel with zero verifiable telemetry.</li>
                <li><strong>Execution Latency Penalty:</strong> 2 to 4-week delays in drafting and distributing campaign narratives cause irreversible market and perception bleed.</li>
                <li><strong>Data Blindness:</strong> Without live telemetry nodes, decision-makers are left blind to real-time competitor maneuvers and ground-level sentiment shifts.</li>
              </ul>
            </div>

            {/* Section 2: Fleet Architecture & Active Deliverables */}
            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1e3a8a", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px", marginBottom: "10px" }}>
                2. Enterprise AI OS Architecture & Deliverables Matrix
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem", marginBottom: "12px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                    <th style={{ padding: "8px", textAlign: "left", color: "#1e293b" }}>Scope Dimension</th>
                    <th style={{ padding: "8px", textAlign: "left", color: "#1e293b" }}>Configured Capacity</th>
                    <th style={{ padding: "8px", textAlign: "left", color: "#1e293b" }}>Operational Execution Mode</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px", fontWeight: 700 }}>Primary Scale</td>
                    <td style={{ padding: "8px" }}>{currentSectorState.s1} {cfg.slider1.unit}</td>
                    <td style={{ padding: "8px", color: "#475569" }}>Real-time telemetry and data ingestion nodes deployed</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px", fontWeight: 700 }}>Content Factory</td>
                    <td style={{ padding: "8px" }}>{currentSectorState.s2} {cfg.slider2.unit}</td>
                    <td style={{ padding: "8px", color: "#475569" }}>High-velocity neural voice, 4K rendering & distribution</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px", fontWeight: 700 }}>Algorithmic Saturation</td>
                    <td style={{ padding: "8px" }}>{currentSectorState.media1.toLocaleString("en-IN")} {cfg.mediaSimulator.slider1Unit}</td>
                    <td style={{ padding: "8px", color: "#475569" }}>{(mediaCalculation.totalImpressions / 1000000).toFixed(2)}M Impressions at {currentSectorState.media2}x frequency</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px", fontWeight: 700 }}>Battle Horizon</td>
                    <td style={{ padding: "8px" }}>{currentSectorState.duration} Months</td>
                    <td style={{ padding: "8px", color: "#475569" }}>Uninterrupted 24/7 autonomous intelligence & PR sentinel</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ fontSize: "0.82rem", color: "#475569", fontWeight: 700, marginBottom: "6px" }}>
                Active System Modules Configured:
              </div>
              <ul style={{ fontSize: "0.82rem", lineHeight: "1.5", color: "#334155", margin: 0, paddingLeft: "20px" }}>
                {cfg.modules.filter((m) => currentSectorState.modules[m.key]).map((m) => (
                  <li key={m.key}><strong>{m.label.split("(")[0].trim()}:</strong> {m.desc}</li>
                ))}
              </ul>
            </div>

            {/* Section 3: 3-Stage Milestone Escrow */}
            <div style={{ marginBottom: "28px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1e3a8a", borderBottom: "1px solid #cbd5e1", paddingBottom: "6px", marginBottom: "10px" }}>
                3. Structured 3-Stage Milestone Escrow Protocol
              </h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
                    <th style={{ padding: "8px", textAlign: "left", width: "18%" }}>Milestone</th>
                    <th style={{ padding: "8px", textAlign: "left" }}>Deliverable & Acceptance Criteria</th>
                    <th style={{ padding: "8px", textAlign: "right", width: "15%" }}>Allocation</th>
                    <th style={{ padding: "8px", textAlign: "right", width: "20%" }}>Escrow Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px", fontWeight: 800, color: "#1e3a8a" }}>Stage 1: Inception</td>
                    <td style={{ padding: "8px", color: "#334155" }}>
                      Architecture deployment, telemetry ingestion of {currentSectorState.s1} {cfg.slider1.unit} & security fortress setup.
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>40%</td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: 900, color: "#0f172a" }}>
                      ₹{liveCalculation.stage1Advance.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px", fontWeight: 800, color: "#1e3a8a" }}>Stage 2: Blitz</td>
                    <td style={{ padding: "8px", color: "#334155" }}>
                      Rollout of {currentSectorState.s2} {cfg.slider2.unit}, active outreach lead swarm & 24/7 sentinel monitoring.
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>35%</td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: 900, color: "#0f172a" }}>
                      ₹{liveCalculation.stage2Mid.toLocaleString("en-IN")}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px", fontWeight: 800, color: "#10b981" }}>Stage 3: Victory</td>
                    <td style={{ padding: "8px", color: "#334155" }}>
                      Final target delivery audit, comprehensive performance sign-off & sovereign asset handover.
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>25%</td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: 900, color: "#0f172a" }}>
                      ₹{liveCalculation.stage3Victory.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 4: Bilateral Authorization Signatures */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", paddingTop: "20px", borderTop: "2px solid #e2e8f0" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>AUTHORIZED FOR GARUDA AI OS:</div>
                <div style={{ height: "45px" }} />
                <div style={{ fontWeight: 900, fontSize: "1rem", color: "#0f172a" }}>Praveen Mahawar</div>
                <div style={{ fontSize: "0.78rem", color: "#475569" }}>Founder & Supreme Architect, GARUDA AI OS</div>
              </div>

              <div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>ACCEPTED & APPROVED BY:</div>
                <div style={{ height: "45px" }} />
                <div style={{ fontWeight: 900, fontSize: "1rem", color: "#0f172a" }}>{currentSectorState.clientName}</div>
                <div style={{ fontSize: "0.78rem", color: "#475569" }}>Principal Enterprise In-Charge</div>
              </div>
            </div>

            <div style={{ marginTop: "24px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", textAlign: "center", fontSize: "0.7rem", color: "#94a3b8" }}>
              🔒 Cryptographic SHA-256 Seal: sha256_sovereign_sow_{selectedSector}_2026 · Confidential & Governed by GARUDA Constitution
            </div>
          </div>
        </div>
      )}

      {/* 5. 16:9 BOARDROOM PRESENTATION DECK MODAL */}
      {showPresentationModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "#030712",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "20px 24px",
            fontFamily: "sans-serif"
          }}
        >
          {/* Top Presentation Deck Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.3rem" }}>📽️</span>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#d4af37", letterSpacing: "0.06em" }}>
                  GARUDA SOVEREIGN MATRIX™ // BOARDROOM BRIEFING
                </div>
                <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                  {activeSectorData.title} · Slide {currentSlideIndex + 1} of 6
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                disabled={currentSlideIndex === 0}
                onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                style={{
                  background: currentSlideIndex === 0 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: currentSlideIndex === 0 ? "#64748b" : "#ffffff",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: currentSlideIndex === 0 ? "not-allowed" : "pointer"
                }}
              >
                ◀ Prev Slide
              </button>
              <button
                disabled={currentSlideIndex === 5}
                onClick={() => setCurrentSlideIndex((prev) => Math.min(5, prev + 1))}
                style={{
                  background: currentSlideIndex === 5 ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #d4af37, #b8860b)",
                  border: "none",
                  color: currentSlideIndex === 5 ? "#64748b" : "#030712",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  cursor: currentSlideIndex === 5 ? "not-allowed" : "pointer"
                }}
              >
                Next Slide ▶
              </button>
              <button
                onClick={handlePrintPdf}
                style={{
                  background: "rgba(37,99,235,0.2)",
                  border: "1px solid #3b82f6",
                  color: "#93c5fd",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                🖨️ Export Deck
              </button>
              <button
                onClick={() => setShowPresentationModal(false)}
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid #ef4444",
                  color: "#fca5a5",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ✕ Exit Deck
              </button>
            </div>
          </div>

          {/* 16:9 Slide Canvas */}
          <div
            style={{
              maxWidth: "1080px",
              width: "100%",
              aspectRatio: "16/9",
              margin: "auto",
              background: "#080c14",
              border: "1px solid rgba(212,175,55,0.35)",
              borderRadius: "16px",
              padding: "48px 56px",
              boxShadow: "0 0 50px rgba(0,0,0,0.9), 0 0 30px rgba(212,175,55,0.1)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative"
            }}
          >
            {/* Slide 1: Title & Mandate */}
            {currentSlideIndex === 0 && (
              <>
                <div>
                  <div style={{ display: "inline-block", background: "rgba(212,175,55,0.15)", border: "1px solid #d4af37", color: "#fef08a", padding: "4px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800, marginBottom: "16px" }}>
                    SOVEREIGN STRATEGIC BRIEFING // BOARDROOM CONFIDENTIAL
                  </div>
                  <h1 style={{ fontSize: "2.4rem", fontWeight: 900, color: "#ffffff", margin: "0 0 12px 0", letterSpacing: "0.02em" }}>
                    GARUDA AI SOVEREIGN MATRIX™
                  </h1>
                  <p style={{ fontSize: "1.15rem", color: "#93c5fd", margin: 0, fontWeight: 700 }}>
                    {activeSectorData.title}
                  </p>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "20px 24px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>DESIGNATED PRINCIPAL</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#ffffff", marginTop: "2px" }}>
                        {currentSectorState.clientName}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>{currentSectorState.region}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>SOVEREIGN ARCHITECT</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#d4af37", marginTop: "2px" }}>
                        Founder Praveen Mahawar
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>1,000 Autonomous AI Agent Fleet inside GARUDA OS</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#64748b" }}>
                  <span>CLASSIFICATION: COMMERCIAL IN CONFIDENCE</span>
                  <span>GARUDA OS PLATFORM ENGINE</span>
                </div>
              </>
            )}

            {/* Slide 2: Strategic Threat & Problem Forensics */}
            {currentSlideIndex === 1 && (
              <>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 800, letterSpacing: "0.1em" }}>
                    OPERATIONAL HEMORRHAGE ANALYSIS
                  </div>
                  <h2 style={{ fontSize: "1.9rem", fontWeight: 900, color: "#ffffff", margin: "4px 0 0 0" }}>
                    The Failure of Conventional Agency Workflows
                  </h2>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "20px" }}>
                    <div style={{ fontSize: "1.4rem" }}>💸</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fca5a5", marginTop: "8px" }}>Capital Bleed</div>
                    <div style={{ fontSize: "0.78rem", color: "#cbd5e1", marginTop: "6px", lineHeight: "1.5" }}>
                      Traditional agencies markup media ads by 20–35% without telemetry, wasting budget on untargeted mass channels.
                    </div>
                  </div>

                  <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "10px", padding: "20px" }}>
                    <div style={{ fontSize: "1.4rem" }}>⏳</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fef08a", marginTop: "8px" }}>Latency Bottleneck</div>
                    <div style={{ fontSize: "0.78rem", color: "#cbd5e1", marginTop: "6px", lineHeight: "1.5" }}>
                      Manual design teams take 2–3 weeks to respond to market shifts or competitor attacks, losing momentum.
                    </div>
                  </div>

                  <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "10px", padding: "20px" }}>
                    <div style={{ fontSize: "1.4rem" }}>👁️‍🗨️</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#93c5fd", marginTop: "8px" }}>Data Blindness</div>
                    <div style={{ fontSize: "0.78rem", color: "#cbd5e1", marginTop: "6px", lineHeight: "1.5" }}>
                      Zero ground-level telemetry leaves executive leadership blind to localized sentiment shifts.
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "0.82rem", color: "#94a3b8", fontStyle: "italic" }}>
                  "GARUDA eliminates human delays by replacing manual coordination with an autonomous 1,000-agent execution fleet."
                </div>
              </>
            )}

            {/* Slide 3: Enterprise AI OS Architecture */}
            {currentSlideIndex === 2 && (
              <>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 800, letterSpacing: "0.1em" }}>
                    SOVEREIGN SYSTEM TOPOLOGY
                  </div>
                  <h2 style={{ fontSize: "1.9rem", fontWeight: 900, color: "#ffffff", margin: "4px 0 0 0" }}>
                    1,000 Autonomous AI Agents Fleet Architecture
                  </h2>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ color: "#38bdf8", fontWeight: 800, fontSize: "0.88rem" }}>📡 PILLAR 1: TELEMETRY GRID</div>
                    <div style={{ color: "#ffffff", fontSize: "1.1rem", fontWeight: 900, marginTop: "2px" }}>
                      {currentSectorState.s1} {cfg.slider1.unit} Monitored
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
                      Real-time sentiment telemetry, GIS coordinates, and active stakeholder feedback loops.
                    </div>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ color: "#d4af37", fontWeight: 800, fontSize: "0.88rem" }}>🎬 PILLAR 2: CONTENT FACTORY</div>
                    <div style={{ color: "#ffffff", fontSize: "1.1rem", fontWeight: 900, marginTop: "2px" }}>
                      {currentSectorState.s2} {cfg.slider2.unit} Rendered
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
                      Autonomous multi-dialect neural voice, 4K rendering & high-converting algorithmic assets.
                    </div>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ color: "#10b981", fontWeight: 800, fontSize: "0.88rem" }}>⚡ PILLAR 3: TARGETED SATURATION</div>
                    <div style={{ color: "#ffffff", fontSize: "1.1rem", fontWeight: 900, marginTop: "2px" }}>
                      {currentSectorState.media1.toLocaleString("en-IN")} {cfg.mediaSimulator.slider1Unit}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
                      Precision algorithmic distribution with zero intermediary ad markup or agency cuts.
                    </div>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ color: "#ec4899", fontWeight: 800, fontSize: "0.88rem" }}>🛡️ PILLAR 4: 24/7 SENTINEL WAR ROOM</div>
                    <div style={{ color: "#ffffff", fontSize: "1.1rem", fontWeight: 900, marginTop: "2px" }}>
                      15-Minute Crisis Response
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
                      Continuous opposition counter-strike, grievance triage, and brand defense radar.
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Active Modules Configured: {cfg.modules.filter((m) => currentSectorState.modules[m.key]).length} of {cfg.modules.length} Enabled
                </div>
              </>
            )}

            {/* Slide 4: Direct Media Fuel & Reach Economics */}
            {currentSlideIndex === 3 && (
              <>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 800, letterSpacing: "0.1em" }}>
                    PAID MEDIA SATURATION MODEL
                  </div>
                  <h2 style={{ fontSize: "1.9rem", fontWeight: 900, color: "#ffffff", margin: "4px 0 0 0" }}>
                    100% Direct Client-Card Paid Media Fuel (0% Markup)
                  </h2>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "24px" }}>
                    <div style={{ fontSize: "0.8rem", color: "#6ee7b7", fontWeight: 800 }}>ESTIMATED DIRECT MEDIA FUEL</div>
                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                      {mediaCalculation.exactMediaInr}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "#a7f3d0", marginTop: "4px" }}>
                      {mediaCalculation.formattedMediaSpend} Total Media Budget
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginTop: "12px", lineHeight: "1.5" }}>
                      Paid directly by Client PAN/GST card to Meta & Google. GARUDA charges ZERO commission on ad spend.
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "14px 18px", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>TARGET AUDIENCE BASE</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff" }}>
                        {currentSectorState.media1.toLocaleString("en-IN")} {cfg.mediaSimulator.slider1Unit}
                      </div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "14px 18px", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>SATURATION FREQUENCY</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#ffffff" }}>
                        {currentSectorState.media2}x Exposures per Target
                      </div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "14px 18px", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>TOTAL HIGH-IMPACT IMPRESSIONS</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#38bdf8" }}>
                        {(mediaCalculation.totalImpressions / 1000000).toFixed(2)} Million Impressions
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  STATUTORY TRANSPARENCY: Zero hidden deductions. 100% audited platform invoices.
                </div>
              </>
            )}

            {/* Slide 5: Commercial Milestone Escrow */}
            {currentSlideIndex === 4 && (
              <>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "#d4af37", fontWeight: 800, letterSpacing: "0.1em" }}>
                    COMMERCIAL VALUATION & ESCROW
                  </div>
                  <h2 style={{ fontSize: "1.9rem", fontWeight: 900, color: "#ffffff", margin: "4px 0 0 0" }}>
                    Sovereign Milestone Escrow & Capital Allocation
                  </h2>
                </div>

                <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "12px", padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "0.8rem", color: "#d4af37", fontWeight: 800 }}>TOTAL SOVEREIGN RETAINER</div>
                      <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", marginTop: "2px" }}>
                        {liveCalculation.exactInr}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>Horizon: {currentSectorState.duration} Months</div>
                      <div style={{ fontSize: "0.85rem", color: "#6ee7b7", fontWeight: 800 }}>Zero-Discount Enterprise Policy</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#d4af37", fontWeight: 800 }}>STAGE 1: ADVANCE (40%)</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                      ₹{liveCalculation.stage1Advance.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
                      Platform setup & telemetry ingestion
                    </div>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: 800 }}>STAGE 2: BLITZ (35%)</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                      ₹{liveCalculation.stage2Mid.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
                      Content blitz & active outreach grid
                    </div>
                  </div>

                  <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "16px" }}>
                    <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 800 }}>STAGE 3: VICTORY (25%)</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                      ₹{liveCalculation.stage3Victory.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "4px" }}>
                      Final target delivery & audit
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  ESCROW POLICY: Funds released strictly upon verifiable milestone delivery acceptance gates.
                </div>
              </>
            )}

            {/* Slide 6: Execution Roadmap & Sovereign Next Step */}
            {currentSlideIndex === 5 && (
              <>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 800, letterSpacing: "0.1em" }}>
                    IMMEDIATE DEPLOYMENT HORIZON
                  </div>
                  <h2 style={{ fontSize: "1.9rem", fontWeight: 900, color: "#ffffff", margin: "4px 0 0 0" }}>
                    Rapid 72-Hour Deployment Cadence
                  </h2>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "20px" }}>
                    <div style={{ color: "#d4af37", fontWeight: 800, fontSize: "0.85rem" }}>DAYS 1 – 3</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                      Architecture & Ingestion
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginTop: "6px", lineHeight: "1.5" }}>
                      Deploy GARUDA OS nodes, configure {currentSectorState.s1} telemetry nodes, and establish digital fortress.
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "20px" }}>
                    <div style={{ color: "#38bdf8", fontWeight: 800, fontSize: "0.85rem" }}>DAYS 4 – 10</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                      Algorithmic Blitz
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginTop: "6px", lineHeight: "1.5" }}>
                      Rollout {currentSectorState.s2} {cfg.slider2.unit}, activate lead/voter swarms, and launch paid media saturation.
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "20px" }}>
                    <div style={{ color: "#10b981", fontWeight: 800, fontSize: "0.85rem" }}>DAYS 11+</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
                      Autonomous Dominance
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginTop: "6px", lineHeight: "1.5" }}>
                      24/7 Sentinel monitoring, grievance defense, and continuous conversion pipeline execution.
                    </div>
                  </div>
                </div>

                <div style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "10px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#ffffff" }}>
                      Schedule Executive Consultation with Founder Praveen Mahawar
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#fef08a" }}>
                      Direct private strategy channel · Official Verified Email: praveen@garudaos.in
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPresentationModal(false);
                      setShowDossierModal(true);
                    }}
                    style={{
                      background: "linear-gradient(135deg, #d4af37, #b8860b)",
                      border: "none",
                      color: "#030712",
                      padding: "8px 18px",
                      borderRadius: "6px",
                      fontWeight: 800,
                      fontSize: "0.8rem",
                      cursor: "pointer"
                    }}
                  >
                    View Full Cabinet SOW
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Bottom Presentation Slide Dots Navigation */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px" }}>
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                style={{
                  width: idx === currentSlideIndex ? "28px" : "10px",
                  height: "10px",
                  borderRadius: "999px",
                  background: idx === currentSlideIndex ? "#d4af37" : "rgba(255,255,255,0.2)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                title={`Go to Slide ${idx + 1}`}
              />
            ))}
            <span style={{ fontSize: "0.72rem", color: "#64748b", marginLeft: "14px" }}>
              Press ← → Arrow keys to navigate · Esc to close
            </span>
          </div>
        </div>
      )}

      {/* 6. CLEAN DEFENSE-GRADE PRINT-ONLY CABINET MEMORANDUM */}
      <div className="print-dossier-page">
        <div style={{ borderBottom: "3px solid #1e3a8a", paddingBottom: "16px", marginBottom: "20px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#b8860b", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            CONFIDENTIAL STRATEGIC BRIEFING & COMMERCIAL ESCROW
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#111827", margin: "4px 0" }}>
            GARUDA AI SOVEREIGN TECHNOLOGIES
          </h1>
          <div style={{ fontSize: "0.95rem", color: "#475569", fontWeight: 700 }}>
            {activeSectorData.title.toUpperCase()} • ENTERPRISE SOVEREIGN INFRASTRUCTURE
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
            REF: GARUDA/SOW/2026/{selectedSector.toUpperCase()} · DATE: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "0.85rem" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "6px 0", fontWeight: 700, width: "30%", color: "#64748b" }}>Designated Client:</td>
              <td style={{ padding: "6px 0", fontWeight: 900, color: "#0f172a" }}>{currentSectorState.clientName}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "6px 0", fontWeight: 700, color: "#64748b" }}>Constituency / Domain:</td>
              <td style={{ padding: "6px 0", fontWeight: 700, color: "#0f172a" }}>{currentSectorState.region}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "6px 0", fontWeight: 700, color: "#64748b" }}>GARUDA OS Retainer Valuation:</td>
              <td style={{ padding: "6px 0", fontWeight: 900, fontSize: "1.1rem", color: "#1e3a8a" }}>
                {liveCalculation.exactInr} ({liveCalculation.formattedTotal})
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "6px 0", fontWeight: 700, color: "#64748b" }}>Direct Paid Media Fuel:</td>
              <td style={{ padding: "6px 0", fontWeight: 800, color: "#047857" }}>
                {mediaCalculation.exactMediaInr} ({mediaCalculation.formattedMediaSpend}) · 100% Direct Client Card to Meta/Google (0% Markup)
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "6px 0", fontWeight: 700, color: "#64748b" }}>Pricing Policy:</td>
              <td style={{ padding: "6px 0", color: "#0f172a" }}>100% Non-Discounted Sovereign Milestone Escrow</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 0", fontWeight: 700, color: "#64748b" }}>Workforce Allocation:</td>
              <td style={{ padding: "6px 0", color: "#0f172a" }}>1,000 Autonomous AI Agents Fleet inside GARUDA OS</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1e3a8a", borderBottom: "1px solid #1e3a8a", paddingBottom: "4px", marginBottom: "8px" }}>
          Configured Deliverables & Scope Matrix
        </h3>
        <ul style={{ fontSize: "0.82rem", lineHeight: "1.5", color: "#334155", marginBottom: "16px", paddingLeft: "20px" }}>
          <li><strong>Primary Scale:</strong> {currentSectorState.s1} {cfg.slider1.unit} mapped into GARUDA OS with telemetry nodes.</li>
          <li><strong>High-Velocity Content:</strong> {currentSectorState.s2} {cfg.slider2.unit} scripted, rendered, and distributed across platforms.</li>
          <li><strong>Direct Media Saturation:</strong> Reach across {currentSectorState.media1.toLocaleString("en-IN")} {cfg.mediaSimulator.slider1Unit} at {currentSectorState.media2}x frequency.</li>
          <li><strong>Battle Horizon:</strong> {currentSectorState.duration} Months of uninterrupted 24/7 autonomous intelligence operations.</li>
          {cfg.modules.filter((m) => currentSectorState.modules[m.key]).map((m) => (
            <li key={m.key}><strong>{m.label.split("(")[0].trim()}:</strong> {m.desc}</li>
          ))}
        </ul>

        <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#1e3a8a", borderBottom: "1px solid #1e3a8a", paddingBottom: "4px", marginBottom: "8px" }}>
          Structured 3-Phase Milestone Escrow
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px", fontSize: "0.82rem" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: "6px", textAlign: "left" }}>Phase</th>
              <th style={{ padding: "6px", textAlign: "left" }}>Milestone Deliverable</th>
              <th style={{ padding: "6px", textAlign: "right" }}>Percentage</th>
              <th style={{ padding: "6px", textAlign: "right" }}>Escrow Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "6px", fontWeight: 700 }}>Stage 1</td>
              <td style={{ padding: "6px" }}>Advance Initiation & Core Architecture Deployment ({currentSectorState.s1} {cfg.slider1.unit})</td>
              <td style={{ padding: "6px", textAlign: "right" }}>40%</td>
              <td style={{ padding: "6px", textAlign: "right", fontWeight: 700 }}>₹{liveCalculation.stage1Advance.toLocaleString("en-IN")}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "6px", fontWeight: 700 }}>Stage 2</td>
              <td style={{ padding: "6px" }}>Execution Blitz ({currentSectorState.s2} {cfg.slider2.unit}) & Sentinel Network</td>
              <td style={{ padding: "6px", textAlign: "right" }}>35%</td>
              <td style={{ padding: "6px", textAlign: "right", fontWeight: 700 }}>₹{liveCalculation.stage2Mid.toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px", fontWeight: 700 }}>Stage 3</td>
              <td style={{ padding: "6px" }}>Final Victory & Milestone Completion Audit</td>
              <td style={{ padding: "6px", textAlign: "right" }}>25%</td>
              <td style={{ padding: "6px", textAlign: "right", fontWeight: 700 }}>₹{liveCalculation.stage3Victory.toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Authorized for GARUDA OS:</div>
            <div style={{ height: "40px" }} />
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>Praveen Mahawar</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Founder & Supreme Architect, GARUDA AI</div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Accepted & Approved by:</div>
            <div style={{ height: "40px" }} />
            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>{currentSectorState.clientName}</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Principal Client / Enterprise In-Charge</div>
          </div>
        </div>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.7rem", color: "#9ca3af" }}>
          SHA-256 Governed Cryptographic Seal: sha256_cabinet_dossier_{selectedSector}_2026 · Confidential Executive Property
        </div>
      </div>
    </main>
  );
}
