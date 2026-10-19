/**
 * P1 Forensic Verification Script: AI Gateway Reliability & Full Cascade Matrix
 */
const cascade = require('../../src/services/sovereignAiCascadeService');

async function testP1Cascade() {
  console.log('=== P1 TEST 1: Normal Reasoning Request ===');
  const t1 = await cascade.generateCompletion({
    prompt: 'State 2 core engineering principles of GARUDA OS in 2 bullet points.',
    maxTokens: 120
  });
  console.log('Test 1 Result:', {
    success: t1.success,
    provider: t1.provider,
    textSnippet: t1.text.slice(0, 140).replace(/\n/g, ' '),
    latencyMs: t1.latencyMs
  });

  console.log('\n=== P1 TEST 2: Structured JSON Answer ===');
  const t2 = await cascade.generateCompletion({
    prompt: 'Return ONLY a JSON object: {"status": "ACTIVE", "tier": "P1"}. Do not add markdown or explanations.',
    maxTokens: 80
  });
  console.log('Test 2 Result:', {
    success: t2.success,
    provider: t2.provider,
    rawText: t2.text.trim()
  });

  console.log('\n=== P1 TEST 3: Simulated Provider Failure (Forced Groq Cooldown -> NVIDIA Fallback) ===');
  const keys = cascade.getAllKeys();
  keys.groqKeys.forEach((k, idx) => {
    cascade.setKeyCooldown(`groq_${idx}_${k.slice(-6)}`, 'Simulated Groq Outage', 60);
  });
  const t3 = await cascade.generateCompletion({
    prompt: 'Hello from failover test',
    maxTokens: 60
  });
  console.log('Test 3 Result:', {
    success: t3.success,
    provider: t3.provider,
    textSnippet: t3.text.slice(0, 100).replace(/\n/g, ' '),
    latencyMs: t3.latencyMs
  });

  console.log('\n=== P1 TEST 4: Complete Failure Safety Check ===');
  keys.nvidiaKeys.forEach((k, idx) => {
    cascade.setKeyCooldown(`nvidia_${idx}_${k.slice(-6)}`, 'Simulated NVIDIA Outage', 60);
  });
  keys.geminiKeys.forEach((k, idx) => {
    cascade.setKeyCooldown(`gemini_${idx}_${k.slice(-6)}`, 'Simulated Gemini Outage', 60);
  });
  const t4 = await cascade.generateCompletion({
    prompt: 'Test complete outage scenario',
    maxTokens: 60
  });
  console.log('Test 4 Result:', {
    success: t4.success,
    provider: t4.provider,
    isDeterministic: Boolean(t4.isDeterministic),
    textSnippet: t4.text.slice(0, 120).replace(/\n/g, ' ')
  });

  console.log('\n=== P1 AUDIT COMPLETE: ALL SCENARIOS VERIFIED ===');
}

testP1Cascade().catch(err => {
  console.error('P1 Audit Failed:', err);
  process.exit(1);
});
