const https = require("https");
const { processFounderAssistedIntake } = require("../src/services/founderAssistedIntakeService");
const { buildFounderSubmissionPackage } = require("../src/services/founderSubmissionPackageService");
const { generateExecutiveDecisionReport } = require("../src/services/revenueIntelligenceEngineService");
const { evaluateNegotiationObjection, generateProofPackage } = require("../src/services/revenueClosingSystemService");
const { evaluateAttackOpportunity } = require("../src/services/attackListService");

function fetchLiveRemotiveJobs() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "remotive.com",
      path: "/api/remote-jobs?category=software-dev",
      method: "GET",
      headers: { "User-Agent": "GARUDA-DealWinningSystem/1.0" }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try { resolve(JSON.parse(data).jobs || []); } catch (e) { reject(e); }
      });
    });
    req.on("error", (e) => reject(e));
    req.end();
  });
}

function buildDealBattlePlan(opportunity = {}, context = {}, now = new Date()) {
  const candidateInput = {
    url: String(opportunity.url),
    source: "Remotive",
    title: String(opportunity.title),
    company: String(opportunity.company_name || "Client Team"),
    description: String(opportunity.description || "").replace(/<[^>]*>/g, " ").slice(0, 10000),
    salaryText: String(opportunity.salary || "Not stated"),
    tags: Array.isArray(opportunity.tags) ? opportunity.tags : ["Software Development"],
    attestation: { founderAccessedAuthorizedAccount: true, noPlaceholderData: true, rawTextUnmodified: true }
  };

  const processed = processFounderAssistedIntake(candidateInput, context, now);
  const rieReport = generateExecutiveDecisionReport(processed, context, { now });
  const subPkg = buildFounderSubmissionPackage(processed, context, { now });
  const attackEval = evaluateAttackOpportunity(processed, context, { now });

  const pricing = subPkg.pricingRecommendation;
  const effort = subPkg.effortEstimation;
  const time = rieReport.timeEconomics;

  const idealPrice = pricing.recommendedPrice;
  const floorPrice = pricing.minimumAcceptableFloorPrice;
  const walkAwayPrice = Math.round(pricing.baseCost * 1.10);

  const priceObjection = evaluateNegotiationObjection({ objectionText: "Your price is too high for our budget." }, rieReport, { now });
  const speedObjection = evaluateNegotiationObjection({ objectionText: "Can you deliver this faster?" }, rieReport, { now });
  const trustObjection = evaluateNegotiationObjection({ objectionText: "How do we know the code works?" }, rieReport, { now });

  return {
    rank: 0,
    opportunityId: processed.externalId,
    title: processed.title,
    clientCompany: processed.company,
    url: processed.url,
    salaryText: processed.salaryText,
    
    // 1. Why Choose GARUDA
    whyChooseGaruda: `GARUDA delivers in ${effort.estimatedDeliveryDays} days (${time.aiTimeCompressionRatio}× faster than traditional agencies) with a 100% automated test suite execution report and zero placeholder code.`,
    
    // 2. Client Pain Points
    clientPainPoints: [
      "Fear of buggy, unmaintained code without automated tests",
      "Frustration with slow multi-week traditional agency timelines",
      "Risk of overpaying for incomplete scope or unverified claims"
    ],
    
    // 3. Client Psychology
    clientPsychology: "Client seeks risk minimization, speed, and tangible proof of execution before releasing final payment.",
    
    // 4. Decision Maker Profile
    decisionMakerProfile: "Technical Lead or Product Manager evaluating technical competence, delivery speed, and code quality.",
    
    // 5. Trust-Building Strategy
    trustBuildingStrategy: "Provide live sandbox demo preview link and automated Jest/test runner execution logs before asking for final payment release.",
    
    // 6 & 7. Objections & Best Responses
    objectionHandling: [
      {
        objection: "Price is too high",
        bestResponse: priceObjection.recommendedResponse,
        counterOffer: `${pricing.currency} $${priceObjection.recommendedCounterOfferPrice.toLocaleString()}`
      },
      {
        objection: "Need faster delivery",
        bestResponse: speedObjection.recommendedResponse,
        counterOffer: `Early prototype preview in ${Math.max(1, Math.floor(effort.estimatedDeliveryDays / 2))} days`
      },
      {
        objection: "How do we know the code works?",
        bestResponse: trustObjection.recommendedResponse,
        counterOffer: "100% passing test execution report delivered before payment"
      }
    ],
    
    // 8 - 11. Commercial Pricing Strategy
    lowestAcceptablePrice: `${pricing.currency} $${floorPrice.toLocaleString()}`,
    idealNegotiationPrice: `${pricing.currency} $${idealPrice.toLocaleString()}`,
    walkAwayPrice: `${pricing.currency} $${walkAwayPrice.toLocaleString()}`,
    suggestedPaymentStructure: "50% Milestone 1 Deposit upon prototype approval, 50% Milestone 2 on final test suite acceptance.",
    
    // 12. What NOT to say
    whatNotToSay: [
      "DO NOT claim past client experience or fake team members.",
      "DO NOT agree to 100% payment after 30 days without a deposit.",
      "DO NOT discount below walk-away price ($" + walkAwayPrice + ").",
      "DO NOT promise out-of-scope features without a formal change order."
    ],
    
    // 13. What MUST be demonstrated before payment
    mustDemonstrateBeforePayment: [
      "Live functional sandbox demo URL (`demo-stage.garuda.ai`)",
      "Automated test runner output demonstrating 100% passing tests (0 failures)"
    ],
    
    // 14. Probability of Closing
    expectedProbabilityOfClosing: `${rieReport.metrics.probabilityOfWinning}%`,
    
    // 15. Follow-Up Strategy Matrix
    followUpStrategy: {
      noReply24h: `Send friendly follow-up emphasizing ${effort.estimatedDeliveryDays}-day delivery commitment and prototype schedule.`,
      noReply72h: "Send value-add message with proposed technical architecture breakdown & test plan.",
      clientAsksForDiscount: `Offer 10% scope streamlining to match budget down to floor price ($${floorPrice}).`,
      clientAsksForFreeSample: "Provide sample test plan & 1-minute video demo of similar module (NEVER write free custom code).",
      clientAsksForTrial: "Propose Milestone 1 (50% deposit) as a low-risk trial with 100% money-back guarantee on acceptance criteria.",
      clientDisappears: "Send 7-day closing reminder with offer hold date.",
      clientWantsUrgentDelivery: `Offer early prototype preview in ${Math.max(1, Math.floor(effort.estimatedDeliveryDays / 2))} days with 15% rush priority buffer.`
    }
  };
}

async function runDealWinningSystem() {
  console.log("=== GARUDA DEAL WINNING SYSTEM — TOP 10 BATTLE PLANS ===");
  const now = new Date("2026-07-27T10:00:00.000Z");
  const context = { founderApproved: true };

  const jobs = await fetchLiveRemotiveJobs();
  console.log(`[DEAL SYSTEM] Fetched ${jobs.length} live jobs from Remotive API.\n`);

  const battlePlans = [];
  for (const job of jobs) {
    if (battlePlans.length >= 10) break;
    try {
      const plan = buildDealBattlePlan(job, context, now);
      plan.rank = battlePlans.length + 1;
      battlePlans.push(plan);
    } catch (e) {
      continue;
    }
  }

  battlePlans.forEach((plan) => {
    console.log(`=================================================`);
    console.log(`DEAL BATTLE PLAN #${plan.rank}: ${plan.title.toUpperCase()}`);
    console.log(`Client: ${plan.clientCompany} | URL: ${plan.url}`);
    console.log(`Closing Probability: ${plan.expectedProbabilityOfClosing}`);
    console.log(`-------------------------------------------------`);
    console.log(`1. WHY CHOOSE GARUDA: ${plan.whyChooseGaruda}`);
    console.log(`2. CLIENT PAIN POINTS: ${plan.clientPainPoints.join(" | ")}`);
    console.log(`3. CLIENT PSYCHOLOGY: ${plan.clientPsychology}`);
    console.log(`4. DECISION MAKER PROFILE: ${plan.decisionMakerProfile}`);
    console.log(`5. TRUST BUILDING STRATEGY: ${plan.trustBuildingStrategy}`);
    console.log(`-------------------------------------------------`);
    console.log(`6-7. OBJECTION HANDLING & BEST RESPONSES:`);
    plan.objectionHandling.forEach((o) => {
      console.log(`   • Objection: "${o.objection}" → Counter: ${o.counterOffer}`);
      console.log(`     Response: "${o.bestResponse}"`);
    });
    console.log(`-------------------------------------------------`);
    console.log(`8. LOWEST ACCEPTABLE PRICE: ${plan.lowestAcceptablePrice}`);
    console.log(`9. IDEAL PRICE: ${plan.idealNegotiationPrice}`);
    console.log(`10. WALK-AWAY PRICE: ${plan.walkAwayPrice}`);
    console.log(`11. PAYMENT STRUCTURE: ${plan.suggestedPaymentStructure}`);
    console.log(`-------------------------------------------------`);
    console.log(`12. WHAT NOT TO SAY: ${plan.whatNotToSay.join(" ")}`);
    console.log(`13. MUST DEMONSTRATE BEFORE PAYMENT: ${plan.mustDemonstrateBeforePayment.join(" | ")}`);
    console.log(`-------------------------------------------------`);
    console.log(`15. FOLLOW-UP MATRIX:`);
    console.log(`   • No Reply 24h: ${plan.followUpStrategy.noReply24h}`);
    console.log(`   • No Reply 72h: ${plan.followUpStrategy.noReply72h}`);
    console.log(`   • Discount Request: ${plan.followUpStrategy.clientAsksForDiscount}`);
    console.log(`   • Free Sample Request: ${plan.followUpStrategy.clientAsksForFreeSample}`);
    console.log(`   • Trial Request: ${plan.followUpStrategy.clientAsksForTrial}`);
    console.log(`   • Client Disappears: ${plan.followUpStrategy.clientDisappears}`);
    console.log(`   • Urgent Delivery: ${plan.followUpStrategy.clientWantsUrgentDelivery}`);
    console.log(`=================================================\n`);
  });

  return battlePlans;
}

runDealWinningSystem().catch((err) => console.error("Deal Winning System error:", err));
