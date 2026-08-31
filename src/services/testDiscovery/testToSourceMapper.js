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

function extractImports(filePath) {
  let content;
  try { content = fs.readFileSync(filePath, "utf8"); } catch { return []; }
  let ast;
  try { ast = parser.parse(content, PARSE_OPTIONS); } catch { return []; }
  const sources = [];
  for (const node of ast.program.body) {
    if (node.type === "ImportDeclaration" && node.source && node.source.value && node.source.value.startsWith(".")) {
      sources.push(node.source.value);
    }
    if (node.type === "VariableDeclaration") {
      for (const decl of node.declarations) {
        if (decl.init && decl.init.type === "CallExpression" &&
            decl.init.callee && decl.init.callee.type === "Identifier" &&
            decl.init.callee.name === "require" &&
            decl.init.arguments.length > 0 &&
            decl.init.arguments[0].type === "StringLiteral" &&
            decl.init.arguments[0].value.startsWith(".")) {
          sources.push(decl.init.arguments[0].value);
        }
      }
    }
    if (node.type === "ExpressionStatement" &&
        node.expression.type === "CallExpression" &&
        node.expression.callee && node.expression.callee.type === "Identifier" &&
        node.expression.callee.name === "require" &&
        node.expression.arguments.length > 0 &&
        node.expression.arguments[0].type === "StringLiteral" &&
        node.expression.arguments[0].value.startsWith(".")) {
      sources.push(node.expression.arguments[0].value);
    }
  }
  return sources;
}

function resolveToSource(testPath, importSource) {
  const testDir = path.dirname(testPath);
  let resolved = path.resolve(testDir, importSource);
  const candidates = [resolved, resolved + ".js", resolved + ".jsx", resolved + ".ts", resolved + ".tsx", path.join(resolved, "index.js")];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return path.relative(process.cwd(), c).replace(/\\/g, "/");
    }
  }
  return null;
}

function mapTestsToSources(testFiles, sourceFiles) {
  const sourceSet = new Set(sourceFiles.map((f) => f.path || f));
  const testToSource = {};
  const sourceToTest = {};

  for (const tf of testFiles) {
    const testPath = typeof tf === "string" ? tf : tf.path;
    const imports = extractImports(typeof tf === "string" ? tf : tf.absolutePath);
    const matched = imports
      .map((imp) => resolveToSource(testPath, imp))
      .filter((resolved) => resolved && sourceSet.has(resolved));
    testToSource[testPath] = matched;
    for (const src of matched) {
      if (!sourceToTest[src]) sourceToTest[src] = [];
      sourceToTest[src].push(testPath);
    }
  }

  const untested = sourceFiles
    .map((f) => typeof f === "string" ? f : f.path)
    .filter((sf) => !sourceToTest[sf]);

  return {
    testToSource,
    sourceToTest,
    untestedFiles: untested,
    summary: {
      totalTestFiles: testFiles.length,
      totalSourceFiles: sourceFiles.length,
      mappedTestFiles: Object.keys(testToSource).filter((k) => testToSource[k].length > 0).length,
      testedSourceFiles: Object.keys(sourceToTest).length,
      untestedFileCount: untested.length,
      coverageRatio: sourceFiles.length > 0 ? Object.keys(sourceToTest).length / sourceFiles.length : 0
    }
  };
}

module.exports = { extractImports, resolveToSource, mapTestsToSources };
