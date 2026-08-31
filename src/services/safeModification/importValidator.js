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

const BUILTIN_MODULES = new Set(require("module").builtinModules || [
  "assert", "buffer", "child_process", "cluster", "console", "constants",
  "crypto", "dgram", "dns", "domain", "events", "fs", "http", "https",
  "module", "net", "os", "path", "process", "punycode", "querystring",
  "readline", "repl", "stream", "string_decoder", "sys", "timers",
  "tls", "tty", "url", "util", "v8", "vm", "zlib"
]);

function extractModuleReferences(content) {
  let ast;
  try {
    ast = parser.parse(content, PARSE_OPTIONS);
  } catch {
    return [];
  }
  const refs = [];
  for (const node of ast.program.body) {
    if (node.type === "VariableDeclaration") {
      for (const decl of node.declarations) {
        if (decl.init && decl.init.type === "CallExpression" &&
            decl.init.callee && decl.init.callee.type === "Identifier" &&
            decl.init.callee.name === "require" &&
            decl.init.arguments.length > 0 &&
            decl.init.arguments[0].type === "StringLiteral") {
          refs.push(decl.init.arguments[0].value);
        }
      }
    }
    if (node.type === "ExpressionStatement" &&
        node.expression.type === "CallExpression" &&
        node.expression.callee && node.expression.callee.type === "Identifier" &&
        node.expression.callee.name === "require" &&
        node.expression.arguments.length > 0 &&
        node.expression.arguments[0].type === "StringLiteral") {
      refs.push(node.expression.arguments[0].value);
    }
    if (node.type === "ImportDeclaration" && node.source && node.source.value) {
      refs.push(node.source.value);
    }
  }
  return refs;
}

function validateImports(filePath, newContent) {
  const absolutePath = path.resolve(filePath);
  const fileDir = path.dirname(absolutePath);
  const refs = extractModuleReferences(newContent);
  const results = [];
  for (const ref of refs) {
    if (ref.startsWith(".") || ref.startsWith("/")) {
      let resolved = path.resolve(fileDir, ref);
      const candidates = [resolved, resolved + ".js", resolved + ".jsx", resolved + ".ts", resolved + ".tsx", path.join(resolved, "index.js"), path.join(resolved, "index.jsx")];
      const exists = candidates.some((c) => fs.existsSync(c));
      results.push({ ref, resolved: path.relative(process.cwd(), candidates.find((c) => fs.existsSync(c)) || resolved), exists, type: "relative" });
    } else {
      const baseName = ref.startsWith("@") ? ref.split("/").slice(0, 2).join("/") : ref.split("/")[0];
      if (BUILTIN_MODULES.has(baseName) || BUILTIN_MODULES.has(ref)) {
        results.push({ ref, resolved: ref, exists: true, type: "builtin" });
      } else {
        const nodeModulesPath = path.join(process.cwd(), "node_modules", ref);
        const pkgJsonPath = path.join(nodeModulesPath, "package.json");
        const exists = fs.existsSync(pkgJsonPath) || fs.existsSync(nodeModulesPath);
        results.push({ ref, resolved: ref, exists, type: "external" });
      }
    }
  }
  const broken = results.filter((r) => !r.exists);
  return {
    valid: broken.length === 0,
    totalRefs: results.length,
    brokenCount: broken.length,
    broken,
    all: results
  };
}

module.exports = { extractModuleReferences, validateImports };
