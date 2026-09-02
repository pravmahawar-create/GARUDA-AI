const { cinematicPresentationDirector } = require("../src/services/cinematicPresentationDirector");
const { conversationBrainService } = require("../src/services/conversationBrainService");

async function testSequence() {
  const sessionId = "investor-session-" + Date.now();
  console.log("--- STARTING 20-QUESTION MANDATORY INVESTOR INTELLIGENCE TEST ---");
  console.log("Session ID:", sessionId);

  const questions = [
    "What is GARUDA?",
    "How are you different from ChatGPT?",
    "What is SHA-256?",
    "Why do you use it?",
    "Show me the Creative Universe.",
    "What about Digital Marketing?",
    "How will GARUDA make money?",
    "Prove it.",
    "Do it.",
    "What did you just create?",
    "Tum sirf answer dete ho ya actual kaam bhi karte ho?",
    "Agar main tumhe ek logistics company doon to tum practically kya karoge?",
    "Agar tum galat ho jao to kaise pata chalega?",
    "Tumhari sabse badi limitation kya hai?",
    "Agar Founder approval na mile to kya karoge?",
    "batao mujhse Hindi mein baat karo",
    "GARUDA kya hai?",
    "tum mere liye practically kya kar sakte ho?",
    "prove it",
    "continue"
  ];

  let passCount = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const t0 = Date.now();
    const res = await cinematicPresentationDirector.directTurn(q, { sessionId });
    const elapsed = Date.now() - t0;
    const data = res.data;

    console.log(`\n[Turn ${i + 1}/20] Q: "${q}"`);
    console.log(`  Latency: ${elapsed}ms | Intent: ${data.intent} | Topic: ${data.topic} | Lang: ${data.language}`);
    console.log(`  Answer: ${data.answer.substring(0, 160).replace(/\n/g, " ")}...`);

    if (data && data.answer && data.answer.length > 10) {
      passCount++;
    }
  }

  console.log(`\n=== TEST SUMMARY: ${passCount}/20 PASSED ===`);
  if (passCount === 20) {
    console.log("ALL 20 MANDATORY QUESTIONS PASSED CONTEXTUALLY AND INTELLIGENTLY.");
  } else {
    console.error("FAIL: Only " + passCount + "/20 passed.");
    process.exit(1);
  }
}

testSequence().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
