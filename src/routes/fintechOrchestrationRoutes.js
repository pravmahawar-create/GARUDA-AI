/**
 * 🦅 GARUDA OS — FINTECH ORCHESTRATION ROUTES
 * Express router for Sovereign Payment Orchestration & Treasury
 * Spec: GARUDA-FINTECH-SPEC-V2.0 Section 15 & 26
 * Controlled Pilot Mandate: Routes for Payments, Webhooks, Diagnostics & Treasury Metrics
 */

const express = require("express");
const router = express.Router();
const fintechController = require("../controllers/fintechController");

// Payment Lifecycle
router.post("/payments/create", fintechController.createPayment);
router.post("/payments/instructions", fintechController.getPaymentInstructions);
router.get("/payments/:id", fintechController.getPayment);

// Dynamic Fee Engine
router.get("/fees/estimate", fintechController.estimateFees);

// Provider Integrations & Health Diagnostics
router.get("/providers", fintechController.getProviders);
router.get("/providers/health", fintechController.getProvidersHealth);

// Treasury Observability & Multi-Tier Alerts
router.get("/treasury/metrics", fintechController.getTreasuryMetrics);
router.get("/treasury/alerts", fintechController.getTreasuryAlerts);
router.post("/treasury/alerts/:id/ack", fintechController.acknowledgeAlert);

// Bank Settlement Webhooks (Supports raw body or json)
router.post("/webhooks/:provider_id", express.text({ type: "*/*" }), fintechController.handleWebhook);

// Forensic Audit Trail
router.get("/audit/:id", fintechController.getAuditLogs);

module.exports = router;
