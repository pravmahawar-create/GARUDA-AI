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

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  let ast;
  try { ast = parser.parse(content, PARSE_OPTIONS); } catch { ast = null; }

  const analysis = {
    path: filePath,
    lines: lines.length,
    functions: 0,
    exports: 0,
    requires: 0,
    issues: [],
    suggestions: []
  };

  if (ast) {
    for (const node of ast.program.body) {
      if (node.type === "FunctionDeclaration") analysis.functions++;
      if (node.type === "ExportDefaultDeclaration" || node.type === "ExportNamedDeclaration") analysis.exports++;
      if (node.type === "ExpressionStatement" && node.expression?.type === "AssignmentExpression" && node.expression?.left?.property?.name === "exports") analysis.exports++;
      if (node.type === "ExpressionStatement" && node.expression?.type === "CallExpression" && node.expression?.callee?.name === "require") analysis.requires++;
      if (node.type === "VariableDeclaration") {
        for (const decl of node.declarations) {
          if (decl.init?.type === "FunctionExpression" || decl.init?.type === "ArrowFunctionExpression") analysis.functions++;
        }
      }
    }
  }

  if (lines.length > 200) {
    analysis.issues.push({ type: "long_file", severity: "warning", message: `File is ${lines.length} lines — consider splitting` });
    analysis.suggestions.push({ type: "split", description: "Split into smaller modules" });
  }

  if (analysis.functions > 15) {
    analysis.issues.push({ type: "many_functions", severity: "info", message: `${analysis.functions} functions — consider grouping` });
    analysis.suggestions.push({ type: "group", description: "Group related functions" });
  }

  const todoCount = (content.match(/TODO|FIXME|HACK/gi) || []).length;
  if (todoCount > 0) {
    analysis.issues.push({ type: "todos", severity: "info", message: `${todoCount} TODO/FIXME comments` });
  }

  return analysis;
}

function suggestModification(analysis) {
  const suggestions = [];
  for (const issue of analysis.issues) {
    if (issue.type === "long_file") {
      suggestions.push({ type: "refactor", target: analysis.path, action: "split", reason: issue.message, priority: "medium" });
    }
    if (issue.type === "many_functions") {
      suggestions.push({ type: "refactor", target: analysis.path, action: "group", reason: issue.message, priority: "low" });
    }
  }
  return suggestions;
}

function applyModification(filePath, modification, dryRun = false) {
  if (!fs.existsSync(filePath)) return { success: false, error: "File not found" };

  const content = fs.readFileSync(filePath, "utf8");
  const backup = content;

  let newContent = content;
  if (modification.action === "add_function") {
    const fn = modification.code || `function newFunction() {\n  // TODO: implement\n}\n\nmodule.exports = { newFunction };\n`;
    newContent = content + "\n" + fn;
  } else if (modification.action === "remove_todo_lines") {
    newContent = content.split("\n").filter((line) => !line.includes("TODO") && !line.includes("FIXME")).join("\n");
  } else if (modification.action === "add_header") {
    newContent = `// ${modification.header || "Auto-generated"}\n// Date: ${new Date().toISOString()}\n\n${content}`;
  } else {
    return { success: false, error: `Unknown action: ${modification.action}` };
  }

  if (dryRun) return { success: true, dryRun: true, original: content.length, modified: newContent.length };

  fs.writeFileSync(filePath, newContent, "utf8");
  return { success: true, backup: backup.length, modified: newContent.length, path: filePath };
}

function scanCodebase(root) {
  const srcDir = path.join(root, "src");
  if (!fs.existsSync(srcDir)) return [];

  const files = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules") walk(fullPath);
      else if (entry.isFile() && entry.name.endsWith(".js") && !entry.name.includes(".test.")) files.push(fullPath);
    }
  }
  walk(srcDir);
  return files;
}

function selfModify(root, dryRun = false) {
  const files = scanCodebase(root);
  const allSuggestions = [];
  const applied = [];

  for (const file of files) {
    try {
      const analysis = analyzeFile(file);
      const suggestions = suggestModification(analysis);
      allSuggestions.push(...suggestions);
    } catch {}
  }

  for (const sug of allSuggestions.slice(0, 5)) {
    if (sug.action === "remove_todo_lines" || sug.action === "add_header") {
      const result = applyModification(sug.target, sug, dryRun);
      applied.push({ ...sug, result });
    }
  }

  return { filesScanned: files.length, suggestions: allSuggestions.length, applied: applied.length, details: applied };
}

module.exports = { analyzeFile, suggestModification, applyModification, scanCodebase, selfModify };
