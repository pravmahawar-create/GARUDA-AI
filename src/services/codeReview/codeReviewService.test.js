const assert = require("assert");
const path = require("path");
const { extractConventions } = require("./conventionExtractor");
const { buildReviewPrompt, buildStructuralReview } = require("./reviewPromptBuilder");
const { parseReviewResponse, mergeReviewResults } = require("./reviewAnalyzer");
const { aggregateReviews } = require("./reviewVerdictAggregator");
const { reviewFileSync } = require("./codeReviewService");

const ROOT = process.cwd();
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

async function main() {
  console.log("\n=== Semantic Code Review Engine Tests ===\n");

  console.log("--- Convention Extractor ---");
  await test("extractConventions analyzes codebase", () => {
    const files = [
      "src/services/repositoryIntelligence/fileGraphBuilder.js",
      "src/services/safeModification/fileBackupService.js",
      "src/services/testDiscovery/testRunner.js"
    ];
    const conv = extractConventions(files, ROOT);
    assert.ok(conv.moduleSystem, "Should have moduleSystem");
    assert.ok(conv.exportStyle, "Should have exportStyle");
    assert.ok(Array.isArray(conv.patterns), "Should have patterns");
    assert.ok(conv.avgLineCount > 0, "Should have avgLineCount");
  });

  await test("extractConventions detects CommonJS", () => {
    const conv = extractConventions(["src/services/repositoryIntelligence/fileGraphBuilder.js"], ROOT);
    assert.ok(conv.moduleSystem.commonjs > 0, "Should detect CommonJS");
  });

  console.log("\n--- Review Prompt Builder ---");
  await test("buildReviewPrompt creates prompt", () => {
    const prompt = buildReviewPrompt("function hello() { return 1; }", "test.js");
    assert.ok(prompt.includes("test.js"), "Should include file path");
    assert.ok(prompt.includes("APPROVE"), "Should include verdict options");
    assert.ok(prompt.includes("JSON"), "Should mention JSON format");
  });

  await test("buildReviewPrompt includes conventions", () => {
    const prompt = buildReviewPrompt("code", "test.js", { patterns: ["CommonJS modules"] });
    assert.ok(prompt.includes("CommonJS"), "Should include conventions");
  });

  console.log("\n--- Structural Review ---");
  await test("buildStructuralReview passes clean code", () => {
    const review = buildStructuralReview("function hello() { return 1; }", "test.js");
    assert.strictEqual(review.verdict, "APPROVE");
    assert.ok(review.score >= 80, "Score should be high");
    assert.strictEqual(review.method, "structural");
  });

  await test("buildStructuralReview detects eval", () => {
    const review = buildStructuralReview('eval("code")', "test.js");
    assert.strictEqual(review.verdict, "REJECT");
    assert.ok(review.score < 70, "Score should be low");
    assert.ok(review.issues.some((i) => i.message.includes("eval")));
  });

  await test("buildStructuralReview detects secrets", () => {
    const review = buildStructuralReview('const key = process.env.SECRET_KEY', "test.js");
    assert.strictEqual(review.verdict, "REJECT");
    assert.ok(review.issues.some((i) => i.message.includes("secret")));
  });

  await test("buildStructuralReview detects deep nesting", () => {
    const deepCode = "if (a) {\n  if (b) {\n    if (c) {\n      if (d) {\n        if (e) {\n          if (f) {\n            if (g) {\n              x();\n            }\n          }\n        }\n      }\n    }\n  }\n}";
    const review = buildStructuralReview(deepCode, "test.js");
    assert.ok(review.issues.some((i) => i.message.includes("nesting")));
  });

  console.log("\n--- Review Analyzer ---");
  await test("parseReviewResponse parses valid JSON", () => {
    const response = '{"verdict":"APPROVE","score":85,"issues":[],"strengths":["clean code"],"summary":"Good"}';
    const result = parseReviewResponse(response);
    assert.ok(result, "Should parse");
    assert.strictEqual(result.verdict, "APPROVE");
    assert.strictEqual(result.score, 85);
  });

  await test("parseReviewResponse handles text around JSON", () => {
    const response = 'Here is my review:\n{"verdict":"REQUEST_CHANGES","score":60,"issues":[],"strengths":[],"summary":"fix stuff"}\nDone.';
    const result = parseReviewResponse(response);
    assert.ok(result, "Should parse despite surrounding text");
    assert.strictEqual(result.verdict, "REQUEST_CHANGES");
  });

  await test("parseReviewResponse returns null for invalid", () => {
    const result = parseReviewResponse("no json here");
    assert.strictEqual(result, null);
  });

  await test("mergeReviewResults combines reviews", () => {
    const structural = { verdict: "APPROVE", score: 90, issues: [], strengths: ["clean"] };
    const llm = { verdict: "REQUEST_CHANGES", score: 70, issues: [{ severity: "warning", message: "style" }], strengths: [] };
    const merged = mergeReviewResults(structural, llm);
    assert.strictEqual(merged.verdict, "REQUEST_CHANGES");
    assert.strictEqual(merged.score, 80);
    assert.strictEqual(merged.issues.length, 1);
  });

  console.log("\n--- Verdict Aggregator ---");
  await test("aggregateReviews combines multiple reviews", () => {
    const reviews = [
      { verdict: "APPROVE", score: 85, issues: [], strengths: ["good"] },
      { verdict: "APPROVE", score: 90, issues: [], strengths: ["clean"] }
    ];
    const agg = aggregateReviews(reviews);
    assert.strictEqual(agg.verdict, "APPROVE");
    assert.strictEqual(agg.score, 88);
    assert.strictEqual(agg.reviewCount, 2);
  });

  await test("aggregateReviews handles REJECT", () => {
    const reviews = [
      { verdict: "APPROVE", score: 85, issues: [], strengths: [] },
      { verdict: "REJECT", score: 30, issues: [], strengths: [] }
    ];
    const agg = aggregateReviews(reviews);
    assert.strictEqual(agg.verdict, "REJECT");
  });

  await test("aggregateReviews handles empty", () => {
    const agg = aggregateReviews([]);
    assert.strictEqual(agg.verdict, "NO_REVIEW");
  });

  console.log("\n--- Code Review Service ---");
  await test("reviewFileSync performs structural review", () => {
    const review = reviewFileSync("function hello() { return 1; }", "test.js");
    assert.ok(review.verdict, "Should have verdict");
    assert.ok(typeof review.score === "number", "Should have score");
    assert.strictEqual(review.method, "structural");
  });

  await test("service can be imported without error", () => {
    const svc = require("./codeReviewService");
    assert.ok(svc, "Should export");
    assert.ok(typeof svc.reviewCode === "function");
    assert.ok(typeof svc.reviewFileSync === "function");
    assert.ok(typeof svc.extractConventions === "function");
  });

  console.log("\n=== Summary ===");
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  console.log(`  total:  ${passed + failed}\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
