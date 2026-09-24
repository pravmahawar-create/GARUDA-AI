#!/usr/bin/env node
/**
 * 🦅 GARUDA SOVEREIGN AGENT BINARY
 */
const { main } = require("../src/cli/garudaAgent");

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
