const fs = require("fs");
const path = require("path");
const ProjectMemoryEngine = require("../dev-agent/core/ProjectMemoryEngine");

const legacyMemoryFile = path.join(__dirname, "memory.json");
const engine = new ProjectMemoryEngine({
  memoryFilePath: path.join(__dirname, "../../data/dev-agent/project-memory.json")
});

function loadMemory() {
  const engineMemory = engine.loadMemory();

  let legacyData = {};
  if (fs.existsSync(legacyMemoryFile)) {
    try {
      legacyData = JSON.parse(fs.readFileSync(legacyMemoryFile, "utf8"));
    } catch {
      legacyData = {};
    }
  }

  return {
    ...legacyData,
    engine: engineMemory.engine,
    records: engineMemory.records,
    getEngine: () => engine
  };
}

function saveMemory(data = {}) {
  if (data.records && Array.isArray(data.records)) {
    data.records.forEach((record) => engine.saveRecord(record));
  } else if (data.goal || data.workflowStatus) {
    engine.saveRecord(data);
  }

  try {
    fs.writeFileSync(legacyMemoryFile, JSON.stringify(data, null, 2));
  } catch {
    // Non-fatal legacy mirror fallback
  }
}

module.exports = {
  loadMemory,
  saveMemory,
  getMemoryEngine: () => engine
};