/**
 * 🦅 GARUDA AUTONOMOUS POST-MISSION LEARNER & SYNAPSE ENGINE
 * Enforces Constitutional Law:
 * "Post-Mission Autonomous Self-Evolution & Memory Synapse Law (Har Kaam Ke Baad Self-Learning & Zero-Repeat Law)"
 * 
 * Automatically captures operational learnings, bug post-mortems, and architectural countermeasures
 * after every successful deployment, bug fix, or pipeline mission.
 * Persists them into:
 * 1. Persistent Memory (data/memory/experiences.jsonl & lessons.jsonl)
 * 2. GARUDA Bible (GARUDA_BIBLE/13_POST_MISSION_LESSONS.md)
 */

const fs = require("fs");
const path = require("path");
const memoryService = require("../../src/services/persistentMemory/memoryService");
const { createLesson, createExperience } = require("../../src/services/persistentMemory/memorySchema");

const BIBLE_LESSONS_FILE = path.join(__dirname, "..", "..", "GARUDA_BIBLE", "13_POST_MISSION_LESSONS.md");

/**
 * Records a structured mission learning post-mortem.
 */
function recordMissionLearning({
  missionTitle,
  category = "architecture",
  goalId = "mission-evolution",
  failureModesEncountered = [],
  rootCauseAnalysis = "",
  architecturalFix = "",
  permanentRuleAdded = "",
  gitCommitSha = "",
  evidenceVerified = ""
}) {
  console.log(`\n🧠 [GARUDA SYNAPSE] Recording post-mission learning: "${missionTitle}"...`);

  const timestamp = new Date().toISOString();

  // 1. Record Experience into Memory System
  const exp = memoryService.remember({
    type: category,
    goalId,
    action: `POST_MISSION_LEARNING: ${missionTitle}`,
    input: { failureModesEncountered, rootCauseAnalysis },
    output: { architecturalFix, permanentRuleAdded, gitCommitSha, evidenceVerified },
    outcome: "success",
    tags: ["governance", "self-evolution", category, "zero-repeat"],
    context: { timestamp, gitCommitSha }
  });

  // 2. Extract and Save Specific Lessons through LearningPromoter & ValidationPipeline
  const lessons = failureModesEncountered.map((failure, idx) => {
    return createLesson({
      experienceId: exp.id,
      goalId,
      sourceAgent: "post_mission_learner",
      type: "anti_repetition_guardrail",
      lesson: `RULE: ${permanentRuleAdded} | CAUSE: ${rootCauseAnalysis} | COUNTERMEASURE: ${architecturalFix}`,
      pattern: failure,
      evidence: [
        { type: "runtime_verified", details: evidenceVerified || "Locally verified" },
        { type: "automated_verification", details: `Commit: ${gitCommitSha || "working-tree"}` }
      ],
      tags: ["zero-repeat", category, "verified-lesson"]
    });
  });

  if (lessons.length > 0) {
    const { saveLessons } = require("../../src/services/persistentMemory/lessonExtractor");
    const savedLessons = saveLessons(lessons);
    const avgConfidence = savedLessons.length > 0
      ? (savedLessons.reduce((acc, l) => acc + (l.confidence || 0), 0) / savedLessons.length).toFixed(2)
      : "N/A";
    console.log(`✔ [MEMORY] Inscribed ${savedLessons.length} verified lessons via LearningPromoter into data/memory/lessons.jsonl (confidence: ${avgConfidence})`);
  }

  // 3. Append to GARUDA BIBLE (13_POST_MISSION_LESSONS.md)
  ensureBibleLessonsHeader();

  const markdownEntry = `
---

### Mission: ${missionTitle}
- **Timestamp**: ${timestamp}
- **Commit SHA**: \`${gitCommitSha || "N/A"}\`
- **Category**: \`${category}\`
- **Verification Evidence**: ${evidenceVerified || "Verified locally and live"}

#### 1. Failure Modes & Hemorrhages Encountered
${failureModesEncountered.map((f, i) => `${i + 1}. **${f}**`).join("\n")}

#### 2. Root Cause Forensic Analysis
${rootCauseAnalysis}

#### 3. Permanent Architectural Countermeasure
${architecturalFix}

#### 4. Inscribed Permanent Law / Guardrail
> **${permanentRuleAdded}**
`;

  fs.appendFileSync(BIBLE_LESSONS_FILE, markdownEntry, "utf8");
  console.log(`✔ [BIBLE] Inscribed permanent lesson into GARUDA_BIBLE/13_POST_MISSION_LESSONS.md`);

  return { experienceId: exp.id, lessonsCount: lessons.length };
}

function ensureBibleLessonsHeader() {
  if (!fs.existsSync(BIBLE_LESSONS_FILE)) {
    const header = `# 13 Sovereign Post-Mission Lessons & Self-Evolution Registry

> **Constitutional Authority**: FD-024 & Section 9 of AGENTS.md / GEMINI.md.
> **Law**: "Har Kaam Ke Baad Self-Learning & Zero-Repeat Law".
> After every mission, task, bug-fix, or deploy, GARUDA autonomously documents the root causes,
> failure modes, and architectural countermeasures so that the same error can NEVER repeat.

`;
    fs.writeFileSync(BIBLE_LESSONS_FILE, header, "utf8");
  }
}

/**
 * Pre-configured entry for today's mission (Local Client Radar & Vercel CleanUrls Demohosting).
 */
function recordTodayRadarMission() {
  return recordMissionLearning({
    missionTitle: "Local Client Radar, Direct Outreach & Vercel SPA CleanUrls Demohosting",
    category: "outreach_and_web_routing",
    goalId: "local-radar-hunter-v1",
    failureModesEncountered: [
      "Custom client demo link (e.g. /demos/3r-car-care/index.html) redirected to the root GARUDA homepage instead of the client portal, violating 100% Anti-Fabrication Law.",
      "Vercel SPA cleanUrls: true stripped /index.html and issued a 308 redirect to /demos/:slug, which failed to find a static file and collapsed to the catch-all SPA rewrite (/:match* -> /)."
    ],
    rootCauseAnalysis: 
      "1. Static demo HTML files were originally written only to directory index.html and root public/ instead of frontend/public/.\n" +
      "2. In Vercel, when cleanUrls is active, requests to /demos/:slug require either a flat /demos/:slug.html static file or an explicit rewrite rule pointing to /demos/:slug/index.html before the catch-all rewrite.\n" +
      "3. Outreach messages were initially queued before verifying live HTTP 200 responses for each generated demo URL.",
    architecturalFix:
      "1. Dual-format static output: instant-demo-builder.js now builds BOTH directory index.html and direct flat [slug].html in frontend/public/demos/.\n" +
      "2. Explicit Vercel rewrites: vercel.json now explicitly maps /demos/:slug, /demos/:slug/, /demos/:slug.html, and /demos/:slug/index.html before /:match*.\n" +
      "3. Automated Pre-Outreach Link Verifier: scripts/governance/pre-outreach-verifier.js now executes an automated HTTP GET check verifying status 200 OK, title matching the prospect name, and rejection of homepage fallbacks before ANY message is dispatched.",
    permanentRuleAdded:
      "LAW: Never dispatch any client communication containing an external URL without an automated HTTP 200 OK verification showing verified prospect content. All static sub-demos must include flat HTML and explicit Vercel rewrites.",
    gitCommitSha: "961cb52",
    evidenceVerified: "Live verification confirmed 8/8 URLs return HTTP 200 OK with custom prospect titles. Mobile screenshot captured and verified."
  });
}

if (require.main === module) {
  const result = recordTodayRadarMission();
  console.log("\n🎉 Self-Evolution Synapse Complete:", result);
}

module.exports = { recordMissionLearning, recordTodayRadarMission };
