const fs = require("fs");
const path = require("path");
const { createExperience, ensureMemoryDir, EXPERIENCES_FILE } = require("./memorySchema");

function logExperience(input) {
  ensureMemoryDir();
  const experience = createExperience(input);
  const line = JSON.stringify(experience) + "\n";
  fs.appendFileSync(EXPERIENCES_FILE, line, "utf8");
  return experience;
}

function logExperiences(inputs) {
  ensureMemoryDir();
  const results = [];
  for (const input of inputs) {
    const experience = createExperience(input);
    results.push(experience);
  }
  const lines = results.map((e) => JSON.stringify(e)).join("\n") + "\n";
  fs.appendFileSync(EXPERIENCES_FILE, lines, "utf8");
  return results;
}

function readExperiences(limit = 100) {
  ensureMemoryDir();
  if (!fs.existsSync(EXPERIENCES_FILE)) return [];
  const content = fs.readFileSync(EXPERIENCES_FILE, "utf8").trim();
  if (!content) return [];
  const lines = content.split("\n").filter(Boolean);
  return lines.slice(-limit).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

function readExperiencesByGoal(goalId) {
  return readExperiences(1000).filter((e) => e.goalId === goalId);
}

function readExperiencesByType(type) {
  return readExperiences(1000).filter((e) => e.type === type);
}

function getExperienceStats() {
  const experiences = readExperiences(10000);
  const byType = {};
  const byOutcome = {};
  for (const e of experiences) {
    byType[e.type] = (byType[e.type] || 0) + 1;
    byOutcome[e.outcome] = (byOutcome[e.outcome] || 0) + 1;
  }
  return { total: experiences.length, byType, byOutcome };
}

function clearExperiences() {
  ensureMemoryDir();
  if (fs.existsSync(EXPERIENCES_FILE)) fs.writeFileSync(EXPERIENCES_FILE, "", "utf8");
}

module.exports = {
  logExperience, logExperiences, readExperiences,
  readExperiencesByGoal, readExperiencesByType,
  getExperienceStats, clearExperiences
};
