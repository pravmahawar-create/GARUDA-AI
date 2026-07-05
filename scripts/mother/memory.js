const fs = require("fs");
const path = require("path");

const MEMORY_FILE = path.join(__dirname, "memory.json");

function loadMemory() {
  if (!fs.existsSync(MEMORY_FILE)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveMemory(data) {
  fs.writeFileSync(
    MEMORY_FILE,
    JSON.stringify(data, null, 2)
  );
}

module.exports = {
  loadMemory,
  saveMemory
};