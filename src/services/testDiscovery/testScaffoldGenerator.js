const fs = require("fs");
const path = require("path");

function generateTestScaffold(sourcePath) {
  const absolutePath = path.resolve(sourcePath);
  if (!fs.existsSync(absolutePath)) {
    return { success: false, error: "Source file not found" };
  }
  const content = fs.readFileSync(absolutePath, "utf8");
  const basename = path.basename(sourcePath).replace(/\.(js|jsx|ts|tsx)$/, "");
  const dir = path.dirname(sourcePath);
  const testFileName = `${basename}.test.js`;
  const testFilePath = path.join(dir, testFileName);

  if (fs.existsSync(testFilePath)) {
    return { success: false, error: "Test file already exists", existingPath: testFilePath };
  }

  const functions = [];
  const classes = [];
  const requirePattern = /(?:const|let|var)\s+(\w+)\s*=\s*require\(/g;
  let match;
  while ((match = requirePattern.exec(content)) !== null) {
    functions.push(match[1]);
  }
  const exportPattern = /module\.exports\s*=\s*\{([^}]+)\}/;
  const exportMatch = content.match(exportPattern);
  const exports = exportMatch
    ? exportMatch[1].split(",").map((e) => e.trim()).filter(Boolean)
    : [];

  const testLines = [
    `const assert = require("assert");`,
    ``,
  ];

  const importLine = `const { ${exports.join(", ")} } = require("./${basename}");`;
  if (exports.length > 0) {
    testLines.push(importLine);
  } else {
    testLines.push(`// TODO: Add imports from ./${basename}`);
  }

  testLines.push(``);
  testLines.push(`let passed = 0;`);
  testLines.push(`let failed = 0;`);
  testLines.push(``);
  testLines.push(`function test(name, fn) {`);
  testLines.push(`  try {`);
  testLines.push(`    fn();`);
  testLines.push(`    passed++;`);
  testLines.push(`    console.log(\`  ok  \${name}\`);`);
  testLines.push(`  } catch (err) {`);
  testLines.push(`    failed++;`);
  testLines.push(`    console.log(\`  xx  \${name}: \${err.message}\`);`);
  testLines.push(`  }`);
  testLines.push(`}`);
  testLines.push(``);

  if (exports.length > 0) {
    for (const exp of exports) {
      testLines.push(`test("${exp} is defined", () => {`);
      testLines.push(`  assert.ok(typeof ${exp} === "function" || typeof ${exp} === "object", "${exp} should be exported");`);
      testLines.push(`});`);
      testLines.push(``);
    }
  } else {
    testLines.push(`// TODO: Add tests for exported functions`);
    testLines.push(``);
  }

  testLines.push(`console.log(\`\\n  passed: \${passed}\`);`);
  testLines.push(`console.log(\`  failed: \${failed}\`);`);
  testLines.push(`if (failed > 0) process.exit(1);`);
  testLines.push(``);

  const scaffold = testLines.join("\n");
  return {
    success: true,
    testFilePath,
    testFileName,
    scaffold,
    exportsFound: exports
  };
}

function writeTestScaffold(sourcePath) {
  const result = generateTestScaffold(sourcePath);
  if (!result.success) return result;
  fs.writeFileSync(result.testFilePath, result.scaffold, "utf8");
  return { success: true, testFilePath: result.testFilePath, written: true };
}

module.exports = { generateTestScaffold, writeTestScaffold };
