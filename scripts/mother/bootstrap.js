const fs = require("fs");
const path = require("path");

const MODULES = [
  "scanner.js",
  "planner.js",
  "builder.js",
  "validator.js",
  "reporter.js",
  "thinker.js",
  "context.js",
  "memory.js",
  "decision.js",
  "taskQueue.js"
];

function bootstrap() {
  console.log("[Bootstrap] Starting...");

  const base = __dirname;

  MODULES.forEach(file => {
    const full = path.join(base, file);

    if (fs.existsSync(full)) {
      console.log("✅", file);
    } else {
      fs.writeFileSync(
        full,
        `// ${file}\nmodule.exports = {};\n`
      );

      console.log("🆕 Created", file);
    }
  });

  console.log("[Bootstrap] Complete");
}

module.exports = { bootstrap };

bootstrap();