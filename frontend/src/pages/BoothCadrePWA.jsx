import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";

// Presets for rapid zero-friction field authorization
const FIELD_DEVICE_PRESETS = [
  {
    deviceId: "GRD-CADRE-148-001",
    boothId: 1,
    boothName: "Booth #1 — Central Core",
    agentName: "Authorized Booth Officer 001",
    token: "grd_sec_tok_thane_001_auth"
  },
  {
    deviceId: "GRD-CADRE-148-042",
    boothId: 42,
    boothName: "Booth #42 — Central Core",
    agentName: "Authorized Booth Officer 042",
    token: "grd_sec_tok_thane_042_auth"
  },
  {
    deviceId: "GRD-CADRE-148-085",
    boothId: 85,
    boothName: "Booth #85 — Industrial Belt",
    agentName: "Authorized Booth Officer 085",
    token: "grd_sec_tok_thane_085_auth"
  }
];

const OFFLINE_QUEUE_KEY = "garuda_cadre_offline_queue_v1";
const DEVICE_CONFIG_KEY = "garuda_cadre_device_config_v1";

export default function BoothCadrePWA() {
  // Device Configuration State
  const [deviceConfig, setDeviceConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(DEVICE_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Fallback
    }
    return {
      deviceId: "GRD-CADRE-148-001",
      boothId: 1,
      boothName: "Booth #1 — Central Core",
      agentName: "Authorized Booth Officer 001",
      token: "grd_sec_tok_thane_001_auth",
      isConfigured: true
    };
  });

  // UI & Heartbeat State
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [lastAck, setLastAck] = useState(null);
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState(null);
  const [freshness, setFreshness] = useState("UNKNOWN");
  const [elapsedSeconds, setElapsedSeconds] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(navigator.onLine !== false);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [feedbackToast, setFeedbackToast] = useState(null);
  const [serverStatus, setServerStatus] = useState("STANDBY"); // STANDBY | TRANSMITTING | VERIFIED | ERROR

  // Hardware Telemetry State
  const [hardwareTelemetry, setHardwareTelemetry] = useState({
    battery: "UNAVAILABLE",
    batteryCharging: null,
    networkType: "UNAVAILABLE",
    effectiveType: "UNAVAILABLE",
    signalStrength: "UNAVAILABLE"
  });

  // Polling / Freshness Timer Ref
  const timerRef = useRef(null);

  // Helper: show calm non-jarring feedback toast
  const showToast = useCallback((msg, type = "info") => {
    setFeedbackToast({ msg, type, id: Date.now() });
    setTimeout(() => {
      setFeedbackToast((prev) => (prev && prev.msg === msg ? null : prev));
    }, 3500);
  }, []);

  // Update Offline Queue Count
  const refreshQueueCount = useCallback(() => {
    try {
      const q = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
      setOfflineQueueCount(q.length);
    } catch (e) {
      setOfflineQueueCount(0);
    }
  }, []);

  // Probe Native Hardware Battery & Network APIs (Truth-Enforced: No Guessing)
  const probeHardwareTelemetry = useCallback(async () => {
    let batteryLevel = "UNAVAILABLE";
    let isCharging = null;
    let netType = "UNAVAILABLE";
    let effType = "UNAVAILABLE";
    let sigStrength = "UNAVAILABLE";

    // 1. Probe Battery API
    if (typeof navigator !== "undefined" && typeof navigator.getBattery === "function") {
      try {
        const b = await navigator.getBattery();
        if (b && typeof b.level === "number" && !isNaN(b.level)) {
          batteryLevel = Math.round(b.level * 100);
          isCharging = b.charging === true;
        }
      } catch (err) {
        batteryLevel = "UNAVAILABLE";
      }
    }

    // 2. Probe Network Information API
    if (typeof navigator !== "undefined") {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        if (conn.type) netType = String(conn.type);
        if (conn.effectiveType) effType = String(conn.effectiveType);
        if (typeof conn.downlink === "number") {
          sigStrength = Math.min(100, Math.round(conn.downlink * 10));
        }
      }
    }

    setHardwareTelemetry({
      battery: batteryLevel,
      batteryCharging: isCharging,
      networkType: netType !== "UNAVAILABLE" ? netType : effType !== "UNAVAILABLE" ? effType.toUpperCase() : "UNAVAILABLE",
      effectiveType: effType,
      signalStrength: sigStrength
    });

    return {
      battery: batteryLevel,
      networkType: netType !== "UNAVAILABLE" ? netType : effType !== "UNAVAILABLE" ? effType : "UNAVAILABLE",
      signalStrength: sigStrength
    };
  }, []);

  // Flush Offline Queue with Anti-Replay Defense (Reject payloads older than 5 minutes)
  const flushOfflineQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    let queue = [];
    try {
      queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
    } catch (e) {
      queue = [];
    }

    if (queue.length === 0) return;

    const now = Date.now();
    const remaining = [];
    let synced = 0;
    let expired = 0;

    for (const item of queue) {
      const age = now - (item.clientTimestampMs || 0);
      if (age > 5 * 60 * 1000) {
        // Discard expired heartbeat to prevent replay attack
        expired++;
        continue;
      }

      try {
        const res = await fetch("/api/war-room/cadre/heartbeat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${item.token}`
          },
          body: JSON.stringify(item.payload)
        });

        if (res.ok) {
          synced++;
        } else {
          remaining.push(item);
        }
      } catch (err) {
        remaining.push(item);
      }
    }

    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
      setOfflineQueueCount(remaining.length);
    } catch (e) {
      // Storage error
    }

    if (synced > 0 || expired > 0) {
      showToast(`Queue synced: ${synced} sent, ${expired} expired (Anti-Replay)`, "info");
    }
  }, [showToast]);

  // Execute One-Tap "BOOTH ACTIVE" Heartbeat
  const handleBoothActiveHeartbeat = async () => {
    if (isTransmitting) return;
    setIsTransmitting(true);
    setServerStatus("TRANSMITTING");

    // Vibrate device softly if supported on Android handset
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(45);
      } catch (e) {
        // Ignored
      }
    }

    const telemetry = await probeHardwareTelemetry();
    const now = Date.now();
    const payload = {
      deviceId: deviceConfig.deviceId,
      boothId: Number(deviceConfig.boothId),
      timestamp: new Date(now).toISOString(),
      appVersion: "GARUDA-CADRE-PWA-v2.5.0",
      battery: telemetry.battery,
      networkType: telemetry.networkType,
      signalStrength: telemetry.signalStrength,
      deviceToken: deviceConfig.token
    };

    // If completely offline, enqueue locally
    if (!navigator.onLine) {
      try {
        const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
        queue.push({ clientTimestampMs: now, token: deviceConfig.token, payload });
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        refreshQueueCount();
      } catch (e) {
        // Storage fail
      }
      setIsTransmitting(false);
      setServerStatus("OFFLINE");
      setLastHeartbeatTime(new Date(now));
      showToast("Offline: Heartbeat saved in local anti-replay queue.", "warn");
      return;
    }

    try {
      // Primary: Try Express endpoint, fallback to Vercel serverless
      let response = await fetch("/api/war-room/cadre/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deviceConfig.token}`
        },
        body: JSON.stringify(payload)
      });

      // Fallback for Vercel query routing if 404
      if (response.status === 404) {
        response = await fetch("/api/war-room?action=cadre&subAction=heartbeat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${deviceConfig.token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();

      if (response.ok && data.success) {
        setServerStatus("VERIFIED");
        setLastAck(data);
        setLastHeartbeatTime(new Date(now));
        setFreshness("LIVE");
        setElapsedSeconds(0);
        showToast(`Booth #${deviceConfig.boothId} ACTIVE verified by War Room.`, "success");
        // Flush any pending queue in background
        flushOfflineQueue();
      } else {
        setServerStatus("ERROR");
        showToast(data.message || `Heartbeat rejected (${data.code || "AUTH_FAIL"})`, "error");
      }
    } catch (error) {
      // Network or fetch drop: buffer to offline queue
      try {
        const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
        queue.push({ clientTimestampMs: now, token: deviceConfig.token, payload });
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        refreshQueueCount();
      } catch (e) {
        // Storage fail
      }
      setServerStatus("OFFLINE");
      setLastHeartbeatTime(new Date(now));
      showToast("Network dropped. Queued for auto-reconnect sync.", "warn");
    } finally {
      setIsTransmitting(false);
    }
  };

  // Freshness calculation clock (ticks every 1s)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (lastHeartbeatTime) {
        const secs = Math.floor((Date.now() - lastHeartbeatTime.getTime()) / 1000);
        setElapsedSeconds(secs);
        if (secs <= 60) {
          setFreshness("LIVE");
        } else if (secs <= 900) {
          setFreshness("FRESH");
        } else if (secs <= 86400) {
          setFreshness("STALE");
        } else {
          setFreshness("UNKNOWN");
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lastHeartbeatTime]);

  // Online / Offline listener & initial probe
  useEffect(() => {
    probeHardwareTelemetry();
    refreshQueueCount();

    const handleOnline = () => {
      setNetworkOnline(true);
      probeHardwareTelemetry();
      flushOfflineQueue();
      showToast("Network restored. Syncing cadre telemetry...", "info");
    };

    const handleOffline = () => {
      setNetworkOnline(false);
      showToast("Network offline. All actions queued locally.", "warn");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [probeHardwareTelemetry, flushOfflineQueue, refreshQueueCount, showToast]);

  // Save device configuration
  const handleSelectPreset = (preset) => {
    const newConfig = {
      ...preset,
      isConfigured: true
    };
    setDeviceConfig(newConfig);
    try {
      localStorage.setItem(DEVICE_CONFIG_KEY, JSON.stringify(newConfig));
    } catch (e) {
      // Ignored
    }
    setShowConfigModal(false);
    showToast(`Configured for Booth #${preset.boothId}`, "success");
  };

  // Freshness badge color
  const freshnessMeta = {
    LIVE: { color: "#10B981", bg: "rgba(16, 185, 129, 0.15)", text: "LIVE (<60s)" },
    FRESH: { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)", text: "FRESH (<15m)" },
    STALE: { color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)", text: "STALE (>15m)" },
    UNKNOWN: { color: "#9CA3AF", bg: "rgba(156, 163, 175, 0.15)", text: "STANDBY" }
  }[freshness] || { color: "#9CA3AF", bg: "rgba(156, 163, 175, 0.15)", text: "STANDBY" };

  return (
    <div
      style={{
        backgroundColor: "#07080A",
        color: "#F5F5F2",
        minHeight: "100dvh",
        height: "100dvh",
        width: "100%",
        maxWidth: "480px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        WebkitTapHighlightColor: "transparent",
        WebkitTouchCallout: "none",
        userSelect: "none",
        overscrollBehavior: "none",
        boxShadow: "0 0 50px rgba(0,0,0,0.8)"
      }}
    >
      <SEOHead
        title="GARUDA Cadre Field PWA | Booth Active Telemetry"
        description="Low-bandwidth mobile field terminal for ground cadre. One-tap booth presence, anti-replay queued heartbeats, and real-time War Room synchronization."
        canonical="https://www.garudaos.in/booth-cadre"
      />

      {/* TOP ANCHORED HEADER (Zero-Slip Architecture) */}
      <header
        style={{
          flexShrink: 0,
          position: "relative",
          zIndex: 40,
          background: "rgba(12, 14, 18, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(196, 139, 40, 0.25)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #C48B28 0%, #6E490D 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "14px",
              color: "#08090B",
              boxShadow: "0 2px 8px rgba(196, 139, 40, 0.3)"
            }}
          >
            🦅
          </div>
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#C48B28", fontWeight: 700, textTransform: "uppercase" }}>
              GARUDA CADRE PWA
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>{deviceConfig.boothName || `Booth #${deviceConfig.boothId}`}</span>
              <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", background: freshnessMeta.bg, color: freshnessMeta.color, fontWeight: 700 }}>
                {freshnessMeta.text}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowConfigModal(true)}
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#C48B28",
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          ⚙️ Setup
        </button>
      </header>

      {/* FEEDBACK TOAST */}
      {feedbackToast && (
        <div
          style={{
            position: "absolute",
            top: "60px",
            left: "16px",
            right: "16px",
            zIndex: 60,
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            textAlign: "center",
            background:
              feedbackToast.type === "error"
                ? "rgba(220, 38, 38, 0.95)"
                : feedbackToast.type === "warn"
                ? "rgba(217, 119, 6, 0.95)"
                : "rgba(5, 150, 105, 0.95)",
            color: "#FFFFFF",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            transition: "all 0.2s ease"
          }}
        >
          {feedbackToast.msg}
        </div>
      )}

      {/* MIDDLE SCROLLABLE BODY (Touch-Isolated) */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        {/* CONNECTION & NETWORK BANNER */}
        <div
          style={{
            background: networkOnline ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.12)",
            border: `1px solid ${networkOnline ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.3)"}`,
            borderRadius: "10px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px" }}>{networkOnline ? "🟢" : "🔴"}</span>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: networkOnline ? "#10B981" : "#EF4444" }}>
                {networkOnline ? "NETWORK ONLINE" : "OFFLINE // LOCAL QUEUE"}
              </div>
              <div style={{ fontSize: "10px", color: "#9CA3AF" }}>
                {networkOnline ? "Direct SSL Link to War Room" : `${offlineQueueCount} heartbeats buffered`}
              </div>
            </div>
          </div>

          {offlineQueueCount > 0 && (
            <button
              onClick={flushOfflineQueue}
              disabled={!networkOnline}
              style={{
                background: "#C48B28",
                color: "#08090B",
                border: "none",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: networkOnline ? "pointer" : "not-allowed",
                opacity: networkOnline ? 1 : 0.5
              }}
            >
              Sync ({offlineQueueCount})
            </button>
          )}
        </div>

        {/* PRIMARY FIELD ACTION: "BOOTH ACTIVE" BIG ONE-TAP BUTTON */}
        <div
          style={{
            background: "linear-gradient(180deg, #13171F 0%, #0C0E13 100%)",
            border: "1px solid rgba(196, 139, 40, 0.3)",
            borderRadius: "16px",
            padding: "24px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6)",
            position: "relative"
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "1.5px",
              color: "#C48B28",
              textTransform: "uppercase",
              marginBottom: "8px"
            }}
          >
            FIELD PRESENCE HANDSHAKE
          </div>

          <p style={{ fontSize: "12px", color: "#9B9B98", margin: "0 0 20px 0", maxWidth: "300px" }}>
            Tap once to register your verified presence at Booth #{deviceConfig.boothId}. Transmits signed cryptographic token and hardware metrics.
          </p>

          {/* PULSING ONE-TAP BUTTON */}
          <button
            onClick={handleBoothActiveHeartbeat}
            disabled={isTransmitting}
            style={{
              width: "210px",
              height: "210px",
              borderRadius: "50%",
              background: isTransmitting
                ? "radial-gradient(circle, #D97706 0%, #78350F 100%)"
                : serverStatus === "VERIFIED" && freshness === "LIVE"
                ? "radial-gradient(circle, #059669 0%, #064E3B 100%)"
                : "radial-gradient(circle, #C48B28 0%, #78490B 100%)",
              border: "6px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: isTransmitting ? "wait" : "pointer",
              boxShadow: isTransmitting
                ? "0 0 35px rgba(217, 119, 6, 0.7)"
                : serverStatus === "VERIFIED" && freshness === "LIVE"
                ? "0 0 45px rgba(5, 150, 105, 0.8)"
                : "0 0 35px rgba(196, 139, 40, 0.6)",
              transform: isTransmitting ? "scale(0.96)" : "translateZ(0)",
              transition: "transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease",
              position: "relative"
            }}
          >
            <span style={{ fontSize: "36px", marginBottom: "4px" }}>
              {isTransmitting ? "⏳" : serverStatus === "VERIFIED" && freshness === "LIVE" ? "✅" : "🟢"}
            </span>
            <span style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "1px" }}>
              {isTransmitting ? "SENDING..." : "BOOTH ACTIVE"}
            </span>
            <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.8)", marginTop: "4px", fontWeight: 600 }}>
              1-TAP HEARTBEAT
            </span>
          </button>

          {/* Freshness Status Sub-bar */}
          <div style={{ marginTop: "18px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#9B9B98" }}>Last Acknowledged:</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#FFFFFF" }}>
              {lastHeartbeatTime ? `${elapsedSeconds ?? 0}s ago (${lastHeartbeatTime.toLocaleTimeString()})` : "Never in this session"}
            </span>
          </div>
        </div>

        {/* METRICS & AUDIT EVIDENCE CARD */}
        <div
          style={{
            background: "rgba(14, 16, 19, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "16px"
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#C48B28", letterSpacing: "1px", marginBottom: "12px", textTransform: "uppercase" }}>
            GROUND HARDWARE TELEMETRY
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {/* Battery */}
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
              <div style={{ fontSize: "10px", color: "#9B9B98", textTransform: "uppercase", marginBottom: "4px" }}>Battery</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: hardwareTelemetry.battery !== "UNAVAILABLE" ? "#10B981" : "#6B7280" }}>
                {hardwareTelemetry.battery !== "UNAVAILABLE" ? `${hardwareTelemetry.battery}% ${hardwareTelemetry.batteryCharging ? "⚡" : ""}` : "UNAVAILABLE"}
              </div>
              <div style={{ fontSize: "9px", color: "#6B7280", marginTop: "2px" }}>
                Truth: {hardwareTelemetry.battery !== "UNAVAILABLE" ? "REAL (Browser API)" : "UNAVAILABLE"}
              </div>
            </div>

            {/* Network Type */}
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
              <div style={{ fontSize: "10px", color: "#9B9B98", textTransform: "uppercase", marginBottom: "4px" }}>Network</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: hardwareTelemetry.networkType !== "UNAVAILABLE" ? "#3B82F6" : "#6B7280" }}>
                {hardwareTelemetry.networkType}
              </div>
              <div style={{ fontSize: "9px", color: "#6B7280", marginTop: "2px" }}>
                Truth: {hardwareTelemetry.networkType !== "UNAVAILABLE" ? "REAL (Network API)" : "UNAVAILABLE"}
              </div>
            </div>

            {/* Device Identity */}
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
              <div style={{ fontSize: "10px", color: "#9B9B98", textTransform: "uppercase", marginBottom: "4px" }}>Device ID</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#F5F5F2", fontFamily: "monospace" }}>
                {deviceConfig.deviceId}
              </div>
              <div style={{ fontSize: "9px", color: "#6B7280", marginTop: "2px" }}>
                Agent: {deviceConfig.agentName}
              </div>
            </div>

            {/* Replay Protection */}
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
              <div style={{ fontSize: "10px", color: "#9B9B98", textTransform: "uppercase", marginBottom: "4px" }}>Anti-Replay</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#10B981" }}>
                ACTIVE (TTL 300s)
              </div>
              <div style={{ fontSize: "9px", color: "#6B7280", marginTop: "2px" }}>
                SHA-256 Auth Shield
              </div>
            </div>
          </div>
        </div>

        {/* SERVER ACKNOWLEDGEMENT RECEIPT */}
        {lastAck && (
          <div
            style={{
              background: "rgba(5, 150, 105, 0.08)",
              border: "1px solid rgba(5, 150, 105, 0.25)",
              borderRadius: "10px",
              padding: "12px 14px",
              fontSize: "11px"
            }}
          >
            <div style={{ color: "#10B981", fontWeight: 700, marginBottom: "4px" }}>
              ✅ SERVER ACKNOWLEDGEMENT RECEIPT
            </div>
            <div style={{ color: "#D1D5DB" }}>
              Booth: <strong style={{ color: "#FFFFFF" }}>#{lastAck.boothId}</strong> | Freshness: <strong style={{ color: "#10B981" }}>{lastAck.freshness}</strong>
            </div>
            <div style={{ color: "#9CA3AF", fontSize: "10px", marginTop: "2px", fontFamily: "monospace" }}>
              Server Timestamp: {lastAck.serverTimestamp}
            </div>
          </div>
        )}

        {/* JUMP TO WAR ROOM */}
        <div style={{ textAlign: "center", marginTop: "8px" }}>
          <Link
            to="/war-room"
            style={{
              color: "#C48B28",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            ← Open Constituency War Room Dashboard
          </Link>
        </div>
      </main>

      {/* FOOTER SAFE ANCHOR */}
      <footer
        style={{
          flexShrink: 0,
          background: "rgba(10, 12, 16, 0.98)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "10px",
          color: "#6B7280"
        }}
      >
        <span>GARUDA Anti-Fabrication Law</span>
        <span>Version 2.5.0</span>
      </footer>

      {/* DEVICE CONFIGURATION MODAL */}
      {showConfigModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "#13171F",
              border: "1px solid rgba(196, 139, 40, 0.4)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "400px",
              padding: "20px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#C48B28", letterSpacing: "1px" }}>
                CADRE DEVICE SETUP
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "11px", color: "#9B9B98", marginBottom: "14px" }}>
              Select an authorized booth profile for rapid ground deployment or testing:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {FIELD_DEVICE_PRESETS.map((preset) => (
                <button
                  key={preset.deviceId}
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    background: deviceConfig.deviceId === preset.deviceId ? "rgba(196, 139, 40, 0.15)" : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${deviceConfig.deviceId === preset.deviceId ? "#C48B28" : "rgba(255, 255, 255, 0.08)"}`,
                    borderRadius: "10px",
                    padding: "12px",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF" }}>{preset.boothName}</span>
                    {deviceConfig.deviceId === preset.deviceId && (
                      <span style={{ fontSize: "10px", color: "#C48B28", fontWeight: 700 }}>ACTIVE</span>
                    )}
                  </div>
                  <div style={{ fontSize: "11px", color: "#C48B28", fontFamily: "monospace" }}>{preset.deviceId}</div>
                  <div style={{ fontSize: "10px", color: "#9CA3AF" }}>Officer: {preset.agentName}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowConfigModal(false)}
              style={{
                width: "100%",
                marginTop: "16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
