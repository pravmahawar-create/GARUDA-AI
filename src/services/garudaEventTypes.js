/**
 * 🦅 GARUDA Event Nervous System — Standard Event Types
 * Central dictionary of all verified business, engineering, and telemetry events.
 * Enforces stable event naming and prevents rogue string proliferation.
 */

const GARUDA_EVENT_TYPES = Object.freeze({
  // Phase 1: Inbound & Commercial Acquisition
  LEAD_CREATED: "LEAD_CREATED",
  PROPOSAL_CREATED: "PROPOSAL_CREATED",
  PROPOSAL_SENT: "PROPOSAL_SENT",
  PROPOSAL_ACCEPTED: "PROPOSAL_ACCEPTED",
  PAYMENT_ORDER_CREATED: "PAYMENT_ORDER_CREATED",
  PAYMENT_VERIFIED: "PAYMENT_VERIFIED",
  PROJECT_ACTIVATED: "PROJECT_ACTIVATED",

  // Phase 2: Governed Client Delivery Engine
  EXECUTION_PLANNED: "EXECUTION_PLANNED",
  EXECUTION_PENDING_WORKER: "EXECUTION_PENDING_WORKER",
  EXECUTION_RUNNING: "EXECUTION_RUNNING",
  TASK_COMPLETED: "TASK_COMPLETED",
  VALIDATION_STARTED: "VALIDATION_STARTED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  DELIVERY_READY: "DELIVERY_READY",
  EXECUTION_FAILED: "EXECUTION_FAILED",

  // Lifecycle Completion & Settlement
  CLIENT_DELIVERY_ACCEPTED: "CLIENT_DELIVERY_ACCEPTED",
  FINAL_PAYMENT_RECEIVED: "FINAL_PAYMENT_RECEIVED",
  PROJECT_COMPLETED: "PROJECT_COMPLETED",

  // System Failures & Observability
  SYSTEM_ERROR: "SYSTEM_ERROR"
});

const GARUDA_ENTITY_TYPES = Object.freeze({
  LEAD: "lead",
  PROPOSAL: "proposal",
  PAYMENT: "payment",
  PROJECT: "project",
  TASK: "task",
  DELIVERY: "delivery",
  SYSTEM: "system"
});

module.exports = {
  GARUDA_EVENT_TYPES,
  GARUDA_ENTITY_TYPES
};
