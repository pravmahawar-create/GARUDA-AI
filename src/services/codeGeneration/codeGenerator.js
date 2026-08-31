const fs = require("fs");
const path = require("path");
const { getTemplate, listTemplates } = require("./codeTemplates");

function generate(type, options = {}) {
  const parts = type.split("/");
  let category, templateType;
  if (parts.length > 1) {
    category = parts[0];
    templateType = parts[1];
  } else {
    category = guessCategory(type);
    templateType = guessTemplateType(type);
  }
  const name = options.name || "myModule";
  const params = options.params || "";

  const templateFn = getTemplate(category, templateType);
  if (!templateFn) return null;
  return templateFn(name, params);
}

function guessCategory(type) {
  const map = {
    service: "module", repository: "module", middleware: "module", validator: "module", test: "module",
    express: "api", handler: "api",
    react: "component",
    class: "class", singleton: "class"
  };
  return map[type] || "function";
}

function guessTemplateType(type) {
  const map = {
    service: "service", repository: "repository", middleware: "middleware", validator: "validator", test: "test",
    express: "express", handler: "handler",
    react: "react",
    class: "basic", singleton: "singleton"
  };
  return map[type] || "basic";
}

function generateAndSave(type, filePath, options = {}) {
  const code = generate(type, options);
  if (!code) return { success: false, error: "Unknown template type" };

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, code, "utf8");
  return { success: true, filePath, code };
}

function generateModule(name, options = {}) {
  const type = options.template || "service";
  const code = generate(`module/${type}`, { name, ...options });
  return code;
}

function generateApi(name, options = {}) {
  const type = options.template || "express";
  const code = generate(`api/${type}`, { name, ...options });
  return code;
}

function generateTest(sourceFile) {
  const name = path.basename(sourceFile, path.extname(sourceFile));
  return generate("module/test", { name });
}

function listAllTemplates() {
  return listTemplates();
}

module.exports = { generate, generateAndSave, generateModule, generateApi, generateTest, listAllTemplates };
