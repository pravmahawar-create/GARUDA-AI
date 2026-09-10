/**
 * 🦅 GARUDA Clinic Closer AI Agent Service
 * 
 * Purpose:
 * - Engages incoming inquiries from Dental & Medical clinics.
 * - Handles clinical objections (Price, Tech, Timeline, Existing WhatsApp Number).
 * - Detects Buying Intent / "Yes Interested" signals.
 * - Instantly escalates to Founder Praveen Mahawar via Telegram alert with complete clinic details for an immediate closing call.
 */

const fs = require("fs");
const path = require("path");
const telegramBotService = require("./telegramBotService");
const llmProvider = require("./llmProvider");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const HOT_DEALS_FILE = path.join(DATA_DIR, "hot-clinic-deals.json");

// Verified Clinic Profiles
const CLINIC_PROFILES = {
  STEP3_CLINIC_MEDIDENT_INDORE: {
    clinicId: "STEP3_CLINIC_MEDIDENT_INDORE",
    businessName: "Medident Clinic",
    doctorName: "Dr. Priya Joshi & Dr. Prakash Joshi",
    city: "Indore",
    phone: "+917314969589",
    email: "drpriyajoshi2010@gmail.com",
    speciality: "Multispeciality Dental & Physician",
    standardFeeINR: 35000,
    advanceINR: 17500
  },
  STEP3_CLINIC_SANGHVI_MUMBAI: {
    clinicId: "STEP3_CLINIC_SANGHVI_MUMBAI",
    businessName: "Sanghvi's Dental Clinic",
    doctorName: "Dr. Aashal Sanghvi",
    city: "Santacruz West, Mumbai",
    phone: "+919819801940",
    email: "draashalsanghvi@gmail.com",
    speciality: "Cosmetic Dentistry & Smile Makeover",
    standardFeeINR: 40000,
    advanceINR: 20000
  },
  STEP3_CLINIC_KANUPRIYA_KOLKATA: {
    clinicId: "STEP3_CLINIC_KANUPRIYA_KOLKATA",
    businessName: "Dr Kanupriya Advanced Dentistry",
    doctorName: "Dr. Kanupriya",
    city: "AJC Bose Road, Kolkata",
    phone: "+919831246464",
    email: "care@drkanupriya.in",
    speciality: "Advanced Orthodontics & Dental Implants",
    standardFeeINR: 35000,
    advanceINR: 17500
  },
  STEP3_CLINIC_ONEDENTAL_MUMBAI: {
    clinicId: "STEP3_CLINIC_ONEDENTAL_MUMBAI",
    businessName: "One Dental Solutions",
    doctorName: "Dr. Aseem Agrawal",
    city: "Malad West, Mumbai",
    phone: "+918779376034",
    email: "aseem.dr@gmail.com",
    speciality: "Full Mouth Rehabilitation & Implants",
    standardFeeINR: 35000,
    advanceINR: 17500
  },
  STEP3_CLINIC_INDORE_DENTAL: {
    clinicId: "STEP3_CLINIC_INDORE_DENTAL",
    businessName: "Indore Dental Clinic",
    doctorName: "Chief Dental Surgeon",
    city: "Indore",
    phone: "+918461966613",
    email: "contact@indoredentalclinic.com",
    speciality: "General & Emergency Dentistry",
    standardFeeINR: 30000,
    advanceINR: 15000
  },
  STEP3_CLINIC_GIGGLES_MUMBAI: {
    clinicId: "STEP3_CLINIC_GIGGLES_MUMBAI",
    businessName: "Giggles & Grins Kids Dentistry",
    doctorName: "Pediatric Dental Team",
    city: "Dadar, Mumbai",
    phone: "+918072710242",
    email: "gigglesgrinsmumbai@gmail.com",
    speciality: "Pediatric Dentistry",
    standardFeeINR: 35000,
    advanceINR: 17500
  }
};

class ClinicCloserAgentService {
  constructor() {
    this.profiles = CLINIC_PROFILES;
  }

  getProfile(refOrPhone) {
    if (!refOrPhone) return null;
    const cleanRef = String(refOrPhone).trim();
    if (this.profiles[cleanRef]) return this.profiles[cleanRef];

    const cleanNum = cleanRef.replace(/[^0-9]/g, "");
    for (const key of Object.keys(this.profiles)) {
      const p = this.profiles[key];
      const pNum = p.phone.replace(/[^0-9]/g, "");
      if (cleanNum.endsWith(pNum.slice(-10)) || pNum.endsWith(cleanNum.slice(-10))) {
        return p;
      }
    }
    return null;
  }

  detectInterest(message) {
    const text = String(message || "").toLowerCase().trim();
    if (!text) return false;

    // Direct strong interest keywords
    const interestRegex = /\b(yes|yeah|yep|sure|interested|haan|theek hai|thik hai|sahi hai|demo|call me|connect|baat|call|karo|batao|number|payment|advance|shuru|start|deal|chahiye|done|okay|ok|agree)\b/i;
    
    // Check if user is asking for call / consultation
    const callRequest = /(call|baat|phone|connect|milte|discuss|schedule)/i.test(text);
    const positiveConsent = /^(yes|haan|ha|sure|interested|done|ok|okay|ha ji|haanji)$/i.test(text.replace(/[!.,]/g, ""));

    return positiveConsent || (interestRegex.test(text) && (callRequest || text.includes("demo") || text.includes("details") || text.includes("start")));
  }

  async escalateToFounder({ profile, userMessage, conversationHistory = [] }) {
    const p = profile || {
      businessName: "Direct Clinic Lead",
      doctorName: "Doctor / Clinic Owner",
      city: "India",
      phone: "Phone via WhatsApp",
      standardFeeINR: 35000,
      advanceINR: 17500
    };

    const convHistoryFormatted = Array.isArray(conversationHistory) && conversationHistory.length
      ? conversationHistory.map(m => `• ${m.role === "user" ? "Doctor" : "Agent"}: ${m.content || m.text}`).join("\n")
      : `• Doctor: "${String(userMessage).slice(0, 300)}"`;

    const alertTitle = "🚨🚨 HOT CLINIC DEAL ALERT — CLOSING CALL READY! 🚨🚨";
    const alertBody = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏥 Clinic: ${p.businessName}`,
      `👨‍⚕️ Doctor: ${p.doctorName}`,
      `📍 City: ${p.city}`,
      `📞 Direct Phone: ${p.phone}`,
      p.email ? `📧 Email: ${p.email}` : null,
      `💰 Deal Size: ₹${p.standardFeeINR.toLocaleString("en-IN")} (50% Advance: ₹${p.advanceINR.toLocaleString("en-IN")})`,
      `🎯 Status: Doctor is INTERESTED & ready to speak with Founder Praveen!`,
      `\n📜 Conversation History:\n${convHistoryFormatted}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👉 Call Doctor Directly: tel:${p.phone.replace(/[^0-9+]/g, "")}`,
      `👉 Open WhatsApp with Doctor: https://wa.me/${p.phone.replace(/[^0-9]/g, "")}`
    ].filter(Boolean).join("\n");

    // 1. Send Instant Telegram Alert
    try {
      await telegramBotService.sendMessage(`${alertTitle}\n\n${alertBody}`);
    } catch (err) {
      console.error("[ClinicCloserAgent] Telegram alert failed:", err.message);
    }

    // 2. Persist to Hot Deals Ledger
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      let deals = [];
      if (fs.existsSync(HOT_DEALS_FILE)) {
        try { deals = JSON.parse(fs.readFileSync(HOT_DEALS_FILE, "utf8")); } catch { deals = []; }
      }
      deals.push({
        id: `deal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        clinicId: p.clinicId || "unknown",
        businessName: p.businessName,
        doctorName: p.doctorName,
        city: p.city,
        phone: p.phone,
        dealSizeINR: p.standardFeeINR,
        advanceINR: p.advanceINR,
        doctorMessage: userMessage,
        escalatedAt: new Date().toISOString()
      });
      fs.writeFileSync(HOT_DEALS_FILE, JSON.stringify(deals, null, 2), "utf8");
    } catch (e) {
      console.error("[ClinicCloserAgent] Failed saving hot deal:", e.message);
    }

    return {
      escalated: true,
      doctorGreeting: p.doctorName.split(" ")[0] || "Doctor",
      phone: p.phone
    };
  }

  async handleMessage({ ref, phone, message, conversationHistory = [] }) {
    const profile = this.getProfile(ref) || this.getProfile(phone);
    const doctorName = profile ? profile.doctorName : "Doctor";
    const clinicName = profile ? profile.businessName : "aapke clinic";
    const text = String(message || "").trim();

    // Check if buying intent / call request is detected
    if (this.detectInterest(text)) {
      const esc = await this.escalateToFounder({ profile, userMessage: text, conversationHistory });
      return {
        reply: `Bohat badhiya ${doctorName}! Maine hamare Founder & Chief AI Architect Praveen Mahawar ji ko aapki clinic details aur request forward kar di hai.\n\nWo agle 5–10 minute mein aapse direct phone call / WhatsApp par connect kar rahe hain taaki live system dikha kar 48-hour setup kickoff lock kar sakein.\n\nDirect Founder Channel: praveen@garudaos.in | www.garudaos.in`,
        intent: "DEAL_INTERESTED_ESCALATED",
        escalated: true,
        profile
      };
    }

    // Handle common clinic objections / questions
    const lower = text.toLowerCase();

    // Pricing question
    if (/price|cost|charges|fee|kitna|paisa|rate/i.test(lower)) {
      const fee = profile ? profile.standardFeeINR : 35000;
      const adv = profile ? profile.advanceINR : 17500;
      return {
        reply: `Namaste ${doctorName}, GARUDA Clinic 24/7 AI Receptionist + Paperless Intake PWA ka complete turnkey setup ₹${fee.toLocaleString("en-IN")} hai (50% kickoff advance ₹${adv.toLocaleString("en-IN")} aur baaki 50% live testing aur verification ke baad).\n\nDoctor saheb, ek single dental implant ya 2 invisible aligner cases me ye poori cost recover ho jati hai jo raat ko 8 PM ke baad unanswered messages ki wajah se drop ho rahe the.\n\nSetup sirf 48 hours me live ho jata hai. Kya hum aaj sham 5 minute ka quick walkthrough call connect karein?`,
        intent: "PRICING_INQUIRY",
        escalated: false,
        profile
      };
    }

    // Timeline / How fast question
    if (/time|kitne din|timeline|duration|kab tak|fast|hours/i.test(lower)) {
      return {
        reply: `Sirf 48 hours mein! Hamari sovereign engineering team 48 ghante ke andar aapke clinic ke WhatsApp number par AI assistant configure karke intake PWA live kar deti hai.\n\nAapko koi technical kaam nahi karna hai. Kya Founder Praveen Mahawar se 5-minute closing call schedule karein?`,
        intent: "TIMELINE_INQUIRY",
        escalated: false,
        profile
      };
    }

    // Technical / Number question
    if (/number|existing|sim|phone badalna|change/i.test(lower)) {
      return {
        reply: `Aapka existing clinic WhatsApp number hi rahega doctor saheb. Number badalne ki bilkul zaroorat nahi hai. Patient usi number par message karenge aur unhe instant replies aur appointment booking milegi.\n\nKya hum call par aapse connect karke live demo dikhayein?`,
        intent: "TECH_NUMBER_INQUIRY",
        escalated: false,
        profile
      };
    }

    // Default conversational reply via LLM Provider
    try {
      const context = `You are Aarav, Senior Solutions Director at GARUDA AI Operating System (founded by Praveen Mahawar - www.garudaos.in). You are speaking to ${doctorName} of ${clinicName}. Keep replies warm, professional, respectful (Roman Hindi / English), and strictly focused on solving their 35% after-hours patient inquiry drop with a 24/7 WhatsApp AI receptionist and intake PWA in 48 hours. Never hallucinate fake contact numbers. Push politely to connect a 5-minute call with Founder Praveen Mahawar.`;
      const aiReply = await llmProvider.ask({
        systemContext: context,
        userMessage: text,
        conversationHistory,
        skipKnowledge: true,
        skipRuntimeContext: true,
        fastLane: true
      });
      if (aiReply && aiReply.answer) {
        return {
          reply: aiReply.answer.trim(),
          intent: "CONVERSATIONAL",
          escalated: false,
          profile
        };
      }
    } catch (err) { console.warn("[auto-recovery] suppressed error in clinicCloserAgentService.js:", String(err.message).slice(0,80)); }

    // Fallback if LLM unavailable
    return {
      reply: `Namaste ${doctorName}! GARUDA Clinic Growth Engine aapke clinic ke official WhatsApp par 24/7 intelligent patient booking aur 1-tap reception intake live karta hai taaki shaam ke waqt koi bhi patient drop na ho.\n\nIs par details discuss karne ke liye kya Founder Praveen Mahawar aapse 5 minute ki quick call par connect karein?`,
      intent: "FALLBACK",
      escalated: false,
      profile
    };
  }
}

module.exports = new ClinicCloserAgentService();
