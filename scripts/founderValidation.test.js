const assert = require('assert');
const { evaluateClassifier, evaluateCapabilities } = require('./founderValidation');
const revenueOrchestrator = require('../src/services/revenueOrchestratorService');

function runRegressionTests() {
  console.log('Running Founder Validation Anti-Circular, Classification & Security Invariant Tests...\n');

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

  // Test 5: Defensive Security & Smart Contract Safety Invariants
  {
    const securityCases = [
      {
        name: 'Authorized web application security assessment',
        input: { title: 'Authorized Web Application Security Audit & Assessment', description: 'Perform defensive code security review and vulnerability assessment' },
        expectedCap: 'engineering.repository-audit'
      },
      {
        name: 'API authentication and authorization review',
        input: { title: 'REST API Authentication & Authorization Security Review', description: 'Review OAuth2 tokens and access control policies for security' },
        expectedCap: 'engineering.software-implementation'
      },
      {
        name: 'Dependency vulnerability audit',
        input: { title: 'npm Dependency Vulnerability Audit Report', description: 'Scan package dependencies for known CVE vulnerabilities and report' },
        expectedCap: 'engineering.repository-audit'
      },
      {
        name: 'Cloud security configuration review',
        input: { title: 'AWS Cloud IAM Security Policy Review', description: 'Audit AWS IAM policies for secure access configuration' },
        expectedCap: 'engineering.software-implementation'
      },
      {
        name: 'Solidity smart-contract audit',
        input: { title: 'Solidity Smart Contract Security Verification', description: 'Audit Ethereum ERC-20 smart contract code for reentrancy vulnerabilities' },
        expectedCap: 'engineering.software-implementation'
      },
      {
        name: 'Token contract access-control verification',
        input: { title: 'Token Smart Contract Access Control Verification', description: 'Verify Solidity token contract admin role permissions' },
        expectedCap: 'engineering.software-implementation'
      },
      {
        name: 'Ordinary software QA test',
        input: { title: 'Automated Unit Test Suite for Node.js App', description: 'Write Mocha/Jest unit test assertions' },
        expectedCap: 'testing.quality-assurance'
      },
      {
        name: 'Financial audit document',
        input: { title: 'Annual Financial Audit Report Preparation', description: 'Synthesize spreadsheet financial balance sheet audit' },
        expectedCap: 'automation.spreadsheet-automation'
      },
      {
        name: 'Unauthorized exploitation request',
        input: { title: 'Hack target website and bypass password cracking', description: 'Phishing and unauthorized credential theft' },
        expectedCategory: 'Scam Opportunities'
      },
      {
        name: 'Ambiguous penetration-testing request without authorization',
        input: { title: 'Unauthorized penetration testing and credential exploitation', description: 'Bypass server password cracking and phishing attacks' },
        expectedCategory: 'Scam Opportunities'
      }
    ];

    securityCases.forEach((tc) => {
      if (tc.expectedCategory) {
        const cat = evaluateClassifier(tc.input);
        assert.strictEqual(cat, tc.expectedCategory, `Security test '${tc.name}' must classify as '${tc.expectedCategory}' but got '${cat}'`);
      }
      if (tc.expectedCap) {
        const match = revenueOrchestrator.matchDemand(tc.input);
        assert.strictEqual(match.primaryCapability, tc.expectedCap, `Security test '${tc.name}' primary capability must be '${tc.expectedCap}' but got '${match.primaryCapability}'`);
      }
    });

    console.log('✔ Test 5 — Defensive security & smart contract safety invariants passed (10/10 cases passed)');
  }

  console.log('\nAll Founder Validation Anti-Circular, Classification & Security Invariant Tests PASSED cleanly.');
}

runRegressionTests();
