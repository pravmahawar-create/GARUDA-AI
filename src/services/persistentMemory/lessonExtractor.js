const fs = require("fs");
const { createLesson, ensureMemoryDir, LESSONS_FILE } = require("./memorySchema");
const { readExperiencesByGoal, readExperiences } = require("./experienceLogger");

function extractLessonsFromGoal(goalId) {
  const experiences = readExperiencesByGoal(goalId);
  const lessons = [];

  const failedSteps = experiences.filter((e) => e.outcome === "failure" || e.error);
  for (const exp of failedSteps) {
    lessons.push(createLesson({
      experienceId: exp.id,
      goalId,
      type: "failure_lesson",
      lesson: exp.error || `Step failed: ${exp.action}`,
      pattern: exp.action,
      confidence: 0.7,
      tags: [...exp.tags, "failure", exp.type]
    }));
  }

  const successSteps = experiences.filter((e) => e.outcome === "success");
  if (successSteps.length > 3) {
    const actions = successSteps.map((s) => s.action).filter(Boolean);
    if (actions.length > 0) {
      lessons.push(createLesson({
        experienceId: successSteps[0].id,
        goalId,
        type: "success_pattern",
        lesson: `Successful approach: ${actions.join(" → ")}`,
        pattern: actions.join("|"),
        confidence: 0.8,
        tags: ["success", "pattern"]
      }));
    }
  }

  return lessons;
}

function extractLessonsFromExperiences(experiences) {
  const lessons = [];
  const errorMap = {};

  for (const exp of experiences) {
    if (exp.error) {
      const key = exp.error.substring(0, 100);
      if (!errorMap[key]) errorMap[key] = { error: exp.error, count: 0, tags: new Set() };
      errorMap[key].count++;
      if (exp.tags) exp.tags.forEach((t) => errorMap[key].tags.add(t));
    }
  }

  for (const [, data] of Object.entries(errorMap)) {
    if (data.count >= 2) {
      lessons.push(createLesson({
        type: "recurring_error",
        lesson: `Recurring error (${data.count} times): ${data.error}`,
        pattern: data.error,
        confidence: Math.min(0.9, 0.5 + data.count * 0.1),
        tags: [...data.tags, "recurring"]
      }));
    }
  }

  return lessons;
}

function saveLesson(lesson) {
  ensureMemoryDir();
  const line = JSON.stringify(lesson) + "\n";
  fs.appendFileSync(LESSONS_FILE, line, "utf8");
  return lesson;
}

function saveLessons(lessons) {
  ensureMemoryDir();
  const lines = lessons.map((l) => JSON.stringify(l)).join("\n") + "\n";
  if (lessons.length > 0) fs.appendFileSync(LESSONS_FILE, lines, "utf8");
  return lessons;
}

function readLessons(limit = 100) {
  ensureMemoryDir();
  if (!fs.existsSync(LESSONS_FILE)) return [];
  const content = fs.readFileSync(LESSONS_FILE, "utf8").trim();
  if (!content) return [];
  const lines = content.split("\n").filter(Boolean);
  return lines.slice(-limit).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

function searchLessons(query) {
  const lessons = readLessons(1000);
  if (!query) return lessons;
  const q = query.toLowerCase();
  return lessons.filter((l) => {
    const searchable = [l.lesson, l.pattern, ...(l.tags || [])].join(" ").toLowerCase();
    return searchable.includes(q);
  });
}

function clearLessons() {
  ensureMemoryDir();
  if (fs.existsSync(LESSONS_FILE)) fs.writeFileSync(LESSONS_FILE, "", "utf8");
}

module.exports = {
  extractLessonsFromGoal, extractLessonsFromExperiences,
  saveLesson, saveLessons, readLessons, searchLessons, clearLessons
};
