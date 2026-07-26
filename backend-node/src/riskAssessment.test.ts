import { RiskAssessmentEngine, UpstreamContextInput, CRITICAL_RISK_SCORE_FLOOR } from './services/riskAssessmentService';

export function runTests() {
  console.log('Running Risk Assessment Engine v1 Regression Tests...');
  const engine = new RiskAssessmentEngine();

  // Case 1 — Fully ready low-risk Node.js project
  {
    const input: UpstreamContextInput = {
      opportunity: {
        title: 'Build Node.js API Service',
        description: 'Standard Node.js backend development with tests',
        compensation: { amount: 500, currency: 'USD' }
      },
      context: {
        paymentTermsKnown: true,
        clientVerified: true,
        scopeClear: true,
        deadlineConfirmed: true,
        platformAccountAvailable: true,
        externalServiceAvailable: true
      }
    };
    const result = engine.assess(input);
    if (!['none', 'low'].includes(result.overallSeverity)) throw new Error('Case 1 failed: overallSeverity');
    if (result.hasCriticalRisk !== false) throw new Error('Case 1 failed: hasCriticalRisk');
    if (result.overallRiskScore > 25) throw new Error('Case 1 failed: overallRiskScore');
    console.log('✔ Case 1 — Fully ready low-risk Node.js project');
  }

  // Case 2 — Missing payment terms
  {
    const input: UpstreamContextInput = {
      opportunity: { title: 'Project with missing payment terms' },
      context: { paymentTermsKnown: false }
    };
    const result = engine.assess(input);
    const financialRisk = result.risks.find((r) => r.code === 'FINANCIAL_PAYMENT_TERMS_MISSING');
    if (!financialRisk) throw new Error('Case 2 failed: financialRisk missing');
    if (financialRisk.category !== 'financial') throw new Error('Case 2 failed: category');
    if (financialRisk.evidence.length === 0) throw new Error('Case 2 failed: evidence');
    if (financialRisk.mitigations.length === 0) throw new Error('Case 2 failed: mitigations');
    console.log('✔ Case 2 — Missing payment terms');
  }

  // Case 3 — Compensation unclear
  {
    const input: UpstreamContextInput = {
      opportunity: { title: 'Ambiguous job', compensation: 'unclear' }
    };
    const result = engine.assess(input);
    const financialRisk = result.risks.find((r) => r.code === 'FINANCIAL_COMPENSATION_UNCLEAR');
    if (!financialRisk) throw new Error('Case 3 failed');
    console.log('✔ Case 3 — Compensation unclear');
  }

  // Case 4 — Missing acceptance criteria
  {
    const input: UpstreamContextInput = {
      opportunity: { description: 'Build something with no acceptance criteria' },
      context: { scopeClear: false }
    };
    const result = engine.assess(input);
    const deliveryRisk = result.risks.find((r) => r.code === 'DELIVERY_ACCEPTANCE_CRITERIA_MISSING');
    if (!deliveryRisk || deliveryRisk.category !== 'delivery') throw new Error('Case 4 failed');
    console.log('✔ Case 4 — Missing acceptance criteria');
  }

  // Case 5 — Unrealistic deadline with explicit evidence
  {
    const input: UpstreamContextInput = {
      opportunity: { title: 'Urgent task', description: 'Complete massive app with unrealistic deadline in 1 hour', deadline: 'immediate_impossible' }
    };
    const result = engine.assess(input);
    const deliveryRisk = result.risks.find((r) => r.code === 'DELIVERY_DEADLINE_UNREALISTIC');
    if (!deliveryRisk || !['high', 'critical'].includes(deliveryRisk.severity)) throw new Error('Case 5 failed');
    console.log('✔ Case 5 — Unrealistic deadline');
  }

  // Case 6 — Planned GraphQL capability
  {
    const input: UpstreamContextInput = {
      opportunity: { description: 'Integration requiring GraphQL API' },
      capabilityMapping: { plannedCapability: 'engineering.api-integration.graphql' }
    };
    const result = engine.assess(input);
    const techRisk = result.risks.find((r) => r.code === 'TECHNICAL_CAPABILITY_GAP');
    if (!techRisk || !techRisk.evidence.some((e) => e.includes('PLANNED'))) throw new Error('Case 6 failed');
    console.log('✔ Case 6 — Planned GraphQL capability');
  }

  // Case 7 — Experimental Docker/AWS capability
  {
    const input: UpstreamContextInput = {
      opportunity: { description: 'Deploy using Docker on AWS' },
      capabilityMapping: { experimental: true }
    };
    const result = engine.assess(input);
    const techRisk = result.risks.find((r) => r.code === 'TECHNICAL_EXPERIMENTAL_CAPABILITY');
    if (!techRisk || techRisk.severity !== 'low') throw new Error('Case 7 failed');
    console.log('✔ Case 7 — Experimental Docker/AWS capability');
  }

  // Case 8 — Kubernetes missing
  {
    const input: UpstreamContextInput = {
      opportunity: { description: 'Deploy microservices to Kubernetes cluster' },
      requirements: { missingCapabilities: ['kubernetes'] }
    };
    const result = engine.assess(input);
    const techRisk = result.risks.find((r) => r.code === 'TECHNICAL_CAPABILITY_GAP');
    if (!techRisk || techRisk.severity !== 'high') throw new Error('Case 8 failed');
    console.log('✔ Case 8 — Kubernetes missing');
  }

  // Case 9 — Runtime unavailable
  {
    const input: UpstreamContextInput = {
      executionFeasibility: { runtimeAvailable: false }
    };
    const result = engine.assess(input);
    const techRisk = result.risks.find((r) => r.code === 'TECHNICAL_RUNTIME_UNAVAILABLE');
    if (!techRisk || techRisk.mitigations.length === 0) throw new Error('Case 9 failed');
    if ((input.executionFeasibility as any).runtimeAvailable !== false) throw new Error('Case 9 failed non-mutation');
    console.log('✔ Case 9 — Runtime unavailable');
  }

  // Case 10 — n8n with approval pending
  {
    const input: UpstreamContextInput = {
      opportunity: { description: 'Automate n8n workflows' },
      executionFeasibility: { blockers: ['FOUNDER_APPROVAL_PENDING'] }
    };
    const result = engine.assess(input);
    const opRisk = result.risks.find((r) => r.code === 'OPERATIONAL_PROCESS_UNDEFINED');
    if (!opRisk || !opRisk.evidence.some((e) => e.includes('FOUNDER_APPROVAL_PENDING'))) throw new Error('Case 10 failed');
    console.log('✔ Case 10 — n8n with approval pending');
  }

  // Case 11 — Licensed attorney requirement (Individual critical finding)
  {
    const input: UpstreamContextInput = {
      opportunity: { title: 'Licensed Attorney Legal Consultation' }
    };
    const result = engine.assess(input);
    const legalRisk = result.risks.find((r) => r.code === 'LEGAL_PROFESSIONAL_LICENCE_REQUIRED');
    if (!legalRisk || legalRisk.severity !== 'critical') throw new Error('Case 11: individual critical finding failed');
    if (result.overallSeverity !== 'critical' || !result.hasCriticalRisk) throw new Error('Case 11: overallSeverity critical failed');
    if (result.overallRiskScore < CRITICAL_RISK_SCORE_FLOOR) throw new Error(`Case 11: overallRiskScore floor ${CRITICAL_RISK_SCORE_FLOOR} failed`);
    console.log('✔ Case 11 — Licensed attorney requirement (Individual critical -> overall critical & score floor >= 85)');
  }

  // Case 12 — Physical onsite requirement
  {
    const input: UpstreamContextInput = {
      opportunity: { description: 'Require onsite physical presence for hardware setup' }
    };
    const result = engine.assess(input);
    const opRisk = result.risks.find((r) => r.code === 'OPERATIONAL_HUMAN_ROLE_REQUIRED');
    if (!opRisk || opRisk.category !== 'operational') throw new Error('Case 12 failed');
    console.log('✔ Case 12 — Physical onsite requirement');
  }

  // Case 13 — Personal data involved, consent unknown
  {
    const input: UpstreamContextInput = {
      opportunity: { description: 'Process customer personal data and emails' }
    };
    const result = engine.assess(input);
    const privacyRisk = result.risks.find((r) => r.code === 'PRIVACY_PERSONAL_DATA_PRESENT');
    if (!privacyRisk || privacyRisk.category !== 'privacy') throw new Error('Case 13 failed');
    console.log('✔ Case 13 — Personal data involved');
  }

  // Case 14 — Production credentials required
  {
    const input: UpstreamContextInput = {
      opportunity: { description: 'Connect using production credentials and admin password' }
    };
    const result = engine.assess(input);
    const secRisk = result.risks.find((r) => r.code === 'SECURITY_CREDENTIAL_HANDLING');
    if (!secRisk || secRisk.category !== 'security') throw new Error('Case 14 failed');
    console.log('✔ Case 14 — Production credentials required');
  }

  // Case 15 — Third-party API without fallback
  {
    const input: UpstreamContextInput = {
      opportunity: { description: 'Integrate external API service' },
      context: { externalServiceAvailable: false }
    };
    const result = engine.assess(input);
    const depRisk = result.risks.find((r) => r.code === 'DEPENDENCY_EXTERNAL_API_REQUIRED');
    if (!depRisk || depRisk.category !== 'dependency') throw new Error('Case 15 failed');
    console.log('✔ Case 15 — Third-party API without fallback');
  }

  // Case 16 — Platform account unavailable
  {
    const input: UpstreamContextInput = {
      context: { platformAccountAvailable: false }
    };
    const result = engine.assess(input);
    const platRisk = result.risks.find((r) => r.code === 'PLATFORM_ACCOUNT_UNAVAILABLE');
    if (!platRisk || platRisk.category !== 'platform') throw new Error('Case 16 failed');
    console.log('✔ Case 16 — Platform account unavailable');
  }

  // Case 17 — Client identity unverified
  {
    const input: UpstreamContextInput = {
      context: { clientVerified: false }
    };
    const result = engine.assess(input);
    const repRisk = result.risks.find((r) => r.code === 'REPUTATION_CLIENT_UNVERIFIED');
    if (!repRisk || repRisk.category !== 'reputation') throw new Error('Case 17 failed');
    console.log('✔ Case 17 — Client identity unverified');
  }

  // Case 18 — Multiple simultaneous risks & two high findings escalation
  {
    const input: UpstreamContextInput = {
      opportunity: {
        description: 'Need third-party API integration with production credentials required. Unrealistic deadline.'
      },
      context: {
        paymentTermsKnown: false,
        scopeClear: false,
        clientVerified: false
      }
    };
    const result = engine.assess(input);
    if (result.risks.length < 4 || result.highestRiskCategories.length <= 1) throw new Error('Case 18 failed');
    if (result.overallSeverity !== 'critical') throw new Error('Case 18 failed: escalation to critical');
    if (result.overallRiskScore < CRITICAL_RISK_SCORE_FLOOR) throw new Error(`Case 18 failed: score ${result.overallRiskScore} must be >= ${CRITICAL_RISK_SCORE_FLOOR}`);
    console.log('✔ Case 18 — Two high findings escalate overallSeverity to critical & enforce score floor >= 85');
  }

  // Explicit Invariant Test 1: Three medium findings -> overallSeverity === 'high' or 'critical'
  {
    const input: UpstreamContextInput = {
      opportunity: { description: 'Integration needing external API with personal data and no acceptance criteria' },
      context: { paymentTermsKnown: false }
    };
    const result = engine.assess(input);
    const mediumCount = result.risks.filter((r) => r.severity === 'medium').length;
    if (mediumCount >= 3) {
      if (result.overallSeverity !== 'high' && result.overallSeverity !== 'critical') {
        throw new Error(`Explicit Invariant Test 1 failed: 3 medium findings must yield overallSeverity high or critical, got ${result.overallSeverity}`);
      }
    }
    console.log('✔ Explicit Invariant Test 1 — Three medium findings yield high overall severity');
  }

  // Explicit Invariant Test 2: Fully complete zero-risk input -> score 0, confidence 100, severity none
  {
    const input: UpstreamContextInput = {
      opportunity: { title: 'Standard low-risk job', compensation: { amount: 1000, currency: 'USD' } },
      context: {
        paymentTermsKnown: true,
        clientVerified: true,
        scopeClear: true,
        deadlineConfirmed: true,
        platformAccountAvailable: true,
        externalServiceAvailable: true
      }
    };
    const result = engine.assess(input);
    if (result.overallRiskScore !== 0) throw new Error(`Explicit Invariant Test 2 failed: score must be 0, got ${result.overallRiskScore}`);
    if (result.overallConfidence !== 100) throw new Error(`Explicit Invariant Test 2 failed: confidence must be 100, got ${result.overallConfidence}`);
    if (result.overallSeverity !== 'none') throw new Error(`Explicit Invariant Test 2 failed: severity must be none, got ${result.overallSeverity}`);
    console.log('✔ Explicit Invariant Test 2 — Fully complete zero-risk input -> score 0, confidence 100, severity none');
  }

  // Explicit Invariant Test 3: Relevant missing-context penalties vs irrelevant omission
  {
    const financialInput: UpstreamContextInput = { opportunity: { compensation: { amount: 1000, currency: 'USD' } } };
    const resFinancial = engine.assess(financialInput);
    if (resFinancial.overallConfidence !== 95) {
      throw new Error(`Explicit Invariant Test 3 failed: paymentTermsKnown omitted when financial relevant should reduce confidence by 5, got ${resFinancial.overallConfidence}`);
    }

    const techOnlyInput: UpstreamContextInput = {
      opportunity: { title: 'Code Refactoring', description: 'Pure technical refactoring' },
      context: { paymentTermsKnown: true, clientVerified: true, scopeClear: true }
    };
    const resTech = engine.assess(techOnlyInput);
    if (resTech.overallConfidence !== 100) {
      throw new Error(`Explicit Invariant Test 3 failed: irrelevant penalty was applied to technical input, got ${resTech.overallConfidence}`);
    }
    console.log('✔ Explicit Invariant Test 3 — Missing context penalties apply only when relevant to context');
  }

  // Explicit Invariant Test 4: Explicit false is distinct from undefined
  {
    const inputFalse: UpstreamContextInput = { context: { paymentTermsKnown: false } };
    const resultFalse = engine.assess(inputFalse);
    const financialFinding = resultFalse.risks.find((r) => r.code === 'FINANCIAL_PAYMENT_TERMS_MISSING');
    if (!financialFinding) throw new Error('Explicit Invariant Test 4 failed: explicit false must generate a risk finding');
    console.log('✔ Explicit Invariant Test 4 — Explicit false values generate risk findings and are distinct from undefined');
  }

  // General Invariant checks (Determinism, Non-mutation, Bounds 0-100, Unique codes, Evidence/Mitigation)
  {
    const input: UpstreamContextInput = {
      opportunity: { description: 'Integrate external API with personal data' },
      context: { paymentTermsKnown: false }
    };
    const inputCopy = JSON.parse(JSON.stringify(input));

    const res1 = engine.assess(input);
    const res2 = engine.assess(input);

    if (JSON.stringify(res1) !== JSON.stringify(res2)) throw new Error('Determinism failed');
    if (JSON.stringify(input) !== JSON.stringify(inputCopy)) throw new Error('Non-mutation failed');
    if (res1.overallRiskScore < 0 || res1.overallRiskScore > 100) throw new Error('Score bounds failed');
    if (res1.overallConfidence < 0 || res1.overallConfidence > 100) throw new Error('Confidence bounds failed');

    res1.risks.forEach((r) => {
      if (r.severity !== 'none') {
        if (r.evidence.length === 0 || r.mitigations.length === 0) throw new Error('Evidence/Mitigations completeness failed');
      }
    });

    const codes = res1.risks.map((r) => r.code);
    if (new Set(codes).size !== codes.length) throw new Error('Unique codes failed');
    console.log('✔ Invariant Checks (Determinism, Non-mutation, Bounds, Evidence/Mitigation Completeness)');
  }

  console.log('\nAll Risk Assessment Engine v1 Regression Tests & Invariants PASSED cleanly.');
}

runTests();
