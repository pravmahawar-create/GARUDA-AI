const path = require("path");
const { buildFileGraph } = require("./fileGraphBuilder");
const { analyzeFile } = require("./astAnalyzer");
const { buildDependencyGraph } = require("./dependencyGraphBuilder");
const { mapAllRoutes } = require("./routeMapper");
const { mapTestsToSources } = require("./testMapper");
const { loadCache, saveCache, isCacheFresh } = require("./graphCache");

let cachedGraph = null;

function buildFullGraph(root = process.cwd(), forceRefresh = false) {
  if (!forceRefresh && cachedGraph) return cachedGraph;
  if (!forceRefresh && isCacheFresh()) {
    const cached = loadCache();
    if (cached) { cachedGraph = cached; return cached; }
  }

  const fileGraph = buildFileGraph(root);
  const sourceFiles = fileGraph.files.filter((f) => f.category === "source");

  const fileAnalyses = sourceFiles.map((f) => {
    const analysis = analyzeFile(f.absolutePath);
    analysis.category = f.category;
    analysis.lines = f.lines;
    analysis.path = f.path;
    return analysis;
  });

  const allTestFiles = fileGraph.files
    .filter((f) => f.category === "test")
    .map((f) => { const a = analyzeFile(f.absolutePath); a.path = f.path; a.category = "test"; a.lines = f.lines; return a; });

  const combinedAnalyses = [...fileAnalyses, ...allTestFiles];

  const depGraph = buildDependencyGraph(combinedAnalyses, root);
  const routeMap = mapAllRoutes(fileGraph.files.filter((f) => f.category === "source" || f.category === "test").map((f) => f.path));
  const testMap = mapTestsToSources(fileGraph);

  const graph = {
    engine: "GARUDA Repository Intelligence Engine v1",
    scannedAt: new Date().toISOString(),
    root,
    fileGraph: {
      totalFiles: fileGraph.totalFiles,
      byCategory: fileGraph.byCategory,
      files: fileGraph.files
    },
    dependencyGraph: {
      nodes: depGraph.nodes,
      edges: depGraph.edges,
      dependents: depGraph.dependents,
      dependencies: depGraph.dependencies,
      impactScores: depGraph.impactScores,
      circularDeps: depGraph.circularDeps,
      summary: depGraph.summary
    },
    routeMap: routeMap,
    testMap: {
      testToSource: testMap.testToSource,
      sourceToTest: testMap.sourceToTest,
      untestedFiles: testMap.untestedFiles,
      summary: testMap.summary
    },
    fileAnalyses: fileAnalyses.map((a) => ({
      path: a.path,
      exports: [...(a.exports || []).map((e) => e.name || e.local || "?"), ...(a.moduleExports || []).map((e) => e.name)],
      functions: a.functions || [],
      classes: (a.classes || []).map((c) => c.name),
      requires: a.requires || [],
      imports: (a.imports || []).map((i) => i.source),
      error: a.error || null
    }))
  };

  cachedGraph = graph;
  try { saveCache(graph); } catch {}
  return graph;
}

function getFileStructure(filePath, root = process.cwd()) {
  const graph = buildFullGraph(root);
  const analysis = graph.fileAnalyses.find((a) => a.path === filePath);
  if (!analysis) return null;
  const fileEntry = (graph.fileGraph || {}).files ||
    (function () { const fg = buildFileGraph(root); return fg.files; })().find((f) => f.path === filePath);
  return { ...analysis, lines: fileEntry ? fileEntry.lines : 0, category: fileEntry ? fileEntry.category : "unknown" };
}

function getDependencies(filePath, root = process.cwd()) {
  const graph = buildFullGraph(root);
  return graph.dependencyGraph.dependencies[filePath] || [];
}

function getDependents(filePath, root = process.cwd()) {
  const graph = buildFullGraph(root);
  return graph.dependencyGraph.dependents[filePath] || [];
}

function getImpactScore(filePath, root = process.cwd()) {
  const graph = buildFullGraph(root);
  return graph.dependencyGraph.impactScores[filePath] || 0;
}

function getTestFile(sourcePath, root = process.cwd()) {
  const graph = buildFullGraph(root);
  return graph.testMap.sourceToTest[sourcePath] || [];
}

function getUntestedFiles(root = process.cwd()) {
  const graph = buildFullGraph(root);
  return graph.testMap.untestedFiles;
}

function getRouteMap(root = process.cwd()) {
  const graph = buildFullGraph(root);
  return graph.routeMap;
}

function searchFiles(query, root = process.cwd()) {
  const graph = buildFullGraph(root);
  const lower = query.toLowerCase();
  if (graph.fileGraph && graph.fileGraph.files) {
    return graph.fileGraph.files.filter((f) => f.path.toLowerCase().includes(lower));
  }
  const fg = buildFileGraph(root);
  return fg.files.filter((f) => f.path.toLowerCase().includes(lower));
}

function getSummary(root = process.cwd()) {
  const graph = buildFullGraph(root);
  return {
    fileGraph: graph.fileGraph,
    dependencyGraph: graph.dependencyGraph.summary,
    routeMap: graph.routeMap.summary,
    testMap: graph.testMap.summary,
    scannedAt: graph.scannedAt
  };
}

function refreshGraph(root = process.cwd()) {
  cachedGraph = null;
  return buildFullGraph(root, true);
}

module.exports = {
  buildFullGraph,
  getFileStructure,
  getDependencies,
  getDependents,
  getImpactScore,
  getTestFile,
  getUntestedFiles,
  getRouteMap,
  searchFiles,
  getSummary,
  refreshGraph
};
