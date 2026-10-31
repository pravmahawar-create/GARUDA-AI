/**
 * 🦅 GARUDA PAWAN ASTRA™ — VALIDATION HARDENING SUITE
 * 
 * Verifies Section 9: Closing All Validation Bypass Routes
 * - Inline DOM event handlers AST validation (onclick, onsubmit, onchange).
 * - Static DOM element reference verification (detecting broken getElementById calls).
 * - CSS syntax validation (unclosed comment blocks, unbalanced braces).
 */

const test = require("node:test");
const assert = require("node:assert");
const { LayeredValidator } = require("./layeredValidator");

test("GARUDA PAWAN ASTRA — Validation Hardening Suite", async (t) => {
  const validator = new LayeredValidator();

  await t.test("1. Catches syntax errors hidden inside inline DOM event handlers (onclick bypass closed)", () => {
    // Defect: broken syntax inside onclick
    const badInlineHtml = `<!DOCTYPE html>
<html>
<body>
  <button id="bad-btn" onclick="let a = { broken: ;">Click Me</button>
</body>
</html>`;

    const res = validator.validateHtml(badInlineHtml, "bad_onclick.html");
    assert.strictEqual(res.valid, false, "Must detect syntax error inside onclick handler");
    assert.ok(res.error.includes("Inline Event 'onclick'"), "Error message must cite the inline event");
  });

  await t.test("2. Validates clean inline event handlers cleanly without false positives", () => {
    const cleanInlineHtml = `<!DOCTYPE html>
<html>
<body>
  <button id="ok-btn" onclick="console.log('Button clicked!'); alert('Success');">Click Me</button>
</body>
</html>`;

    const res = validator.validateHtml(cleanInlineHtml, "clean_onclick.html");
    assert.strictEqual(res.valid, true, "Valid inline JS must pass cleanly");
  });

  await t.test("3. Detects static DOM reference error (referencing non-existent ID in script)", () => {
    // Script calls document.getElementById('ghost-element') but no such element exists in HTML
    const brokenDomRefHtml = `<!DOCTYPE html>
<html>
<body>
  <div id="real-container">Real Element</div>
  <script>
    const el = document.getElementById('ghost-element');
    el.addEventListener('click', () => {});
  </script>
</body>
</html>`;

    const res = validator.validateHtml(brokenDomRefHtml, "broken_dom_ref.html");
    assert.strictEqual(res.valid, false, "Must catch static reference to non-existent DOM element");
    assert.ok(res.error.includes("Static DOM Reference Error: document.getElementById('ghost-element')"));
  });

  await t.test("4. Catches unclosed CSS comment blocks inside <style>", () => {
    const brokenCssHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    /* Unclosed comment block inside CSS
    body { background: #000; color: #fff; }
  </style>
</head>
<body><h1>Test</h1></body>
</html>`;

    const res = validator.validateHtml(brokenCssHtml, "broken_css.html");
    assert.strictEqual(res.valid, false, "Must catch unclosed CSS comment block");
    assert.ok(res.error.includes("Unclosed CSS comment block"));
  });
});
