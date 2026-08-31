const fs = require("fs");
const parser = require("@babel/parser");

const PARSE_OPTIONS = {
  sourceType: "unambiguous",
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  allowSuperOutsideMethod: true,
  allowUndeclaredExports: true,
  errorRecovery: true,
  plugins: ["dynamicImport", "optionalChaining", "nullishCoalescingOperator"]
};

function extractRequires(ast) {
  const requires = [];
  for (const node of ast.program.body) {
    if (node.type === "ExpressionStatement" &&
        node.expression.type === "CallExpression" &&
        node.expression.callee.type === "Identifier" &&
        node.expression.callee.name === "require" &&
        node.expression.arguments.length > 0 &&
        node.expression.arguments[0].type === "StringLiteral") {
      requires.push(node.expression.arguments[0].value);
    }
    if (node.type === "VariableDeclaration") {
      for (const decl of node.declarations) {
        if (decl.init && decl.init.type === "CallExpression" &&
            decl.init.callee && decl.init.callee.type === "Identifier" &&
            decl.init.callee.name === "require" &&
            decl.init.arguments.length > 0 &&
            decl.init.arguments[0].type === "StringLiteral") {
          requires.push(decl.init.arguments[0].value);
        }
      }
    }
  }
  return requires;
}

function extractImports(ast) {
  const imports = [];
  for (const node of ast.program.body) {
    if (node.type === "ImportDeclaration" && node.source && node.source.value) {
      const specifiers = (node.specifiers || []).map((s) => {
        if (s.type === "ImportDefaultSpecifier") return { type: "default", name: s.local.name };
        if (s.type === "ImportSpecifier") return { type: "named", name: s.imported.name || s.imported.value, local: s.local.name };
        if (s.type === "ImportNamespaceSpecifier") return { type: "namespace", name: s.local.name };
        return { type: "unknown", name: "?" };
      });
      imports.push({ source: node.source.value, specifiers });
    }
  }
  return imports;
}

function extractExports(ast) {
  const exports = [];
  for (const node of ast.program.body) {
    if (node.type === "ExportDefaultDeclaration") {
      const name = node.declaration && node.declaration.name ? node.declaration.name : "default";
      exports.push({ type: "default", name });
    }
    if (node.type === "ExportNamedDeclaration") {
      if (node.declaration) {
        if (node.declaration.type === "FunctionDeclaration") {
          exports.push({ type: "named", name: node.declaration.id.name });
        } else if (node.declaration.type === "ClassDeclaration") {
          exports.push({ type: "named", name: node.declaration.id.name });
        } else if (node.declaration.type === "VariableDeclaration") {
          for (const decl of node.declaration.declarations) {
            if (decl.id && decl.id.name) {
              exports.push({ type: "named", name: decl.id.name });
            }
          }
        }
      }
      if (node.specifiers) {
        for (const spec of node.specifiers) {
          exports.push({ type: "named", name: spec.exported.name || spec.exported.value, local: spec.local.name });
        }
      }
    }
    if (node.type === "ExportAllDeclaration" && node.source && node.source.value) {
      exports.push({ type: "all", source: node.source.value });
    }
  }
  return exports;
}

function extractModuleExports(ast) {
  const results = [];
  for (const node of ast.program.body) {
    if (node.type === "ExpressionStatement" &&
        node.expression.type === "AssignmentExpression" &&
        node.expression.left &&
        node.expression.left.type === "MemberExpression" &&
        node.expression.left.object &&
        node.expression.left.object.type === "Identifier" &&
        node.expression.left.object.name === "module" &&
        node.expression.left.property &&
        node.expression.left.property.name === "exports") {
      const right = node.expression.right;
      if (right.type === "ObjectExpression") {
        for (const prop of right.properties) {
          if (prop.type === "ObjectProperty" && prop.key) {
            const name = prop.key.name || prop.key.value;
            if (prop.value && prop.value.type === "FunctionDeclaration") {
              results.push({ name, type: "function" });
            } else {
              results.push({ name, type: "value" });
            }
          }
        }
      } else if (right.type === "Identifier") {
        results.push({ name: right.name, type: "alias" });
      }
    }
  }
  return results;
}

function extractFunctions(ast) {
  const functions = [];
  for (const node of ast.program.body) {
    if (node.type === "FunctionDeclaration" && node.id) {
      functions.push(node.id.name);
    }
    if (node.type === "VariableDeclaration") {
      for (const decl of node.declarations) {
        if (decl.init && (decl.init.type === "FunctionExpression" || decl.init.type === "ArrowFunctionExpression") && decl.id && decl.id.name) {
          functions.push(decl.id.name);
        }
      }
    }
  }
  return functions;
}

function extractClasses(ast) {
  const classes = [];
  for (const node of ast.program.body) {
    if (node.type === "ClassDeclaration" && node.id) {
      const methods = [];
      if (node.body && node.body.body) {
        for (const member of node.body.body) {
          if (member.type === "ClassMethod" && member.key) {
            methods.push(member.key.name || member.key.value);
          }
        }
      }
      classes.push({ name: node.id.name, methods });
    }
  }
  return classes;
}

function analyzeFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return { path: filePath, error: "FILE_READ_ERROR", requires: [], imports: [], exports: [], moduleExports: [], functions: [], classes: [] };
  }

  let ast;
  try {
    ast = parser.parse(content, PARSE_OPTIONS);
  } catch {
    return { path: filePath, error: "PARSE_ERROR", requires: [], imports: [], exports: [], moduleExports: [], functions: [], classes: [] };
  }

  return {
    path: filePath,
    requires: extractRequires(ast),
    imports: extractImports(ast),
    exports: extractExports(ast),
    moduleExports: extractModuleExports(ast),
    functions: extractFunctions(ast),
    classes: extractClasses(ast)
  };
}

module.exports = { analyzeFile, extractRequires, extractImports, extractExports };
