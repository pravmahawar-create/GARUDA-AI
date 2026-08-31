const path = require("path");
const { scanTestFiles } = require("./testFileScanner");
const { mapTestsToSources } = require("./testToSourceMapper");

function analyzeCoverage(sourceFiles, root = process.cwd()) {
  const testScan = scanTestFiles(root);
  const sourcePaths = sourceFiles.map((f) => typeof f === "string" ? f : f.path);
  const mapping = mapTestsToSources(testScan.files, sourcePaths);

  const covered = Object.keys(mapping.sourceToTest);
  const uncovered = mapping.untestedFiles;

  const byDirectory = {};
  for (const src of sourcePaths) {
    const dir = path.dirname(src);
    if (!byDirectory[dir]) byDirectory[dir] = { total: 0, tested: 0, untested: [] };
    byDirectory[dir].total++;
    if (covered.includes(src)) {
      byDirectory[dir].tested++;
    } else {
      byDirectory[dir].untested.push(src);
    }
  }

  for (const dir of Object.keys(byDirectory)) {
    byDirectory[dir].ratio = byDirectory[dir].total > 0
      ? byDirectory[dir].tested / byDirectory[dir].total
      : 0;
  }

  return {
    analyzedAt: new Date().toISOString(),
    totalSourceFiles: sourcePaths.length,
    testedFiles: covered.length,
    untestedFiles: uncovered.length,
    coverageRatio: sourcePaths.length > 0 ? covered.length / sourcePaths.length : 0,
    byDirectory,
    uncoveredFiles: uncovered
  };
}

module.exports = { analyzeCoverage };
