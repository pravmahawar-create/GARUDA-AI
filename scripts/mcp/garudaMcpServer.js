#!/usr/bin/env node
/**
 * 🦅 GARUDA SOVEREIGN MCP SERVER (Model Context Protocol)
 * Enables VS Code, OpenCode, Antigravity, Cline, and Cursor to natively
 * execute GARUDA autonomous agents (PAWAN, ASTRA, Mother Brain) over stdio.
 * 
 * Founder: Praveen Mahawar
 * Operating Standard: 100% Anti-Fabrication Law ("Show > Tell")
 */

const readline = require("readline");
const path = require("path");
const fs = require("fs");

// Ensure process.stdout is 100% pure JSON-RPC. Redirect standard console.log to stderr.
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
console.log = (...args) => {
  process.stderr.write("[GARUDA-MCP] " + args.map(a => typeof a === "object" ? JSON.stringify(a) : a).join(" ") + "\n");
};
console.info = console.log;
console.warn = console.log;

const ROOT_DIR = path.resolve(__dirname, "..", "..");

// Pre-load required GARUDA engines with graceful fallbacks
let astraEngine = null;
let localDecisionEngine = null;
let ruleBasedPlanner = null;
let memoryService = null;
let selfAwarenessService = null;
let healthMonitor = null;

try {
  const { AstraExecutionEngine } = require(path.join(ROOT_DIR, "src", "services", "astraCodingAgent", "astraExecutionEngine"));
  astraEngine = new AstraExecutionEngine({ rootDir: ROOT_DIR });
} catch (err) {
  process.stderr.write(`[GARUDA-MCP] Warning: AstraExecutionEngine load failed: ${err.message}\n`);
}

try {
  localDecisionEngine = require(path.join(ROOT_DIR, "src", "services", "independence", "localDecisionEngine"));
  localDecisionEngine.init();
} catch (err) {
  process.stderr.write(`[GARUDA-MCP] Warning: localDecisionEngine load failed: ${err.message}\n`);
}

try {
  ruleBasedPlanner = require(path.join(ROOT_DIR, "src", "services", "independence", "ruleBasedPlanner"));
} catch (err) {
  process.stderr.write(`[GARUDA-MCP] Warning: ruleBasedPlanner load failed: ${err.message}\n`);
}

try {
  memoryService = require(path.join(ROOT_DIR, "src", "services", "persistentMemory", "memoryService"));
} catch (err) {
  process.stderr.write(`[GARUDA-MCP] Warning: memoryService load failed: ${err.message}\n`);
}

try {
  selfAwarenessService = require(path.join(ROOT_DIR, "src", "services", "selfAwareness", "selfAwarenessService"));
} catch (err) {
  process.stderr.write(`[GARUDA-MCP] Warning: selfAwarenessService load failed: ${err.message}\n`);
}

try {
  healthMonitor = require(path.join(ROOT_DIR, "src", "services", "selfAwareness", "healthMonitor"));
} catch (err) {
  process.stderr.write(`[GARUDA-MCP] Warning: healthMonitor load failed: ${err.message}\n`);
}

// Tool definitions for MCP
const TOOLS = [
  {
    name: "garuda_pawan_code",
    description: "Autonomous coding agent (PAWAN / ASTRA) that generates, patches, tests, and validates code with SHA-256 verification and self-healing.",
    inputSchema: {
      type: "object",
      properties: {
        instruction: {
          type: "string",
          description: "Detailed instruction for the coding task (e.g. 'Build a utility to encrypt tokens')"
        },
        targetFile: {
          type: "string",
          description: "Relative path to target file (e.g. 'src/utils/tokenUtil.js')"
        }
      },
      required: ["instruction"]
    }
  },
  {
    name: "garuda_plan_goal",
    description: "Mother Brain Planner agent that breaks complex software or architectural goals into structured, ordered dependency steps.",
    inputSchema: {
      type: "object",
      properties: {
        goal: {
          type: "string",
          description: "The overarching goal to plan (e.g. 'Integrate OAuth2 login flow with JWT sessions')"
        }
      },
      required: ["goal"]
    }
  },
  {
    name: "garuda_review_code",
    description: "Forensic code review engine that inspects a file for syntax validity, anti-fabrication compliance, security issues, and quality score.",
    inputSchema: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "Relative or absolute path to the file to review (e.g. 'server.js')"
        }
      },
      required: ["filePath"]
    }
  },
  {
    name: "garuda_system_status",
    description: "Query live GARUDA Operating System status, memory synapses (experiences & lessons), and health metrics.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

// Tool execution implementations
async function handleToolCall(name, args) {
  switch (name) {
    case "garuda_pawan_code": {
      const { instruction, targetFile } = args || {};
      if (!instruction) {
        return { isError: true, text: "Missing required argument: instruction" };
      }
      if (!astraEngine) {
        return { isError: true, text: "AstraExecutionEngine is not initialized." };
      }

      process.stderr.write(`[GARUDA-MCP] Running PAWAN/ASTRA for: "${instruction}"\n`);
      const startTime = Date.now();
      const result = await astraEngine.executeTask(instruction, { targetFile: targetFile || null });
      const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

      const summary = [
        `🦅 GARUDA PAWAN / ASTRA EXECUTION REPORT`,
        `======================================================`,
        `Task ID:       ${result.taskId}`,
        `Status:        ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`,
        `Target File:   ${result.file || "N/A"}`,
        `SHA-256:       ${result.sha256 || "N/A"}`,
        `Heal Cycles:   ${result.healCyclesRun}`,
        `Execution Time:${durationSec}s`,
        `Trajectory:    ${result.trajectory ? result.trajectory.length : 0} steps`,
        `======================================================`,
        result.message || (result.success ? "Code changes verified and validated cleanly." : "Execution encountered errors.")
      ].join("\n");

      return { isError: !result.success, text: summary };
    }

    case "garuda_plan_goal": {
      const { goal } = args || {};
      if (!goal) return { isError: true, text: "Missing required argument: goal" };

      if (!ruleBasedPlanner) {
        return { isError: true, text: "Planner engine not available." };
      }

      const plan = ruleBasedPlanner.planGoal({ id: "mcp-goal-" + Date.now(), type: "custom", title: goal });
      const stepsFormatted = (plan.steps || []).map((s, idx) => `${idx + 1}. [${s.action || s.type}] ${s.description || s.title || JSON.stringify(s)}`).join("\n");

      const response = [
        `🦅 GARUDA MOTHER BRAIN ARCHITECTURAL PLAN`,
        `Goal: ${goal}`,
        `------------------------------------------------------`,
        stepsFormatted || "No explicit steps generated.",
        `Reasoning: ${(plan.reasoning || []).join(" | ") || "Deterministic rule-based graph expansion"}`
      ].join("\n");

      return { isError: false, text: response };
    }

    case "garuda_review_code": {
      const { filePath } = args || {};
      if (!filePath) return { isError: true, text: "Missing required argument: filePath" };

      const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(ROOT_DIR, filePath);
      if (!fs.existsSync(resolved)) {
        return { isError: true, text: `File not found: ${filePath}` };
      }

      const code = fs.readFileSync(resolved, "utf8");
      if (localDecisionEngine) {
        const review = localDecisionEngine.reviewCode(code, resolved);
        const issuesFormatted = (review.issues || []).map(i => `  - [${i.severity.toUpperCase()}] ${i.message}`).join("\n");
        const text = [
          `🦅 GARUDA FORENSIC CODE REVIEW`,
          `File:    ${filePath}`,
          `Verdict: ${review.verdict}`,
          `Score:   ${review.score}/100`,
          `Issues:`,
          issuesFormatted || "  None detected. Clean code."
        ].join("\n");
        return { isError: false, text };
      }

      return { isError: false, text: `File read successfully (${code.length} bytes), but review engine was inactive.` };
    }

    case "garuda_system_status": {
      let memoryStats = "N/A";
      let health = "N/A";
      let capabilitiesCount = "N/A";

      if (memoryService) {
        try {
          const stats = memoryService.getStats();
          memoryStats = `${stats.totalMemories} memories (${stats.experiences.total} experiences, ${stats.lessons.total} lessons)`;
        } catch (_) {}
      }

      if (healthMonitor) {
        try {
          const h = healthMonitor.checkHealth();
          health = `Overall: ${h.overallStatus} (Disk: ${h.disk.usagePercent}%, RAM: ${h.memory.usagePercent}%)`;
        } catch (_) {}
      }

      if (selfAwarenessService) {
        try {
          const s = selfAwarenessService.getStatus();
          capabilitiesCount = `${s.capabilities.total} capabilities active`;
        } catch (_) {}
      }

      const text = [
        `🦅 GARUDA OPERATING SYSTEM — SOVEREIGN AGENT STATUS`,
        `Founder:      Praveen Mahawar`,
        `Platform:     garudaos.in`,
        `Root:         ${ROOT_DIR}`,
        `Health:       ${health}`,
        `Memory:       ${memoryStats}`,
        `Capabilities: ${capabilitiesCount}`,
        `Status:       🟢 LIVE & READY`
      ].join("\n");

      return { isError: false, text };
    }

    default:
      return { isError: true, text: `Unknown tool: ${name}` };
  }
}

// JSON-RPC Response Helper
function send(msg) {
  const line = JSON.stringify(msg);
  originalStdoutWrite(line + "\n");
}

function sendResult(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function sendError(id, code, message, data) {
  send({ jsonrpc: "2.0", id, error: { code, message, data } });
}

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let request;
  try {
    request = JSON.parse(trimmed);
  } catch (err) {
    process.stderr.write(`[GARUDA-MCP] Parse error: ${err.message}\n`);
    sendError(null, -32700, "Parse error");
    return;
  }

  const { id, method, params } = request;

  // Notification (no ID)
  if (id === undefined || id === null) {
    if (method === "notifications/initialized") {
      process.stderr.write("[GARUDA-MCP] Client connection initialized successfully.\n");
    }
    return;
  }

  try {
    switch (method) {
      case "initialize": {
        const clientProto = params?.protocolVersion || "2024-11-05";
        sendResult(id, {
          protocolVersion: clientProto,
          capabilities: {
            tools: {
              listChanged: false
            }
          },
          serverInfo: {
            name: "garuda-ai",
            version: "1.0.0"
          },
          instructions: "You are connected to GARUDA Operating System sovereign agents (PAWAN, ASTRA, Mother Brain) by Founder Praveen Mahawar."
        });
        break;
      }

      case "ping": {
        sendResult(id, {});
        break;
      }

      case "tools/list": {
        sendResult(id, { tools: TOOLS });
        break;
      }

      case "tools/call": {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        const outcome = await handleToolCall(toolName, toolArgs);
        sendResult(id, {
          content: [
            {
              type: "text",
              text: outcome.text
            }
          ],
          isError: outcome.isError
        });
        break;
      }

      default:
        sendError(id, -32601, `Method not found: ${method}`);
        break;
    }
  } catch (err) {
    process.stderr.write(`[GARUDA-MCP] Internal error processing ${method}: ${err.stack}\n`);
    sendError(id, -32603, `Internal error: ${err.message}`);
  }
});

process.stderr.write("[GARUDA-MCP] Sovereign Agent Server ready on stdio.\n");
