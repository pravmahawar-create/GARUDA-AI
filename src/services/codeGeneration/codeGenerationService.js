const fs = require("fs");
const path = require("path");
const templates = require("./codeTemplates");
const generator = require("./codeGenerator");

function generate(type, options = {}) {
  return generator.generate(type, options);
}

function generateAndSave(type, filePath, options = {}) {
  return generator.generateAndSave(type, filePath, options);
}

function generateModule(name, options = {}) {
  return generator.generateModule(name, options);
}

function generateApi(name, options = {}) {
  return generator.generateApi(name, options);
}

function generateTest(sourceFile) {
  return generator.generateTest(sourceFile);
}

function getTemplates() {
  return templates.listTemplates();
}

function getTemplateInfo(category, type) {
  return templates.getTemplate(category, type) ? { category, type, available: true } : null;
}

module.exports = { generate, generateAndSave, generateModule, generateApi, generateTest, getTemplates, getTemplateInfo };
