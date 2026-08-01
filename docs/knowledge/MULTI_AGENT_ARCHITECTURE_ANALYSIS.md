# Document Summary
GARUDA employs a multi-agent architecture with a provider-agnostic orchestration layer to avoid vendor lock-in and ensure continuity of service. Providers integrate via thin adapters, and the system supports fallback behavior by routing to the highest-priority available provider. Mother Brain orchestrates tasks by dispatching them to specialized providers (e.g., coding tasks to Copilot/OpenAI, research tasks to Claude/Gemini, offline work to local providers).

# Engineering Rules
- Maintain provider-agnostic orchestration.
- Implement thin adapters for new providers with a shared status shape and execution contract.
- Support fallback behavior for provider unavailability.
- Design for modularity to allow future expansion.

# Key Decisions
- **Provider-Agnostic Orchestration**: Ensures flexibility and reduces vendor lock-in.
- **Thin Adapter Integration**: Simplifies the process of adding new AI providers.
- **Fallback Behavior**: Enhances system resilience and reliability.
- **Mother Brain Orchestration**: Centralizes task dispatching to specialized providers.

# Architecture Impact
This architecture dictates a highly modular and extensible system. The core orchestration layer must be robust and capable of managing multiple AI providers seamlessly. The design requires a clear interface for provider integration and a sophisticated agent manager to handle capability routing, availability checks, and fallback mechanisms.

# Founder Intent
The Founder intends to create a resilient, flexible, and efficient AI engineering platform that is not dependent on any single AI vendor. The focus is on leveraging diverse AI capabilities while maintaining control and continuity.

# Constraints
- All providers must implement a thin adapter with a shared status shape and execution contract.
- The agent manager must handle capability routing, provider availability, and fallback.

# Open Questions
- What are the specific technical details of the "shared status shape and execution contract" for providers?
- How is "capability routing" evaluated by the agent manager?
- What are the criteria for prioritizing providers?
- How will "richer orchestration, retries, approval flows, cost tracking, and multi-agent collaboration" be integrated in future expansions?