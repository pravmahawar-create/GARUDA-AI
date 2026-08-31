const { readExperiences } = require("./experienceLogger");

function searchExperiences(query, options = {}) {
  const { tags = [], type = null, outcome = null, limit = 20 } = options;
  let experiences = readExperiences(5000);

  if (type) experiences = experiences.filter((e) => e.type === type);
  if (outcome) experiences = experiences.filter((e) => e.outcome === outcome);
  if (tags.length > 0) {
    experiences = experiences.filter((e) =>
      tags.some((tag) => e.tags.includes(tag))
    );
  }

  if (query) {
    const queryLower = query.toLowerCase();
    experiences = experiences.filter((e) => {
      const searchable = [
        e.action, e.error, e.lesson,
        ...(e.tags || []),
        ...(e.context ? Object.values(e.context) : [])
      ].filter(Boolean).join(" ").toLowerCase();
      return searchable.includes(queryLower);
    });
  }

  return experiences.slice(-limit);
}

function searchByGoalId(goalId) {
  return readExperiences(5000).filter((e) => e.goalId === goalId);
}

function getRecentExperiences(count = 10) {
  return readExperiences(count);
}

function getFailedExperiences() {
  return readExperiences(5000).filter((e) => e.outcome === "failure" || e.error);
}

function getSuccessfulExperiences() {
  return readExperiences(5000).filter((e) => e.outcome === "success");
}

function getExperiencesWithErrors() {
  return readExperiences(5000).filter((e) => e.error);
}

module.exports = {
  searchExperiences, searchByGoalId, getRecentExperiences,
  getFailedExperiences, getSuccessfulExperiences, getExperiencesWithErrors
};
