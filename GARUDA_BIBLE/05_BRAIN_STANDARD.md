# 05 Brain Standard

## Summary
Defines required brain contract: capability map, policy controls, and reviewability.

## Highlights
- Declared capabilities and action boundaries.
- Approval-required governance.
- Traceable outputs in reports.
- Execution success requires real artifact or command evidence; report-only completion is not success.
- Test execution uses explicit targets, no shell, bounded timeouts, and captured exit evidence.
- Engineering artifacts are generated in an isolated workspace, remain new-file-only in v1, and require Founder approval before source application.
- Intelligence providers are proposal-only adapters: raw provider code is rejected, and allow-listed structured specifications must pass path, isolated execution, and Founder approval gates before they can affect GARUDA source.
- Reviewer Brain independently verifies patch and artifact hashes, real test evidence, and governance flags; its approval is technical only and cannot authorize source, Git, or deployment actions.
- Architect Brain converts bounded goals into dependency-ordered, risk-aware, read-only plans and may hand off only allow-listed structured Engineering specifications.
- Governed correction loops allow at most three attempts, stop on rejection, accept only structured revisions, preserve evidence per attempt, and still require Founder approval.
- Revenue execution missions begin only from Founder-approved, fully verified GARUDA-deliverable candidates with a currently verified commercial capability; bounded scope is required before Engineering begins.
