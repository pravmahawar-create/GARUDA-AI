/**
 * 🦅 GARUDA Authentic Indian Neural Voice Generator
 * Uses Microsoft's native Indian Neural Models:
 * - hi-IN-SwaraNeural (Natural Indian Female - used by Indian Fintech & Telecom)
 * - hi-IN-MadhurNeural (Natural Indian Male - used by Indian Tech Enterprises)
 */

const fs = require("fs");
const path = require("path");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const OUTPUT_DIR = path.join(__dirname, "..", "frontend", "public", "audio");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const SCENARIOS = [
  {
    id: "greeting",
    text: "नमस्ते! मैं गरुड़ बोल रही हूँ — फाउंडर प्रवीण महावर जी की पर्सनल AI असिस्टेंट। प्रवीण जी अभी एक ज़रूरी काम में व्यस्त हैं। बताइये, आप किस सिलसिले में बात करना चाहते हैं?",
    textMale: "नमस्ते! मैं गरुड़ बोल रहा हूँ — फाउंडर प्रवीण महावर का पर्सनल AI असिस्टेंट। प्रवीण अभी एक ज़रूरी काम में व्यस्त हैं। बताइये, आप किस सिलसिले में बात करना चाहते हैं?"
  },
  {
    id: "casual",
    text: "प्रवीण जी अभी एक ज़रूरी काम में व्यस्त हैं। अगर आप उनके दोस्त या पर्सनल कॉन्टैक्ट हैं, तो बस अपना नाम और छोटा सा मैसेज बता दीजिए — मैं तुरंत उनके फोन पर मैसेज भेज दूँगी।",
    textMale: "प्रवीण अभी एक ज़रूरी काम में व्यस्त हैं। अगर आप उनके दोस्त या पर्सनल कॉन्टैक्ट हैं, तो बस अपना नाम और छोटा सा मैसेज बता दीजिए — मैं तुरंत उनके फोन पर मैसेज भेज दूँगा।"
  },
  {
    id: "commercial",
    text: "समझ गई! क्लिनिक के लिए 24 घंटे चलने वाला AI रिसेप्शनिस्ट। मैंने आपकी बात प्रवीण जी के डैशबोर्ड पर भेज दी है। प्रवीण जी इसे थोड़ी देर में खुद देखेंगे। मैंने आपके नंबर पर हमारा डेमो लिंक भी भेज दिया है।",
    textMale: "समझ गया! क्लिनिक के लिए 24 घंटे चलने वाला AI रिसेप्शनिस्ट। मैंने आपकी बात प्रवीण जी के डैशबोर्ड पर भेज दी है। प्रवीण इसे थोड़ी देर में खुद देखेंगे। मैंने आपके नंबर पर हमारा डेमो लिंक भी भेज दिया है।"
  },
  {
    id: "skeptic",
    text: "जी हाँ, बिल्कुल! मैं 100% AI असिस्टेंट हूँ, जिसे प्रवीण महावर जी ने खुद बनाया है। मैं कोई कॉल सेंटर नहीं हूँ, बल्कि प्रवीण जी के कॉल्स और प्रोजेक्ट्स संभालती हूँ।",
    textMale: "जी हाँ, बिल्कुल! मैं 100% AI असिस्टेंट हूँ, जिसे प्रवीण महावर ने खुद बनाया है। मैं कोई कॉल सेंटर नहीं हूँ, बल्कि प्रवीण के कॉल्स और प्रोजेक्ट्स संभालता हूँ।"
  },
  {
    id: "spam",
    text: "माफ़ कीजिए, यह नंबर सिर्फ काम और ज़रूरी कॉल्स के लिए है। आपका बहुत-बहुत शुक्रिया।",
    textMale: "माफ़ कीजिए, यह नंबर सिर्फ काम और ज़रूरी कॉल्स के लिए है। आपका बहुत-बहुत शुक्रिया।"
  }
];

const MODELS = [
  {
    persona: "swara",
    voiceName: "hi-IN-SwaraNeural",
    label: "Swara (Indian Female - Telecom & Fintech Standard)"
  },
  {
    persona: "madhur",
    voiceName: "hi-IN-MadhurNeural",
    label: "Madhur (Indian Male - Warm Tech Executive)"
  }
];

async function generate() {
  console.log("🦅 Generating Authentic Indian Neural Voice Assets...");

  for (const m of MODELS) {
    console.log(`\n🎙️ Processing ${m.label} (${m.voiceName})...`);
    const tts = new MsEdgeTTS();
    await tts.setMetadata(m.voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    for (const sc of SCENARIOS) {
      const textToUse = m.persona === "madhur" ? sc.textMale : sc.text;
      const tempDir = path.join(OUTPUT_DIR, `temp_${m.persona}_${sc.id}`);
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        await tts.toFile(tempDir, textToUse);
        const sourceMp3 = path.join(tempDir, "audio.mp3");
        const finalMp3 = path.join(OUTPUT_DIR, `${m.persona}_${sc.id}.mp3`);

        if (fs.existsSync(sourceMp3)) {
          fs.copyFileSync(sourceMp3, finalMp3);
          const stats = fs.statSync(finalMp3);
          console.log(`  ✔ [${m.persona}] ${sc.id}.mp3 -> ${stats.size} bytes`);
        }

        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.error(`  ✖ Failed ${sc.id} for ${m.persona}:`, err.message);
      }
    }
  }

  console.log("\n✔ All Indian Neural Voice Assets Generated in frontend/public/audio/!");
}

generate().catch(console.error);
