const registry = require("./serviceRegistry");

function orchestrate(input) {
  const { action, target, params = {} } = input;
  const result = { action, target, steps: [], output: null, error: null };

  try {
    switch (action) {
      case "review":
        return orchestrateReview(target, params, result);
      case "plan":
        return orchestratePlan(target, params, result);
      case "fix":
        return orchestrateFix(target, params, result);
      case "generate":
        return orchestrateGenerate(target, params, result);
      case "test":
        return orchestrateTest(target, params, result);
      case "analyze":
        return orchestrateAnalyze(target, params, result);
      case "learn":
        return orchestrateLearn(target, params, result);
      case "status":
        return orchestrateStatus(result);
      default:
        result.error = `Unknown action: ${action}`;
        return result;
    }
  } catch (err) {
    result.error = err.message;
    return result;
  }
}

function orchestrateReview(target, params, result) {
  const independence = registry.getService("independence");
  if (independence) {
    independence.init();
    const fs = require("fs");
    if (fs.existsSync(target)) {
      const code = fs.readFileSync(target, "utf8");
      const review = independence.reviewCode(code, target);
      result.output = review;
      result.steps.push({ step: "review", status: "done" });

      const memory = registry.getService("memory");
      if (memory) {
        memory.remember({ type: "review", action: `Reviewed ${target}`, outcome: review.verdict === "APPROVE" ? "success" : "warning", tags: ["review", review.verdict.toLowerCase()] });
        result.steps.push({ step: "remember", status: "done" });
      }
    } else {
      result.error = `File not found: ${target}`;
    }
  } else {
    result.error = "Independence service not available";
  }
  return result;
}

function orchestratePlan(target, params, result) {
  const independence = registry.getService("independence");
  if (independence) {
    independence.init();
    const planner = require("../independence/ruleBasedPlanner");
    const goal = { id: `orch-${Date.now()}`, type: params.type || "custom", title: target };
    const plan = planner.planGoal(goal);
    result.output = plan;
    result.steps.push({ step: "plan", status: "done" });
  }
  return result;
}

function orchestrateFix(target, params, result) {
  const review = orchestrateReview(target, params, { action: "review", target, steps: [], output: null, error: null });
  result.steps.push(...review.steps);
  result.output = { review: review.output, message: "Review complete. Manual fix required." };
  result.steps.push({ step: "fix", status: "manual", message: "Apply fix based on review findings" });
  return result;
}

function orchestrateGenerate(target, params, result) {
  const codeGen = registry.getService("codeGen");
  if (codeGen) {
    const code = codeGen.generate(target, params);
    result.output = code;
    result.steps.push({ step: "generate", status: "done" });

    if (params.savePath) {
      const saveResult = codeGen.generateAndSave(target, params.savePath, params);
      result.output = saveResult;
      result.steps.push({ step: "save", status: saveResult.success ? "done" : "failed" });
    }
  }
  return result;
}

function orchestrateTest(target, params, result) {
  const testDiscovery = registry.getService("testDiscovery");
  if (testDiscovery) {
    try {
      const discovered = testDiscovery.discoverTests();
      result.output = { testFiles: discovered.testFiles.length, tests: discovered.testFiles.slice(0, 10) };
      result.steps.push({ step: "discover", status: "done" });
    } catch (err) {
      result.error = err.message;
    }
  }
  return result;
}

function orchestrateAnalyze(target, params, result) {
  const repoIntel = registry.getService("repoIntel");
  if (repoIntel) {
    try {
      const graph = repoIntel.buildFullGraph();
      result.output = {
        files: graph.fileGraph.totalFiles,
        routes: graph.routeMapper.totalRoutes,
        tests: graph.testMapper.totalTests
      };
      result.steps.push({ step: "analyze", status: "done" });
    } catch (err) {
      result.error = err.message;
    }
  }
  return result;
}

function orchestrateLearn(target, params, result) {
  const memory = registry.getService("memory");
  if (memory) {
    const lessons = memory.learnFromGoal(target);
    result.output = { lessons: lessons.length, lessonsList: lessons };
    result.steps.push({ step: "learn", status: "done" });
  }
  return result;
}

function orchestrateStatus(result) {
  const selfAwareness = registry.getService("selfAwareness");
  if (selfAwareness) {
    result.output = selfAwareness.getStatus();
    result.steps.push({ step: "status", status: "done" });
  }
  return result;
}

module.exports = { orchestrate };
