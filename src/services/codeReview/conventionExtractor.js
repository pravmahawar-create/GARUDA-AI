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

function extractConventions(filePaths, root = process.cwd()) {
  const conventions = {
    namingPatterns: { functions: [], variables: [], files: [] },
    moduleSystem: { commonjs: 0, esm: 0 },
    exportStyle: { named: 0, default: 0, moduleExports: 0 },
    avgLineCount: 0,
    avgFunctionLength: 0,
    patterns: []
  };

  let totalLines = 0;
  let totalFunctions = 0;
  let functionLengths = [];

  for (const filePath of filePaths.slice(0, 50)) {
    const absolute = path.resolve(root, filePath);
    let content;
    try { content = fs.readFileSync(absolute, "utf8"); } catch { continue; }

    const lines = content.split("\n");
    totalLines += lines.length;

    if (content.includes("module.exports") || content.includes("require(")) conventions.moduleSystem.commonjs++;
    if (content.includes("import ") && content.includes("from ")) conventions.moduleSystem.esm++;

    if (content.includes("module.exports")) conventions.exportStyle.moduleExports++;
    if (content.includes("export default")) conventions.exportStyle.default++;
    if (content.includes("export {") || content.includes("export const")) conventions.exportStyle.named++;

    let ast;
    try { ast = parser.parse(content, PARSE_OPTIONS); } catch { continue; }

    for (const node of ast.program.body) {
      if (node.type === "FunctionDeclaration" && node.id) {
        conventions.namingPatterns.functions.push(node.id.name);
        totalFunctions++;
      }
      if (node.type === "VariableDeclaration") {
        for (const decl of node.declarations) {
          if (decl.init && (decl.init.type === "FunctionExpression" || decl.init.type === "ArrowFunctionExpression") && decl.id) {
            conventions.namingPatterns.functions.push(decl.id.name);
            totalFunctions++;
          }
        }
      }
    }
  }

  conventions.avgLineCount = filePaths.length > 0 ? Math.round(totalLines / filePaths.length) : 0;
  conventions.avgFunctionLength = totalFunctions > 0 ? Math.round(totalLines / totalFunctions) : 0;

  const camelCase = conventions.namingPatterns.functions.filter((n) => /^[a-z][a-zA-Z0-9]*$/.test(n));
  const pascalCase = conventions.namingPatterns.functions.filter((n) => /^[A-Z][a-zA-Z0-9]*$/.test(n));
  const snakeCase = conventions.namingPatterns.functions.filter((n) => /^[a-z]+_[a-z]/.test(n));

  conventions.patterns = [];
  if (camelCase.length > pascalCase.length && camelCase.length > snakeCase.length) {
    conventions.patterns.push("camelCase functions (dominant)");
  } else if (pascalCase.length > camelCase.length) {
    conventions.patterns.push("PascalCase functions (dominant)");
  } else if (snakeCase.length > 0) {
    conventions.patterns.push("snake_case functions detected");
  }

  if (conventions.moduleSystem.commonjs > conventions.moduleSystem.esm) {
    conventions.patterns.push("CommonJS modules (dominant)");
  } else if (conventions.moduleSystem.esm > 0) {
    conventions.patterns.push("ESM modules (dominant)");
  }

  return conventions;
}

module.exports = { extractConventions };
