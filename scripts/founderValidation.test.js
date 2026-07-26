const assert = require('assert');
const { evaluateClassifier, evaluateCapabilities } = require('./founderValidation');

function runRegressionTests() {
  console.log('Running Founder Validation Anti-Circular & Classification Boundary Regression Tests...\n');

  // Test 1: Classification Anti-Circular Test
  {
    const scenarioContentOnly = {
      title: 'Build Node.js API Service',
      description: 'Standard Node.js REST API development with unit tests'
    };

    const scenarioWithMutatedExpected = {
      ...scenarioContentOnly,
      expectedCategory: 'Legal Research'
    };

    const actualOutputContentOnly = evaluateClassifier(scenarioContentOnly);
    const actualOutputMutated = evaluateClassifier(scenarioWithMutatedExpected);

    assert.strictEqual(
      actualOutputContentOnly,
      actualOutputMutated,
      'Classification output must depend strictly on scenario content, not on expectedCategory'
    );
    assert.strictEqual(actualOutputMutated, 'Upwork Software');
    assert.notStrictEqual(
      actualOutputMutated,
      scenarioWithMutatedExpected.expectedCategory,
      'Mutated expectedCategory must not self-validate'
    );

    console.log('✔ Test 1 — Classification anti-circular protection passed');
  }

  // Test 2: Capability Anti-Circular Test
  {
    const scenarioContentOnly = {
      title: 'Build Node.js API Service',
      description: 'Standard Node.js REST API development with unit tests',
      expectedQualification: 'qualified',
      expectedCapabilities: ['engineering.software-implementation', 'engineering.api-integration']
    };

    const scenarioWithMutatedCapabilities = {
      ...scenarioContentOnly,
      expectedCapabilities: ['unrelated.fake-capability-id']
    };

    const actualCapMutated = evaluateCapabilities(scenarioWithMutatedCapabilities);

    assert.deepStrictEqual(
      actualCapMutated,
      ['engineering.software-implementation', 'engineering.api-integration'],
      'Capability output must evaluate from production orchestrator, not return fake expectedCapabilities'
    );
    assert.notDeepStrictEqual(
      actualCapMutated,
      scenarioWithMutatedCapabilities.expectedCapabilities,
      'Mutated expectedCapabilities must fail comparison against real engine output'
    );

    console.log('✔ Test 2 — Capability anti-circular protection passed');
  }

  // Test 3: No Expected-Field Dependency Test
  {
    const baseScenario = {
      title: 'Build React Dashboard',
      description: 'Create analytics dashboard components in React'
    };

    const runA = evaluateClassifier({ ...baseScenario, expectedCategory: 'CatA' });
    const runB = evaluateClassifier({ ...baseScenario, expectedCategory: 'CatB' });

    assert.strictEqual(runA, runB, 'Classifier engine output must be invariant to expectedCategory mutations');
    console.log('✔ Test 3 — No expected-field dependency protection passed');
  }

  // Test 4: Classification Domain Boundary Invariants
  {
    const testCases = [
      { input: { title: 'Government Construction E-Tender Bid' }, expected: 'Government Tender' },
      { input: { title: 'Public Health Department IT Procurement RFP' }, expected: 'Government Tender' },
      { input: { title: 'GDPR Data Compliance & Privacy Policy Review' }, expected: 'Legal Research' },
      { input: { title: 'Legal Patent Research & Prior Art Assignment' }, expected: 'Legal Research' },
      { input: { title: 'Zapier Automated Email Lead Notification' }, expected: 'AI Automation' },
      { input: { title: 'Social Media Graphic Banner Design Gig' }, expected: 'Fiverr Creative' },
      { input: { title: 'B2B Cold Email Outreach Campaign Writing' }, expected: 'Marketing' }
    ];

    testCases.forEach(({ input, expected }) => {
      const actual = evaluateClassifier(input);
      assert.strictEqual(actual, expected, `Scenario '${input.title}' must classify as '${expected}' but got '${actual}'`);
    });

    console.log('✔ Test 4 — Classification domain boundary invariants passed');
  }

  console.log('\nAll Founder Validation Anti-Circular & Classification Boundary Regression Tests PASSED cleanly.');
}

runRegressionTests();
