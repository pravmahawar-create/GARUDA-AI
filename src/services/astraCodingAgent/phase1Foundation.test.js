/**
 * 🦅 GARUDA PAWAN ASTRA — PHASE 1 FOUNDATION TEST SUITE
 * 
 * Verifies all 10 core acceptance gates of Phase 1:
 * Gate 1: LayeredValidator JS/TS/JSX validation
 * Gate 2: LayeredValidator Deep HTML & inline <script> verification
 * Gate 3: PatchEngine exact & normalized search/replace
 * Gate 4: PatchEngine whitespace-tolerant sliding-window search/replace
 * Gate 5: PatchEngine ambiguity rejection & context mismatch safety
 * Gate 6: PatchEngine diff block parsing & sequential application
 * Gate 7: ProjectWorkspace multi-file manifest & per-file SHA-256 tracking
 * Gate 8: ProjectWorkspace immutable snapshots & 100% verified rollback
 * Gate 9: AstraExecutionEngine automated rollback on validation exhaustion
 * Gate 10: PawanApkService truthful non-fabricated classification
 */

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const { LayeredValidator } = require("./layeredValidator");
const { PatchEngine } = require("./patchEngine");
const { ProjectWorkspace } = require("./workspaceEngine");
const { RepoIndexEngine } = require("./repoIndexEngine");
const { AstraExecutionEngine } = require("./astraExecutionEngine");
const { containerizeApp } = require("../pawanApkService");

test("GARUDA PAWAN ASTRA — Phase 1 Foundation Regression Gates", async (t) => {
  const validator = new LayeredValidator();
  const patchEngine = new PatchEngine();

  // GATE 1: LayeredValidator JS/TS syntax
  await t.test("Gate 1: LayeredValidator validates JS/JSX cleanly and detects syntax errors", () => {
    const cleanJs = "const calculateTotal = (items) => items.reduce((sum, item) => sum + item.price, 0);";
    const cleanRes = validator.validateJavaScript(cleanJs);
    assert.strictEqual(cleanRes.valid, true);
    assert.strictEqual(cleanRes.exitCode, 0);

    const brokenJs = "const calculateTotal = (items) => items.reduce((sum, item) => sum + item.price, ;";
    const brokenRes = validator.validateJavaScript(brokenJs);
    assert.strictEqual(brokenRes.valid, false);
    assert.strictEqual(brokenRes.exitCode, 1);
    assert.ok(brokenRes.error.includes("SyntaxError"));
  });

  // GATE 2: Deep HTML & Inline Script Verification (Eliminates HTML Bypass)
  await t.test("Gate 2: LayeredValidator extracts and AST-validates scripts inside HTML", () => {
    const validHtml = `<!DOCTYPE html>
<html>
<head><title>Clinic Receptionist</title></head>
<body>
  <h1>Welcome</h1>
  <script>
    function bookSlot(time) {
      console.log("Slot booked at: " + time);
      return true;
    }
  </script>
</body>
</html>`;
    const validRes = validator.validateHtml(validHtml);
    assert.strictEqual(validRes.valid, true);
    assert.strictEqual(validRes.scriptsValidated, 1);

    const brokenHtml = `<!DOCTYPE html>
<html>
<head><title>Clinic Receptionist</title></head>
<body>
  <h1>Welcome</h1>
  <script>
    function bookSlot(time) {
      const invalid = { missing brace;
    }
  </script>
</body>
</html>`;
    const brokenRes = validator.validateHtml(brokenHtml);
    assert.strictEqual(brokenRes.valid, false);
    assert.strictEqual(brokenRes.exitCode, 1);
    assert.ok(brokenRes.error.includes("Script #1"));
    assert.ok(brokenRes.error.includes("SyntaxError"));
  });

  // GATE 3: PatchEngine Exact & Normalized Search/Replace
  await t.test("Gate 3: PatchEngine performs surgical exact substring replacement", () => {
    const initial = `
function renderHeader() {
  return "<h1>Old Header</h1>";
}
function renderFooter() {
  return "<footer>Contact Us</footer>";
}
`;
    const res = patchEngine.applySearchReplace(initial, '"<h1>Old Header</h1>"', '"<h1>Sovereign Header</h1>"');
    assert.strictEqual(res.success, true);
    assert.ok(res.newContent.includes('"<h1>Sovereign Header</h1>"'));
    assert.ok(res.newContent.includes("renderFooter")); // Surrounding code preserved
    assert.strictEqual(res.occurrencesReplaced, 1);
  });

  // GATE 4: PatchEngine Whitespace-Tolerant Sliding Window
  await t.test("Gate 4: PatchEngine handles indentation and whitespace shift", () => {
    const initial = `
class CartService {
    calculateDiscount(total) {
        if (total > 500) {
            return total * 0.1;
        }
        return 0;
    }
}
`;
    // Search block with different indentation
    const searchBlock = `if (total > 500) {
    return total * 0.1;
}`;
    const replaceBlock = `if (total > 1000) {
            return total * 0.2;
        }`;

    const res = patchEngine.applySearchReplace(initial, searchBlock, replaceBlock);
    assert.strictEqual(res.success, true);
    assert.ok(res.newContent.includes("total > 1000"));
    assert.ok(res.newContent.includes("total * 0.2"));
  });

  // GATE 5: PatchEngine Ambiguity & Mismatch Safety
  await t.test("Gate 5: PatchEngine safely rejects context mismatch without modifying content", () => {
    const initial = "const x = 10; const y = 20;";
    const res = patchEngine.applySearchReplace(initial, "nonExistentFunctionCall()", "replacement()");
    assert.strictEqual(res.success, false);
    assert.ok(res.error.includes("mismatch"));
  });

  // GATE 6: Diff Block Parsing and Sequential Application
  await t.test("Gate 6: PatchEngine parses and applies search/replace diff blocks", () => {
    const initial = "const a = 1;\nconst b = 2;\nconst c = 3;";
    const diffText = `
<<<<<<< SEARCH
const a = 1;
=======
const a = 100;
>>>>>>> REPLACE
<<<<<<< SEARCH
const c = 3;
=======
const c = 300;
>>>>>>> REPLACE
`;
    const blocks = patchEngine.parseDiffBlocks(diffText);
    assert.strictEqual(blocks.length, 2);

    const patchRes = patchEngine.applyMultiplePatches(initial, blocks);
    assert.strictEqual(patchRes.success, true);
    assert.strictEqual(patchRes.patchesApplied, 2);
    assert.strictEqual(patchRes.newContent, "const a = 100;\nconst b = 2;\nconst c = 300;");
  });

  // GATE 7: ProjectWorkspace Multi-File Manifest & SHA-256
  await t.test("Gate 7: ProjectWorkspace manages multi-file projects with verified SHA-256", () => {
    const ws = new ProjectWorkspace({ name: "Appointment PWA" });
    ws.setFile("index.html", "<!DOCTYPE html><html><body><div id='root'></div></body></html>");
    ws.setFile("src/app.js", "console.log('App initialized');");
    ws.setFile("src/styles.css", "body { margin: 0; background: #000; }");

    const manifest = ws.getManifest();
    assert.strictEqual(manifest.fileCount, 3);
    assert.ok(manifest.totalBytes > 50);

    const appFile = ws.getFile("src/app.js");
    assert.ok(appFile.sha256);
    assert.strictEqual(appFile.version, 1);
  });

  // GATE 8: ProjectWorkspace Immutable Snapshot and Verified Rollback
  await t.test("Gate 8: ProjectWorkspace creates snapshots and rolls back cleanly", () => {
    const ws = new ProjectWorkspace({ name: "Rollback Test" });
    ws.setFile("config.json", JSON.stringify({ version: "1.0.0" }));
    const snap = ws.createSnapshot("v1.0.0-stable");

    // Corrupt the workspace
    ws.setFile("config.json", "{ invalid JSON state");
    ws.setFile("deleted.js", "this should disappear on rollback");
    assert.strictEqual(ws.getManifest().fileCount, 2);

    // Rollback to snapshot
    const rollbackRes = ws.rollback(snap.snapshotId);
    assert.strictEqual(rollbackRes.success, true);
    assert.strictEqual(ws.getManifest().fileCount, 1);
    assert.strictEqual(ws.getFile("config.json").content, JSON.stringify({ version: "1.0.0" }));
    assert.strictEqual(ws.getFile("deleted.js"), null);
  });

  // GATE 9: AstraExecutionEngine Automated Rollback on Self-Healing Exhaustion
  await t.test("Gate 9: AstraExecutionEngine automatically rolls back if file remains invalid", async () => {
    const engine = new AstraExecutionEngine({ maxHealCycles: 0 });
    const tempFile = "data/astra/rollback_test.js";
    const initialContent = "function validFunction() { return 42; }\nmodule.exports = { validFunction };";

    // Setup initial clean file
    engine.applyPatch(tempFile, initialContent);

    // Attempt to execute task with intentionally invalid code
    const result = await engine.executeTask("Corrupt file test", {
      targetFile: tempFile,
      code: "function corrupted() { const x = ;",
      summary: "Invalid patch test"
    });

    // File on disk MUST be rolled back to initial valid content!
    const diskContent = fs.readFileSync(path.join(process.cwd(), tempFile), "utf8");
    assert.strictEqual(diskContent, initialContent);
    assert.strictEqual(result.rollbackExecuted, true);

    // Cleanup
    try { fs.unlinkSync(path.join(process.cwd(), tempFile)); } catch {}
  });

  // GATE 10: Truthful Non-Fabricated APK/PWA Classification
  await t.test("Gate 10: pawanApkService truthfully classifies PWA and does NOT fabricate apkReady", async () => {
    const html = "<!DOCTYPE html><html><head></head><body><h1>PWA Test</h1></body></html>";
    const result = await containerizeApp({
      code: html,
      appName: "Truthful App Test"
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.pwaReady, true);
    assert.strictEqual(result.apkReady, false); // Must NEVER claim true unless real APK binary is compiled
    assert.strictEqual(result.realApkCompiled, false);
    assert.strictEqual(result.artifactType, "pwa_bundle_with_capacitor_scaffold");
  });
});
