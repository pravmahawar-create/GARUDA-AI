const fs = require("fs");

function loadConstitution() {
  const text = fs.readFileSync("GARUDA_CONSTITUTION.md", "utf8");

  return {
    loaded: true,
    laws: text
      .split("\n")
      .filter(line => /^\d+\./.test(line))
      .map(line => line.replace(/^\d+\.\s*/, "")),
    philosophy: text.includes("One Command. Infinite Intelligence.")
      ? "One Command. Infinite Intelligence."
      : ""
  };
}

module.exports = { loadConstitution };
