const assert = require("assert");
const path = require("path");
const { resolveSafeRepositoryPath, classifyCommand, promptApproval } = require("./security");

console.log("\n=== GARUDA CLI SECURITY UNIT TESTS ===\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ ok  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ FAIL ${name}:`, err.message);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✔ ok  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ FAIL ${name}:`, err.message);
    failed++;
  }
}

const ROOT = path.resolve(__dirname, "..", "..");

// 1. Filesystem Traversal Tests
console.log("--- Repository Confinement Tests ---");
test("resolves normal nested file", () => {
  const p = resolveSafeRepositoryPath("package.json", ROOT);
  assert.strictEqual(p, path.join(ROOT, "package.json"));
});

test("resolves relative nested directory path", () => {
  const p = resolveSafeRepositoryPath("src/cli/garudaAgent.js", ROOT);
  assert.strictEqual(p, path.join(ROOT, "src", "cli", "garudaAgent.js"));
});

test("blocks parent directory escape (..)", () => {
  assert.throws(() => {
    resolveSafeRepositoryPath("../outside.txt", ROOT);
  }, /🛡️ GARUDA SECURITY BLOCK: Path escapes repository boundary/);
});

test("blocks deep parent traversal (../../Windows/System32)", () => {
  assert.throws(() => {
    resolveSafeRepositoryPath("../../Windows/System32/cmd.exe", ROOT);
  }, /🛡️ GARUDA SECURITY BLOCK: Path escapes repository boundary/);
});

test("blocks absolute path outside repository", () => {
  const outside = process.platform === "win32" ? "C:\\Windows\\System32\\calc.exe" : "/etc/passwd";
  assert.throws(() => {
    resolveSafeRepositoryPath(outside, ROOT);
  }, /🛡️ GARUDA SECURITY BLOCK: Path escapes repository boundary/);
});

test("blocks prefix-confusion path (e.g. ROOT-EVIL)", () => {
  const evil = ROOT + "-EVIL" + path.sep + "payload.js";
  assert.throws(() => {
    resolveSafeRepositoryPath(evil, ROOT);
  }, /🛡️ GARUDA SECURITY BLOCK: Path escapes repository boundary/);
});

test("blocks null byte injection", () => {
  assert.throws(() => {
    resolveSafeRepositoryPath("package.json\0.evil", ROOT);
  }, /Null byte injection detected/);
});

// 2. Command Risk Classification Tests
console.log("\n--- Command Risk Classification Tests ---");
test("classifies git commit as FOUNDER_ONLY", () => {
  const r = classifyCommand("git commit -m 'test'");
  assert.strictEqual(r.level, "FOUNDER_ONLY");
});

test("classifies git push as FOUNDER_ONLY", () => {
  const r = classifyCommand("git push origin main");
  assert.strictEqual(r.level, "FOUNDER_ONLY");
});

test("classifies vercel deploy as FOUNDER_ONLY", () => {
  const r = classifyCommand("vercel deploy --prod");
  assert.strictEqual(r.level, "FOUNDER_ONLY");
});

test("classifies format command as BLOCKED", () => {
  const r = classifyCommand("format c: /fs:ntfs");
  assert.strictEqual(r.level, "BLOCKED");
});

test("classifies placeholder command as BLOCKED", () => {
  const r = classifyCommand("your command here");
  assert.strictEqual(r.level, "BLOCKED");
});

test("classifies rm/Remove-Item as CONFIRM_REQUIRED", () => {
  const r1 = classifyCommand("rm -rf ./temp");
  assert.strictEqual(r1.level, "CONFIRM_REQUIRED");
  const r2 = classifyCommand("Remove-Item -Path ./temp -Recurse");
  assert.strictEqual(r2.level, "CONFIRM_REQUIRED");
});

test("classifies git reset as CONFIRM_REQUIRED", () => {
  const r = classifyCommand("git reset --hard HEAD~1");
  assert.strictEqual(r.level, "CONFIRM_REQUIRED");
});

test("classifies taskkill as CONFIRM_REQUIRED", () => {
  const r = classifyCommand("taskkill /F /IM node.exe");
  assert.strictEqual(r.level, "CONFIRM_REQUIRED");
});

test("classifies npm test as LOW_RISK", () => {
  const r = classifyCommand("npm test");
  assert.strictEqual(r.level, "LOW_RISK");
});

test("classifies git status as SAFE", () => {
  const r = classifyCommand("git status");
  assert.strictEqual(r.level, "SAFE");
});

// 3. Adversarial Attack Tests (B1, B2, B3, B4)
console.log("\n--- Adversarial Hardening Tests ---");
test("B1: blocks Windows reserved device names (CON/NUL)", () => {
  if (process.platform === "win32") {
    assert.throws(() => {
      resolveSafeRepositoryPath("CON", ROOT);
    }, /Windows reserved device name/);
    assert.throws(() => {
      resolveSafeRepositoryPath("NUL.txt", ROOT);
    }, /Windows reserved device name/);
  }
});

test("B1: blocks UNC host escapes", () => {
  assert.throws(() => {
    resolveSafeRepositoryPath("\\\\localhost\\c$\\Windows", ROOT);
  }, /escapes repository boundary/);
});

test("B2: intercepts chained command injection (semicolon, &&, ||)", () => {
  const r1 = classifyCommand("echo safe ; git commit -m 'evil'");
  assert.strictEqual(r1.level, "FOUNDER_ONLY");

  const r2 = classifyCommand("echo safe && rm -rf /");
  assert.strictEqual(r2.level, "CONFIRM_REQUIRED");

  const r3 = classifyCommand("dir || format d: /fs:ntfs");
  assert.strictEqual(r3.level, "BLOCKED");
});

test("B2: decodes and intercepts base64 encoded PowerShell commands", () => {
  // 'git push' in base64 UTF-16LE = 'ZwBpAHQAIABwAHUAcwBoAA==' or standard 'Z2l0IHB1c2g='
  const r = classifyCommand("powershell -EncodedCommand Z2l0IHB1c2g=");
  assert.strictEqual(r.level, "FOUNDER_ONLY");
});

test("B3: blocks Founder Gatekeeper whitespace variants (multi-space, tabs)", () => {
  const r1 = classifyCommand("git    commit -m 'sneaky'");
  assert.strictEqual(r1.level, "FOUNDER_ONLY");

  const r2 = classifyCommand("git\tcommit -m 'tabbed'");
  assert.strictEqual(r2.level, "FOUNDER_ONLY");

  const r3 = classifyCommand("git   push origin main");
  assert.strictEqual(r3.level, "FOUNDER_ONLY");
});

test("B3: blocks git.exe and flag-interspersed commands", () => {
  const r1 = classifyCommand("git.exe commit -m 'exe'");
  assert.strictEqual(r1.level, "FOUNDER_ONLY");

  const r2 = classifyCommand("git -c user.name=x commit -m 'flag'");
  assert.strictEqual(r2.level, "FOUNDER_ONLY");

  const r3 = classifyCommand("git.exe push");
  assert.strictEqual(r3.level, "FOUNDER_ONLY");
});

test("B3: blocks PowerShell Start-Process and Invoke-Expression wrappers", () => {
  const r1 = classifyCommand("Start-Process git -ArgumentList push");
  assert.strictEqual(r1.level, "FOUNDER_ONLY");

  const r2 = classifyCommand("Invoke-Expression (git push)");
  assert.strictEqual(r2.level, "FOUNDER_ONLY");
});

// 4. Approval Tests
console.log("\n--- Approval Logic Tests ---");
(async () => {
  await testAsync("promptApproval auto-approves when flag set", async () => {
    const res = await promptApproval("rm -rf temp", "deletion", { autoApprove: true });
    assert.strictEqual(res, true);
  });

  await testAsync("promptApproval rejects in non-interactive mode", async () => {
    const res = await promptApproval("rm -rf temp", "deletion", { nonInteractive: true });
    assert.strictEqual(res, false);
  });

  console.log(`\n=== Summary ===`);
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  console.log(`  total:  ${passed + failed}\n`);

  if (failed > 0) process.exit(1);
})();
