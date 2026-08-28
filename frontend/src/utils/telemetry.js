/**
 * GARUDA Lightweight Measurement & Telemetry System
 * Tracks conversion funnel events with automatic acquisition attribution context:
 * - page_view
 * - primary_cta_click
 * - secondary_cta_click
 * - project_scope_started
 * - project_scope_submitted
 * - whatsapp_cta_click
 * - chat_started
 */

import { getAttributionPayload } from "./attribution";

const EVENT_STORAGE_KEY = "garuda_recent_telemetry_events";

export function trackEvent(eventName, eventData = {}) {
  if (typeof window === "undefined") return null;

  try {
    const attribution = getAttributionPayload();
    const payload = {
      event: eventName,
      data: eventData,
      attribution,
      url: window.location.href,
      path: window.location.pathname,
      timestamp: new Date().toISOString()
    };

    // 1. Console in development/audit mode
    if (window.__GARUDA_DEBUG__ || process.env.NODE_ENV !== "production") {
      console.log(`[GARUDA Telemetry] ${eventName}:`, payload);
    }

    // 2. Store in session history (keeps last 50 events)
    try {
      const existing = JSON.parse(sessionStorage.getItem(EVENT_STORAGE_KEY) || "[]");
      existing.push(payload);
      if (existing.length > 50) existing.shift();
      sessionStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(existing));
    } catch {}

    // 3. Dispatch to standard analytics integrations if present
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, { ...eventData, ...attribution });
    }
    if (window.posthog && typeof window.posthog.capture === "function") {
      window.posthog.capture(eventName, { ...eventData, ...attribution });
    }

    return payload;
  } catch {
    return null;
  }
}

export function getTelemetryHistory() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(EVENT_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
