const express = require("express");
const router = express.Router();
const repoIntel = require("../services/repositoryIntelligence/repositoryIntelligenceService");

router.get("/summary", (req, res) => {
  try {
    res.json(repoIntel.getSummary());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/graph", (req, res) => {
  try {
    res.json(repoIntel.buildFullGraph());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/file", (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: "Query parameter 'path' is required" });
    const result = repoIntel.getFileStructure(filePath);
    if (!result) return res.status(404).json({ error: "File not found in graph" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dependencies", (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: "Query parameter 'path' is required" });
    res.json({ file: filePath, dependsOn: repoIntel.getDependencies(filePath) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dependents", (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: "Query parameter 'path' is required" });
    res.json({ file: filePath, importedBy: repoIntel.getDependents(filePath) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/impact", (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: "Query parameter 'path' is required" });
    res.json({ file: filePath, impactScore: repoIntel.getImpactScore(filePath) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/tests", (req, res) => {
  try {
    const sourcePath = req.query.path;
    if (!sourcePath) return res.status(400).json({ error: "Query parameter 'path' is required" });
    res.json({ source: sourcePath, testFiles: repoIntel.getTestFile(sourcePath) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/untested", (req, res) => {
  try {
    res.json({ untestedFiles: repoIntel.getUntestedFiles() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/routes-list", (req, res) => {
  try {
    res.json(repoIntel.getRouteMap());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/search", (req, res) => {
  try {
    const q = req.query.q || "";
    if (!q) return res.status(400).json({ error: "Query parameter 'q' is required" });
    res.json({ query: q, results: repoIntel.searchFiles(q) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/refresh", (req, res) => {
  try {
    const graph = repoIntel.refreshGraph();
    res.json({ message: "Graph refreshed", scannedAt: graph.scannedAt, totalFiles: graph.fileGraph.totalFiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
