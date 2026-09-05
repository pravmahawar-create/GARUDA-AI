/**
 * 🦅 GARUDA CORE PRINCIPLES — Machine-readable product constitution
 * Founder-approved, runtime-enforceable. Consumers must import and enforce.
 * Categories: simplicity, natural_language, quality, brand_consistency,
 * provider_independence, sovereignty, os_coherence, governance, intelligence_invisible,
 * one_request_workflow, creative_universe, cinematic_quality, resilience, memory, product_language
 */

const GARUDA_CORE_PRINCIPLES = Object.freeze({
  version: "1.0.0",
  supreme: "GARUDA MUST MAKE COMPLEXITY SIMPLE — Being complex is not GARUDA. Making complexity easy and simple is GARUDA.",
  principles: {
    simplicity: {
      id: "simplicity",
      statement: "Hide APIs, models, providers, workflows, file formats, pipelines, engineering terminology unless user asks advanced control.",
      enforcement: { hideTechnicalParamsDefault: true, simpleInputPowerfulOutput: true },
      consumer: "CreativeStudioService.createCreativeBrief, Mother understandGoal, EngineeringPipeline",
    },
    natural_language: {
      id: "natural_language",
      statement: "Human language is primary interface: 'Ek cinematic video bana do' → internal story/script/provider/quality without exposing complexity.",
      pipeline: ["USER INTENT", "UNDERSTANDING", "PLANNING", "INTERNAL ORCHESTRATION", "QUALITY CONTROL", "FINAL OUTPUT"],
      consumer: "Mother goalEngine, garudaCommandRouter",
    },
    quality: {
      id: "quality",
      philosophy: "BEYOND_EXPECTATION_QUALITY",
      statement: "When ordinary systems stop at merely acceptable results, GARUDA should strive to exceed expectations through intelligence, depth, polish, craftsmanship, proactive thinking, continuity and attention to detail. Colloquial '19 nahi, 22' is founder philosophy for ambition, NEVER a numeric score.",
      ambition: "BEYOND_EXPECTATION_QUALITY — aim beyond basic expectation when user intent requires exceptional work",
      technicalVerification: "Objective: file exists, MIME, dimensions, SHA-256, persistence, integrity — deterministic binary checks",
      requirementCompliance: "Verify: requested format, required dimensions, content constraints, identity metadata, CTA presence",
      visualQuality: "Only VERIFIED if actual visual/semantic assessment exists. Otherwise VISUAL_QUALITY_NOT_YET_VERIFIED — never fake numeric aesthetic score 98/22.",
      // Requirement compliance floors (not aesthetic scores) — for format/dimension/CTA completeness, not visual beauty
      requirementFloors: Object.freeze({ preview: "basic_completeness", standard: "full_completeness", premium: "polished_completeness", brand_critical: "exceptional_completeness", cinematic: "exceptional_completeness" }),
      defaultRequirement: "full_completeness",
      distinguishPreviewVsDelivery: true,
      fallbackStrategy: ["retry", "improve_prompt", "switch_provider", "alternative_pipeline", "ask_approval"],
      consumer: "creativeQualityService.validateAsset, imageGenerationRouter, videoGenerationRouter, audioGenerationRouter",
    },
    brand_consistency: {
      id: "brand_consistency",
      statement: "Brand never compromises. Identity Lock for face/voice/logo/style must persist across scenes and provider switches.",
      lockedDimensions: ["face_consistency","character_appearance","costume_identity","voice_identity","speaking_style","personality","logo_usage","visual_language","cinematic_style","color_language","brand_tone"],
      flow: ["PROJECT","BRAND_PROFILE","IDENTITY_ASSETS","STYLE_PROFILE","VOICE_PROFILE","SCENE_GENERATION","CONSISTENCY_VALIDATION"],
      consumer: "identityLockService, imageGenerationRouter, videoGenerationRouter, audioGenerationRouter, creativeStudioService",
    },
    provider_independence: {
      id: "provider_independence",
      statement: "Provider is a tool, quality is standard, Garuda is product. User sees GARUDA not Gemini/Runway.",
      selectionOptimizes: ["output_quality","brand_consistency","task_suitability","reliability","cost_efficiency","sovereignty_preference"],
      costNeverOverridesQualityFloor: true,
      consumer: "imageGenerationRouter, videoGenerationRouter, audioGenerationRouter, smartModelRouter",
    },
    sovereignty: {
      id: "sovereignty",
      statement: "Free First, Sovereign Always. External → Adapter → Garuda Capability Interface → Quality/Governance → Output. Replaceable.",
      freeFirst: true,
      replaceableAdapter: true,
      consumer: "All provider routers via adapter pattern",
    },
    os_coherence: {
      id: "os_coherence",
      statement: "Garuda is OS not toolbox. One intelligence coordinates Creative Understanding → Story → Script → Storyboard → Visual → Voice → Music → Assembly → Review.",
      consumer: "CreativeStudioService orchestration",
    },
    governance: {
      id: "governance",
      statement: "Autonomy governed. Creative autonomous; destructive/financial/deployment/permanent engineering requires founder approval, worktree, review, evidence, no auto commit/push.",
      consumer: "EngineeringPipeline, DevelopmentApprovalGate, missionControlService, executor.js",
    },
    intelligence_invisible: {
      id: "intelligence_invisible",
      statement: "More internal intelligence → less user complexity. Expose Create/Build/Generate not 'Select routing strategy'.",
      consumer: "All user-facing routes",
    },
    one_request_workflow: {
      id: "one_request_workflow",
      statement: "One human intention → multi-step execution → quality validation → finished result. Truthful completion only.",
      consumer: "CreativeStudioService.generateCampaignFamily, EngineeringPipeline",
    },
    creative_universe: {
      id: "creative_universe",
      statement: "Unified Creative Director → Specialist engines (Image/Video/Voice/Music/PPT/PDF) → Quality + Brand Consistency → Final Asset",
      consumer: "CreativeStudioService",
    },
    cinematic_quality: {
      id: "cinematic_quality",
      statement: "Cinematic/brand-critical/premium delivery requires highest consistency, high-res, continuity, quality review. 'Ek video bana' ≠ 'flagship cinematic brand film'. This is BEYOND_EXPECTATION ambition, not numeric score 98.",
      ambition: "BEYOND_EXPECTATION_QUALITY — premium cinematic requires exceptional completeness and continuity, not fake 98",
      consumer: "creativeQualityService, imageGenerationRouter, videoGenerationRouter",
    },
    resilience: {
      id: "resilience",
      statement: "Provider failure → internal retry → alternative provider/model/strategy → partial recovery before surfacing failure.",
      consumer: "imageGenerationRouter, videoGenerationRouter, audioGenerationRouter, EngineeringPipeline retry",
    },
    memory: {
      id: "memory",
      statement: "Learn from provider failures, successes, brand preferences, quality outcomes. Next similar task better with less effort.",
      consumer: "persistentMemory, outcomeLearningService, smartModelRouter learningContext",
    },
    product_language: {
      id: "product_language",
      statement: "Speak human: 'Bhai, cinematic version ready kar raha hoon.' not 'Initiating multimodal orchestration.' Adapt to user language.",
      consumer: "garudaCommandRouter, llmProvider, CreativeStudioService responses",
    },
    outreach_visual_identity: {
      id: "outreach_visual_identity",
      statement: "All outreach emails & proposals must be visual-first, responsive, dynamically tailored to prospect's industry/brand ('Rang, Roop & Mood'), zero cross-brand pollution (no Niravi leakage), and zero fake phone numbers or fake emails. Strictly verified Founder channels.",
      consumer: "premiumVisualEmailService, garudaOutreachDispatchService, emailRelayService",
    },
  },
  finalTest10: [
    "Does this make UX simpler?",
    "Does Garuda hide unnecessary complexity?",
    "Does it preserve quality?",
    "Does it preserve brand consistency?",
    "Can underlying provider be replaced?",
    "Does it support long-term sovereignty?",
    "Does Garuda perform work instead of only explaining?",
    "Does it avoid fake completion?",
    "Does it preserve governance?",
    "Would non-technical person use naturally?"
  ],
});

function getQualityFloor(profile = "standard") {
  // Returns requirement compliance level (not aesthetic score) — BEYOND_EXPECTATION philosophy
  const key = String(profile || "standard").toLowerCase();
  const floors = GARUDA_CORE_PRINCIPLES.principles.quality.requirementFloors;
  if (floors[key] !== undefined) return floors[key];
  if (key.includes("cinematic") || key.includes("brand_critical") || key.includes("flagship")) return floors.cinematic;
  if (key.includes("premium")) return floors.premium;
  if (key.includes("preview") || key.includes("draft")) return floors.preview;
  return floors.standard;
}
// Deprecated numeric alias kept for backward test compatibility — do not use for visual scoring
function getQualityFloorNumeric(profile = "standard") {
  const map = { preview: 65, draft: 70, standard: 85, premium: 95, brand_critical: 98, cinematic: 98 };
  const key = String(profile || "standard").toLowerCase();
  if (map[key] !== undefined) return map[key];
  if (key.includes("cinematic") || key.includes("brand_critical") || key.includes("flagship")) return map.cinematic;
  if (key.includes("premium")) return map.premium;
  if (key.includes("preview") || key.includes("draft")) return map.preview;
  return map.standard;
}

function isProviderLocked() { return false; } // true would violate provider_independence
function requiresBrandConsistency(projectId, brandId) {
  return Boolean(projectId && brandId);
}

module.exports = { GARUDA_CORE_PRINCIPLES, getQualityFloor, getQualityFloorNumeric, isProviderLocked, requiresBrandConsistency };
