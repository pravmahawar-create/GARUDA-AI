const fs = require("fs");
const path = require("path");
const { ProductionBatchLifecycle } = require("./core/ProductionBatchLifecycle");
const lifecycle = new ProductionBatchLifecycle({ rootDir: path.resolve(__dirname, "../..") });
const command = process.argv[2] || "resume";
if (command === "environment") console.log(JSON.stringify(lifecycle.validateEnvironment({ mongoRequired: process.argv.includes("--mongo-required") }), null, 2));
else if (command === "resume") console.log(JSON.stringify(lifecycle.resume(), null, 2));
else if (command === "checkpoint") { const file = process.argv[3]; if (!file) throw new Error("checkpoint requires a JSON input file"); console.log(JSON.stringify(lifecycle.writeCheckpoint(JSON.parse(fs.readFileSync(path.resolve(file), "utf8"))), null, 2)); }
else if (command === "report") console.log(lifecycle.generateReport());
else throw new Error(`Unsupported command: ${command}`);
