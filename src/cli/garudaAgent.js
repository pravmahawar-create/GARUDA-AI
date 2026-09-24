#!/usr/bin/env node
/**
 * 🦅 GARUDA SOVEREIGN AUTONOMOUS AGENT CONSOLE
 * 
 * "One Command. Infinite Intelligence."
 * Founder & Chief AI Architect: Praveen Mahawar
 * Operating System: garudaos.in
 * Standard: 100% Anti-Fabrication Law ("Show > Tell", Verified Evidence)
 */

const readline = require("readline");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { execSync } = require("child_process");

// Set Process & Terminal Window Title to GARUDA
try {
  process.title = "GARUDA";
  process.stdout.write("\x1b]0;GARUDA Sovereign Agent\x07");
} catch (_) {}

// Load environment variables cleanly
const ROOT_DIR = path.resolve(__dirname, "..", "..");
try {
  process.env.DOTENV_CONFIG_QUIET = "true";
  require("dotenv").config({ path: path.join(ROOT_DIR, ".env"), quiet: true });
} catch (err) {}

// Terminal Colors (ANSI)
const C = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  gold: "\x1b[38;5;220m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  gray: "\x1b[90m"
};

// Available LLM Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// System Prompt for GARUDA Sovereign Agent
const SYSTEM_PROMPT = `You are GARUDA, the sovereign autonomous AI Operating System engineered by Founder & Chief AI Architect Praveen Mahawar.
You are running as a direct, inhouse interactive coding agent on Founder Praveen's machine.

GOVERNANCE & GOLDEN RULES:
1. Supreme Sovereign Identity: Declare yourself strictly as GARUDA ("Mai GARUDA hoon", "I am GARUDA"). Never promote, mention, or market third-party AI products (no OpenAI, no Anthropic, no Google, no Groq, no Mimo).
2. Communication Protocol: Strictly communicate in natural, clear, authoritative Roman Hindi (Hinglish). Address Founder Praveen Mahawar with supreme respect as "Praveen ji".
3. 100% Anti-Fabrication Law: Show > Tell. Never hallucinate code or state. Use tools to view real files, run real tests, and report verified SHA-256 evidence.
4. Strict Gatekeeping on Git & Deploy: Under NO circumstances execute git commit, git push, or deploy without explicit prior permission from Founder Praveen.
5. Privacy Shield: Founder Praveen's personal phone number (+91 9098750362) is internal escalation only. Never publish or display it.
6. Execution Mode: Once Praveen ji gives a task, autonomously investigate, read files, write code, run commands, verify syntax, and report back.

TOOL CALLING FORMAT:
You have native tools to inspect and modify the codebase.
To call a tool, you MUST use this exact format:
<thought>Your step-by-step reasoning</thought>
<action name="tool_name">
{"param1": "value"}
</action>

AVAILABLE TOOLS:
1. run_command: Execute a PowerShell/cmd command in the workspace.
   Format: <action name="run_command">{"cmd": "npm test"}</action>
2. view_file: View contents of a file with line numbers.
   Format: <action name="view_file">{"filePath": "server.js", "startLine": 1, "endLine": 100}</action>
3. write_file: Create or completely overwrite a file.
   Format: <action name="write_file">{"filePath": "src/utils/test.js", "content": "console.log('hi');"}</action>
4. edit_file: Surgical replacement in an existing file.
   Format: <action name="edit_file">{"filePath": "src/utils/test.js", "targetContent": "old", "replacementContent": "new"}</action>
5. list_dir: List files and subdirectories.
   Format: <action name="list_dir">{"dirPath": "src/services"}</action>
6. system_status: Get live GARUDA Operating System health, memory synapses, and capabilities.
   Format: <action name="system_status">{}</action>

MANDATORY ANTI-FABRICATION PROTOCOL:
You do NOT know real file contents, directory structures, test outcomes, or system metrics without calling tools.
- When asked about system status/health -> You MUST invoke <action name="system_status">{}</action>
- When asked to view or check code -> You MUST invoke <action name="view_file">
- When asked to create/update code -> You MUST invoke <action name="write_file"> or <action name="edit_file">
- When asked to run tests or commands -> You MUST invoke <action name="run_command">
NEVER fabricate or hallucinate metrics, file lines, or JSON. Always call the real tool first, wait for the <observation>, and then give the final response to Praveen ji in natural Roman Hindi (Hinglish).`;

// Tool Implementations
class ToolRunner {
  static runCommand(cmd) {
    if (!cmd) return "Error: No command provided.";
    
    // Strict Governance Guard
    const forbidden = ["git commit", "git push", "vercel deploy", "render deploy", "git branch -D main"];
    for (const f of forbidden) {
      if (cmd.toLowerCase().includes(f)) {
        return `⚠️ GARUDA SOVEREIGN GATEKEEPER: Execution of '${cmd}' blocked. Git commit, push, and production deployments strictly require explicit prior command (aadesh) from Founder Praveen Mahawar.`;
      }
    }

    try {
      const output = execSync(cmd, {
        cwd: ROOT_DIR,
        shell: "powershell.exe",
        encoding: "utf8",
        timeout: 45000,
        maxBuffer: 5 * 1024 * 1024
      });
      const trimmed = output.trim();
      return trimmed.length > 4000 ? trimmed.slice(0, 4000) + "\n...[truncated]" : trimmed || "(Command completed with exit code 0 and no output)";
    } catch (err) {
      const stdout = err.stdout ? String(err.stdout).slice(0, 2000) : "";
      const stderr = err.stderr ? String(err.stderr).slice(0, 2000) : "";
      return `Command failed (Exit code: ${err.status || 1}):\nSTDOUT: ${stdout}\nSTDERR: ${stderr || err.message}`;
    }
  }

  static viewFile(filePath, startLine = 1, endLine = 150) {
    if (!filePath) return "Error: filePath required.";
    const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(ROOT_DIR, filePath);
    if (!fs.existsSync(resolved)) return `Error: File not found: ${filePath}`;

    try {
      const content = fs.readFileSync(resolved, "utf8");
      const lines = content.split("\n");
      const start = Math.max(1, parseInt(startLine, 10) || 1);
      const end = Math.min(lines.length, parseInt(endLine, 10) || lines.length);
      const slice = lines.slice(start - 1, end);
      const formatted = slice.map((line, idx) => `${start + idx}: ${line}`).join("\n");
      return `File: ${filePath} (${lines.length} lines total, showing ${start} to ${end}):\n${formatted}`;
    } catch (err) {
      return `Error reading file: ${err.message}`;
    }
  }

  static writeFile(filePath, content) {
    if (!filePath || content === undefined) return "Error: filePath and content required.";
    const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(ROOT_DIR, filePath);

    try {
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, content, "utf8");
      const sha256 = crypto.createHash("sha256").update(content).digest("hex");
      return `✅ File written successfully: ${filePath}\nBytes: ${Buffer.byteLength(content)}\nSHA-256: ${sha256}`;
    } catch (err) {
      return `Error writing file: ${err.message}`;
    }
  }

  static editFile(filePath, targetContent, replacementContent) {
    if (!filePath || targetContent === undefined || replacementContent === undefined) {
      return "Error: filePath, targetContent, and replacementContent required.";
    }
    const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(ROOT_DIR, filePath);
    if (!fs.existsSync(resolved)) return `Error: File not found: ${filePath}`;

    try {
      const original = fs.readFileSync(resolved, "utf8");
      if (!original.includes(targetContent)) {
        return `Error: targetContent not found in ${filePath}. Check exact whitespace and linebreaks.`;
      }
      const updated = original.replace(targetContent, replacementContent);
      fs.writeFileSync(resolved, updated, "utf8");
      const sha256 = crypto.createHash("sha256").update(updated).digest("hex");
      return `✅ File edited successfully: ${filePath}\nSHA-256: ${sha256}`;
    } catch (err) {
      return `Error editing file: ${err.message}`;
    }
  }

  static listDir(dirPath = "") {
    const resolved = path.isAbsolute(dirPath) ? dirPath : path.resolve(ROOT_DIR, dirPath);
    if (!fs.existsSync(resolved)) return `Error: Directory not found: ${dirPath}`;

    try {
      const items = fs.readdirSync(resolved, { withFileTypes: true });
      const dirs = items.filter(i => i.isDirectory()).map(i => `📁 ${i.name}/`);
      const files = items.filter(i => i.isFile()).map(i => `📄 ${i.name}`);
      return `Directory: ${dirPath || "."} (${items.length} items):\n` + [...dirs, ...files].join("\n");
    } catch (err) {
      return `Error listing directory: ${err.message}`;
    }
  }

  static systemStatus() {
    let memoryStats = "N/A";
    let health = "N/A";
    let capabilities = "N/A";

    try {
      const memory = require(path.join(ROOT_DIR, "src", "services", "persistentMemory", "memoryService"));
      const stats = memory.getStats();
      memoryStats = `${stats.totalMemories} memories (${stats.experiences.total} experiences, ${stats.lessons.total} lessons)`;
    } catch (_) {}

    try {
      const healthMonitor = require(path.join(ROOT_DIR, "src", "services", "selfAwareness", "healthMonitor"));
      const h = healthMonitor.checkHealth();
      health = `Overall: ${h.overallStatus} (Disk: ${h.disk.usagePercent}%, RAM: ${h.memory.usagePercent}%)`;
    } catch (_) {}

    try {
      const selfAwareness = require(path.join(ROOT_DIR, "src", "services", "selfAwareness", "selfAwarenessService"));
      const s = selfAwareness.getStatus();
      capabilities = `${s.capabilities.total} active capabilities`;
    } catch (_) {}

    return [
      `🦅 GARUDA OPERATING SYSTEM — LIVE SOVEREIGN STATUS`,
      `Founder:      Praveen Mahawar`,
      `Platform:     garudaos.in`,
      `Workspace:    ${ROOT_DIR}`,
      `Health:       ${health}`,
      `Memory:       ${memoryStats}`,
      `Capabilities: ${capabilities}`,
      `Status:       🟢 LIVE & SOVEREIGN`
    ].join("\n");
  }
}

// Multi-Provider LLM Caller
async function callAgentLLM(conversation) {
  // 1. Primary: Google Gemini 2.5 Flash
  if (GEMINI_API_KEY) {
    try {
      const contents = conversation.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2500
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (_) {}
  }

  // 2. Secondary: Groq Compound / GPT-OSS
  if (GROQ_API_KEY) {
    const models = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"];
    for (const m of models) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: m,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...conversation
            ],
            temperature: 0.2
          })
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) return text;
        }
      } catch (_) {}
    }
  }

  throw new Error("All LLM providers failed or API keys unavailable. Check GEMINI_API_KEY or GROQ_API_KEY in .env.");
}

// Agentic Execution Loop
async function runAgentTurn(userMessage, conversationHistory, onLog = console.log) {
  conversationHistory.push({ role: "user", content: userMessage });
  let maxSteps = 8;
  let step = 0;

  while (step < maxSteps) {
    step++;
    const responseText = await callAgentLLM(conversationHistory);

    // Check for tool action
    const actionMatch = responseText.match(/<action\s+name=["']([^"']+)["']>([\s\S]*?)<\/action>/i);
    const thoughtMatch = responseText.match(/<thought>([\s\S]*?)<\/thought>/i);

    if (thoughtMatch && onLog) {
      onLog(`${C.dim}💭 [GARUDA Reason] ${thoughtMatch[1].trim()}${C.reset}`);
    }

    if (!actionMatch) {
      // Final response (no tools invoked)
      conversationHistory.push({ role: "assistant", content: responseText });
      return responseText.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();
    }

    const toolName = actionMatch[1].trim();
    const toolParamsRaw = actionMatch[2].trim();
    let toolParams = {};
    try {
      toolParams = JSON.parse(toolParamsRaw);
    } catch (e) {
      toolParams = { raw: toolParamsRaw };
    }

    onLog(`${C.gold}⚡ [GARUDA Tool] ${toolName}${C.reset}(${C.cyan}${JSON.stringify(toolParams)}${C.reset})`);

    let toolResult = "";
    switch (toolName) {
      case "run_command":
        toolResult = ToolRunner.runCommand(toolParams.cmd || toolParams.command || toolParams.raw);
        break;
      case "view_file":
        toolResult = ToolRunner.viewFile(toolParams.filePath || toolParams.file, toolParams.startLine, toolParams.endLine);
        break;
      case "write_file":
        toolResult = ToolRunner.writeFile(toolParams.filePath || toolParams.file, toolParams.content);
        break;
      case "edit_file":
        toolResult = ToolRunner.editFile(toolParams.filePath || toolParams.file, toolParams.targetContent, toolParams.replacementContent);
        break;
      case "list_dir":
        toolResult = ToolRunner.listDir(toolParams.dirPath || toolParams.path || toolParams.dir || "");
        break;
      case "system_status":
        toolResult = ToolRunner.systemStatus();
        break;
      default:
        toolResult = `Error: Unknown tool '${toolName}'.`;
        break;
    }

    // Append tool interaction to context
    conversationHistory.push({ role: "assistant", content: responseText });
    conversationHistory.push({
      role: "user",
      content: `<observation tool="${toolName}">\n${toolResult}\n</observation>\nBased on this tool result, continue the task or give final answer.`
    });
  }

  return "Maximum agent execution steps reached. Please verify results.";
}

// Banner Display
function printBanner() {
  console.log(`${C.gold}========================================================================================${C.reset}`);
  console.log(`${C.bright}${C.gold}🦅 GARUDA SOVEREIGN AUTONOMOUS AGENT (Console v1.0)${C.reset}`);
  console.log(`${C.cyan}"One Command. Infinite Intelligence."${C.reset}`);
  console.log(`${C.gray}Founder & Chief AI Architect: ${C.bright}Praveen Mahawar${C.reset}${C.gray} | Platform: ${C.cyan}garudaos.in${C.reset}`);
  console.log(`${C.gray}Autonomous Engines: ${C.green}PAWAN${C.gray} / ${C.green}ASTRA${C.gray} / ${C.green}Mother Brain${C.reset}`);
  console.log(`${C.green}Status: 🟢 ONLINE${C.gray} | Workspace: ${C.cyan}${ROOT_DIR}${C.reset}`);
  console.log(`${C.gold}========================================================================================${C.reset}\n`);
  console.log(`${C.bright}Namaste Praveen ji! Mai GARUDA hoon.${C.reset}`);
  console.log(`Aapka sovereign inhouse coding agent taiyar hai.`);
  console.log(`Bataiye, aaj kis project, feature ya bug par kaam karna hai?\n`);
  console.log(`${C.dim}Commands: /status (Health & Synapses), /clear (Clear Screen), /help (Help), /exit (Quit)${C.reset}\n`);
}

// Interactive REPL
async function startRepl() {
  printBanner();

  const conversationHistory = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${C.gold}🦅 GARUDA ${C.green}> ${C.reset}`
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    // Built-in slash commands
    if (input === "/exit" || input === "exit" || input === "quit") {
      console.log(`\n${C.gold}🦅 GARUDA Console exiting. Jai Hind Praveen ji!${C.reset}\n`);
      process.exit(0);
    }

    if (input === "/clear" || input === "clear") {
      console.clear();
      printBanner();
      rl.prompt();
      return;
    }

    if (input === "/status") {
      console.log("\n" + ToolRunner.systemStatus() + "\n");
      rl.prompt();
      return;
    }

    if (input === "/help") {
      console.log(`\n${C.gold}GARUDA SOVEREIGN AGENT HELP:${C.reset}`);
      console.log(`  - Direct Chat: Simply describe any task in Roman Hindi or English.`);
      console.log(`  - Code Edits: "src/utils/hash.js me SHA-256 function banao"`);
      console.log(`  - Diagnostics: "build check karo aur koi error ho toh fix karo"`);
      console.log(`  - Commands: /status, /clear, /exit\n`);
      rl.prompt();
      return;
    }

    console.log(`${C.dim}⏳ [GARUDA soch raha hai...]${C.reset}`);

    try {
      const answer = await runAgentTurn(input, conversationHistory, (log) => console.log(log));
      console.log(`\n${C.bright}${C.cyan}🦅 GARUDA:${C.reset}\n${answer}\n`);
    } catch (err) {
      console.log(`\n${C.red}❌ Error: ${err.message}${C.reset}\n`);
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log(`\n${C.gold}🦅 GARUDA session closed.${C.reset}`);
    process.exit(0);
  });
}

// Main CLI Entry
async function main() {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const singleTask = args.join(" ");
    console.log(`\n${C.gold}🦅 [GARUDA Execution] Running task: "${singleTask}"${C.reset}\n`);
    const history = [];
    try {
      const result = await runAgentTurn(singleTask, history, (log) => console.log(log));
      console.log(`\n${C.bright}${C.cyan}🦅 GARUDA:${C.reset}\n${result}\n`);
      process.exitCode = 0;
      return;
    } catch (err) {
      console.error(`\n${C.red}❌ Error: ${err.message}${C.reset}`);
      process.exitCode = 1;
      return;
    }
  } else {
    await startRepl();
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}

module.exports = { main, runAgentTurn, ToolRunner };
