/**
 * 🦅 GARUDA PAWAN ASTRA™ — FEATURE PRESERVATION SUITE
 * 
 * Verifies Section 6: Feature Preservation Engine
 * - Baseline feature inventory extraction (DOM IDs, form inputs, buttons, functions).
 * - Automatic detection of unexpected deletions.
 * - Patch rejection when existing functionality is erased.
 * - Intentional deletion allowance when requested by user.
 * - Transactional rollback protection.
 */

const test = require("node:test");
const assert = require("node:assert");
const { featurePreservationEngine } = require("./featurePreservationEngine");

test("GARUDA PAWAN ASTRA — Feature Preservation Suite", async (t) => {
  const originalHtml = `<!DOCTYPE html>
<html>
<head><title>CRM App</title></head>
<body>
  <div id="header">CRM Header</div>
  <form id="lead-form">
    <input id="lead-name" name="leadName" type="text" placeholder="Name" />
    <input id="lead-phone" name="leadPhone" type="tel" placeholder="Phone" />
    <button id="submit-btn">Submit Lead</button>
  </form>
  <button id="export-btn">Export Data</button>
  <script>
    function validateLead() { return true; }
    function submitLead() { if(validateLead()) console.log("submitted"); }
  </script>
</body>
</html>`;

  await t.test("1. Extracts comprehensive baseline feature inventory", () => {
    const inventory = featurePreservationEngine.extractFeatureInventory(originalHtml, "html");

    assert.ok(inventory.domIds.includes("header"));
    assert.ok(inventory.domIds.includes("lead-form"));
    assert.ok(inventory.domIds.includes("lead-name"));
    assert.ok(inventory.domIds.includes("lead-phone"));
    assert.ok(inventory.domIds.includes("submit-btn"));

    assert.strictEqual(inventory.formInputs.length, 2);
    assert.strictEqual(inventory.interactiveElements.length, 2); // 2 buttons
    assert.ok(inventory.functions.includes("validateLead"));
    assert.ok(inventory.functions.includes("submitLead"));
  });

  await t.test("2. Detects unexpected deletion of form inputs and buttons and REJECTS patch", () => {
    // Destructive patch: replaced form with single paragraph, deleting inputs and buttons
    const destructivePatch = `<!DOCTYPE html>
<html>
<head><title>CRM App</title></head>
<body>
  <div id="header">CRM Header</div>
  <p>Form was replaced with text</p>
</body>
</html>`;

    const evalResult = featurePreservationEngine.evaluatePreservation(
      originalHtml,
      destructivePatch,
      { fileType: "html", userIntent: "Add a new footer banner" }
    );

    assert.strictEqual(evalResult.passed, false, "Patch that erases inputs without instruction must be REJECTED");
    assert.strictEqual(evalResult.status, "PRESERVATION_VIOLATION_DETECTED");
    assert.ok(evalResult.violations.length > 0);
    assert.ok(evalResult.unexpectedDeletions.formInputs.length >= 2, "Must detect deleted form inputs");
    assert.ok(evalResult.unexpectedDeletions.buttons.length >= 2, "Must detect deleted buttons");
  });

  await t.test("3. Cleanly ACCEPTS additive patch that preserves all existing features", () => {
    // Clean additive patch: preserves existing form, adds new footer
    const additivePatch = `<!DOCTYPE html>
<html>
<head><title>CRM App</title></head>
<body>
  <div id="header">CRM Header</div>
  <form id="lead-form">
    <input id="lead-name" name="leadName" type="text" placeholder="Name" />
    <input id="lead-phone" name="leadPhone" type="tel" placeholder="Phone" />
    <button id="submit-btn">Submit Lead</button>
  </form>
  <button id="export-btn">Export Data</button>
  <div id="footer-banner">GARUDA Verified Footer</div>
  <script>
    function validateLead() { return true; }
    function submitLead() { if(validateLead()) console.log("submitted"); }
  </script>
</body>
</html>`;

    const evalResult = featurePreservationEngine.evaluatePreservation(
      originalHtml,
      additivePatch,
      { fileType: "html", userIntent: "Add a footer banner" }
    );

    assert.strictEqual(evalResult.passed, true, "Additive patch preserving all features must be ACCEPTED");
    assert.strictEqual(evalResult.status, "FEATURE_PRESERVATION_VERIFIED");
    assert.strictEqual(evalResult.preservationRatio, 100);
    assert.strictEqual(evalResult.totalDeletions, 0);
  });

  await t.test("4. PERMITS intentional deletion when user explicitly requests removal", () => {
    const intentionalPatch = `<!DOCTYPE html>
<html>
<head><title>CRM App</title></head>
<body>
  <div id="header">CRM Header</div>
  <form id="lead-form">
    <input id="lead-name" name="leadName" type="text" placeholder="Name" />
    <input id="lead-phone" name="leadPhone" type="tel" placeholder="Phone" />
    <button id="submit-btn">Submit Lead</button>
  </form>
</body>
</html>`; // Export button intentionally removed

    const evalResult = featurePreservationEngine.evaluatePreservation(
      originalHtml,
      intentionalPatch,
      { fileType: "html", userIntent: "Please remove export-btn from CRM" }
    );

    assert.strictEqual(evalResult.passed, true, "Intentional removal requested by user must be permitted");
  });
});
