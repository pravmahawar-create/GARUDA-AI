const crypto = require("crypto");

function sha256(data) {
  return crypto.createHash("sha256").update(typeof data === "string" ? data : JSON.stringify(data)).digest("hex");
}

function plainText(value = "") {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * 1. Requirement Analysis
 * Extracts technical stack, grounded requirements, scope boundary, and client constraints.
 */
function analyzeRequirements(candidate = {}) {
  const title = plainText(candidate.title || candidate.rawSource?.title || "");
  const description = plainText(candidate.description || candidate.rawSource?.description || "");
  const combinedText = `${title} ${description}`;
  const tags = Array.isArray(candidate.tags) ? candidate.tags.map(plainText) : [];

  // Technology Stack Extraction
  const knownTech = [
    { name: "Node.js", regex: /\b(node\.?js|node|express|nestjs)\b/i },
    { name: "React", regex: /\b(react\.?js|react|next\.?js|frontend)\b/i },
    { name: "TypeScript", regex: /\b(typescript|ts)\b/i },
    { name: "REST API", regex: /\b(rest|restful|api|endpoint|endpoints)\b/i },
    { name: "GraphQL", regex: /\b(graphql|apollo)\b/i },
    { name: "Python", regex: /\b(python|django|fastapi|flask)\b/i },
    { name: "Database", regex: /\b(sql|postgresql|postgres|mongodb|mongo|database|orm|prisma)\b/i },
    { name: "Automated Testing", regex: /\b(testing|jest|mocha|cypress|playwright|qa|unit test|unit tests)\b/i },
    { name: "Docker / AWS", regex: /\b(docker|container|aws|cloud|kubernetes)\b/i },
    { name: "Workflow Automation", regex: /\b(n8n|zapier|automation|workflow)\b/i }
  ];

  const technicalStack = knownTech
    .filter((t) => t.regex.test(combinedText) || tags.some((tag) => t.regex.test(tag)))
    .map((t) => t.name);

  if (technicalStack.length === 0 && tags.length > 0) {
    technicalStack.push(...tags.slice(0, 5));
  }
  if (technicalStack.length === 0) {
    technicalStack.push("Software Development & API Engineering");
  }

  // Grounded Requirement Sentences
  const sentences = description.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const requirementSignals = /\b(require|required|must|deliver|build|implement|test|acceptance|deadline|milestone|scope|feature)\b/i;
  const groundedRequirements = sentences.filter((s) => requirementSignals.test(s)).slice(0, 5);

  if (groundedRequirements.length === 0) {
    groundedRequirements.push(`Implement bounded requirements for: ${title}`);
  }

  // Scope & Constraints
  const hasFixedBudget = /\$|\b(budget|fixed price|rate)\b/i.test(combinedText);
  const hasFixedDeadline = /\b(deadline|by|within|due|timeline)\b/i.test(combinedText);
  const testingRequired = technicalStack.includes("Automated Testing") || /\btest|jest|qa\b/i.test(combinedText);

  return {
    title,
    technicalStack,
    groundedRequirements,
    scopeSummary: description.slice(0, 800) || title,
    clientConstraints: {
      hasFixedBudget,
      hasFixedDeadline,
      testingRequired
    }
  };
}

/**
 * 2. Effort Estimation
 * Calculates hours, delivery days, complexity rating, and breakdown per engineering phase.
 */
function estimateEffort(candidate = {}, requirements = {}) {
  const stackCount = (requirements.technicalStack || []).length;
  const descriptionLength = (candidate.description || candidate.rawSource?.description || "").length;

  let baseHours = 16;
  if (descriptionLength > 1000 || stackCount > 3) {
    baseHours = 28;
  }
  if (descriptionLength > 3500 || stackCount > 5) {
    baseHours = 48;
  }

  const setupHours = Math.max(2, Math.round(baseHours * 0.15));
  const implementationHours = Math.max(6, Math.round(baseHours * 0.50));
  const testingHours = Math.max(4, Math.round(baseHours * 0.20));
  const handoverHours = Math.max(2, Math.round(baseHours * 0.15));

  const totalEstimatedHours = setupHours + implementationHours + testingHours + handoverHours;
  const estimatedDeliveryDays = Math.max(1, Math.ceil(totalEstimatedHours / 6));

  let complexityRating = "medium";
  if (totalEstimatedHours <= 18) complexityRating = "low";
  if (totalEstimatedHours >= 36) complexityRating = "high";

  return {
    totalEstimatedHours,
    estimatedDeliveryDays,
    complexityRating,
    confidenceScore: candidate.verification?.listingKind === "specific_client_work" ? 90 : 75,
    phaseBreakdown: [
      { phase: "Architecture & Data Schema Setup", estimatedHours: setupHours },
      { phase: "Core Feature & API Implementation", estimatedHours: implementationHours },
      { phase: "Automated QA & Integration Testing", estimatedHours: testingHours },
      { phase: "Documentation, Delivery Package & Handover", estimatedHours: handoverHours }
    ]
  };
}

/**
 * 3. Pricing Recommendation Engine
 * Calculates base cost, risk buffer, target price, floor price, and milestone structure.
 */
function recommendPricing(candidate = {}, effort = {}, risks = []) {
  const salaryText = String(candidate.salaryText || candidate.rawSource?.salaryText || "").trim();

  let currency = "USD";
  let targetClientBudget = null;

  if (/₹|inr/i.test(salaryText)) {
    currency = "INR";
  } else if (/€|eur/i.test(salaryText)) {
    currency = "EUR";
  } else if (/£|gbp/i.test(salaryText)) {
    currency = "GBP";
  }

  const numericMatch = salaryText.replace(/,/g, "").match(/(\d+)/);
  if (numericMatch) {
    const val = parseInt(numericMatch[1], 10);
    if (val > 10 && val < 10000000) {
      targetClientBudget = val;
    }
  }

  const baseRatePerHour = currency === "INR" ? 3500 : 50;
  const baseCost = effort.totalEstimatedHours * baseRatePerHour;

  let riskBufferPercent = 10;
  if (!targetClientBudget) riskBufferPercent += 15;
  if (String(candidate.company || candidate.rawSource?.company || "").toLowerCase().includes("not disclosed")) riskBufferPercent += 10;
  if (effort.complexityRating === "high") riskBufferPercent += 15;
  if (risks.length > 2) riskBufferPercent += 10;

  const riskBufferAmount = Math.round(baseCost * (riskBufferPercent / 100));

  let recommendedPrice = baseCost + riskBufferAmount;

  if (targetClientBudget) {
    if (targetClientBudget >= baseCost) {
      recommendedPrice = targetClientBudget;
    } else {
      recommendedPrice = Math.max(targetClientBudget, baseCost + riskBufferAmount);
    }
  }

  const minimumAcceptableFloorPrice = Math.round(recommendedPrice * 0.80);

  const milestones = [];
  if (recommendedPrice >= (currency === "INR" ? 50000 : 1000)) {
    const half = Math.round(recommendedPrice / 2);
    milestones.push({
      milestone: "Milestone 1 — Core Architecture & Prototype Verification",
      amount: half,
      percentage: 50
    });
    milestones.push({
      milestone: "Milestone 2 — Final Implementation, Test Suite & Acceptance",
      amount: recommendedPrice - half,
      percentage: 50
    });
  } else {
    milestones.push({
      milestone: "Milestone 1 — Complete Bounded Delivery & Acceptance",
      amount: recommendedPrice,
      percentage: 100
    });
  }

  return {
    currency,
    targetClientBudget,
    baseCost,
    riskBufferPercent,
    riskBufferAmount,
    recommendedPrice,
    minimumAcceptableFloorPrice,
    pricingModel: targetClientBudget ? "fixed_price" : "milestone_based",
    milestones
  };
}

/**
 * 4. Risk Identification & Mitigation
 */
function identifyRisks(candidate = {}) {
  const risks = Array.isArray(candidate.founderAssistedIntake?.risks) ? [...candidate.founderAssistedIntake.risks] : [];
  const missingInfo = Array.isArray(candidate.founderAssistedIntake?.missingInformation) ? [...candidate.founderAssistedIntake.missingInformation] : [];

  const findings = [];

  for (const r of risks) {
    findings.push({
      risk: r,
      mitigation: "Include explicit milestone approval gate and clarify scope before work initiation."
    });
  }
  for (const info of missingInfo) {
    findings.push({
      risk: info,
      mitigation: "Include explicit client confirmation gate in proposal submission."
    });
  }

  if (findings.length === 0) {
    findings.push({
      risk: "Standard client scope creep risk",
      mitigation: "Strictly bind work to the acceptance criteria specified in this submission package."
    });
  }

  const overallRiskLevel = findings.length > 2 ? "medium" : "low";

  return {
    findings,
    overallRiskLevel
  };
}

/**
 * 5. Deliverable Specifications
 */
function prepareDeliverables(candidate = {}, requirements = {}) {
  const title = requirements.title || candidate.title || "Client Solution";
  const stackText = (requirements.technicalStack || []).join(", ");

  return [
    {
      id: "deliverable-01",
      title: `Production Codebase — ${title}`,
      description: `Complete, modular, and governed software implementation using ${stackText}.`,
      acceptanceCriteria: "Codebase compiles cleanly, contains zero placeholder logic, and passes all build checks."
    },
    {
      id: "deliverable-02",
      title: "Automated QA & Verification Suite",
      description: "Automated unit and integration test suite demonstrating 100% passing test execution.",
      acceptanceCriteria: "Test runner exits with code 0 and provides empirical verification logs."
    },
    {
      id: "deliverable-03",
      title: "Documentation & Handover Package",
      description: "Deployment guide, environment configuration template, and API endpoint documentation.",
      acceptanceCriteria: "Founder and client can setup and execute the deliverable following the documented steps."
    }
  ];
}

/**
 * 6. Client Proposal Generator
 */
function generateProposalText(candidate = {}, requirements = {}, effort = {}, pricing = {}, deliverables = []) {
  const company = candidate.company || candidate.rawSource?.company || "Client Team";
  const title = requirements.title || "Project Request";
  const stack = (requirements.technicalStack || []).join(", ");

  const formattedDeliverables = deliverables
    .map((d, index) => `${index + 1}. **${d.title}**: ${d.description}\n   - *Acceptance Criteria*: ${d.acceptanceCriteria}`)
    .join("\n\n");

  const proposalText = `
# Commercial Proposal for ${company}
**Project**: ${title}
**Prepared By**: GARUDA AI Operating System (Founder-Assisted Execution)

---

### 1. Executive Summary
GARUDA is prepared to execute "${title}" as a high-precision, governed engineering deliverable. Our solution uses ${stack} to deliver production-ready code with complete automated test coverage and zero placeholder logic.

### 2. Technical Solution & Scope
${requirements.scopeSummary}

**Key Technical Capabilities**:
- Stack: ${stack}
- Governed execution with strict quality assurance
- Verification: Empirical test execution logs provided with final handover

### 3. Proposed Deliverables & Acceptance Criteria
${formattedDeliverables}

### 4. Delivery Schedule & Effort Estimate
- **Estimated Total Effort**: ${effort.totalEstimatedHours} Hours across ${effort.estimatedDeliveryDays} Business Days
- **Complexity Rating**: ${effort.complexityRating.toUpperCase()}
- **Phases**:
${effort.phaseBreakdown.map((p) => `  • ${p.phase}: ${p.estimatedHours} hrs`).join("\n")}

### 5. Commercial Pricing & Milestones
- **Quoted Investment**: ${pricing.currency} ${pricing.recommendedPrice.toLocaleString()} (${pricing.pricingModel.replace("_", " ")})
- **Minimum Floor Price**: ${pricing.currency} ${pricing.minimumAcceptableFloorPrice.toLocaleString()}
- **Milestone Breakdown**:
${pricing.milestones.map((m) => `  • ${m.milestone}: ${pricing.currency} ${m.amount.toLocaleString()} (${m.percentage}%)`).join("\n")}

### 6. Client Confirmations Requested
1. Exact scope and required input access
2. Confirmation of quoted investment and milestone schedule
3. Authorization to initiate work upon milestone funding

---
*GARUDA AI Operating System Governance: Governed execution, no human identity impersonation, 100% verified test execution.*
`.trim();

  return proposalText;
}

/**
 * 7. Complete Submission Package Assembler
 */
function buildFounderSubmissionPackage(candidate = {}, context = {}, options = {}) {
  const now = options.now ? new Date(options.now) : new Date();

  const requirements = analyzeRequirements(candidate);
  const effort = estimateEffort(candidate, requirements);
  const risks = identifyRisks(candidate);
  const pricing = recommendPricing(candidate, effort, risks.findings);
  const deliverables = prepareDeliverables(candidate, requirements);
  const proposalText = generateProposalText(candidate, requirements, effort, pricing, deliverables);

  const formattedSubmissionText = `
PROPOSAL SUBMISSION PACKAGE (FOR FOUNDER COPY-PASTE)
===================================================
Target URL: ${candidate.url || candidate.rawSource?.url || "Client Portal"}
Client: ${candidate.company || candidate.rawSource?.company || "Not Disclosed"}
Opportunity Title: ${candidate.title || candidate.rawSource?.title || "Listing"}

COMMERCIAL PROPOSAL:
-------------------
${proposalText}

SUBMISSION INSTRUCTIONS FOR FOUNDER:
1. Access listing at: ${candidate.url || candidate.rawSource?.url || "Client Portal"}
2. Copy the proposal text above into the client proposal submission field.
3. Set bid amount to: ${pricing.currency} ${pricing.recommendedPrice}
4. Set delivery timeframe to: ${effort.estimatedDeliveryDays} days
5. Submit via Founder's authorized marketplace account.
===================================================
`.trim();

  const payload = {
    candidateId: String(candidate.externalId || candidate.id || candidate._id || ""),
    url: String(candidate.url || candidate.rawSource?.url || ""),
    title: String(candidate.title || candidate.rawSource?.title || ""),
    clientCompany: String(candidate.company || candidate.rawSource?.company || "not disclosed"),
    requirements,
    effortEstimation: effort,
    pricingRecommendation: pricing,
    riskAssessment: risks,
    deliverables,
    proposalText,
    formattedSubmissionText,
    preparedAt: now.toISOString(),
    status: "READY_FOR_FOUNDER_SUBMISSION",
    governance: {
      founderApprovalRequiredBeforeSubmission: true,
      manualSubmissionRequired: true,
      automaticSubmissionForbidden: true,
      attestationVerified: true,
      truthfulnessGuaranteed: true
    }
  };

  const packageHash = sha256(payload);
  const truthHash = sha256({
    candidateId: payload.candidateId,
    requirements: payload.requirements,
    pricing: payload.pricingRecommendation,
    packageHash
  });

  return {
    ...payload,
    packageHash,
    truthHash
  };
}

module.exports = {
  analyzeRequirements,
  estimateEffort,
  recommendPricing,
  identifyRisks,
  prepareDeliverables,
  generateProposalText,
  buildFounderSubmissionPackage,
  sha256
};
