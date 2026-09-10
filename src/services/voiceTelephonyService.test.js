/**
 * 🦅 Unit Test for GARUDA Voice Telephony Node (Swara)
 */

const assert = require("assert");
const voiceService = require("./voiceTelephonyService");

async function runTests() {
  console.log("🦅 Running Tests for GARUDA Voice Telephony Service (Swara)...");

  // Test 1: Canonical voice model is Swara
  assert.strictEqual(voiceService.voiceModel, "hi-IN-SwaraNeural", "Voice model must be hi-IN-SwaraNeural");
  console.log("✔ Test 1: Voice model confirmed as hi-IN-SwaraNeural");

  // Test 2: Greeting contains Founder Praveen Mahawar
  const greeting = voiceService.getGreeting();
  assert.ok(greeting.includes("प्रवीण महावर"), "Greeting must mention Founder Praveen Mahawar");
  console.log("✔ Test 2: Greeting correctly cites Founder Praveen Mahawar");

  // Test 3: Commercial triage detection
  const commercial = voiceService.detectLeadUrgency("मुझे अपने क्लिनिक के लिए AI बॉट चाहिए");
  assert.strictEqual(commercial.isCommercial, true, "Should detect commercial inquiry");
  console.log("✔ Test 3: Commercial lead triage detected correctly");

  // Test 4: Personal triage detection
  const personal = voiceService.detectLeadUrgency("प्रवीण कहाँ है, मैं उसका दोस्त बोल रहा हूँ");
  assert.strictEqual(personal.isPersonal, true, "Should detect personal caller");
  console.log("✔ Test 4: Personal caller triage detected correctly");

  // Test 5: Process voice input
  const res = await voiceService.processVoiceInput({
    callerPhone: "+919876543210",
    callerSpeech: "नमस्ते, मुझे सॉफ्टवेयर डेवलपमेंट की दरें जाननी हैं"
  });
  assert.ok(res.reply, "Must generate a valid reply");
  assert.strictEqual(res.voice, "hi-IN-SwaraNeural", "Must use Swara voice model");
  console.log("✔ Test 5: Voice input processed with clean reply & Swara tag");

  // Test 6: TwiML response generation
  const twiml = voiceService.generateTwimlResponse("नमस्ते, मैं गरुड़ बोल रही हूँ");
  assert.ok(twiml.includes("<Response>"), "TwiML must have Response root");
  assert.ok(twiml.includes("Polly.Kajal-Neural"), "TwiML must include neural voice");
  console.log("✔ Test 6: Valid TwiML generated for cloud telephony");

  console.log("\n=======================================================");
  console.log("✔ ALL VOICE TELEPHONY (SWARA) TESTS PASSED CLEANLY (EXIT 0)!");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
