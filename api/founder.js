/**
 * 🦅 GARUDA Founder Command API Router Alias
 * Routes /api/founder requests to founder-command.js
 */

const founderCommandHandler = require("./founder-command");

module.exports = async function handler(req, res) {
  return founderCommandHandler(req, res);
};
