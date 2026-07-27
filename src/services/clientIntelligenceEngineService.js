const crypto = require("crypto");
const { getEmpiricalProbability } = require("./dealTrackerService");

function plainText(value = "") {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * 1. Client Intelligence Engine
 * Evaluates Client Trust, Budget Confidence, Payment Risk, Scope Clarity, Technical Match, Communication Complexity, Urgency, and Long-Term Revenue Potential.
 */
function evaluateClientIntelligence(candidate = {}, context = {}) {
  const title = plainText(candidate.title || candidate.rawSource?.title || "").toLowerCase();
  const description = plainText(candidate.description || candidate.rawSource?.description || "").toLowerCase();
  const salaryText = plainText(candidate.salaryText || candidate.rawSource?.salaryText || "").toLowerCase();
  const company = plainText(candidate.company || candidate.rawSource?.company || "");
  const source = plainText(candidate.source || candidate.rawSource?.source || "").toLowerCase();
  const tags = Array.isArray(candidate.tags) ? candidate.tags : [];
  const combinedText = `${title} ${description} ${salaryText} ${company} ${source} ${tags.join(" ")}`;

  // A. Client Trust Score (0-100)
  let clientTrustScore = 70;
  const trustSignals = [];
  if (company && company !== "not disclosed" && company !== "Client") {
    clientTrustScore += 15;
    trustSignals.push("Verified company identity provided");
  }
  if (/payment verified|verified client|5 star|hired|spent \$|top rated/i.test(combinedText)) {
    clientTrustScore += 15;
    trustSignals.push("Platform verified payment history or positive client rating");
  }
  if (/unverified|new account|0 reviews|no payment method/i.test(combinedText)) {
    clientTrustScore -= 25;
    trustSignals.push("Unverified client payment method signal detected");
  }
  clientTrustScore = Math.min(100, Math.max(10, clientTrustScore));

  // B. Budget Confidence (0-100)
  let budgetConfidence = 60;
  if (/\$\d+|\d{2,3}k|\/hr|\/hour/i.test(salaryText) || /\$|\b(budget|rate|salary)\b/i.test(description)) {
    budgetConfidence = 85;
  }
  if (/unrealistic|extremely low|\$5|\$10\b/i.test(salaryText)) {
    budgetConfidence = 30;
  }

  // C. Scope Clarity (0-100)
  let scopeClarity = 65;
  const wordCount = description.split(/\s+/).length;
  if (wordCount > 150) scopeClarity += 15;
  if (wordCount > 400) scopeClarity += 10;
  if (/deliverables|acceptance criteria|requirements|milestones|tasks|specification/i.test(description)) {
    scopeClarity += 10;
  }
  if (wordCount < 40 || /asap|simple job|quick task|do everything/i.test(description)) {
    scopeClarity -= 25;
  }
  scopeClarity = Math.min(100, Math.max(10, scopeClarity));

  // D. Technical Match (0-100)
  let technicalMatch = candidate.score || 85;
  if (candidate.capabilityAssessment?.matches?.[0]?.score) {
    technicalMatch = candidate.capabilityAssessment.matches[0].score;
  }

  // E. Communication Complexity (low, medium, high)
  let communicationComplexity = "low";
  if (wordCount > 500 || /multiple rounds|daily calls|slack required|overlap 8 hours/i.test(description)) {
    communicationComplexity = "medium";
  }
  if (/heavy meetings|constant updates|on-call|micromanage/i.test(description)) {
    communicationComplexity = "high";
  }

  // F. Urgency (low, medium, high, immediate)
  let urgency = "medium";
  if (/asap|immediately|urgent|today|within 24 hours/i.test(combinedText)) {
    urgency = "immediate";
  } else if (/long term|ongoing|monthly|3 months/i.test(combinedText)) {
    urgency = "low";
  }

  // G. Long-Term Revenue Potential (0-100)
  let longTermRevenuePotential = 50;
  if (/long-term|ongoing|full-time|retainer|multi-month|quarterly|future projects/i.test(combinedText)) {
    longTermRevenuePotential = 90;
  } else if (/one-off|single task|bug fix|quick script/i.test(combinedText)) {
    longTermRevenuePotential = 30;
  }

  // H. Payment Risk Rating
  let paymentRiskScore = Math.max(10, 100 - clientTrustScore);

  return {
    clientTrustScore,
    budgetConfidence,
    paymentRiskScore,
    scopeClarity,
    technicalMatch,
    communicationComplexity,
    urgency,
    longTermRevenuePotential,
    trustSignals
  };
}

/**
 * 2. Risk Engine & Risk Level Generator
 */
function evaluateRiskEngine(candidate = {}, clientIntel = {}) {
  const description = plainText(candidate.description || candidate.rawSource?.description || "").toLowerCase();
  const salaryText = plainText(candidate.salaryText || candidate.rawSource?.salaryText || "").toLowerCase();
  const findings = [];

  if (clientIntel.budgetConfidence < 40) {
    findings.push({
      risk: "Unrealistic or Unstated Budget",
      severity: "high",
      mitigation: "Require explicit budget confirmation and milestone deposit prior to initiation."
    });
  }
  if (clientIntel.scopeClarity < 40) {
    findings.push({
      risk: "Vague or Undefined Scope Requirements",
      severity: "medium",
      mitigation: "Include strict deliverable boundary clause and acceptance criteria in proposal."
    });
  }
  if (clientIntel.clientTrustScore < 50) {
    findings.push({
      risk: "Unverified Client Identity / History",
      severity: "high",
      mitigation: "Enforce 50% Milestone 1 upfront deposit before initiating work."
    });
  }
  if (/no deposit|pay after 30 days|net 60/i.test(description)) {
    findings.push({
      risk: "No Upfront Payment Milestones (Deferred Payment)",
      severity: "critical",
      mitigation: "Reject net-60 payment terms; enforce standard GARUDA 50/50 deposit terms."
    });
  }
  if (clientIntel.communicationComplexity === "high") {
    findings.push({
      risk: "Excessive Communication & High Support Burden",
      severity: "medium",
      mitigation: "Enforce asynchronous daily status reports; cap meeting hours in contract."
    });
  }

  // Risk Level Determination
  let riskLevel = "LOW";
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const highCount = findings.filter((f) => f.severity === "high").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;

  if (criticalCount > 0 || highCount >= 2) {
    riskLevel = "CRITICAL";
  } else if (highCount === 1 || mediumCount >= 2) {
    riskLevel = "HIGH";
  } else if (mediumCount === 1) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  const riskScore = Math.min(100, Math.max(10, (criticalCount * 35) + (highCount * 25) + (mediumCount * 15)));

  return {
    riskLevel,
    riskScore,
    findings
  };
}

/**
 * 3. Overall Opportunity Score & Revenue Priority Engine
 */
function calculateOpportunityIntelligence(candidate = {}, context = {}) {
  const clientIntel = evaluateClientIntelligence(candidate, context);
  const riskAnalysis = evaluateRiskEngine(candidate, clientIntel);

  // Overall Opportunity Score (Weighted Balance)
  // Technical Match (25%) + Client Trust (20%) + Scope Clarity (15%) + Budget Confidence (15%) + Long-Term Potential (15%) + (100 - RiskScore) (10%)
  const rawScore = (
    (clientIntel.technicalMatch * 0.25) +
    (clientIntel.clientTrustScore * 0.20) +
    (clientIntel.scopeClarity * 0.15) +
    (clientIntel.budgetConfidence * 0.15) +
    (clientIntel.longTermRevenuePotential * 0.15) +
    ((100 - riskAnalysis.riskScore) * 0.10)
  );

  const opportunityScore = Math.min(100, Math.max(10, Math.round(rawScore)));

  // Expected Revenue Value Calculation
  // Expected Revenue Value = Empirical Win Probability x Payment Probability x Quoted Value x Future Potential Multiplier
  const empirical = getEmpiricalProbability();
  const winProb = empirical.measured ? (empirical.winRate / 100) : (clientIntel.technicalMatch / 100);
  const payProb = empirical.measured ? (empirical.paymentProbability / 100) : (clientIntel.clientTrustScore / 100);

  const quotedPrice = Number(candidate.submissionPackage?.pricingRecommendation?.recommendedPrice || 2500);
  const futureMultiplier = 1.0 + (clientIntel.longTermRevenuePotential / 200); // 1.0 to 1.45

  const expectedRevenueValue = Math.round(winProb * payProb * quotedPrice * futureMultiplier);

  // Recommended Action Determination
  let recommendedAction = "✅ Submit Immediately";
  let actionCode = "SUBMIT_IMMEDIATELY";

  if (riskAnalysis.riskLevel === "CRITICAL" || clientIntel.clientTrustScore < 40) {
    recommendedAction = "❌ Reject";
    actionCode = "REJECT";
  } else if (riskAnalysis.riskLevel === "HIGH" || clientIntel.budgetConfidence < 50) {
    recommendedAction = "⚠️ Negotiate First";
    actionCode = "NEGOTIATE_FIRST";
  } else if (clientIntel.scopeClarity < 50) {
    recommendedAction = "🟡 Ask Questions";
    actionCode = "ASK_QUESTIONS";
  } else {
    recommendedAction = "✅ Submit Immediately";
    actionCode = "SUBMIT_IMMEDIATELY";
  }

  return {
    opportunityScore,
    riskScore: riskAnalysis.riskScore,
    riskLevel: riskAnalysis.riskLevel,
    expectedRevenueValue,
    recommendedAction,
    actionCode,
    clientIntel,
    riskAnalysis
  };
}

module.exports = {
  evaluateClientIntelligence,
  evaluateRiskEngine,
  calculateOpportunityIntelligence
};
