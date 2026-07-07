# GARUDA Mother Brain Orchestrator

## Engine registry

Mother Brain maintains a registry of major GARUDA engines so they can be discovered, synchronized, and monitored through a single coordination layer.

## Synchronization

The orchestrator uses shared context, an event bus, coordinated memory, and task coordination so engines communicate indirectly rather than directly controlling each other.

## Memory sharing

Memory is shared through a coordinator so recommendations, planning state, and global goals can be reused across engines.

## Task coordination

Mother Brain tracks running and global tasks so the system can maintain a unified view of ongoing work without executing changes automatically.

## Approval workflow

Any plan, recommendation, or global task remains advisory until Founder approval is granted.
