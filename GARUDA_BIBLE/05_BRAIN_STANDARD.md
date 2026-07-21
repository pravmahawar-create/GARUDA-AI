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
