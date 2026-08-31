const { scanTestFiles, findTestFileForSource } = require("./testFileScanner");
const { mapTestsToSources, extractImports, resolveToSource } = require("./testToSourceMapper");
const { runTestFile, runMultipleTests } = require("./testRunner");
const { analyzeCoverage } = require("./coverageAnalyzer");
const { generateTestScaffold, writeTestScaffold } = require("./testScaffoldGenerator");

module.exports = {
  scanTestFiles,
  findTestFileForSource,
  mapTestsToSources,
  extractImports,
  resolveToSource,
  runTestFile,
  runMultipleTests,
  analyzeCoverage,
  generateTestScaffold,
  writeTestScaffold
};
