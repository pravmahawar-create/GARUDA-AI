import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BrandAssetImage from "../components/BrandAssetImage";
import SEOHead from "../components/SEOHead";
import { simulateResponse, SIMULATION_MODES } from "../services/simulatorService";

const palette = {
  canvas: "#F6F4EE",
  canvasIvory: "#FAF9F6",
  card: "#FFFFFF",
  text: "#17181B",
  textBody: "#292B30",
  muted: "#525866",
  subtle: "#8A8D95",
  gold: "#B38235",
  goldPrimary: "#C48B28",
  goldDeep: "#9E6D1C",
  goldLight: "#D6A84F",
  goldGradient: "linear-gradient(135deg, #C48B28 0%, #9E6D1C 100%)",
  border: "rgba(23, 24, 27, 0.08)",
  borderGold: "rgba(179, 130, 53, 0.35)",
  obsidian: "#10141D",
  obsidianDeep: "#0B0E14",
  obsidianCard: "#151B26"
};

export default function BoilerplateStore() {
  const navigate = useNavigate();
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live interactive simulator state
  const [testMessage, setTestMessage] = useState("Hi, I have severe acute tooth pain on my lower jaw since last night and need to see the dentist ASAP today.");
  const [clientName, setClientName] = useState("Rohit Verma");
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

  // Escrow Calculator
  const [dealAmount, setDealAmount] = useState(60000);
  const upfrontMilestone = Math.round(dealAmount * 0.5);
  const deliveryMilestone = dealAmount - upfrontMilestone;

  useEffect(() => {
    fetch("/api/boilerplate/info")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setManifest(data.data);
        }
      })
      .catch((err) => console.warn("Boilerplate info fetch note:", err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSimulateTriage = () => {
    setTriageLoading(true);
    setTimeout(() => {
      const mode = testMessage.match(/crm|agency|quote|price|custom|development|app/i)
        ? SIMULATION_MODES.SALES
        : SIMULATION_MODES.CLINIC;
      const sim = simulateResponse(mode, testMessage, clientName);
      setTriageResult({
        urgency: sim.priority.includes("HIGH") ? "urgent" : "normal",
        category: sim.category,
        recommendedAction: sim.recommendedAction,
        draftReply: sim.reply
      });
      setTriageLoading(false);
    }, 400);
  };

  const handleDownload = () => {
    window.open("/api/boilerplate/download", "_blank");
  };

  const [buyLoading, setBuyLoading] = useState(null);

  const handleBuy = async (license) => {
    setBuyLoading(license);
    try {
      const res = await fetch("/api/boilerplate/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license, gateway: "razorpay" }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.success && data.paymentUrl) {
        window.open(data.paymentUrl, "_blank");
      } else {
        // Fallback to static Razorpay page — never show raw error to user
        window.open("https://razorpay.me/@garudaosincompany", "_blank");
        console.warn("Checkout fallback:", data?.error || res.statusText);
      }
    } catch (err) {
      window.open("https://razorpay.me/@garudaosincompany", "_blank");
      console.warn("Checkout network fallback:", err.message);
    } finally {
      setBuyLoading(null);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: palette.canvas,
      color: palette.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      WebkitFontSmoothing: "antialiased"
    }}>
      <SEOHead
        title="WhatsApp AI Bot & Autonomous Receptionist Starter Kit | Next.js 14 Code ($49)"
        description="Launch an autonomous WhatsApp AI receptionist and appointment booking system in 60 minutes. Complete Next.js 14, Supabase, and Razorpay/Stripe source code for businesses, clinics, and agencies."
        canonical="https://www.garudaos.in/whatsapp-bot"
      />

      {/* Top Navbar */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.85rem clamp(1.25rem, 4vw, 3.5rem)",
        borderBottom: `1px solid ${palette.border}`,
        background: "rgba(246, 244, 238, 0.92)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0
          }}
        >
          <img
            src="/images/garuda_eagle_sigil.png"
            alt="GARUDA Sigil"
            style={{ width: 34, height: 28, objectFit: "contain" }}
          />
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.35rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: palette.text
            }}>
              GARUDA
            </span>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#686A70",
              textTransform: "uppercase",
              marginTop: "2px"
            }}>
              AI OPERATING SYSTEM
            </span>
          </span>
          <span style={{
            color: palette.goldDeep,
            fontSize: "0.72rem",
            padding: "0.22rem 0.65rem",
            background: "rgba(179, 130, 53, 0.12)",
            borderRadius: 999,
            fontWeight: 700,
            letterSpacing: "0.05em",
            marginLeft: "0.4rem"
          }}>
            STARTER STORE ($49)
          </span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <button
            type="button"
            onClick={() => navigate("/dost")}
            style={{
              background: "transparent",
              border: `1px solid ${palette.borderGold}`,
              color: palette.goldDeep,
              borderRadius: 999,
              padding: "0.48rem 1.05rem",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.16s ease"
            }}
          >
            GARUDA Dost Rozgar
          </button>
          <button
            type="button"
            onClick={handleDownload}
            style={{
              background: palette.goldGradient,
              border: "none",
              color: "#FFFFFF",
              borderRadius: 999,
              padding: "0.52rem 1.35rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(179, 130, 53, 0.28)",
              transition: "all 0.16s ease"
            }}
          >
            ⬇️ Download Starter (.zip)
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.38rem 1rem",
            borderRadius: 999,
            background: "#FFFFFF",
            border: `1px solid ${palette.borderGold}`,
            color: palette.text,
            fontSize: "0.76rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            marginBottom: "1.2rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}>
            ✦ PRODUCTION NEXT.JS 14 STARTER KIT · ZERO COLD-START
          </div>
          <h1 style={{
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            lineHeight: 1.15,
            margin: "0 0 1rem",
            color: palette.text
          }}>
            Sovereign AI Receptionist &amp; <br />
            <span style={{
              color: palette.gold,
              fontStyle: "italic",
              fontFamily: "'Playfair Display', Georgia, serif"
            }}>
              50/50 Milestone Escrow Starter Kit
            </span>
          </h1>
          <p style={{
            color: palette.muted,
            fontSize: "1.08rem",
            maxWidth: 720,
            margin: "0 auto 2rem",
            lineHeight: 1.6,
            fontFamily: "'Inter', sans-serif"
          }}>
            Launch a battle-tested autonomous WhatsApp AI receptionist, patient/client intake triage with Gemini 2.5 Flash, and cryptographically verified 50/50 milestone payment escrow in 60 minutes.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => handleBuy("standard")}
              style={{
                background: palette.goldGradient,
                border: "none",
                color: "#FFFFFF",
                padding: "0.85rem 2rem",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: "0.96rem",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(179, 130, 53, 0.32)",
                transition: "all 0.16s ease"
              }}
            >
              Get Standard License — ₹3,999 ($49) →
            </button>
            <button
              onClick={handleDownload}
              style={{
                background: "#FFFFFF",
                border: `1px solid ${palette.border}`,
                color: palette.text,
                padding: "0.85rem 1.8rem",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: "0.96rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "all 0.16s ease"
              }}
            >
              Direct Download Archive (.zip)
            </button>
          </div>
        </div>

        {/* Cryptographic SHA-256 Digest Badge */}
        {manifest && (
          <div style={{
            background: "#FFFFFF",
            border: `1px solid ${palette.border}`,
            borderRadius: 14,
            padding: "0.85rem 1.25rem",
            marginBottom: "3rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            fontFamily: "monospace",
            fontSize: "0.8rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#059669", fontWeight: 700 }}>🛡️ VERIFIED ARTIFACT:</span>
              <span style={{ color: palette.muted }}>SHA-256:</span>
              <span style={{ color: palette.goldDeep, fontWeight: 700 }}>{manifest.sha256}</span>
            </div>
            <div style={{ color: palette.muted }}>
              Size: <strong style={{ color: palette.text }}>{manifest.formattedSize}</strong> ({manifest.fileCount} source files)
            </div>
          </div>
        )}

        {/* Live Interactive Triage Simulator */}
        <section style={{
          background: "rgba(11, 15, 23, 0.9)",
          border: "1px solid rgba(245, 215, 110, 0.25)",
          borderRadius: 20,
          padding: "2rem",
          marginBottom: "3.5rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "#fff" }}>
                ⚡ Test WhatsApp AI Triage Simulator
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: "0.3rem 0 0" }}>
                Simulate how incoming inquiries are categorized and prioritized by the living AI engine.
              </p>
            </div>
            <span style={{
              background: "rgba(117, 244, 171, 0.1)",
              color: "#75f4ab",
              border: "1px solid rgba(117, 244, 171, 0.3)",
              padding: "0.25rem 0.75rem",
              borderRadius: 999,
              fontSize: "0.75rem",
              fontWeight: 700
            }}>
              Live Simulator
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", marginBottom: "0.4rem", fontWeight: 700 }}>
                Patient / Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={{
                  width: "100%",
                  background: "#030712",
                  border: "1px solid #1e293b",
                  color: "#fff",
                  padding: "0.6rem 0.8rem",
                  borderRadius: 8,
                  fontSize: "0.9rem"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", marginBottom: "0.4rem", fontWeight: 700 }}>
                Preset Scenario
              </label>
              <select
                onChange={(e) => setTestMessage(e.target.value)}
                style={{
                  width: "100%",
                  background: "#030712",
                  border: "1px solid #1e293b",
                  color: "#fff",
                  padding: "0.6rem 0.8rem",
                  borderRadius: 8,
                  fontSize: "0.9rem"
                }}
              >
                <option value="Hi, I have severe acute tooth pain on my lower jaw since last night and need to see the dentist ASAP today.">
                  🦷 Dental Acute Emergency
                </option>
                <option value="We need an AI CRM system built for our London digital agency. What are your milestone terms?">
                  💼 Agency High-Ticket Inbound
                </option>
                <option value="Can I reschedule my appointment from Friday to next Monday morning?">
                  📅 Reschedule Consultation
                </option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", marginBottom: "0.4rem", fontWeight: 700 }}>
              Inbound Message Text
            </label>
            <textarea
              rows={3}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              style={{
                width: "100%",
                background: "#030712",
                border: "1px solid #1e293b",
                color: "#fff",
                padding: "0.75rem",
                borderRadius: 8,
                fontSize: "0.9rem"
              }}
            />
          </div>

          <button
            onClick={handleSimulateTriage}
            disabled={triageLoading}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
              border: "none",
              color: "#05070b",
              padding: "0.75rem",
              borderRadius: 8,
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.95rem"
            }}
          >
            {triageLoading ? "Simulating AI Evaluation..." : "⚡ Run Autonomous AI Triage"}
          </button>

          {triageResult && (
            <div style={{
              marginTop: "1.5rem",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 12,
              padding: "1.25rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#9ca3af", textTransform: "uppercase", fontFamily: "monospace" }}>
                  Autonomous Triage Result:
                </span>
                <span style={{
                  background: triageResult.urgency === "urgent" ? "rgba(245, 158, 11, 0.2)" : "rgba(59, 130, 246, 0.2)",
                  color: triageResult.urgency === "urgent" ? "#fbbf24" : "#60a5fa",
                  border: `1px solid ${triageResult.urgency === "urgent" ? "#f59e0b" : "#3b82f6"}`,
                  padding: "0.2rem 0.6rem",
                  borderRadius: 999,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase"
                }}>
                  {triageResult.urgency} Urgency · {triageResult.category}
                </span>
              </div>

              <div style={{ fontSize: "0.85rem", color: "#d1d5db", marginBottom: "0.75rem" }}>
                <strong style={{ color: "#f5d76e" }}>Recommended Action:</strong> {triageResult.recommendedAction}
              </div>

              <div style={{
                background: "rgba(5, 150, 105, 0.15)",
                border: "1px solid rgba(5, 150, 105, 0.3)",
                borderRadius: 8,
                padding: "0.85rem",
                color: "#a7f3d0",
                fontSize: "0.85rem",
                lineHeight: 1.5
              }}>
                <div style={{ fontWeight: 700, color: "#34d399", marginBottom: "0.3rem" }}>
                  💬 Automated WhatsApp Dispatch:
                </div>
                "{triageResult.draftReply}"
              </div>
            </div>
          )}
        </section>

        {/* 50/50 Milestone Escrow Calculator */}
        <section style={{
          background: "rgba(11, 15, 23, 0.7)",
          border: "1px solid rgba(245, 215, 110, 0.15)",
          borderRadius: 20,
          padding: "2rem",
          marginBottom: "3.5rem"
        }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 0.5rem" }}>
            ⚖️ 50/50 Milestone Escrow Revenue Engine
          </h2>
          <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
            The starter kit includes cryptographic verification of Razorpay &amp; Stripe webhooks to secure 50% upfront and 50% on verified completion.
          </p>

          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              <span style={{ color: "#9ca3af" }}>Project Contract Size:</span>
              <span style={{ color: "#f5d76e", fontFamily: "monospace", fontSize: "1.1rem" }}>₹{dealAmount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={15000}
              max={500000}
              step={5000}
              value={dealAmount}
              onChange={(e) => setDealAmount(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#f5d76e", cursor: "pointer" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            <div style={{ padding: "1.25rem", borderRadius: 12, background: "rgba(245, 215, 110, 0.05)", border: "1px solid rgba(245, 215, 110, 0.25)" }}>
              <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#f5d76e", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.4rem" }}>
                Stage 1 · 50% Upfront Kickoff Escrow
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
                ₹{upfrontMilestone.toLocaleString()}
              </div>
              <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: "0.6rem 0 0" }}>
                Locked in escrow before sprint initiation. Automatically updates Supabase and dispatches WhatsApp payment receipt.
              </p>
            </div>

            <div style={{ padding: "1.25rem", borderRadius: 12, background: "rgba(117, 244, 171, 0.05)", border: "1px solid rgba(117, 244, 171, 0.25)" }}>
              <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#75f4ab", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.4rem" }}>
                Stage 2 · 50% Verified Completion Escrow
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
                ₹{deliveryMilestone.toLocaleString()}
              </div>
              <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: "0.6rem 0 0" }}>
                Settled upon SHA-256 artifact verification, zero regression tests passing, and client signoff.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "3.5rem" }}>
          {/* Standard */}
          <div style={{
            background: "#FFFFFF",
            border: `1px solid ${palette.border}`,
            borderRadius: 20,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
          }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.25rem 0.6rem", background: "rgba(23, 24, 27, 0.06)", color: palette.text, borderRadius: 4, fontWeight: 700 }}>
                Standard License
              </span>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, color: palette.text, margin: "1rem 0 0.5rem" }}>
                ₹3,999 <span style={{ fontSize: "1rem", color: palette.muted, fontWeight: 500 }}>($49 USD)</span>
              </div>
              <p style={{ color: palette.muted, fontSize: "0.85rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                Full source code for single business or client deployment.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem", color: palette.textBody, lineHeight: 2 }}>
                <li>✓ Next.js 14 App Router + Tailwind CSS</li>
                <li>✓ WhatsApp Cloud API Webhook Integration</li>
                <li>✓ Gemini 2.5 Flash Triage Engine</li>
                <li>✓ Supabase PostgreSQL Schema (`schema.sql`)</li>
                <li>✓ Razorpay &amp; Stripe Milestone Payments</li>
              </ul>
            </div>
            <button
              onClick={() => handleBuy("standard")}
              disabled={buyLoading === "standard"}
              style={{
                marginTop: "2rem",
                width: "100%",
                padding: "0.75rem",
                borderRadius: 999,
                background: buyLoading === "standard" ? "rgba(23, 24, 27, 0.05)" : "rgba(23, 24, 27, 0.07)",
                border: `1px solid ${palette.border}`,
                color: palette.text,
                fontWeight: 700,
                cursor: buyLoading === "standard" ? "wait" : "pointer",
                opacity: buyLoading === "standard" ? 0.7 : 1,
                transition: "all 0.16s ease"
              }}
            >
              {buyLoading === "standard" ? "Opening Razorpay..." : "Get Standard License (₹3,999)"}
            </button>
          </div>

          {/* Extended Agency */}
          <div style={{
            background: "#FFFFFF",
            border: `2px solid ${palette.gold}`,
            borderRadius: 20,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            boxShadow: "0 10px 30px rgba(179, 130, 53, 0.15)"
          }}>
            <div style={{
              position: "absolute",
              top: -12,
              right: 24,
              background: palette.goldGradient,
              color: "#FFFFFF",
              fontSize: "0.7rem",
              fontWeight: 800,
              padding: "0.22rem 0.8rem",
              borderRadius: 999,
              letterSpacing: "0.06em",
              boxShadow: "0 2px 8px rgba(179, 130, 53, 0.3)"
            }}>
              AGENCY FAVORITE
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.25rem 0.6rem", background: "rgba(179, 130, 53, 0.12)", color: palette.goldDeep, borderRadius: 4, fontWeight: 700 }}>
                Extended Agency License
              </span>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, color: palette.text, margin: "1rem 0 0.5rem" }}>
                ₹7,999 <span style={{ fontSize: "1rem", color: palette.muted, fontWeight: 500 }}>($99 USD)</span>
              </div>
              <p style={{ color: palette.muted, fontSize: "0.85rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                Unlimited client deployments, complete white-label rights &amp; direct founder consultation.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem", color: palette.textBody, lineHeight: 2 }}>
                <li>✓ Everything in Standard License</li>
                <li>✓ Unlimited Commercial Client Deployments</li>
                <li>✓ 100% White-Label Rebranding Rights</li>
                <li>✓ Direct Priority Architect Support (praveen@garudaos.in)</li>
                <li>✓ Free Lifetime Updates &amp; Feature Patches</li>
              </ul>
            </div>
            <button
              onClick={() => handleBuy("extended")}
              disabled={buyLoading === "extended"}
              style={{
                marginTop: "2rem",
                width: "100%",
                padding: "0.75rem",
                borderRadius: 999,
                background: buyLoading === "extended" ? "rgba(179, 130, 53, 0.5)" : palette.goldGradient,
                border: "none",
                color: "#FFFFFF",
                fontWeight: 800,
                cursor: buyLoading === "extended" ? "wait" : "pointer",
                boxShadow: "0 4px 15px rgba(179, 130, 53, 0.3)",
                opacity: buyLoading === "extended" ? 0.7 : 1,
                transition: "all 0.16s ease"
              }}
            >
              {buyLoading === "extended" ? "Opening Razorpay..." : "Get Extended Agency License (₹7,999)"}
            </button>
          </div>

          {/* Hosted SaaS */}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            borderRadius: 20,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
          }}>
            <div style={{
              position: "absolute",
              top: -12,
              right: 24,
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "#fff",
              fontSize: "0.7rem",
              fontWeight: 800,
              padding: "0.22rem 0.8rem",
              borderRadius: 999,
              letterSpacing: "0.06em"
            }}>
              NEW • HOSTED
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.25rem 0.6rem", background: "rgba(56, 189, 248, 0.12)", color: "#0284c7", borderRadius: 4, fontWeight: 700 }}>
                Hosted SaaS — Managed
              </span>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, color: palette.text, margin: "1rem 0 0.5rem" }}>
                ₹1,599 <span style={{ fontSize: "1rem", color: palette.muted, fontWeight: 500 }}>($19 / mo)</span>
              </div>
              <p style={{ color: palette.muted, fontSize: "0.85rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                1-Click Vercel deploy + managed Supabase + auto updates. No DevOps.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem", color: palette.textBody, lineHeight: 2 }}>
                <li>✓ Everything in Standard License</li>
                <li>✓ Hosted on garudaos.in subdomain (1-Click)</li>
                <li>✓ Managed Supabase DB + backups</li>
                <li>✓ Auto updates &amp; 24/7 health checks</li>
                <li>✓ Cancel anytime — export full code</li>
              </ul>
            </div>
            <button
              onClick={() => handleBuy("hosted")}
              disabled={buyLoading === "hosted"}
              style={{
                marginTop: "2rem",
                width: "100%",
                padding: "0.75rem",
                borderRadius: 999,
                background: buyLoading === "hosted" ? "rgba(56,189,248,0.5)" : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                border: "none",
                color: "#fff",
                fontWeight: 800,
                cursor: buyLoading === "hosted" ? "wait" : "pointer",
                boxShadow: "0 4px 15px rgba(2, 132, 199, 0.25)",
                opacity: buyLoading === "hosted" ? 0.7 : 1,
                transition: "all 0.16s ease"
              }}
            >
              {buyLoading === "hosted" ? "Opening Razorpay..." : "Get Hosted — ₹1,599/mo"}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: "center",
          borderTop: `1px solid ${palette.border}`,
          paddingTop: "2.5rem",
          color: palette.muted,
          fontSize: "0.82rem",
          lineHeight: 1.7
        }}>
          <div>100% Anti-Fabrication Law · Sovereign AI Architecture by <strong>Praveen Mahawar</strong></div>
          <div>Enterprise Inquiries: <strong>praveen@garudaos.in</strong> | 24/7 Portal: <strong>www.garudaos.in/chat</strong></div>
          <div style={{ marginTop: "0.5rem", color: palette.subtle }}>GARUDA OS · Sovereign Enterprise Platform</div>
        </footer>
      </main>
    </div>
  );
}
