const fs = require("fs");

function patchFile({ filePath, find, replace }) {
  if (!fs.existsSync(filePath)) {
    return { success: false, filePath, reason: "File not found" };
  }

  const original = fs.readFileSync(filePath, "utf8");

  if (!original.includes(find)) {
    return { success: false, filePath, reason: "Find block not found" };
  }

  const updated = original.replace(find, replace);

  fs.writeFileSync(filePath, updated);

  return {
    success: true,
    filePath,
    changed: original !== updated
  };
}

module.exports = { patchFile };
