/**
 * 🦅 GARUDA OS — FINTECH QUALIFICATION & REVENUE PIPELINE TESTS
 * Verification suite for:
 * 1. Deterministic Tier Classification (Cloud Starter, Growth, Enterprise, Custom Review)
 * 2. Strict Credential Stripping & Zero Sensitive Ingestion
 * 3. Truthful Provider Dependency Mapping (MockBank = OPERATIONAL, others require credentials)
 * 4. 19-Section Technical Proposal Draft Generation
 * 5. Statutory Commercial Fee Segregation
 * 6. Founder Approval Gatekeeping (Client cannot self-approve)
 * 7. Telegram Alert Formatting
 * 8. End-to-End Inbound Submission via RevenueFunnelSecurityService
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const {
  FORBIDDEN_FINANCIAL_FIELDS,
  PIPELINE_STAGES,
  COMMERCIAL_TIERS,
  PROVIDER_STATUS_REGISTRY,
  validateAndSanitizeFintechPayload,
  evaluateFintechRequirements,
  buildFintechProposalDraft,
  formatFintechTelegramAlert
} = require("../services/fintechQualificationService");

const { revenueFunnelSecurityService } = require("../services/revenueFunnelSecurityService");

test("Fintech Qualification Pipeline Suite", async (t) => {

  await t.test("1. Deterministic Classification: Cloud Starter", () => {
    const payload = validateAndSanitizeFintechPayload({
      identity: { name: "Aarav Patel", company: "Aarav D2C", email: "aarav@d2c.com" },
      business: { businessType: "D2C / E-commerce", industry: "Apparel" },
      paymentRequirements: {
        selectedTier: "cloud-starter",
        moneyMovement: "domestic",
        expectedMonthlyVolume: "< ₹10 lakh",
        requiredCurrencies: ["INR"]
      },
      deployment: { deploymentModel: "hosted" }
    });

    const result = evaluateFintechRequirements(payload);
    assert.equal(result.recommendedTier, "CLOUD_STARTER");
    assert.equal(result.recommendedTierDetails.title, "Cloud Starter");
    assert.equal(result.tierMatches, true);
    assert.ok(result.reasons.length > 0);
    assert.match(result.status, /Preliminary Architecture Fit/);
  });

  await t.test("2. Deterministic Classification: Cross-Border Growth", () => {
    const payload = validateAndSanitizeFintechPayload({
      identity: { name: "Sarah Jenkins", company: "Global SaaS Corp", email: "sarah@globalsaas.io" },
      business: { businessType: "Exporter / International SaaS", industry: "Software" },
      paymentRequirements: {
        selectedTier: "cross-border-growth",
        moneyMovement: "cross-border",
        expectedMonthlyVolume: "₹50 lakh – ₹5 crore",
        requiredCurrencies: ["USD", "AED", "INR", "EUR"]
      },
      deployment: { deploymentModel: "hosted" }
    });

    const result = evaluateFintechRequirements(payload);
    assert.equal(result.recommendedTier, "CROSS_BORDER_GROWTH");
    assert.equal(result.recommendedTierDetails.title, "Cross-Border Growth");
    assert.equal(result.tierMatches, true);
    assert.ok(result.providerGaps.length >= 3);
  });

  await t.test("3. Deterministic Classification: Sovereign Enterprise (VPC & High Volume)", () => {
    const payload = validateAndSanitizeFintechPayload({
      identity: { name: "Vikram Singhania", company: "Apex Finance NBFC", email: "vikram@apexfinance.in" },
      business: { businessType: "Fintech / NBFC", industry: "Lending" },
      paymentRequirements: {
        selectedTier: "cloud-starter", // Client chose starter, but requirements mandate Enterprise
        moneyMovement: "both",
        expectedMonthlyVolume: "₹25 crore+",
        requiredCurrencies: ["INR", "USD"]
      },
      deployment: { deploymentModel: "privateVPC" }
    });

    const result = evaluateFintechRequirements(payload);
    assert.equal(result.recommendedTier, "SOVEREIGN_ENTERPRISE");
    assert.equal(result.tierMatches, false, "Should detect mismatch between chosen starter and enterprise requirements");
    assert.equal(result.selectedTier, "CLOUD_STARTER");
  });

  await t.test("4. Security: Zero Sensitive Financial Credentials Ingestion", () => {
    const maliciousPayload = {
      name: "Attacker",
      company: "Evil Corp",
      cardNumber: "4111222233334444",
      cvv: "123",
      bankPassword: "superSecretPassword123",
      privateKey: "mock_test_private_key_material_for_sanitization_test",
      apiSecret: "mock_test_secret_for_sanitization_test",
      seedPhrase: "apple banana orange grape...",
      paymentRequirements: {
        pin: "9999",
        card: "4000123456789010",
        expectedMonthlyVolume: "< ₹10 lakh"
      }
    };

    const clean = validateAndSanitizeFintechPayload(maliciousPayload);

    // Assert sensitive fields were stripped completely
    assert.equal(clean.strippedFields.length > 0, true);
    assert.equal(clean.cardNumber, undefined);
    assert.equal(clean.cvv, undefined);
    assert.equal(clean.bankPassword, undefined);
    assert.equal(clean.privateKey, undefined);
    assert.equal(clean.apiSecret, undefined);
    assert.equal(clean.seedPhrase, undefined);
    assert.equal(clean.paymentRequirements.pin, undefined);
    assert.equal(clean.paymentRequirements.card, undefined);
  });

  await t.test("5. Truthful Provider Readiness Mapping (Anti-Fabrication)", () => {
    const payload = validateAndSanitizeFintechPayload({
      paymentRequirements: {
        requiredCurrencies: ["INR", "AED", "GBP"]
      }
    });

    const result = evaluateFintechRequirements(payload);

    // MockBank must be OPERATIONAL
    const mockGap = result.providerGaps.find(g => g.provider.includes("Mock"));
    assert.ok(mockGap);
    assert.equal(mockGap.status, "OPERATIONAL");

    // ICICI must state ADAPTER READY / CREDENTIALS REQUIRED
    const iciciGap = result.providerGaps.find(g => g.provider.includes("ICICI"));
    assert.ok(iciciGap);
    assert.match(iciciGap.status, /ADAPTER_READY|CREDENTIALS_REQUIRED/);

    // Wio Bank must state SANDBOX_READY / CREDENTIALS REQUIRED
    const wioGap = result.providerGaps.find(g => g.provider.includes("Wio"));
    assert.ok(wioGap);
    assert.match(wioGap.status, /SANDBOX_READY|CREDENTIALS_REQUIRED/);

    // Modulr must state ADAPTER READY / CREDENTIALS REQUIRED
    const modulrGap = result.providerGaps.find(g => g.provider.includes("Modulr"));
    assert.ok(modulrGap);
    assert.match(modulrGap.status, /ADAPTER_READY|CREDENTIALS_REQUIRED/);
  });

  await t.test("6. Full 19-Section Technical Proposal Generation", () => {
    const payload = validateAndSanitizeFintechPayload({
      identity: { name: "Ananya Roy", company: "Zeta Commerce", email: "ananya@zeta.com" },
      business: { businessType: "D2C / E-commerce", industry: "Retail" },
      paymentRequirements: {
        selectedTier: "cloud-starter",
        moneyMovement: "domestic",
        expectedMonthlyVolume: "₹10 lakh – ₹50 lakh",
        requiredCurrencies: ["INR"]
      }
    });

    const qual = evaluateFintechRequirements(payload);
    const proposal = buildFintechProposalDraft(payload, qual, { scopeId: "fintech_test_001" });

    assert.equal(proposal.proposalId, "fintech_test_001");
    assert.equal(proposal.isFintech, true);
    assert.equal(proposal.founderApproved, false);
    assert.equal(proposal.governanceStatus, "AWAITING_FOUNDER_APPROVAL");
    assert.equal(proposal.pipelineStage, PIPELINE_STAGES.PROPOSAL_DRAFT);

    const s = proposal.fintechSections;
    assert.ok(s);
    assert.ok(s.section01_executiveSummary);
    assert.ok(s.section02_businessProfileAndObjectives);
    assert.ok(s.section03_currentPaymentWorkflow);
    assert.ok(s.section04_recommendedGatewayArchitecture);
    assert.ok(s.section05_providerAndBankingDependencyMatrix);
    assert.ok(s.section06_crossBorderCorridorAnalysis);
    assert.ok(s.section07_settlementAndTreasuryArchitecture);
    assert.ok(s.section08_securityAndWebhookArchitecture);
    assert.ok(s.section09_integrationPlan);
    assert.ok(s.section10_deploymentModel);
    assert.ok(s.section11_regulatoryAndZeroCustodyDemarcation);
    assert.ok(s.section12_implementationPhasing);
    assert.ok(s.section13_pilotPhaseDefinition);
    assert.ok(s.section14_acceptanceCriteria);
    assert.ok(s.section15_indicativeCommercialStartingPoint);
    assert.ok(s.section16_thirdPartyProviderCostDemarcation);
    assert.ok(s.section17_technicalAssumptions);
    assert.ok(s.section18_clientResponsibilities);
    assert.ok(s.section19_founderApprovalNotice);

    // Verify 3 stages in pilot definition
    assert.equal(s.section13_pilotPhaseDefinition.stages.length, 3);
  });

  await t.test("7. Statutory Commercial Fee Segregation Breakdown", () => {
    const payload = validateAndSanitizeFintechPayload({
      identity: { name: "Test User", company: "Test Co", email: "test@co.com" }
    });
    const qual = evaluateFintechRequirements(payload);
    const proposal = buildFintechProposalDraft(payload, qual);

    const breakdown = proposal.pricing.statutoryDemarcation;
    assert.ok(Array.isArray(breakdown));
    assert.equal(breakdown.length, 4);

    assert.equal(breakdown[0].item, "GARUDA Platform License / Software Fee");
    assert.match(breakdown[0].party, /GARUDA OS/);

    assert.equal(breakdown[1].item, "Banking Interchange & Clearing Fees");
    assert.match(breakdown[1].party, /Acquiring Bank \/ Partner/);

    assert.equal(breakdown[2].item, "Foreign Exchange (FX) Spreads & Swaps");
    assert.match(breakdown[2].party, /interbank/);

    assert.equal(breakdown[3].item, "Applicable Taxes (GST / VAT / Corporate Taxes)");
  });

  await t.test("8. Founder Approval Gatekeeping (Anti-Tamper)", () => {
    const clientPayloadWithForgery = {
      name: "Hacker",
      company: "Hacker Ltd",
      requirements: "Deploy gateway now",
      founderApproved: true,
      paidAmount: 999999,
      verifiedRevenue: true,
      service: "fintech-gateway",
      isTest: true
    };

    const sanitized = revenueFunnelSecurityService.sanitizeInboundPayload(clientPayloadWithForgery);
    assert.equal(sanitized.founderApproved, undefined);
    assert.equal(sanitized.paidAmount, undefined);
    assert.equal(sanitized.verifiedRevenue, undefined);
    assert.ok(sanitized.strippedAuthorityFields.some(f => f.field === "founderApproved"));
  });

  await t.test("9. Telegram Notification Formatter (Exact Spec)", () => {
    const payload = validateAndSanitizeFintechPayload({
      identity: { name: "Rajesh Mittal", company: "Mittal Global Exports", email: "rajesh@mittalexports.com", phone: "+91 98200 12345" },
      paymentRequirements: {
        selectedTier: "cross-border-growth",
        expectedMonthlyVolume: "₹50 lakh – ₹5 crore",
        requiredCurrencies: ["USD", "AED", "INR"],
        moneyMovement: "cross-border"
      },
      deployment: { deploymentModel: "Hosted" },
      integration: { requiredIntegrations: ["REST API", "Webhooks", "Treasury Dashboard"] }
    });

    const qual = evaluateFintechRequirements(payload);
    const alertText = formatFintechTelegramAlert(payload, qual, "https://garudaos.in/proposal/fintech_12345");

    assert.match(alertText, /🦅 NEW FINTECH LEAD:/);
    assert.match(alertText, /Company: Mittal Global Exports/);
    assert.match(alertText, /Selected Tier: Cross-Border Growth/);
    assert.match(alertText, /Preliminary Architecture: Cross-Border Growth/);
    assert.match(alertText, /Volume: ₹50 lakh – ₹5 crore/);
    assert.match(alertText, /Currencies: USD, AED, INR/);
    assert.match(alertText, /Deployment: Hosted/);
    assert.match(alertText, /Cross-Border: Yes \(USD, AED, INR\)/);
    assert.match(alertText, /Status: Draft Proposal Created — Awaiting Founder Review/);
    assert.match(alertText, /View Lead: https:\/\/garudaos\.in\/proposal\/fintech_12345/);
  });

  await t.test("10. End-to-End Submission via revenueFunnelSecurityService", async () => {
    const submission = {
      isTest: true,
      service: "fintech-gateway",
      fintechPayload: {
        identity: { name: "E2E Tester", company: "Test Automation Corp", email: "e2e@testcorp.com", phone: "+91 99999 88888" },
        business: { businessType: "D2C / E-commerce" },
        paymentRequirements: {
          selectedTier: "cloud-starter",
          expectedMonthlyVolume: "< ₹10 lakh",
          requiredCurrencies: ["INR"],
          moneyMovement: "domestic"
        },
        deployment: { deploymentModel: "hosted" }
      }
    };

    const result = await revenueFunnelSecurityService.handleInboundSubmission(submission, {
      headers: { "x-garuda-test-mode": "true" }
    });

    assert.equal(result.statusCode, 201);
    assert.equal(result.body.success, true);
    assert.ok(result.body.proposalId.startsWith("fintech_"));
    assert.equal(result.body.proposal.isFintech, true);
    assert.equal(result.body.proposal.founderApproved, false);
    assert.equal(result.body.proposal.governanceStatus, "AWAITING_FOUNDER_APPROVAL");
    assert.ok(result.body.proposal.fintechSections.section01_executiveSummary);

    // Verify scope can be retrieved by ID
    const retrieved = await revenueFunnelSecurityService.getScopeById(result.body.proposalId);
    assert.ok(retrieved);
    assert.equal(retrieved.proposalId, result.body.proposalId);
    assert.equal(retrieved.client.company, "Test Automation Corp");
  });

});
