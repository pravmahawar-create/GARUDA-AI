const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");

const PARSE_OPTIONS = {
  sourceType: "unambiguous",
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  errorRecovery: true,
  plugins: ["dynamicImport"]
};

function extractImportsFromTest(testPath) {
  let content;
  try {
    content = fs.readFileSync(testPath, "utf8");
  } catch {
    return [];
  }

  let ast;
  try {
    ast = parser.parse(content, PARSE_OPTIONS);
  } catch {
    return [];
  }

  const sources = [];
  for (const node of ast.program.body) {
    if (node.type === "ImportDeclaration" && node.source && node.source.value) {
      if (node.source.value.startsWith(".")) {
        sources.push(node.source.value);
      }
    }
    if (node.type === "ExpressionStatement" &&
        node.expression.type === "CallExpression" &&
        node.expression.callee.name === "require" &&
        node.expression.arguments.length > 0 &&
        node.expression.arguments[0].type === "StringLiteral" &&
        node.expression.arguments[0].value.startsWith(".")) {
      sources.push(node.expression.arguments[0].value);
    }
  }
  return sources;
}

function resolveTestImport(testFile, importSource) {
  const testDir = path.dirname(testFile);
  let resolved = path.resolve(testDir, importSource);
  if (!resolved.endsWith(".js")) resolved += ".js";
  return resolved.replace(/\\/g, "/");
}

function mapTestsToSources(fileGraph) {
  const testFiles = (fileGraph.files || []).filter((f) => f.category === "test");
  const sourceFiles = (fileGraph.files || []).filter((f) => f.category === "source");

  const testToSource = {};
  const sourceToTest = {};

  for (const testFile of testFiles) {
    const imports = extractImportsFromTest(testFile.path);
    const resolvedSources = imports.map((imp) => resolveTestImport(testFile.path, imp));

    const matchedSources = resolvedSources.filter((resolved) =>
      sourceFiles.some((sf) => sf.path === resolved)
    );

    testToSource[testFile.path] = matchedSources;

    for (const source of matchedSources) {
      if (!sourceToTest[source]) sourceToTest[source] = [];
      sourceToTest[source].push(testFile.path);
    }
  }

  const untestedFiles = sourceFiles
    .filter((sf) => !sourceToTest[sf.path] || sourceToTest[sf.path].length === 0)
    .map((sf) => sf.path);

  return {
    testToSource,
    sourceToTest,
    untestedFiles,
    summary: {
      totalTestFiles: testFiles.length,
      totalSourceFiles: sourceFiles.length,
      testedSourceFiles: Object.keys(sourceToTest).length,
      untestedFileCount: untestedFiles.length,
      coverageRatio: sourceFiles.length > 0
        ? Object.keys(sourceToTest).length / sourceFiles.length
        : 0
    }
  };
}

module.exports = { extractImportsFromTest, mapTestsToSources, resolveTestImport };
