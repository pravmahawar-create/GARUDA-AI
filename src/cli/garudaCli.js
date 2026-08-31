const readline = require("readline");
const path = require("path");
const fs = require("fs");
const { parseCommand } = require("./commandParser");
const { generateResponse } = require("./responseGenerator");

let services = {};

function init(serviceOverrides = {}) {
  services = serviceOverrides;
}

function buildContext(command, args) {
  const ctx = {};

  try {
    const selfAwareness = require("../services/selfAwareness/selfAwarenessService");
    const status = selfAwareness.getStatus();
    ctx.capabilities = status.capabilities.total;
    ctx.lessons = status.performance.total || 0;
    ctx.healthStatus = status.health.overallStatus;
    ctx.capabilityList = selfAwareness.listCapabilities();
  } catch {}

  try {
    const memory = require("../services/persistentMemory/memoryService");
    const stats = memory.getStats();
    ctx.memoryStats = { experiences: stats.experiences.total, lessons: stats.lessons.total, total: stats.totalMemories };
  } catch {}

  try {
    const health = require("../services/selfAwareness/healthMonitor");
    const h = health.checkHealth();
    ctx.health = { disk: h.disk.status, diskUsage: h.disk.usagePercent, memory: h.memory.status, memoryUsage: h.memory.usagePercent, process: h.process.status, overall: h.overallStatus };
  } catch {}

  if (command === "review" && args[0]) {
    try {
      const filePath = path.resolve(args[0]);
      if (fs.existsSync(filePath)) {
        const code = fs.readFileSync(filePath, "utf8");
        const independence = require("../services/independence/localDecisionEngine");
        independence.init();
        ctx.reviewResult = independence.reviewCode(code, args[0]);
      } else {
        ctx.reviewResult = { verdict: "ERROR", score: 0, issues: [{ severity: "critical", message: `File not found: ${args[0]}` }] };
      }
    } catch (err) { ctx.reviewResult = { verdict: "ERROR", score: 0, issues: [{ message: err.message }] }; }
  }

  if (command === "plan" && args[0]) {
    try {
      const independence = require("../services/independence/localDecisionEngine");
      const planner = require("../services/independence/ruleBasedPlanner");
      independence.init();
      const goal = { id: "cli-goal", type: "custom", title: args[0] };
      ctx.planResult = planner.planGoal(goal);
    } catch (err) { ctx.planResult = { steps: [], reasoning: [err.message] }; }
  }

  if (command === "find" && args[0]) {
    try {
      const repoIntel = require("../services/repositoryIntelligence/repositoryIntelligenceService");
      const graph = repoIntel.buildFullGraph();
      const query = args[0].toLowerCase();
      ctx.findResults = graph.fileGraph.files.filter((f) => f.path.toLowerCase().includes(query)).slice(0, 10);
    } catch { ctx.findResults = []; }
  }

  if (command === "explain" && args[0]) {
    try {
      const filePath = path.resolve(args[0]);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        ctx.fileInfo = { lines: content.split("\n").length, type: path.extname(args[0]), exports: (content.match(/module\.exports/g) || []).length };
      }
    } catch {}
  }

  if (command === "generate" && args[0]) {
    try {
      const codeGen = require("../services/codeGeneration/codeGenerationService");
      ctx.generatedCode = codeGen.generate(args[0]);
    } catch { ctx.generatedCode = null; }
  }

  if (command === "goals") {
    try {
      const goalEngine = require("../services/goalEngine/goalEngineService");
      ctx.goals = goalEngine.listGoals();
    } catch { ctx.goals = []; }
  }

  return ctx;
}

function processInput(input) {
  const parsed = parseCommand(input);
  const context = buildContext(parsed.command, parsed.args);
  return generateResponse(parsed, context);
}

function startRepl() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "GARUDA> " });

  console.log("\n=== GARUDA CLI ===");
  console.log("Type 'help' for commands. 'quit' to exit.\n");
  rl.prompt();

  rl.on("line", (line) => {
    const input = line.trim();
    if (!input) { rl.prompt(); return; }
    if (input === "quit" || input === "exit" || input === "band") {
      console.log("Alvida! GARUDA ready hai jab bhi bulao.");
      rl.close();
      process.exit(0);
    }
    const response = processInput(input);
    console.log(response);
    rl.prompt();
  });

  rl.on("close", () => { process.exit(0); });
}

if (require.main === module) {
  init();
  startRepl();
}

module.exports = { processInput, init, startRepl, buildContext };
