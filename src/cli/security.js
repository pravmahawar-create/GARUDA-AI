/**
 * 🦅 GARUDA CLI — SECURITY & REPOSITORY CONFINEMENT MODULE
 * 
 * Enforces:
 * 1. Strict repository confinement (No path traversal outside ROOT_DIR)
 * 2. Prefix-confusion defense (D:\GARUDA-AI vs D:\GARUDA-AI-EVIL)
 * 3. Symlink / Junction escape validation
 * 4. Multi-tier command risk classification & human confirmation
 * 5. Founder Gatekeeper enforcement
 */

const path = require("path");
const fs = require("fs");
const readline = require("readline");

// Normalize paths for case-insensitive Windows comparison
function normalizePath(p) {
  let resolved = path.resolve(p);
  if (process.platform === "win32") {
    resolved = resolved.toLowerCase();
  }
  return resolved;
}

/**
 * Resolves a requested path and ensures it stays strictly within rootDir.
 * Returns canonical absolute path if safe.
 * Throws an Error with 🛡️ GARUDA SECURITY BLOCK if unsafe.
 */
function resolveSafeRepositoryPath(requestedPath, rootDir) {
  if (!requestedPath || typeof requestedPath !== "string") {
    throw new Error("🛡️ GARUDA SECURITY BLOCK: Path must be a non-empty string.");
  }

  const baseRoot = rootDir ? path.resolve(rootDir) : path.resolve(__dirname, "..", "..");
  const canonicalRoot = normalizePath(baseRoot);

  // Reject null byte injection
  if (requestedPath.includes("\0")) {
    throw new Error("🛡️ GARUDA SECURITY BLOCK: Null byte injection detected in path.");
  }

  // Reject URL-encoded path traversal attempts
  if (requestedPath.includes("%")) {
    try {
      const decoded = decodeURIComponent(requestedPath);
      if (decoded !== requestedPath) {
        const decodedResolved = path.isAbsolute(decoded)
          ? path.resolve(decoded)
          : path.resolve(baseRoot, decoded);
        const normDecoded = normalizePath(decodedResolved);
        if (normDecoded !== canonicalRoot && !normDecoded.startsWith(canonicalRoot + path.sep)) {
          throw new Error("🛡️ GARUDA SECURITY BLOCK: Encoded path traversal escapes repository boundary.");
        }
      }
    } catch (decErr) {
      if (decErr.message.includes("GARUDA SECURITY BLOCK")) throw decErr;
    }
  }

  // Reject Windows reserved device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
  if (process.platform === "win32") {
    const baseName = path.basename(requestedPath).split(".")[0].toUpperCase();
    const reserved = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];
    if (reserved.includes(baseName)) {
      throw new Error(`🛡️ GARUDA SECURITY BLOCK: Windows reserved device name '${baseName}' is forbidden.`);
    }
  }

  const resolved = path.isAbsolute(requestedPath)
    ? path.resolve(requestedPath)
    : path.resolve(baseRoot, requestedPath);

  const normalizedResolved = normalizePath(resolved);

  // Exact boundary or directory prefix check (with trailing separator to prevent prefix confusion)
  const isExactRoot = normalizedResolved === canonicalRoot;
  const isInsideRoot = normalizedResolved.startsWith(canonicalRoot + path.sep);

  if (!isExactRoot && !isInsideRoot) {
    throw new Error(
      `🛡️ GARUDA SECURITY BLOCK: Path escapes repository boundary.\n` +
      `Requested:  ${requestedPath}\n` +
      `Resolved:   ${resolved}\n` +
      `Repository: ${baseRoot}`
    );
  }

  // Symlink escape check: if path exists, ensure realpath is also within repository root
  if (fs.existsSync(resolved)) {
    try {
      const real = fs.realpathSync(resolved);
      const normalizedReal = normalizePath(real);
      if (normalizedReal !== canonicalRoot && !normalizedReal.startsWith(canonicalRoot + path.sep)) {
        throw new Error(
          `🛡️ GARUDA SECURITY BLOCK: Symlink/Junction targets path outside repository.\n` +
          `Target:     ${real}\n` +
          `Repository: ${baseRoot}`
        );
      }
    } catch (err) {
      if (err.message.includes("GARUDA SECURITY BLOCK")) throw err;
      // Other fs errors (e.g. EPERM) can proceed to normal file operations
    }
  } else {
    // If target file does not exist yet (e.g. write_file), check nearest existing ancestor
    let parent = path.dirname(resolved);
    while (parent && parent !== path.dirname(parent)) {
      if (fs.existsSync(parent)) {
        try {
          const realParent = fs.realpathSync(parent);
          const normalizedRealParent = normalizePath(realParent);
          if (normalizedRealParent !== canonicalRoot && !normalizedRealParent.startsWith(canonicalRoot + path.sep)) {
            throw new Error(
              `🛡️ GARUDA SECURITY BLOCK: Parent directory escapes repository via symlink.\n` +
              `Target:     ${realParent}\n` +
              `Repository: ${baseRoot}`
            );
          }
        } catch (err) {
          if (err.message.includes("GARUDA SECURITY BLOCK")) throw err;
        }
        break;
      }
      parent = path.dirname(parent);
    }
  }

  return resolved;
}

/**
 * Classifies an individual atomic command token/segment.
 */
function classifySingleCommand(cmd) {
  if (!cmd || typeof cmd !== "string" || !cmd.trim()) {
    return { level: "BLOCKED", reason: "Empty command string." };
  }

  const clean = cmd.trim();
  const lower = clean.toLowerCase();

  // 1. Placeholder check
  const placeholders = ["your command", "your_command", "placeholder", "<cmd>", "<command>", "TODO"];
  for (const p of placeholders) {
    if (lower.includes(p.toLowerCase())) {
      return { level: "BLOCKED", reason: `Placeholder command ('${clean}') detected.` };
    }
  }

  // 2. Encoded PowerShell command inspection
  const encMatch = clean.match(/(?:^|\s)-(?:e|enc|encodedcommand)\s+([A-Za-z0-9+/=]+)/i);
  if (encMatch && encMatch[1]) {
    try {
      const buf = Buffer.from(encMatch[1], "base64");
      const decodedUtf16 = buf.toString("utf16le").trim();
      const decodedUtf8 = buf.toString("utf8").trim();

      const inner1 = classifyCommand(decodedUtf16);
      if (inner1.level === "FOUNDER_ONLY" || inner1.level === "BLOCKED") return inner1;

      const inner2 = classifyCommand(decodedUtf8);
      if (inner2.level === "FOUNDER_ONLY" || inner2.level === "BLOCKED") return inner2;

      return { level: "CONFIRM_REQUIRED", reason: "Opaque encoded PowerShell command execution." };
    } catch (_) {}
  }

  // 3. Founder-Only Gatekeeper (Regex, Flag & Whitespace Invariant)
  const founderRegexes = [
    /\bgit(\.exe|\.cmd|\.bat)?\s+([^\s]+\s+)*?(commit|push)\b/i,
    /\bgit(\.exe|\.cmd|\.bat)?\s+([^\s]+\s+)*?branch\s+(-d|-D|--delete)\s+(main|master)\b/i,
    /\bvercel(\.exe|\.cmd|\.bat)?\s+(deploy|--prod)\b/i,
    /\brender(\.exe|\.cmd|\.bat)?\s+deploy\b/i,
    /\b(start-process|saps)\b.*?\bgit\b.*?\b(commit|push)\b/i,
    /\b(invoke-expression|iex)\b.*?\bgit\b.*?\b(commit|push)\b/i,
    /\bgit\s*(\.exe|\.cmd)?\s*(commit|push)\b/i
  ];

  for (const rg of founderRegexes) {
    if (rg.test(clean)) {
      return {
        level: "FOUNDER_ONLY",
        reason: "Git commit, push, and production deployments strictly require explicit prior command (aadesh) from Founder Praveen Mahawar."
      };
    }
  }

  // Legacy substring check for founder gates
  const founderGates = [
    "git commit",
    "git push",
    "vercel deploy",
    "vercel --prod",
    "render deploy",
    "git branch -d main",
    "git branch -d master"
  ];
  for (const fg of founderGates) {
    if (lower.includes(fg)) {
      return {
        level: "FOUNDER_ONLY",
        reason: "Git commit, push, and production deployments strictly require explicit prior command (aadesh) from Founder Praveen Mahawar."
      };
    }
  }

  // 4. System-Destructive BLOCKED
  const systemDestructive = [
    /\bformat\s+[a-z]:/i,
    /\bdiskpart\b/i,
    /\bmkfs\b/i,
    /\bdd\s+if=/i,
    /\brmdir\s+\/s\s+\/q\s+[c-z]:\\/i,
    /\bremove-item\s+.*?-recurse\s+.*?[c-z]:\\/i,
    /\b(clear-disk|initialize-disk|stop-computer|restart-computer)\b/i
  ];
  for (const sd of systemDestructive) {
    if (sd.test(clean)) {
      return { level: "BLOCKED", reason: "Host disk/system destructive operation detected." };
    }
  }

  // 5. CONFIRM_REQUIRED (Potentially Destructive Operations)
  const confirmPatterns = [
    { pattern: /\b(rm|del|erase|rmdir)\b/i, reason: "File or directory deletion command." },
    { pattern: /\bremove-item\b/i, reason: "PowerShell Remove-Item command." },
    { pattern: /\bgit\s+(reset|clean|restore)\b/i, reason: "Destructive git working tree modification." },
    { pattern: /\bgit\s+checkout\s+--\b/i, reason: "Discarding local git changes." },
    { pattern: /\b(taskkill|kill|killall|stop-process)\b/i, reason: "Process termination command." },
    { pattern: /\bnpm\s+(uninstall|remove|prune)\b/i, reason: "Package dependency uninstallation." },
    { pattern: /\b(setx|reg\s+add|reg\s+delete)\b/i, reason: "System environment or registry modification." }
  ];

  for (const cp of confirmPatterns) {
    if (cp.pattern.test(clean)) {
      return { level: "CONFIRM_REQUIRED", reason: cp.reason };
    }
  }

  // 6. LOW_RISK (Builds, Package installations, Tests)
  if (lower.startsWith("npm ") || lower.startsWith("node ") || lower.startsWith("npx ")) {
    return { level: "LOW_RISK", reason: "Standard developer runtime execution." };
  }

  // 7. SAFE (Diagnostic, git status, listing)
  return { level: "SAFE", reason: "Standard safe execution." };
}

/**
 * Command Risk Classification Levels:
 * - SAFE: Read-only or harmless diagnostic commands (e.g. dir, git status, node -v)
 * - LOW_RISK: Standard non-destructive build/test tasks (e.g. npm test, vite build)
 * - CONFIRM_REQUIRED: Deletions, process killing, mass modifications, git resets
 * - BLOCKED: System-destructive (format, diskpart, placeholder scripts)
 * - FOUNDER_ONLY: Production pushes, deployments, commits without Founder aadesh
 *
 * Chaining-Aware: Splits command on ;, &&, ||, |, and newlines, inspecting every segment.
 */
function classifyCommand(cmd) {
  if (!cmd || typeof cmd !== "string" || !cmd.trim()) {
    return { level: "BLOCKED", reason: "Empty command string." };
  }

  const clean = cmd.trim();

  // If command contains chaining or piping operators, inspect individual sub-commands
  const segments = clean.split(/[;&|]|\r?\n/).map(s => s.trim()).filter(Boolean);

  let worstClassification = { level: "SAFE", reason: "Standard safe execution." };

  const riskRank = {
    FOUNDER_ONLY: 5,
    BLOCKED: 4,
    CONFIRM_REQUIRED: 3,
    LOW_RISK: 2,
    SAFE: 1
  };

  // Inspect the whole command first
  const wholeRisk = classifySingleCommand(clean);
  if (riskRank[wholeRisk.level] > riskRank[worstClassification.level]) {
    worstClassification = wholeRisk;
  }

  // Inspect segments
  for (const segment of segments) {
    const segRisk = classifySingleCommand(segment);
    if (riskRank[segRisk.level] > riskRank[worstClassification.level]) {
      worstClassification = segRisk;
    }
  }

  return worstClassification;
}

/**
 * Prompts user for interactive confirmation if CONFIRM_REQUIRED.
 * Resolves to true if approved, false otherwise.
 * In non-interactive mode, safely rejects unless options.autoApprove is true.
 */
async function promptApproval(command, reason, options = {}) {
  // If auto-approve flag provided (e.g. programmatically trusted test context)
  if (options.autoApprove === true) return true;

  // Check if interactive TTY is available
  const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY && !options.nonInteractive);

  if (!isInteractive) {
    return false; // Safe default: never hang or blindly execute in headless environments
  }

  const cwd = options.cwd || process.cwd();

  console.log("\n\x1b[33m" + "=".repeat(70) + "\x1b[0m");
  console.log("\x1b[1m\x1b[33m⚠️  GARUDA APPROVAL REQUIRED\x1b[0m");
  console.log("\x1b[33m" + "=".repeat(70) + "\x1b[0m");
  console.log(`\x1b[1mCommand:\x1b[0m           ${command}`);
  console.log(`\x1b[1mRisk Assessment:\x1b[0m   ${reason}`);
  console.log(`\x1b[1mWorking Directory:\x1b[0m ${cwd}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question("\x1b[1m\x1b[36mProceed with execution? [y/N]: \x1b[0m", (answer) => {
      rl.close();
      const trimmed = (answer || "").trim().toLowerCase();
      const approved = trimmed === "y" || trimmed === "yes";
      resolve(approved);
    });
  });
}

module.exports = {
  resolveSafeRepositoryPath,
  classifyCommand,
  promptApproval
};
