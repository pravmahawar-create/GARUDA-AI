const assert = require("assert");
const fs = require("fs");
const path = require("path");
const templates = require("./codeTemplates");
const generator = require("./codeGenerator");
const service = require("./codeGenerationService");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === "function") {
      return result.then(() => { passed++; console.log(`  ok  ${name}`); }).catch((err) => { failed++; console.log(`  xx  ${name}: ${err.message}`); });
    }
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  xx  ${name}: ${err.message}`);
  }
}

function cleanup() {
  const testDir = path.join(process.cwd(), "data", "test-gen");
  if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true });
}

async function main() {
  console.log("\n=== Code Generation Engine Tests ===\n");
  cleanup();

  console.log("--- Templates ---");
  await test("listTemplates returns all templates", () => {
    const list = templates.listTemplates();
    assert.ok(list.length >= 10, "Should have 10+ templates");
    assert.ok(list.some((t) => t.category === "function"));
    assert.ok(list.some((t) => t.category === "module"));
    assert.ok(list.some((t) => t.category === "api"));
  });

  await test("getTemplate returns function template", () => {
    const fn = templates.getTemplate("function", "basic");
    assert.ok(typeof fn === "function");
    const code = fn("hello", "x, y");
    assert.ok(code.includes("function hello"));
    assert.ok(code.includes("x, y"));
  });

  await test("getTemplate returns class template", () => {
    const fn = templates.getTemplate("class", "basic");
    assert.ok(typeof fn === "function");
    const code = fn("MyClass");
    assert.ok(code.includes("class MyClass"));
    assert.ok(code.includes("module.exports"));
  });

  await test("getTemplate returns module/service template", () => {
    const fn = templates.getTemplate("module", "service");
    assert.ok(typeof fn === "function");
    const code = fn("userAuth");
    assert.ok(code.includes("function init"));
    assert.ok(code.includes("function execute"));
  });

  await test("getTemplate returns module/repository template", () => {
    const fn = templates.getTemplate("module", "repository");
    assert.ok(typeof fn === "function");
    const code = fn("users");
    assert.ok(code.includes("findAll"));
    assert.ok(code.includes("findById"));
    assert.ok(code.includes("save"));
  });

  await test("getTemplate returns api/express template", () => {
    const fn = templates.getTemplate("api", "express");
    assert.ok(typeof fn === "function");
    const code = fn("users");
    assert.ok(code.includes("router.get"));
    assert.ok(code.includes("router.post"));
  });

  await test("getTemplate returns module/test template", () => {
    const fn = templates.getTemplate("module", "test");
    assert.ok(typeof fn === "function");
    const code = fn("myModule");
    assert.ok(code.includes("assert"));
    assert.ok(code.includes("test("));
  });

  await test("getTemplate returns null for unknown", () => {
    const fn = templates.getTemplate("nonexistent", "type");
    assert.strictEqual(fn, null);
  });

  console.log("\n--- Generator ---");
  await test("generate creates function code", () => {
    const code = generator.generate("function", { name: "add", params: "a, b" });
    assert.ok(code.includes("function add"));
    assert.ok(code.includes("a, b"));
  });

  await test("generate creates class code", () => {
    const code = generator.generate("class", { name: "User" });
    assert.ok(code.includes("class User"));
  });

  await test("generate creates module code", () => {
    const code = generator.generate("service", { name: "auth" });
    assert.ok(code.includes("function init"));
  });

  await test("generate creates api code", () => {
    const code = generator.generate("express", { name: "routes" });
    assert.ok(code.includes("router"));
  });

  await test("generate returns null for unknown type", () => {
    const code = generator.generate("nonexistent/unknown");
    assert.strictEqual(code, null);
  });

  await test("generateAndSave writes file", () => {
    const filePath = path.join(process.cwd(), "data", "test-gen", "test.js");
    const result = generator.generateAndSave("function", filePath, { name: "hello" });
    assert.strictEqual(result.success, true);
    assert.ok(fs.existsSync(filePath));
    const content = fs.readFileSync(filePath, "utf8");
    assert.ok(content.includes("function hello"));
  });

  await test("generateModule creates module code", () => {
    const code = generator.generateModule("userService");
    assert.ok(code.includes("function init"));
  });

  await test("generateApi creates API code", () => {
    const code = generator.generateApi("userRoutes");
    assert.ok(code.includes("router"));
  });

  await test("generateTest creates test code", () => {
    const code = generator.generateTest("app.js");
    assert.ok(code.includes("assert"));
    assert.ok(code.includes("test("));
  });

  await test("listAllTemplates returns all", () => {
    const all = generator.listAllTemplates();
    assert.ok(all.length >= 10);
  });

  console.log("\n--- Service (Facade) ---");
  await test("service.generate works", () => {
    const code = service.generate("function", { name: "multiply", params: "a, b" });
    assert.ok(code.includes("function multiply"));
  });

  await test("service.generateModule works", () => {
    const code = service.generateModule("orderService");
    assert.ok(code.includes("init"));
  });

  await test("service.generateApi works", () => {
    const code = service.generateApi("orderRoutes");
    assert.ok(code.includes("router"));
  });

  await test("service.generateTest works", () => {
    const code = service.generateTest("auth.js");
    assert.ok(code.includes("assert"));
  });

  await test("service.getTemplates returns list", () => {
    const list = service.getTemplates();
    assert.ok(list.length >= 10);
  });

  console.log("\n=== Summary ===");
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  console.log(`  total:  ${passed + failed}\n`);

  cleanup();
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  cleanup();
  process.exit(1);
});
