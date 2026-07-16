const fs = require("fs");
const path = require("path");
const { evaluateConstitutionGate } = require("./mother/constitution");

const PROTECTED_FILES = [
  "frontend/src/App.jsx",
  "frontend/src/style.css"
];

function exists(file) {
  return fs.existsSync(file);
}

function writeIfMissing(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const constitutionGate = evaluateConstitutionGate("file_write");
  if (!constitutionGate.allowed) {
    console.log("BLOCKED_BY_CONSTITUTION:", file, "constitution_validation_failed");
    process.exitCode = 1;
    return;
  }

  if (PROTECTED_FILES.includes(file) && exists(file)) {
    console.log("SKIPPED protected file:", file);
    return;
  }

  if (exists(file)) {
    console.log("SKIPPED existing file:", file);
    return;
  }

  fs.writeFileSync(file, content);
  console.log("CREATED:", file);
}

console.log("GARUDA Safe Builder");
console.log("===================");

writeIfMissing(
  "frontend/src/services/api.js",
  `const API_BASE = "http://localhost:3000";

export async function checkHealth() {
  const res = await fetch(\`\${API_BASE}/api/health\`);
  return res.json();
}

export async function askRag(question) {
  const res = await fetch(\`\${API_BASE}/api/rag/answer\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });

  return res.json();
}
`
);

writeIfMissing(
  "frontend/src/App.jsx",
  `// Protected by GARUDA Safe Builder.`
);

writeIfMissing(
  "frontend/src/style.css",
  `/* Protected by GARUDA Safe Builder */`
);

console.log("GARUDA Safe Builder completed.");