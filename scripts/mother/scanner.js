const { execSync } = require("child_process");

function scan(options = {}) {
  console.log("[Scanner] Starting forensic scan...");

  const result = {
    clean: true,
    changes: [],
    summary: {
      modified: 0,
      untracked: 0,
      deleted: 0,
      renamed: 0
    },
    engine: "NazarEngine",
    nazar: null
  };

  // 1. PRIMARY FORENSIC LAYER: NazarEngine 11-Lens Adaptive Investigation
  try {
    const { getGarudaIntelligence } = require("../../src/services/garudaIntelligence");
    const gi = getGarudaIntelligence();
    const missionDesc = (typeof options === "string" ? options : (options && (options.mission || options.goal))) || "Mother continuous workspace forensic scan";
    const context = {
      isProduction: true,
      workspaceRoot: (options && options.rootDir) || process.cwd(),
      ...(typeof options === "object" ? options : {})
    };

    const investigation = gi.investigate(missionDesc, context);
    if (investigation && investigation.findings) {
      result.nazar = {
        investigationId: investigation.id,
        verdict: investigation.verdict || "PROCEED",
        riskClassification: investigation.riskClassification || { level: "LOW" },
        lensesUsed: investigation.selectedLenses ? investigation.selectedLenses.length : investigation.findings.length,
        totalIssues: investigation.totalIssues || 0,
        criticalIssues: investigation.criticalIssues || 0,
        findingsCount: investigation.findings.length,
        findings: investigation.findings.map((f) => ({
          lensId: f.lensId,
          lensName: f.lensName,
          riskLevel: f.riskLevel,
          confidence: f.evidenceConfidence || 0.7,
          status: f.evidence && f.evidence[0] ? (f.evidence[0].status || "VERIFIED") : "VERIFIED",
          provenance: "nazar_investigator",
          evidence: f.evidence || [],
          issues: f.issues || []
        }))
      };
      console.log(`[Scanner/Nazar] Lenses executed: ${result.nazar.lensesUsed} | Findings: ${result.nazar.findingsCount} | Verdict: ${result.nazar.verdict}`);
    }
  } catch (nazarErr) {
    console.warn("[Scanner] NazarEngine primary scan degraded, engaging legacy fallback:", nazarErr.message);
    result.engine = "git_status_fallback";
  }

  // 2. WORKING TREE DELTA SCAN (Git status delta for backward compatibility)
  try {
    const output = execSync("git status --short", {
      encoding: "utf8"
    }).trim();

    if (!output) {
      console.log("Working tree clean");
      result.clean = true;
      return result;
    }

    result.clean = false;
    result.changes = output.split("\n");

    result.changes.forEach((line) => {
      console.log(line);

      const status = line.substring(0, 2).trim();

      if (status.includes("M")) result.summary.modified++;
      if (status.includes("??")) result.summary.untracked++;
      if (status.includes("D")) result.summary.deleted++;
      if (status.includes("R")) result.summary.renamed++;
    });

    console.log("\n[Scanner Summary]");
    console.log("Modified :", result.summary.modified);
    console.log("Untracked:", result.summary.untracked);
    console.log("Deleted  :", result.summary.deleted);
    console.log("Renamed  :", result.summary.renamed);
    if (result.nazar) {
      console.log("Nazar Verdict:", result.nazar.verdict);
      console.log("Nazar Lenses :", result.nazar.lensesUsed);
    }
  } catch (err) {
    result.clean = false;
    result.error = err.message;
    console.log("[Scanner] Failed git status check:", err.message);
  }

  return result;
}

module.exports = { scan };