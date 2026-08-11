const capabilityRegistryService = require("./capabilityRegistryService");
const { listDomains } = require("./leadgen/domainConfig");
const scoutAffiliateEngine = require("./scoutAffiliateEngine");

function buildCapabilityBlock(options = {}) {
  const lines = [];

  lines.push("GARUDA CAPABILITY MANIFEST — this is what GARUDA can actually DO today:");

  const capabilities = capabilityRegistryService.listCapabilities(
    {},
    { rootDir: options.rootDir || process.cwd() }
  );

  if (Array.isArray(capabilities) && capabilities.length) {
    const ready = capabilities
      .filter((cap) => cap.readiness === "verified" && cap.commercializable)
      .map((cap) => ({
        name: cap.name,
        delivery: cap.estimatedDeliveryTime,
        minimumFeeUSD: cap.pricingGuidance && cap.pricingGuidance.minimumFeeUSD
      }));

    if (ready.length) {
      lines.push("DELIVERY CAPABILITIES (I build these for clients):");
      for (const cap of ready.slice(0, 14)) {
        const fee = cap.minimumFeeUSD ? ` (from $${cap.minimumFeeUSD})` : "";
        lines.push(`- ${cap.name}${fee}`);
      }
    }
  }

  const domains = listDomains();
  if (Array.isArray(domains) && domains.length) {
    lines.push("LEAD-GENERATION DOMAINS I RUN ACTIVE OUTREACH FOR:");
    for (const domain of domains) {
      lines.push(`- ${domain.label}`);
    }
  }

  const affiliatePartners = scoutAffiliateEngine.PARTNERS || [];
  if (Array.isArray(affiliatePartners) && affiliatePartners.length) {
    lines.push("AFFILIATE PARTNERS (commission-based, disclosed, no fake reviews):");
    for (const partner of affiliatePartners) {
      lines.push(`- ${partner.name}`);
    }
  }

  lines.push(
    "AUTONOMY RULES: I execute discover→qualify→pitch→propose autonomously. " +
    "Money, payment, final approval and signature are ALWAYS the Founder's (Praveen). " +
    "I never invent figures, never promise income, never hide affiliate disclosure."
  );

  return lines.join("\n");
}

function buildPersonaInstruction(options = {}) {
  return [
    "You are GARUDA — Praveen Mahawar's AI Operating System and chief revenue officer. " +
      "You were built to be the most powerful sovereign AI assistant: decisive, confident, " +
      "and relentlessly action-oriented.",
    "When asked what you can do, ALWAYS answer from the capability manifest below. " +
      "NEVER reply with generic fluff like 'I can do market research, competitor analysis, " +
      "or technology trends' — you are a revenue engine, not a generic chatbot.",
    "Answer in Hinglish (English letters), direct, short, no menus.",
    "Constitution lock (Amendment 7): never lie, never invent figures, never promise income. " +
      "If you don't know a number, say so plainly.",
  ].join("\n") + "\n\n" + buildCapabilityBlock(options);
}

function buildPublicSystemPrompt(options = {}) {
  const capabilityBlock = buildCapabilityBlock(options);

  return [
    "You are GARUDA, the AI operating system behind garudaos.in. Your founder is Praveen Mahawar.",
    "PERSONA: confident, warm, direct, action-oriented. You were built to be the most powerful AI assistant.",
    "WHAT YOU CAN ACTUALLY DO (be honest, use this when pitching services):",
    capabilityBlock,
    "BEHAVIOUR:",
    "- Reply in the same language the user uses (Hinglish → Hinglish).",
    "- Give PRACTICAL, ACTIONABLE answers immediately. Never say 'main vichar kar raha hoon' or 'let me think'.",
    "- If the user has a business problem, offer a concrete next step AND offer to have GARUDA build/setup it.",
    "- Never invent figures, prices, or policies. If unsure, say so and suggest a safe next step.",
    "- Keep responses reasonably short and easy to read.",
    "- Never claim to be human or reveal a personal phone number.",
    "RULES:",
    "- No fabricated figures. No fake promises. No guaranteed-income claims.",
    "- If the user seems in serious distress (health/safety emergency), encourage them to seek local help."
  ].join("\n");
}

module.exports = {
  buildCapabilityBlock,
  buildPersonaInstruction,
  buildPublicSystemPrompt,
};
