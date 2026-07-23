# Engineering Rules

Required sequence: **Code -> Run -> Verify -> Review Diff -> Package -> Founder Approval -> Commit/Push**.

- Inspect Git status and relevant code before editing; review status and diff after editing.
- Prefer a focused patch. Do not combine unrelated refactoring or perform a large rewrite when a safe targeted change works.
- Run targeted tests first, then broader relevant tests and available build, type-check, or lint steps. Report only commands actually run and results actually obtained.
- Add focused tests for new behavior and regressions. Preserve established architecture unless evidence requires change.
- Protect secrets: never print `.env` values, credentials, tokens, or private keys.
- Stop at a genuine blocker and report exact evidence. Do not claim progress or success without verification.
- Before a commit or push, package the tested changes for Founder review and obtain explicit approval.

## Locked Long-Term Engineering Direction

GARUDA must become progressively easier to develop. Every completed engineering batch should reduce future engineering effort: the Founder moves from commands to objectives, and recurring manual work becomes governed automation.

- The Founder must not need to remember repository locations, paths, command order, build order, test order, or packaging order. Provide complete ready-to-run workflows; prefer one command, one script, or one launcher.
- Treat GARUDA Core, Revenue Engine, Mother Brain, Local Worker Ecosystem, Development Agent, and Engineering Automation as permanent parallel tracks. Advance multiple tracks together whenever practical, without combining unrelated changes.
- Revenue remains the highest business priority. Core, Mother Brain, Development Agent, local workers, and automation changes should strengthen verified Revenue execution whenever practical.
- Build local, open, governed, auditable, extensible, and maintainable capability in the Mother Brain, planning and decision engines, Engineering Manager, Worker Dispatcher, Validator, Reporter, Learning and Execution engines, Builder, local workers, Development Agent, Knowledge Engine, Testing Engine, and Automation Engine.
- External AI systems are assistants; GARUDA remains the primary system. Replace repetitive paid or restricted dependencies with suitable local capability whenever practical.
- When repeated engineering work is found, create reusable scripts, launchers, utilities, or automation. Do not accept recurring manual work as a permanent process.
- Measure a successful batch by improved GARUDA intelligence, development ease, governed autonomy, revenue capability, local engineering capability, and reduced Founder effort whenever practical.
- Self-improvement remains governed. Constitution, governance, approval gates, security protections, and Founder final authority are never bypassed.
- Founder workflow is Copy -> Paste -> Approve -> Review. The root `garuda.ps1` launcher selects repositories internally and is the preferred one-command entry point for safe status, verification, Revenue, Self-Build, continuation, and focused packaging work.
