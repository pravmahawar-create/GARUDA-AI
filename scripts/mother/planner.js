function plan() {
  console.log("[Planner] Starting...");

  const tasks = [
    "Check project state",
    "Run Builder",
    "Validate output"
  ];

  tasks.forEach((task, index) => {
    console.log(`${index + 1}. ${task}`);
  });

  return tasks;
}

module.exports = { plan };
plan();