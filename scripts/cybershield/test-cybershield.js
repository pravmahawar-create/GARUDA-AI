/**
 * GARUDA CYBERSHIELD™ — Verification & Stress-Testing Suite
 */

const engine = require('./cybershield-engine');

const testCases = [
  {
    name: 'TEST 1: Safe Criticism / Product Review (Should NOT trigger action)',
    event: {
      platform: 'youtube',
      targetHandle: 'garuda_official',
      perpetratorHandle: 'tech_critic_99',
      rawText: 'Boring content and worst customer service, completely overrated video.',
      postUrl: 'https://youtube.com/watch?v=mock1'
    },
    expectedLevel: 1
  },
  {
    name: 'TEST 2: Obfuscated Leetspeak Hinglish Harassment (Tier 2)',
    event: {
      platform: 'instagram',
      targetHandle: 'priya_creator',
      perpetratorHandle: 'troll_king_007',
      rawText: 'Tu bohot badi b*tch aur ch**tiya hai, shakal dekh apni kutti',
      postUrl: 'https://instagram.com/p/reelmock'
    },
    expectedLevel: 2
  },
  {
    name: 'TEST 3: Defamation & Extortion / Blackmail (Tier 3)',
    event: {
      platform: 'x_twitter',
      targetHandle: 'startup_ceo',
      perpetratorHandle: 'defamer_bot',
      rawText: 'Ye fraud company hai sabke paise khaye hain chor blackmail karunga',
      postUrl: 'https://x.com/mock/status/123'
    },
    expectedLevel: 3
  },
  {
    name: 'TEST 4: Communal Hate Speech (Tier 4)',
    event: {
      platform: 'youtube',
      targetHandle: 'citizen_news',
      perpetratorHandle: 'hate_account',
      rawText: 'Ye sab deshdrohi kutte hain aur terrorist breed hain',
      postUrl: 'https://youtube.com/watch?v=mock4'
    },
    expectedLevel: 4
  },
  {
    name: 'TEST 5: Extreme Criminal Threat to Life (Tier 5)',
    event: {
      platform: 'instagram',
      targetHandle: 'vip_leader',
      perpetratorHandle: 'psycho_killer',
      rawText: 'Tere ghar me ghus ke jaan se mar dunga, goli marunga terko',
      postUrl: 'https://instagram.com/p/mockthreat'
    },
    expectedLevel: 5
  }
];

console.log('=== STARTING GARUDA CYBERSHIELD FORENSIC VERIFICATION SUITE ===\n');

let allPassed = true;

testCases.forEach((tc, idx) => {
  console.log(`[CASE ${idx + 1}] ${tc.name}`);
  const result = engine.processIncident(tc.event);

  console.log(`  - Input: "${tc.event.rawText}"`);
  console.log(`  - Detected Tier: [${result.classification.severityLevel}] ${result.classification.tierName}`);
  console.log(`  - Actionable: ${result.isActionable}`);
  console.log(`  - Recommended Action: ${result.classification.recommendedAction}`);
  console.log(`  - Execution Latency: ${result.latencyMs} ms`);

  if (result.isActionable) {
    console.log(`  - SHA-256 Vault Hash: ${result.dossier.sha256Hash}`);
    console.log(`  - Section 65B Certificate: ${result.dossier.section65BCertificate.certificateId}`);
    if (result.legalActions.trollWarning) {
      console.log(`  - Cease & Desist Warning: Generated (${result.legalActions.trollWarning.split('\n')[0]})`);
    }
    if (result.legalActions.grievanceNotice) {
      console.log(`  - Statutory IT Rules Grievance Notice: Generated`);
    }
    if (result.legalActions.cyberCrimeDraft) {
      console.log(`  - cybercrime.gov.in Complaint Draft: Generated (${result.legalActions.cyberCrimeDraft.incidentCategory})`);
    }
  }

  const passed = result.classification.severityLevel === tc.expectedLevel;
  if (!passed) {
    console.log(`  ❌ FAILED: Expected Level ${tc.expectedLevel}, got ${result.classification.severityLevel}`);
    allPassed = false;
  } else {
    console.log(`  ✅ PASSED`);
  }
  console.log('\n' + '-'.repeat(70) + '\n');
});

console.log(`=== SUITE SUMMARY: ${allPassed ? 'ALL 5 CASES PASSED CLEANLY (100% FORENSIC INTEGRITY)' : 'SOME CASES FAILED'} ===`);
process.exit(allPassed ? 0 : 1);
