/**
 * 🦅 GARUDA Neural Voice Asset Generator
 * Generates true 24kHz Studio-Quality Neural Audio for JARVIS and CYBERPUNK (Friday) personas
 * using Microsoft Azure Neural TTS models (en-US-ChristopherNeural & en-US-AvaNeural).
 */

const fs = require("fs");
const path = require("path");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const OUTPUT_DIR = path.join(__dirname, "..", "frontend", "public", "audio");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const SCENARIOS = [
  {
    id: "greeting",
    text: "Connection secured. GARUDA Neural Node online. Main GARUDA hoon — Founder Praveen Mahawar ki sovereign autonomous intelligence. Praveen is currently locked in an active engineering sprint. State your identity and your objective."
  },
  {
    id: "casual",
    text: "Praveen ji currently high-focus protocol par hain taaki core systems me zero interruption ho. Agar aap unke personal circle se hain, toh ek brief message bata dijiye — main priority packet bana kar unke personal device par direct ping kar dungi."
  },
  {
    id: "commercial",
    text: "Requirement logged: Clinic automation and 24-7 lead triage. Maine aapka voice transcript capture karke Praveen ke private mission-control par route kar diya hai. Praveen will review the telemetric brief within 30 minutes. Main aapke mobile number par hamara sovereign workflow link dispatch kar rahi hoon."
  },
  {
    id: "skeptic",
    text: "Affirmative. 100 percent autonomous neural code, designed and compiled by Praveen Mahawar. Neither a human operator, nor a generic call-center bot. Main Praveen ki digital extension hoon — unke servers, workflows aur client pipeline ko 24-7 autonomously command karti hoon."
  },
  {
    id: "spam",
    text: "Unrecognized pattern. This line is reserved exclusively for verified enterprise operations and priority contacts. Ending transmission."
  }
];

const VOICES = [
  {
    persona: "jarvis",
    voiceName: "en-US-ChristopherNeural", // Deep, calm, British/Neutral, suave JARVIS
    pitch: "-5Hz",
    rate: "-3%"
  },
  {
    persona: "cyberpunk",
    voiceName: "en-US-AvaNeural", // Smooth, Velvet, Futuristic Friday/Cyberpunk AI
    pitch: "+2Hz",
    rate: "+2%"
  }
];

async function generateAll() {
  console.log("🦅 Generating True 24kHz Studio Neural Audio Assets...");

  for (const v of VOICES) {
    console.log(`\n🎙️ Processing Persona: ${v.persona.toUpperCase()} (${v.voiceName})`);
    const tts = new MsEdgeTTS();
    await tts.setMetadata(v.voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    for (const sc of SCENARIOS) {
      const tempDir = path.join(OUTPUT_DIR, `temp_${v.persona}_${sc.id}`);
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        await tts.toFile(tempDir, sc.text);
        const sourceMp3 = path.join(tempDir, "audio.mp3");
        const finalMp3 = path.join(OUTPUT_DIR, `${v.persona}_${sc.id}.mp3`);

        if (fs.existsSync(sourceMp3)) {
          fs.copyFileSync(sourceMp3, finalMp3);
          const stats = fs.statSync(finalMp3);
          console.log(`  ✔ [${v.persona}] ${sc.id}.mp3 -> ${stats.size} bytes`);
        }

        // cleanup temp dir
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        console.error(`  ✖ Failed ${sc.id} for ${v.persona}:`, err.message);
      }
    }
  }

  console.log("\n✔ All Studio Neural Voice Assets Generated in frontend/public/audio/!");
}

generateAll().catch(console.error);
