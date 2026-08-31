const fs = require("fs");

function computeLineDiff(oldContent, newContent) {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");
  const hunks = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  let i = 0;
  while (i < maxLen) {
    const oldLine = oldLines[i] || null;
    const newLine = newLines[i] || null;
    if (oldLine !== newLine) {
      const hunkStart = i;
      while (i < maxLen && (oldLines[i] || null) !== (newLines[i] || null)) {
        i++;
      }
      hunks.push({
        start: hunkStart,
        end: i - 1,
        removed: oldLines.slice(hunkStart, i).map((line, idx) => ({ lineNum: hunkStart + idx + 1, content: line })),
        added: newLines.slice(hunkStart, i).map((line, idx) => ({ lineNum: hunkStart + idx + 1, content: line }))
      });
    } else {
      i++;
    }
  }
  return {
    oldLineCount: oldLines.length,
    newLineCount: newLines.length,
    hunks,
    totalChanges: hunks.reduce((sum, h) => sum + h.removed.length + h.added.length, 0),
    summary: hunks.length === 0 ? "no changes" : `${hunks.length} hunk(s), ${hunks.reduce((s, h) => s + h.added.length, 0)} line(s) added, ${hunks.reduce((s, h) => s + h.removed.length, 0)} line(s) removed`
  };
}

function applyDiff(oldContent, newContent) {
  const diff = computeLineDiff(oldContent, newContent);
  if (diff.hunks.length === 0) {
    return { success: true, changed: false, diff, newContent: oldContent };
  }
  return { success: true, changed: true, diff, newContent };
}

function applyPatchToFile(filePath, newContent) {
  const absolutePath = typeof filePath === "string" ? require("path").resolve(filePath) : filePath;
  if (!fs.existsSync(absolutePath)) {
    return { success: false, error: "File not found", targetPath: filePath };
  }
  const oldContent = fs.readFileSync(absolutePath, "utf8");
  const diff = computeLineDiff(oldContent, newContent);
  if (diff.hunks.length === 0) {
    return { success: true, changed: false, diff, appliedTo: filePath };
  }
  fs.writeFileSync(absolutePath, newContent, "utf8");
  const verifiedContent = fs.readFileSync(absolutePath, "utf8");
  if (verifiedContent !== newContent) {
    fs.writeFileSync(absolutePath, oldContent, "utf8");
    return { success: false, error: "Write verification failed, rolled back", diff, appliedTo: filePath };
  }
  return { success: true, changed: true, diff, appliedTo: filePath, oldHash: require("./fileBackupService").sha256(oldContent), newHash: require("./fileBackupService").sha256(newContent) };
}

function generatePatchReport(diff, filePath) {
  const lines = [`--- Patch Report for ${filePath} ---`];
  lines.push(`Total hunks: ${diff.hunks.length}`);
  lines.push(`Lines: ${diff.oldLineCount} -> ${diff.newLineCount}`);
  for (const hunk of diff.hunks) {
    lines.push(`\nHunk at line ${hunk.start + 1}:`);
    for (const r of hunk.removed) lines.push(`  - ${r.lineNum}: ${r.content}`);
    for (const a of hunk.added) lines.push(`  + ${a.lineNum}: ${a.content}`);
  }
  return lines.join("\n");
}

module.exports = { computeLineDiff, applyDiff, applyPatchToFile, generatePatchReport };
