# GARUDA Multi-Agent Architecture

## Why GARUDA is provider independent

GARUDA is designed to route work through a provider-agnostic orchestration layer rather than depending on a single AI vendor. This allows the platform to preserve continuity of service, reduce vendor lock-in, and swap providers as capabilities evolve.

## How providers plug in

Each provider implements a thin adapter with a shared status shape and execution contract. New providers can be added by creating a new provider class under the providers directory and registering it with the agent manager.

## Fallback behavior

The agent manager evaluates capability routing, checks provider availability and enabled state, then routes to the highest-priority provider that can support the task. If that provider is unavailable, the request falls back to the next configured option automatically.

## How Mother Brain will orchestrate providers

Mother Brain can use this foundation to dispatch specialized tasks across providers. Coding tasks can route to Copilot or OpenAI, research tasks can route to Claude or Gemini, and offline work can route to a local provider.

The architecture remains modular so future expansion can introduce richer orchestration, retries, approval flows, cost tracking, and multi-agent collaboration.
