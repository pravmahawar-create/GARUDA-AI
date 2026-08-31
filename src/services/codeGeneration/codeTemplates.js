const templates = {
  function: {
    basic: (name, params) => `function ${name}(${params || ""}) {\n  // TODO: implement\n  return null;\n}`,
    async: (name, params) => `async function ${name}(${params || ""}) {\n  // TODO: implement\n  return null;\n}`,
    arrow: (name, params) => `const ${name} = (${params || ""}) => {\n  // TODO: implement\n  return null;\n};`,
    exported: (name, params) => `function ${name}(${params || ""}) {\n  // TODO: implement\n  return null;\n}\n\nmodule.exports = { ${name} };`
  },
  class: {
    basic: (name) => `class ${name} {\n  constructor() {\n    // TODO: init\n  }\n\n  // TODO: methods\n}\n\nmodule.exports = { ${name} };`,
    singleton: (name) => `let instance = null;\n\nclass ${name} {\n  constructor() {\n    if (instance) return instance;\n    instance = this;\n  }\n\n  static getInstance() {\n    if (!instance) instance = new ${name}();\n    return instance;\n  }\n}\n\nmodule.exports = { ${name} };`
  },
  module: {
    service: (name) => `const fs = require("fs");\nconst path = require("path");\n\nfunction init() {\n  // TODO: initialize\n}\n\nfunction execute(input) {\n  // TODO: implement\n  return { success: true, data: null };\n}\n\nmodule.exports = { init, execute };`,
    repository: (name) => `const fs = require("fs");\nconst path = require("path");\n\nconst DATA_FILE = path.join(process.cwd(), "data", "${name}.json");\n\nfunction ensureDir() {\n  const dir = path.dirname(DATA_FILE);\n  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });\n}\n\nfunction findAll() {\n  ensureDir();\n  if (!fs.existsSync(DATA_FILE)) return [];\n  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));\n}\n\nfunction findById(id) {\n  return findAll().find((item) => item.id === id) || null;\n}\n\nfunction save(item) {\n  ensureDir();\n  const items = findAll();\n  const idx = items.findIndex((i) => i.id === item.id);\n  if (idx >= 0) items[idx] = item; else items.push(item);\n  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));\n  return item;\n}\n\nfunction remove(id) {\n  const items = findAll().filter((i) => i.id !== id);\n  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));\n}\n\nmodule.exports = { findAll, findById, save, remove };`,
    middleware: (name) => `function ${name}(req, res, next) {\n  // TODO: implement middleware\n  next();\n}\n\nmodule.exports = { ${name} };`,
    validator: (name) => `function validate${name.charAt(0).toUpperCase() + name.slice(1)}(input) {\n  const errors = [];\n  if (!input) errors.push("Input is required");\n  // TODO: add validations\n  return { valid: errors.length === 0, errors };\n}\n\nmodule.exports = { validate${name.charAt(0).toUpperCase() + name.slice(1)} };`,
    test: (name) => `const assert = require("assert");\nconst { } = require("./${name}");\n\nlet passed = 0;\nlet failed = 0;\n\nfunction test(name, fn) {\n  try {\n    fn();\n    passed++;\n    console.log(\`  ok  \${name}\`);\n  } catch (err) {\n    failed++;\n    console.log(\`  xx  \${name}: \${err.message}\`);\n  }\n}\n\n// Tests here\n\ntest("placeholder", () => {\n  assert.ok(true);\n});\n\nconsole.log(\`\\n  passed: \${passed}, failed: \${failed}\\n\`);\nif (failed > 0) process.exit(1);`
  },
  api: {
    express: (name) => `const express = require("express");\nconst router = express.Router();\n\nrouter.get("/", (req, res) => {\n  res.json({ message: "${name} endpoint" });\n});\n\nrouter.get("/:id", (req, res) => {\n  res.json({ id: req.params.id });\n});\n\nrouter.post("/", (req, res) => {\n  res.status(201).json({ created: true });\n});\n\nmodule.exports = router;`,
    handler: (name) => `async function handle${name.charAt(0).toUpperCase() + name.slice(1)}(req, res) {\n  try {\n    // TODO: implement\n    res.json({ success: true });\n  } catch (err) {\n    res.status(500).json({ error: err.message });\n  }\n}\n\nmodule.exports = { handle${name.charAt(0).toUpperCase() + name.slice(1)} };`
  },
  component: {
    react: (name) => `import React from "react";\n\nfunction ${name}({ children }) {\n  return (\n    <div className="${name.toLowerCase()}">\n      {children}\n    </div>\n  );\n}\n\nexport default ${name};`
  }
};

function getTemplate(category, type) {
  if (templates[category] && templates[category][type]) return templates[category][type];
  return null;
}

function listTemplates() {
  const result = [];
  for (const [category, types] of Object.entries(templates)) {
    for (const type of Object.keys(types)) {
      result.push({ category, type });
    }
  }
  return result;
}

module.exports = { templates, getTemplate, listTemplates };
