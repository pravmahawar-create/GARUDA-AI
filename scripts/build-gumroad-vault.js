const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function buildGumroadVault() {
  const dir = path.join(__dirname, '..', 'data', 'products', 'garuda-ai-cash-vault');
  fs.mkdirSync(dir, { recursive: true });

  const promptVaultContent = `# 🦅 GARUDA AI PROMPT ENGINEERING MASTER VAULT (2026 EDITION)
Author: GARUDA OS & Founder Praveen Mahawar
Website: https://www.garudaos.in
Support: praveen@garudaos.in

---

## 1. HIGH-CONVERSION SALES & COLD OUTREACH PROMPTS
### 1.1 The Forensic Hemorrhage Cold Email
\`\`\`
Act as a world-class enterprise sales strategist. Analyze the following prospect website / business description: [INSERT DETAILS].
Identify their top 3 conversion bottlenecks or latency drops. Draft a high-contrast cold email under 120 words using the 'Problem-First Destruction' framework:
1. Call out their exact bleeding point in line 1 without flattery.
2. Quantify what they are losing every month.
3. Present our sovereign automation architecture as the single fix.
4. Close with a zero-friction single-line CTA. No fluff, no buzzwords.
\`\`\`

### 1.2 The LinkedIn Dominance & Trojan Comment
\`\`\`
Act as an elite tech founder building sovereign AI systems. Write a viral LinkedIn comment on a post about AI adoption:
- Validate the core premise in 1 sentence.
- Pinpoint the hidden architectural flaw everyone is missing (security, lock-in, recurring API cost).
- Offer the sovereign open-source self-hosted alternative with verified metrics.
\`\`\`

---

## 2. 200+ PHOTOREALISTIC PROMPTS (FLUX / MIDJOURNEY / SDXL)
### 2.1 Cybernetic & Autonomous Systems
- "Hyper-realistic 8k octane render of a glowing cybernetic eagle perched on a quantum mainframe, dark indigo and cyan lighting, volumetric fog, cinematic depth of field, anamorphic lens flare, --ar 16:9 --style raw"
- "Futuristic autonomous server command room, neon amber telemetry indicators, holographic dashboard floating in mid-air, dark sapphire background, ultra-fine reflections."

### 2.2 Viral Mystery, History & Horror B-Roll
- "Cinematic wide-angle shot of an ancient abandoned temple in dense foggy mountain pass at midnight, moonlight filtering through cracked stone pillars, eerie mystical blue mist, Unreal Engine 5 render, award-winning cinematography, --ar 16:9"
- "Dramatic historical portrait of a 19th-century royal commander overlooking a misty battlefield at sunrise, intricate brass armor details, atmospheric smoke and embers, golden hour rim lighting."

---

## 3. VIRAL RETENTION HOOKS & STORY STRUCTURES
- **The Suspense Opening**: "If you think AI is just about writing emails, the next 60 seconds will prove that 90% of software companies are already obsolete."
- **The Secret Knowledge Open**: "What NASA, hedge funds, and autonomous AI agents do behind closed doors is finally being revealed."
- **The 3-Second Visual Rule**: Never let any frame stay on screen longer than 2.8 seconds. Cut or punch-in zoom continuously.
`;

  fs.writeFileSync(path.join(dir, '01_AI_PROMPT_ENGINEERING_MASTER_VAULT.md'), promptVaultContent);

  const ytBlueprintContent = `# 🎬 FACELESS YOUTUBE AUTOMATION BLUEPRINT (ZERO TO MONETIZATION)
Author: GARUDA OS & Founder Praveen Mahawar
Website: https://www.garudaos.in

---

## ZERO-DOLLAR WORKFLOW BREAKDOWN

### 1. Script Generation (100% Free)
Use Groq (Llama 3 70B) or Google Gemini Flash with this exact framework:
\`\`\`
Write an 8-minute high-retention documentary script on: [TOPIC].
Pacing: Fast, dramatic, highly engaging.
Structure:
- 00:00 - 00:20: Hook & open loop.
- 00:20 - 02:30: Context, origin story, hidden details.
- 02:30 - 05:30: The major conflict / unbelievable incident.
- 05:30 - 07:30: Unresolved questions & shocking revelation.
- 07:30 - 08:00: Mind-bending conclusion & CTA.
Include bracketed visual cues [VISUAL: description] every 3 seconds.
\`\`\`

### 2. 100% Free Voiceover Generation (Edge-TTS)
No need to pay $22/month for ElevenLabs. Edge-TTS runs unlimited on your machine:
\`\`\`bash
# English Voice (Rich, Documentary Narrator):
edge-tts --voice en-US-ChristopherNeural --text "Script content here" --write-media narration_en.mp3

# Hindi Voice (Madhur, Suspense Narrator):
edge-tts --voice hi-IN-MadhurNeural --text "कहानी का टेक्स्ट यहाँ लिखें" --write-media narration_hi.mp3
\`\`\`

### 3. Visuals & B-Roll (Zero Expense)
- **Pexels & Pixabay**: Free 4K documentary video clips.
- **Hugging Face / Fal.ai**: Generate specific character or location stills.

### 4. Automated Video Assembly with FFmpeg
Combine images, audio, and subtitles in one single command without expensive video editors:
\`\`\`bash
ffmpeg -loop 1 -i image_%03d.jpg -i narration.mp3 -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest output_video.mp4
\`\`\`
`;

  fs.writeFileSync(path.join(dir, '02_FACELESS_YOUTUBE_AUTOMATION_BLUEPRINT.md'), ytBlueprintContent);

  const audioGuideContent = `# 🎙️ 100% FREE AI AUDIO PRODUCTION MASTER GUIDE
Author: GARUDA OS & Founder Praveen Mahawar
Website: https://www.garudaos.in

---

## THE BEST FREE TTS ENGINES IN 2026:
1. **Microsoft Edge-TTS**: 
   - 100% Free, zero tokens required.
   - 100+ voices across Hindi, English, Punjabi, Tamil, Spanish, German.
   - Recommended Voices:
     - \`en-US-ChristopherNeural\` (Deep documentary style)
     - \`en-US-JennyNeural\` (Clear, energetic female)
     - \`hi-IN-MadhurNeural\` (Authoritative Hindi male)
     - \`hi-IN-SwaraNeural\` (Melodious Hindi female)

2. **Kokoro-82M**:
   - Open-source 82M parameter audio model, runs in sub-second latency on local CPU.
   - Quality rivals ElevenLabs Turbo v2.

3. **OpenAI Whisper (Local)**:
   - For auto-generating synced .SRT subtitles from any audio file at ₹0 cost.
`;

  fs.writeFileSync(path.join(dir, '03_FREE_AI_AUDIO_PRODUCTION_GUIDE.md'), audioGuideContent);

  const licenseContent = `# 📜 GARUDA AI CASH VAULT — LICENSE & OFFICIAL ACCESS
Product: GARUDA 2026 AI Cash Flow & Faceless Automation Master Vault
Author: Praveen Mahawar (Principal Architect & Founder, GARUDA OS)
Website: https://www.garudaos.in
Contact: praveen@garudaos.in
Live Store: https://garudaos.gumroad.com
Razorpay Direct UPI: https://razorpay.me/@garudaosincompany

---

## INCLUDED LICENSES:
- **Personal Use**: Full permission to build unlimited personal channels and stores.
- **Commercial Use**: Full permission to use these prompts and workflows for client agency work.
- **Support**: Direct scoping chat at https://www.garudaos.in/chat
`;

  fs.writeFileSync(path.join(dir, 'README_AND_LICENSE.md'), licenseContent);

  // Zip the directory into output/downloads
  const distDir = path.join(__dirname, '..', 'public', 'downloads');
  fs.mkdirSync(distDir, { recursive: true });
  const zipPath = path.join(distDir, 'garuda-ai-cash-vault-2026.zip');

  console.log('📦 Zipping files to:', zipPath);
  try {
    // Windows PowerShell Compress-Archive
    const cmd = 'powershell -Command "Compress-Archive -Path \\"' + dir + '\\*\\" -DestinationPath \\"' + zipPath + '\\" -Force"';
    execSync(cmd);
    const stats = fs.statSync(zipPath);
    console.log('✔ Zip created successfully: ' + stats.size + ' bytes');
  } catch (err) {
    console.error('Error creating zip:', err.message);
  }

  // Also copy to frontend/public/downloads if it exists
  const frontDist = path.join(__dirname, '..', 'frontend', 'public', 'downloads');
  if (fs.existsSync(frontDist)) {
    fs.copyFileSync(zipPath, path.join(frontDist, 'garuda-ai-cash-vault-2026.zip'));
    console.log('✔ Copied to frontend/public/downloads');
  }
}

buildGumroadVault().catch(console.error);
