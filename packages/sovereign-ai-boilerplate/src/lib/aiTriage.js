/**
 * 🦅 GARUDA Sovereign AI Triage Engine
 * Built for 24/7 autonomous client/patient triage and appointment prioritization.
 * Uses Google Gemini 2.5 Flash (verified living model) with zero cold start.
 */

const GEMINI_MODEL = "gemini-2.5-flash";

export async function runAITriage({ message, contactName, channel = "whatsapp" }) {
  const apiKey = process.env.GEMINI_API_KEY;

  const systemPrompt = `You are the Sovereign AI Receptionist & Triage Specialist for GARUDA OS-powered clinics and agencies.
Your goal is to accurately evaluate user inquiries, assess urgency, classify intent, and output strict JSON.

URGENCY LEVELS:
- emergency: Severe acute pain, trauma, chest pain, vision loss, or high-risk active crisis.
- urgent: Same-day resolution needed (fever, high priority deal closure, broken production).
- normal: Standard consultation, new booking, pricing query.
- low: General inquiry, feedback, routine checkup.

CATEGORIES:
- clinical_urgent, general_consult, appointment_reschedule, billing_escrow, technical_inquiry

RESPOND STRICTLY WITH A JSON OBJECT ONLY (no markdown code blocks, no backticks, no comments):
{
  "urgency": "emergency" | "urgent" | "normal" | "low",
  "category": string,
  "summary": string,
  "recommendedAction": string,
  "bookingRecommended": boolean,
  "draftReply": string
}`;

  if (!apiKey) {
    // Offline deterministic triage fallback
    return fallbackRuleBasedTriage(message, contactName);
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: `${systemPrompt}\n\nClient Name: ${contactName || "Anonymous"}\nChannel: ${channel}\nIncoming Message: "${message}"` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 600,
          responseMimeType: "application/json"
        }
      })
    });

    if (!res.ok) {
      console.warn(`[GARUDA AI Triage] Gemini API returned status ${res.status}. Falling back to rule engine.`);
      return fallbackRuleBasedTriage(message, contactName);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return fallbackRuleBasedTriage(message, contactName);

    const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[GARUDA AI Triage] Error executing triage:", err.message);
    return fallbackRuleBasedTriage(message, contactName);
  }
}

function fallbackRuleBasedTriage(message, contactName) {
  const text = (message || "").toLowerCase();
  const name = contactName || "Partner";

  let urgency = "normal";
  let category = "general_consult";
  let bookingRecommended = true;

  if (text.match(/chest pain|bleeding|breath|accident|severe pain|emergency|heart|unconscious/i)) {
    urgency = "emergency";
    category = "clinical_urgent";
    bookingRecommended = false;
  } else if (text.match(/today|urgent|asap|broken|crash|fever|high pain|immediate/i)) {
    urgency = "urgent";
    category = "clinical_urgent";
  } else if (text.match(/price|quote|cost|rate|invoice|payment|fees/i)) {
    urgency = "normal";
    category = "billing_escrow";
  } else if (text.match(/reschedule|cancel|change time|postpone/i)) {
    urgency = "normal";
    category = "appointment_reschedule";
  }

  let draftReply = "";
  if (urgency === "emergency") {
    draftReply = `Namaste ${name}. This seems like an acute medical concern. Please visit your nearest emergency room or dial local emergency services immediately. Our team has also been alerted.`;
  } else if (urgency === "urgent") {
    draftReply = `Namaste ${name}. We have noted your urgent request. We are scheduling our priority slot for you today. Please tap the link below to confirm your time.`;
  } else if (category === "billing_escrow") {
    draftReply = `Namaste ${name}. Thank you for asking about our pricing. We operate on a verified 50/50 milestone basis with full escrow protection. Would you like to review our scope breakdown?`;
  } else {
    draftReply = `Namaste ${name}. Thank you for reaching out to us. We have captured your request and our specialist is ready to assist you. When is the best time for your consultation?`;
  }

  return {
    urgency,
    category,
    summary: message ? message.substring(0, 140) : "General inquiry",
    recommendedAction: urgency === "emergency" ? "Immediate ER referral" : "Schedule 30-min discovery slot",
    bookingRecommended,
    draftReply
  };
}
