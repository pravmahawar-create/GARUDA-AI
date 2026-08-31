const path = require("path");

function resolveModulePath(fromFile, moduleName, root) {
  if (moduleName.startsWith(".") || moduleName.startsWith("/")) {
    const fromDir = path.dirname(fromFile);
    let resolved = path.resolve(fromDir, moduleName);
    if (!resolved.endsWith(".js")) resolved += ".js";
    const relative = path.relative(root, resolved).replace(/\\/g, "/");
    return relative;
  }
  return null;
}

function buildDependencyGraph(fileAnalyses, root = process.cwd()) {
  const nodes = [];
  const edges = [];
  const dependents = {};
  const dependencies = {};

  for (const analysis of fileAnalyses) {
    const filePath = analysis.path;
    nodes.push({
      id: filePath,
      category: analysis.category || "unknown",
      lines: analysis.lines || 0,
      exports: [
        ...(analysis.exports || []).map((e) => e.name || e.local || "?"),
        ...(analysis.moduleExports || []).map((e) => e.name)
      ],
      functions: analysis.functions || [],
      classes: (analysis.classes || []).map((c) => c.name),
      error: analysis.error || null
    });

    const fileDeps = [];
    const allModuleNames = [
      ...(analysis.requires || []),
      ...(analysis.imports || []).map((i) => i.source)
    ];

    for (const moduleName of allModuleNames) {
      const resolved = resolveModulePath(filePath, moduleName, root);
      if (resolved) {
        fileDeps.push(resolved);
        edges.push({ from: filePath, to: resolved, type: analysis.imports.length > 0 ? "import" : "require" });

        if (!dependents[resolved]) dependents[resolved] = [];
        dependents[resolved].push(filePath);
      }
    }

    dependencies[filePath] = fileDeps;
  }

  const impactScores = {};
  for (const node of nodes) {
    const depCount = (dependents[node.id] || []).length;
    impactScores[node.id] = depCount;
  }

  const circularDeps = detectCircularDependencies(nodes, edges);

  return {
    nodes,
    edges,
    dependents,
    dependencies,
    impactScores,
    circularDeps,
    summary: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      circularDependencyCount: circularDeps.length,
      mostDependedOn: Object.entries(impactScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([file, score]) => ({ file, dependents: score }))
    }
  };
}

function detectCircularDependencies(nodes, edges) {
  const adjacency = {};
  for (const node of nodes) adjacency[node.id] = [];
  for (const edge of edges) {
    if (adjacency[edge.from]) adjacency[edge.from].push(edge.to);
  }

  const cycles = [];
  const visited = new Set();
  const recursionStack = new Set();

  function dfs(node, path) {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    for (const neighbor of (adjacency[node] || [])) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart).concat(neighbor));
        }
      }
    }

    recursionStack.delete(node);
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}

module.exports = { buildDependencyGraph, detectCircularDependencies, resolveModulePath };
