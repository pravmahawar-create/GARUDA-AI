const { logExperience, logExperiences, readExperiences, readExperiencesByGoal, getExperienceStats, clearExperiences } = require("./experienceLogger");
const { searchExperiences, getRecentExperiences, getFailedExperiences, getSuccessfulExperiences } = require("./memorySearch");
const { extractLessonsFromGoal, extractLessonsFromExperiences, saveLesson, saveLessons, readLessons, searchLessons, clearLessons } = require("./lessonExtractor");
const { createExperience, createLesson } = require("./memorySchema");

function remember(input) {
  return logExperience(input);
}

function rememberMultiple(inputs) {
  return logExperiences(inputs);
}

function recall(options = {}) {
  return searchExperiences(options.query || "", options);
}

function recallRecent(count = 10) {
  return getRecentExperiences(count);
}

function recallByGoal(goalId) {
  return readExperiencesByGoal(goalId);
}

function learnFromGoal(goalId) {
  const lessons = extractLessonsFromGoal(goalId);
  if (lessons.length > 0) saveLessons(lessons);
  return lessons;
}

function learnFromExperiences(experiences) {
  const lessons = extractLessonsFromExperiences(experiences);
  if (lessons.length > 0) saveLessons(lessons);
  return lessons;
}

function getWisdom(query) {
  return searchLessons(query);
}

function getAllWisdom() {
  return readLessons(1000);
}

function getStats() {
  const expStats = getExperienceStats();
  const lessons = readLessons(10000);
  return {
    experiences: expStats,
    lessons: { total: lessons.length },
    totalMemories: expStats.total + lessons.length
  };
}

function wipeMemory() {
  clearExperiences();
  clearLessons();
  return { message: "All memories wiped" };
}

module.exports = {
  remember, rememberMultiple, recall, recallRecent, recallByGoal,
  learnFromGoal, learnFromExperiences, getWisdom, getAllWisdom,
  getStats, wipeMemory
};
