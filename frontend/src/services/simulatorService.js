/**
 * 🦅 GARUDA OS — Pure Deterministic Simulation Service
 * ---------------------------------------------------
 * Reusable, safe, zero-LLM-cost simulation engine for public sandbox demos.
 * 
 * Safety & Security Guarantees:
 * - 0 API cost (No public LLM quota burn)
 * - 0 Private API / Token exposure
 * - 100% Deterministic (Zero prompt injection, zero hallucination)
 * - Safe demo environments with explicit simulation labeling
 */

export const SIMULATION_MODES = {
  CLINIC: "clinic",
  SALES: "sales",
  CODE: "code"
};

export const PRESET_PROMPTS = {
  [SIMULATION_MODES.CLINIC]: [
    { id: "c1", label: "📅 Book Appointment", text: "Hi! I'd like to book an appointment with Dr. Sharma for next week. Do you have any slots available?" },
    { id: "c2", label: "🦷 Severe Tooth Pain", text: "I have severe acute tooth pain on my lower jaw since last night and need to see the dentist ASAP today." },
    { id: "c3", label: "💰 Treatment Cost", text: "How much does a consultation and basic dental cleaning cost?" }
  ],
  [SIMULATION_MODES.SALES]: [
    { id: "s1", label: "🤖 WhatsApp Bot for Business", text: "I need a 24/7 WhatsApp receptionist for my retail store to handle customer orders and FAQs." },
    { id: "s2", label: "📊 Automation Pricing", text: "How much does it cost to automate our client onboarding workflow?" },
    { id: "s3", label: "📈 Generate More Leads", text: "We are an agency losing leads because of slow replies. Can GARUDA qualify inbound prospects automatically?" }
  ],
  [SIMULATION_MODES.CODE]: [
    { id: "d1", label: "⚡ Next.js API Route", text: "Generate a simple Next.js 14 API route for WhatsApp Cloud API webhook verification." },
    { id: "d2", label: "📝 WhatsApp Form", text: "Create a lightweight React inquiry form for WhatsApp lead capture." },
    { id: "d3", label: "🛡️ Triage Function", text: "Build a lead capture triage function that scores lead priority." }
  ]
};

export function simulateResponse(mode, inputMessage, clientName = "Guest") {
  const text = (inputMessage || "").toLowerCase().trim();

  // Mode 1: Clinic WhatsApp Receptionist
  if (mode === SIMULATION_MODES.CLINIC) {
    if (text.match(/appointment|book|slot|dr\. sharma|dr sharma|available|schedule|visit|next week/i)) {
      return {
        priority: "STANDARD",
        priorityColor: "#f5d76e",
        category: "Appointment Intake · Calendar Sync",
        recommendedAction: "Automated slot reservation",
        humanEscalationRequired: false,
        reply: `Hello! 👋\nDr. Sharma has the following slots available next week:\n\n📅 Mon, 12 May – 10:00 AM\n📅 Tue, 13 May – 11:30 AM\n📅 Wed, 14 May – 9:00 AM\n\nWould you like me to book any of these for you?`,
        disclaimer: "SIMULATION: Demo environment — no real patient data is used.",
        ctaLabel: "Deploy This Bot For My Business →",
        ctaType: "clinic"
      };
    }

    if (text.match(/pain|bleed|emergency|acute|severe|swelling|broken|trauma|tooth/i)) {
      return {
        priority: "HIGH PRIORITY",
        priorityColor: "#f87171",
        category: "Clinical Triage · Urgent Care",
        recommendedAction: "Simulated emergency hold · Human staff alerted",
        humanEscalationRequired: true,
        reply: `Namaste ${clientName}. We have flagged your message as high urgency. Dr. Sharma's clinic holds an emergency buffer slot today at 11:30 AM. Tap below to confirm or request human callback.`,
        disclaimer: "SIMULATION: Demo environment — no real patient, appointment, or clinical action is performed.",
        ctaLabel: "Deploy This Bot For My Business →",
        ctaType: "clinic"
      };
    }

    if (text.match(/hour|time|timing|open|address|location|when/i)) {
      return {
        priority: "STANDARD",
        priorityColor: "#38bdf8",
        category: "General Enquiry · Information",
        recommendedAction: "Automated schedule dispatch",
        humanEscalationRequired: false,
        reply: `Hello ${clientName}. Clinic hours are Monday–Saturday: 9:00 AM – 8:00 PM (Sunday: 10:00 AM – 2:00 PM). Consultations are by appointment. Reply with 'Book' to see available slots.`,
        disclaimer: "SIMULATION: Demo environment — no real patient, appointment, or clinical action is performed.",
        ctaLabel: "Deploy This Bot For My Business →",
        ctaType: "clinic"
      };
    }

    if (text.match(/ai|system|business|software|bot|app|agency|starter|code|automate|workflow/i)) {
      return {
        priority: "AI SYSTEM INQUIRY",
        priorityColor: "#75f4ab",
        category: "Enterprise AI Architecture",
        recommendedAction: "Autonomous system scoping & deployment",
        humanEscalationRequired: false,
        reply: `Namaste ${clientName}. While Dr. Sharma's clinic bot handles clinical patient intake, GARUDA OS builds custom autonomous AI systems, 24/7 receptionists, and workflows for any business. Turnkey setup starts at $199 (₹9,999) and Starter Kits are $49 (₹3,999). Tap below to deploy.`,
        disclaimer: "SIMULATION: Cross-system intelligence routing inbound commercial inquiry.",
        ctaLabel: "Deploy Your AI System →",
        ctaType: "sales"
      };
    }

    // Default / Pricing
    return {
      priority: "STANDARD",
      priorityColor: "#f5d76e",
      category: "Service & Pricing Enquiry",
      recommendedAction: "Transparent fee disclosure & intake",
      humanEscalationRequired: false,
      reply: `Hello ${clientName}. Initial oral examination is ₹500 ($15). Cleaning & polishing packages start at ₹1,200 ($35). Advanced procedures are estimated following clinical assessment.`,
      disclaimer: "SIMULATION: Demo environment — no real patient, appointment, or clinical action is performed.",
      ctaLabel: "Deploy This Bot For My Business →",
      ctaType: "clinic"
    };
  }

  // Mode 2: Sales Lead Qualifier
  if (mode === SIMULATION_MODES.SALES) {
    if (text.match(/ai system|autonomous|custom software|automate business|build system/i)) {
      return {
        priority: "ENTERPRISE INTAKE",
        priorityColor: "#75f4ab",
        category: "Autonomous System Engineering",
        recommendedAction: "Direct scoping review by Founder Praveen",
        humanEscalationRequired: false,
        reply: `Namaste ${clientName}. GARUDA builds autonomous AI systems and 24/7 WhatsApp workflows tailored directly to your business logic. We can deploy turnkey in 48 hours ($199 / ₹9,999) or provide the Next.js 14 source code Starter Kit ($49 / ₹3,999). Tap below to begin scoping.`,
        disclaimer: "SIMULATION: High-intent enterprise scoping protocol.",
        ctaLabel: "Deploy Your AI System →",
        ctaType: "sales"
      };
    }

    if (text.match(/cost|price|budget|rate|how much|fee/i)) {
      return {
        priority: "QUALIFIED LEAD",
        priorityColor: "#75f4ab",
        category: "Commercial Qualification · Budget Fit",
        recommendedAction: "Structured scope briefing proposal",
        humanEscalationRequired: false,
        reply: `Thank you for reaching out, ${clientName}. Turnkey WhatsApp AI receptionists start at $199 (₹9,999), and source-code kits are $49 (₹3,999). Custom workflows run on structured milestone delivery (50% inception, 50% delivery verification).`,
        disclaimer: "SIMULATION: Structured qualification flow based on GARUDA commercial standards.",
        ctaLabel: "Build My AI Lead System →",
        ctaType: "sales"
      };
    }

    if (text.match(/lead|agency|reply|slow|qualif/i)) {
      return {
        priority: "HIGH INTENT",
        priorityColor: "#38bdf8",
        category: "Agency Optimization · Pipeline Triage",
        recommendedAction: "Inbound funnel deployment",
        humanEscalationRequired: false,
        reply: `Understood, ${clientName}. Fast-growth agencies typically lose 40% of leads if first response takes over 15 minutes. GARUDA qualifies budget, industry, and urgency within 45 seconds, then routes hot leads directly to your calendar.`,
        disclaimer: "SIMULATION: Structured qualification flow based on GARUDA commercial standards.",
        ctaLabel: "Build My AI Lead System →",
        ctaType: "sales"
      };
    }

    // Default business inquiry
    return {
      priority: "NEW INBOUND",
      priorityColor: "#f5d76e",
      category: "Business Automation Intake",
      recommendedAction: "Operational requirements capture",
      humanEscalationRequired: false,
      reply: `Namaste ${clientName}. GARUDA deploys 24/7 autonomous receptionists configured for your specific catalog and business rules. Would you like a ready-to-deploy kit ($49) or a done-for-you installation ($199)?`,
      disclaimer: "SIMULATION: Structured qualification flow based on GARUDA commercial standards.",
      ctaLabel: "Build My AI Lead System →",
      ctaType: "sales"
    };
  }

  // Mode 3: Real-Time Code Generator
  if (mode === SIMULATION_MODES.CODE) {
    if (text.match(/form|component|ui|capture/i)) {
      return {
        priority: "DEV ARTIFACT",
        priorityColor: "#38bdf8",
        category: "React / Tailwind Component",
        recommendedAction: "Zero-dependency client component",
        humanEscalationRequired: false,
        codeSnippet: `// LeadCaptureForm.jsx — Zero-dependency React Component
export function LeadCaptureForm({ onCapture }) {
  const [phone, setPhone] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onCapture({ phone }); }}>
      <input type="tel" placeholder="+1 555-0199" value={phone} 
        onChange={e => setPhone(e.target.value)} required />
      <button type="submit">Start WhatsApp Chat</button>
    </form>
  );
}`,
        reply: `Generated production-ready React lead capture component with sanitized telephone validation. Ready for direct inclusion in Next.js 14 App Router.`,
        disclaimer: "SIMULATION: Generated from GARUDA verified template repository.",
        ctaLabel: "Get Full Starter Kit ($49) →",
        ctaType: "code"
      };
    }

    if (text.match(/triage|score|priority|function/i)) {
      return {
        priority: "DEV ARTIFACT",
        priorityColor: "#75f4ab",
        category: "Deterministic Logic Module",
        recommendedAction: "Sub-millisecond pure function",
        humanEscalationRequired: false,
        codeSnippet: `// triage.js — Deterministic Lead Scoring
export function triageMessage(text) {
  const isEmergency = /urgent|asap|pain|critical/i.test(text);
  const isCommercial = /quote|pricing|cost|hire/i.test(text);
  return {
    priority: isEmergency ? 'HIGH' : isCommercial ? 'MEDIUM' : 'NORMAL',
    escalateHuman: isEmergency,
    timestamp: Date.now()
  };
}`,
        reply: `Generated pure deterministic triage utility with zero external runtime dependencies.`,
        disclaimer: "SIMULATION: Generated from GARUDA verified template repository.",
        ctaLabel: "Get Full Starter Kit ($49) →",
        ctaType: "code"
      };
    }

    // Default Next.js Webhook
    return {
      priority: "DEV ARTIFACT",
      priorityColor: "#f5d76e",
      category: "Next.js 14 Webhook Handler",
      recommendedAction: "Meta Cloud API compliant route",
      humanEscalationRequired: false,
      codeSnippet: `// app/api/whatsapp/route.js — Next.js 14 App Router
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}`,
      reply: `Generated official Meta WhatsApp Cloud API verification route with environment token validation and status 200 challenge response.`,
      disclaimer: "SIMULATION: Generated from GARUDA verified template repository.",
      ctaLabel: "Get Full Starter Kit ($49) →",
      ctaType: "code"
    };
  }

  return {
    priority: "STANDARD",
    priorityColor: "#9ca3af",
    category: "General Simulation",
    recommendedAction: "Triage complete",
    reply: `Request processed successfully under GARUDA deterministic governance.`,
    disclaimer: "SIMULATION: Demo environment.",
    ctaLabel: "Explore Starter Kit ($49) →",
    ctaType: "code"
  };
}
