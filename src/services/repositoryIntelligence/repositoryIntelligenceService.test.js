const assert = require("assert");
const path = require("path");
const { buildFileGraph, categorizeFile } = require("./fileGraphBuilder");
const { analyzeFile } = require("./astAnalyzer");
const { buildDependencyGraph } = require("./dependencyGraphBuilder");
const { extractRoutesFromFile, mapAllRoutes } = require("./routeMapper");
const { mapTestsToSources, extractImportsFromTest } = require("./testMapper");
const { loadCache, saveCache, isCacheFresh, buildFileHashes, detectChangedFiles } = require("./graphCache");
const repoIntel = require("./repositoryIntelligenceService");

const ROOT = path.resolve(__dirname, "..", "..", "..");

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
  console.log("\n=== Repository Intelligence Engine Tests ===\n");

  console.log("--- File Graph Builder ---");
  await test("buildFileGraph returns file list", () => {
    const graph = buildFileGraph(ROOT);
    assert.ok(graph.totalFiles > 0, "Should find files");
    assert.ok(graph.files.length > 0, "Files array should not be empty");
  });

  await test("buildFileGraph categorizes files", () => {
    const graph = buildFileGraph(ROOT);
    assert.ok(graph.byCategory.source > 0, "Should have source files");
    assert.ok(graph.byCategory.test > 0, "Should have test files");
  });

  await test("categorizeFile identifies test files", () => {
    assert.strictEqual(categorizeFile("src/services/foo.test.js"), "test");
    assert.strictEqual(categorizeFile("src/routes/bar.spec.js"), "test");
  });

  await test("categorizeFile identifies source files", () => {
    assert.strictEqual(categorizeFile("src/services/foo.js"), "source");
    assert.strictEqual(categorizeFile("src/routes/bar.jsx"), "source");
  });

  await test("categorizeFile identifies config files", () => {
    assert.strictEqual(categorizeFile("package.json"), "config");
    assert.strictEqual(categorizeFile(".env"), "config");
  });

  await test("buildFileGraph excludes node_modules", () => {
    const graph = buildFileGraph(ROOT);
    const hasNodeModules = graph.files.some((f) => f.path.includes("node_modules/"));
    assert.ok(!hasNodeModules, "Should not include node_modules");
  });

  console.log("\n--- AST Analyzer ---");
  await test("analyzeFile parses a known file", () => {
    const result = analyzeFile(path.join(ROOT, "src", "services", "repositoryIntelligence", "fileGraphBuilder.js"));
    assert.ok(result.functions.length > 0, "Should find functions");
    assert.ok(result.exports.length > 0 || result.moduleExports.length > 0, "Should find exports");
  });

  await test("analyzeFile handles missing file", () => {
    const result = analyzeFile(path.join(ROOT, "nonexistent-file.js"));
    assert.strictEqual(result.error, "FILE_READ_ERROR");
  });

  await test("analyzeFile extracts require calls", () => {
    const result = analyzeFile(path.join(ROOT, "src", "services", "repositoryIntelligence", "dependencyGraphBuilder.js"));
    assert.ok(result.requires.length > 0, "Should find require calls");
  });

  console.log("\n--- Dependency Graph Builder ---");
  await test("buildDependencyGraph builds nodes and edges", () => {
    const graph = buildFileGraph(ROOT);
    const sourceFiles = graph.files.filter((f) => f.category === "source").slice(0, 20);
    const analyses = sourceFiles.map((f) => {
      const a = analyzeFile(f.absolutePath);
      a.path = f.path;
      a.category = f.category;
      a.lines = f.lines;
      return a;
    });
    const depGraph = buildDependencyGraph(analyses, ROOT);
    assert.ok(depGraph.nodes.length > 0, "Should have nodes");
    assert.ok(typeof depGraph.impactScores === "object", "Should have impact scores");
  });

  console.log("\n--- Route Mapper ---");
  await test("extractRoutesFromFile finds routes", () => {
    const routes = extractRoutesFromFile(path.join(ROOT, "src", "routes", "repositoryIntelRoutes.js"));
    assert.ok(routes.length > 0, "Should find routes in our own route file");
    assert.ok(routes.some((r) => r.method === "GET"), "Should find GET routes");
  });

  await test("mapAllRoutes maps multiple files", () => {
    const graph = buildFileGraph(ROOT);
    const routeFiles = graph.files
      .filter((f) => f.category === "source" && f.path.includes("routes/"))
      .slice(0, 5)
      .map((f) => f.path);
    const result = mapAllRoutes(routeFiles);
    assert.ok(result.summary.totalRoutes > 0, "Should find routes");
  });

  console.log("\n--- Test Mapper ---");
  await test("mapTestsToSources maps tests to sources", () => {
    const graph = buildFileGraph(ROOT);
    const result = mapTestsToSources(graph);
    assert.ok(result.summary.totalTestFiles > 0, "Should find test files");
    assert.ok(result.summary.totalSourceFiles > 0, "Should find source files");
  });

  await test("mapTestsToSources identifies untested files", () => {
    const graph = buildFileGraph(ROOT);
    const result = mapTestsToSources(graph);
    assert.ok(Array.isArray(result.untestedFiles), "Untested files should be an array");
  });

  console.log("\n--- Graph Cache ---");
  await test("saveCache and loadCache roundtrip", () => {
    const testPath = path.join(ROOT, "data", "test-cache.json");
    const testData = { test: true, timestamp: new Date().toISOString() };
    saveCache(testData, testPath);
    const loaded = loadCache(testPath);
    assert.deepStrictEqual(loaded, testData);
    const fs = require("fs");
    fs.unlinkSync(testPath);
  });

  await test("buildFileHashes computes hashes", () => {
    const graph = buildFileGraph(ROOT);
    const hashes = buildFileHashes(graph.files.slice(0, 10));
    assert.ok(Object.keys(hashes).length === 10, "Should have 10 hashes");
    assert.ok(Object.values(hashes).every((h) => h !== null), "All hashes should be non-null");
  });

  await test("detectChangedFiles detects changes", () => {
    const old = { "a.js": "hash1", "b.js": "hash2", "c.js": "hash3" };
    const updated = { "a.js": "hash1", "b.js": "hash_new", "d.js": "hash4" };
    const changes = detectChangedFiles(old, updated);
    assert.ok(changes.changed.includes("b.js"), "Should detect changed file");
    assert.ok(changes.added.includes("d.js"), "Should detect added file");
    assert.ok(changes.removed.includes("c.js"), "Should detect removed file");
  });

  console.log("\n--- Repository Intelligence Service (Facade) ---");
  await test("buildFullGraph returns complete graph", () => {
    const graph = repoIntel.buildFullGraph(ROOT);
    assert.ok(graph.engine.includes("Repository Intelligence"), "Should have engine name");
    assert.ok(graph.fileGraph.totalFiles > 0, "Should have files");
    assert.ok(graph.dependencyGraph.nodes.length > 0, "Should have dependency nodes");
    assert.ok(typeof graph.routeMap === "object", "Should have route map");
    assert.ok(typeof graph.testMap === "object", "Should have test map");
  });

  await test("getSummary returns summary", () => {
    const summary = repoIntel.getSummary(ROOT);
    assert.ok(summary.fileGraph, "Should have fileGraph");
    assert.ok(summary.dependencyGraph, "Should have dependencyGraph");
    assert.ok(summary.testMap, "Should have testMap");
  });

  await test("getFileStructure returns file info", () => {
    const result = repoIntel.getFileStructure("src/services/repositoryIntelligence/fileGraphBuilder.js", ROOT);
    assert.ok(result, "Should return result");
    assert.ok(result.functions.length > 0, "Should have functions");
  });

  await test("getDependencies returns array", () => {
    const deps = repoIntel.getDependencies("src/services/repositoryIntelligence/repositoryIntelligenceService.js", ROOT);
    assert.ok(Array.isArray(deps), "Should return array");
    assert.ok(deps.length > 0, "Should have dependencies");
  });

  await test("getDependents returns array", () => {
    const deps = repoIntel.getDependents("src/services/repositoryIntelligence/fileGraphBuilder.js", ROOT);
    assert.ok(Array.isArray(deps), "Should return array");
  });

  await test("getImpactScore returns number", () => {
    const score = repoIntel.getImpactScore("src/services/repositoryIntelligence/fileGraphBuilder.js", ROOT);
    assert.strictEqual(typeof score, "number", "Should return number");
  });

  await test("getRouteMap returns route data", () => {
    const routes = repoIntel.getRouteMap(ROOT);
    assert.ok(routes.summary, "Should have summary");
    assert.ok(routes.summary.totalRoutes > 0, "Should find routes");
  });

  await test("getUntestedFiles returns array", () => {
    const untested = repoIntel.getUntestedFiles(ROOT);
    assert.ok(Array.isArray(untested), "Should return array");
  });

  await test("refreshGraph rebuilds graph", () => {
    const graph = repoIntel.refreshGraph(ROOT);
    assert.ok(graph.scannedAt, "Should have scannedAt timestamp");
    assert.ok(graph.fileGraph.totalFiles > 0, "Should have files");
  });

  console.log("\n--- Integration: App.js Route Mounting ---");
  await test("routes can be imported without error", () => {
    const router = require("../../routes/repositoryIntelRoutes");
    assert.ok(router, "Should export router");
  });

  console.log("\n=== Summary ===");
  console.log(`  passed: ${passed}`);
  console.log(`  failed: ${failed}`);
  console.log(`  total:  ${passed + failed}`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
