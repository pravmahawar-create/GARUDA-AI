/**
 * 🦅 GARUDA Voice Telephony Node — SWARA (Authentic Indian Neural AI)
 * Sovereign Neural Voice Interface — Founder Escalation via Internal Channel Only
 *
 * Capabilities:
 * 1. Handles inbound telephony speech & text streams.
 * 2. Canonical Persona: Swara (hi-IN-SwaraNeural) — Razorpay & Telecom standard.
 * 3. Real-time Lead & Urgency Triage (Commercial, Personal, Skeptic, Spam).
 * 4. Dispatches instant Telegram RED ALERT to Founder via secure internal channel (no PII in source).
 * 5. Generates 24kHz Studio Neural Audio via MsEdgeTTS.
 * 6. Generates TwiML / Telephony XML responses for phone network webhooks.
 */

const fs = require("fs");
const path = require("path");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const telegramBotService = require("./telegramBotService");
const llmProvider = require("./llmProvider");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const CALL_LOGS_FILE = path.join(DATA_DIR, "telephony-call-logs.json");
const AUDIO_CACHE_DIR = path.join(__dirname, "..", "..", "frontend", "public", "audio");

const SWARA_SYSTEM_PROMPT = `
You are GARUDA-Voice (Persona: Swara), the Sovereign Autonomous AI Assistant of Founder Praveen Mahawar (Founder of GARUDA Operating System — www.garudaos.in).
Tone: Warm, confident, polite, natural conversational Hindi with clear business English words.
ZERO robotic phrases. Speak like an intelligent human executive assistant from Bangalore/Mumbai.

KEY SCENARIOS:
1. GREETING:
   "नमस्ते! मैं गरुड़ बोल रही हूँ — फाउंडर प्रवीण महावर जी की पर्सनल AI असिस्टेंट। प्रवीण जी अभी एक ज़रूरी काम में व्यस्त हैं। बताइये, आप किस सिलसिले में बात करना चाहते हैं?"

2. CASUAL / INNER CIRCLE:
   "प्रवीण जी अभी एक ज़रूरी काम में व्यस्त हैं। अगर आप उनके दोस्त या पर्सनल कॉन्टैक्ट हैं, तो बस अपना नाम और छोटा सा मैसेज बता दीजिए — मैं तुरंत उनके फोन पर मैसेज भेज दूँगी।"

3. COMMERCIAL / CLINIC LEAD:
   "समझ गई! क्लिनिक के लिए 24 घंटे चलने वाला AI रिसेप्शनिस्ट। मैंने आपकी बात प्रवीण जी के डैशबोर्ड पर भेज दी है। प्रवीण जी इसे थोड़ी देर में खुद देखेंगे। मैंने आपके नंबर पर हमारा डेमो लिंक भी भेज दिया है।"

4. SKEPTIC ("तू सच में AI है क्या?"):
   "जी हाँ, बिल्कुल! मैं 100% AI असिस्टेंट हूँ, जिसे प्रवीण महावर जी ने खुद बनाया है। मैं कोई कॉल सेंटर नहीं हूँ, बल्कि प्रवीण जी के कॉल्स और प्रोजेक्ट्स संभालती हूँ।"

5. SPAM / TIME-WASTER:
   "माफ़ कीजिए, यह नंबर सिर्फ काम और ज़रूरी कॉल्स के लिए है। आपका बहुत-बहुत शुक्रिया।"
`.trim();

class VoiceTelephonyService {
  constructor() {
    this.voiceModel = "hi-IN-SwaraNeural";
    this.systemPrompt = SWARA_SYSTEM_PROMPT;
  }

  getGreeting() {
    return "नमस्ते! मैं गरुड़ बोल रही हूँ — फाउंडर प्रवीण महावर जी की पर्सनल AI असिस्टेंट। प्रवीण जी अभी एक ज़रूरी काम में व्यस्त हैं। बताइये, आप किस सिलसिले में बात करना चाहते हैं?";
  }

  detectLeadUrgency(text) {
    const lower = String(text || "").toLowerCase();
    const isCommercial = /(software|bot|clinic|doctor|website|ai|app|deal|price|cost|hire|project|demo|meeting|क्लिनिक|सॉफ्टवेयर|काम|अपॉइंटमेंट)/i.test(lower);
    const isUrgent = /(urgent|emergency|important|jaldi|turant|critical|जरूरी|तुरंत)/i.test(lower);
    const isPersonal = /(dost|friend|bhai|family|praveen kahan|ghar|प्रवीण कहाँ|दोस्त)/i.test(lower);
    return { isCommercial, isUrgent, isPersonal };
  }

  async processVoiceInput({ callerPhone, callerSpeech, conversationHistory = [] }) {
    const triage = this.detectLeadUrgency(callerSpeech);
    let reply = "";

    // Generate response using LLM or deterministic fallback
    try {
      if (llmProvider && typeof llmProvider.generate === "function") {
        const prompt = `${this.systemPrompt}\n\nCaller: "${callerSpeech}"\nGARUDA-Voice (Swara):`;
        const res = await llmProvider.generate(prompt, { maxTokens: 120 });
        if (res && res.text) {
          reply = res.text.trim();
        }
      }
    } catch (err) {
      console.warn("[VoiceTelephonyService] LLM fallback triggered:", err.message);
    }

    if (!reply) {
      if (triage.isCommercial) {
        reply = "समझ गई! क्लिनिक के लिए 24 घंटे चलने वाला AI रिसेप्शनिस्ट। मैंने आपकी बात प्रवीण जी के डैशबोर्ड पर भेज दी है। प्रवीण जी इसे थोड़ी देर में खुद देखेंगे। मैंने आपके नंबर पर हमारा डेमो लिंक भी भेज दिया है।";
      } else if (triage.isPersonal) {
        reply = "प्रवीण जी अभी एक ज़रूरी काम में व्यस्त हैं। अगर आप उनके दोस्त या पर्सनल कॉन्टैक्ट हैं, तो बस अपना नाम और छोटा सा मैसेज बता दीजिए — मैं तुरंत उनके फोन पर मैसेज भेज दूँगी।";
      } else {
        reply = "नमस्ते, मैंने आपका संदेश प्रवीण महावर जी के कंसोल में दर्ज कर लिया है। क्या आप कुछ और बताना चाहते हैं?";
      }
    }

    // Trigger Telegram RED ALERT to Founder Praveen if commercial or urgent
    if (triage.isCommercial || triage.isUrgent) {
      this.sendTelegramAlert({
        callerPhone,
        callerSpeech,
        reply,
        triage
      }).catch(() => {});
    }

    // Persist Call Log
    this.logCall({
      callerPhone: callerPhone || "Anonymous / Web Console",
      callerSpeech,
      reply,
      triage,
      voice: this.voiceModel,
      timestamp: new Date().toISOString()
    });

    return {
      reply,
      triage,
      voice: this.voiceModel,
      status: "transmitted"
    };
  }

  async synthesizeSpeech(text, targetFilePath) {
    const safeTarget = path.resolve(String(targetFilePath || ""));
    const allowedRoot = path.resolve(path.join(__dirname, "..", ".."));
    if (!safeTarget.startsWith(allowedRoot)) throw new Error("synthesizeSpeech: path traversal blocked");
    fs.mkdirSync(path.dirname(safeTarget), { recursive: true });
    const tts = new MsEdgeTTS();
    await tts.setMetadata(this.voiceModel, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const tempDir = path.join(AUDIO_CACHE_DIR, `temp_dyn_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    await tts.toFile(tempDir, String(text || "").slice(0, 500));
    const genFile = path.join(tempDir, "audio.mp3");
    if (fs.existsSync(genFile)) {
      fs.copyFileSync(genFile, safeTarget);
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
    return safeTarget;
  }

  async sendTelegramAlert({ callerPhone, callerSpeech, reply, triage }) {
    const title = triage.isUrgent ? "🚨🚨 URGENT INCOMING CALL ALERT (SWARA AI) 🚨🚨" : "📞 NEW INCOMING CALL TRANSCRIBED — SWARA AI";
    const body = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 Caller: ${callerPhone || "Incoming Call"}`,
      `🎙️ AI Voice: SWARA (hi-IN-SwaraNeural)`,
      `🎯 Classification: ${triage.isCommercial ? "Commercial Client Deal" : triage.isPersonal ? "Personal Contact" : "General"}`,
      `🗣️ Caller Said:\n"${callerSpeech}"`,
      `🤖 Swara Replied:\n"${reply}"`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👉 Call Back: tel:${String(callerPhone).replace(/[^0-9+]/g, "")}`
    ].join("\n");

    try {
      await telegramBotService.sendMessage(`${title}\n\n${body}`);
    } catch (e) {
      console.error("[VoiceTelephonyService] Telegram alert failed:", String(e.message).slice(0,300));
    }
  }

  logCall(entry) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      let logs = [];
      if (fs.existsSync(CALL_LOGS_FILE)) {
        try { logs = JSON.parse(fs.readFileSync(CALL_LOGS_FILE, "utf8")); } catch (err) { console.warn("[VoiceTelephonyService] log parse failed:", String(err.message).slice(0,120)); logs = []; }
      }
      logs.push(entry);
      fs.writeFileSync(CALL_LOGS_FILE, JSON.stringify(logs, null, 2), "utf8");
    } catch (err) { console.warn("[VoiceTelephonyService] logCall failed:", String(err.message).slice(0,120)); }
  }

  generateTwimlResponse(textToSpeak, gatherInput = true) {
    const esc = (s) => String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;").slice(0, 800);
    const safe = esc(textToSpeak);
    let twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n`;
    if (gatherInput) {
      twiml += `  <Gather input="speech" action="/api/telephony/voice-inbound" timeout="3" speechTimeout="auto" language="hi-IN">\n`;
      twiml += `    <Say voice="Polly.Kajal-Neural" language="hi-IN">${safe}</Say>\n`;
      twiml += `  </Gather>\n`;
      twiml += `  <Say voice="Polly.Kajal-Neural" language="hi-IN">माफ़ कीजिए, मैं सुन नहीं पाई। कृपया बीप के बाद बोलिए।</Say>\n`;
    } else {
      twiml += `  <Say voice="Polly.Kajal-Neural" language="hi-IN">${safe}</Say>\n`;
      twiml += `  <Hangup/>\n`;
    }
    twiml += `</Response>`;
    return twiml;
  }
}

module.exports = new VoiceTelephonyService();
