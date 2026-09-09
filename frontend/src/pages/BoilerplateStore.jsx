import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BrandAssetImage from "../components/BrandAssetImage";
import SEOHead from "../components/SEOHead";

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
    // Realtime deterministic simulation
    setTimeout(() => {
      const text = testMessage.toLowerCase();
      let urgency = "normal";
      let category = "general_consult";
      let reply = `Namaste ${clientName}. Thank you for reaching out. We have captured your request and our specialist is ready to assist you. When is the best time for your consultation?`;

      if (text.match(/pain|bleeding|breath|accident|emergency|tooth|acute|severe/i)) {
        urgency = "urgent";
        category = "clinical_urgent";
        reply = `Namaste ${clientName}. We have flagged your acute pain as high priority. Dr. Sharma has an emergency opening at 11:30 AM today. Please tap below to confirm your visit.`;
      } else if (text.match(/crm|agency|quote|price|custom|development|app/i)) {
        urgency = "urgent";
        category = "technical_inquiry";
        reply = `Namaste ${clientName}. Thank you for contacting GARUDA OS. We build autonomous production engines on a 50/50 escrow milestone. We can reserve a 20-minute scope briefing today.`;
      }

      setTriageResult({
        urgency,
        category,
        recommendedAction: urgency === "urgent" ? "Immediate Emergency Slot Booking" : "General 30-min Consultation",
        draftReply: reply
      });
      setTriageLoading(false);
    }, 600);
  };

  const handleDownload = () => {
    window.open("/api/boilerplate/download", "_blank");
  };

  const handleBuy = (license) => {
    const amount = license === "extended" ? 7999 : 3999;
    window.open(`https://razorpay.me/@garudaosincompany?amount=${amount}`, "_blank");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#f3f4f6", fontFamily: "sans-serif" }}>
      <SEOHead
        title="GARUDA Sovereign AI Starter Kit | WhatsApp Bot & 50/50 Milestone PWA"
        description="Production Next.js 14 + WhatsApp AI Receptionist & Razorpay 50/50 Milestone PWA Starter Kit. Self-serve software kit for developers and agencies."
      />

      {/* Top Navbar */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 2rem",
        borderBottom: "1px solid rgba(245, 215, 110, 0.15)",
        background: "rgba(3, 7, 18, 0.85)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
        >
          <div style={{ width: 36, height: 36, display: "grid", placeItems: "center" }}>
            <BrandAssetImage kind="branding" alt="GARUDA" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "0.1em", color: "#fff" }}>
            GARUDA <span style={{ color: "#f5d76e", fontSize: "0.8rem", padding: "0.2rem 0.5rem", background: "rgba(245,215,110,0.1)", borderRadius: 4 }}>STARTER STORE</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => navigate("/dost")}
            style={{
              background: "transparent",
              border: "1px solid rgba(245,215,110,0.3)",
              color: "#f5d76e",
              borderRadius: 999,
              padding: "0.45rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            GARUDA Dost Rozgar
          </button>
          <button
            onClick={handleDownload}
            style={{
              background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
              border: "none",
              color: "#05070b",
              borderRadius: 999,
              padding: "0.45rem 1.2rem",
              fontSize: "0.85rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(245,215,110,0.3)"
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
            padding: "0.35rem 0.9rem",
            borderRadius: 999,
            background: "rgba(245, 215, 110, 0.1)",
            border: "1px solid rgba(245, 215, 110, 0.3)",
            color: "#f5d76e",
            fontSize: "0.8rem",
            fontWeight: 700,
            marginBottom: "1.2rem"
          }}>
            🦅 PRODUCTION NEXT.JS 14 STARTER KIT · ZERO COLD-START
          </div>
          <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 1rem" }}>
            Sovereign AI Receptionist &amp; <br />
            <span style={{
              background: "linear-gradient(120deg, #f5d76e, #ffdf8a 55%, #b8860b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              50/50 Milestone Escrow Starter Kit
            </span>
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "1.1rem", maxWidth: 750, margin: "0 auto 2rem", lineHeight: 1.6 }}>
            Launch a battle-tested autonomous WhatsApp AI receptionist, patient/client intake triage with Gemini 2.5 Flash, and cryptographically verified 50/50 milestone payment escrow in 60 minutes.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => handleBuy("standard")}
              style={{
                background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
                border: "none",
                color: "#05070b",
                padding: "0.85rem 2rem",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 8px 25px rgba(245, 215, 110, 0.3)"
              }}
            >
              Get Standard License — ₹3,999 ($49) →
            </button>
            <button
              onClick={handleDownload}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(245, 215, 110, 0.35)",
                color: "#f5d76e",
                padding: "0.85rem 1.8rem",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              Direct Download Archive (.zip)
            </button>
          </div>
        </div>

        {/* Cryptographic SHA-256 Digest Badge */}
        {manifest && (
          <div style={{
            background: "rgba(11, 15, 23, 0.8)",
            border: "1px solid rgba(245, 215, 110, 0.2)",
            borderRadius: 12,
            padding: "0.85rem 1.25rem",
            marginBottom: "3rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            fontFamily: "monospace",
            fontSize: "0.8rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#75f4ab" }}>🛡️ VERIFIED ARTIFACT:</span>
              <span style={{ color: "#9ca3af" }}>SHA-256:</span>
              <span style={{ color: "#f5d76e" }}>{manifest.sha256}</span>
            </div>
            <div style={{ color: "#9ca3af" }}>
              Size: <strong style={{ color: "#fff" }}>{manifest.formattedSize}</strong> ({manifest.fileCount} source files)
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
            background: "rgba(11, 15, 23, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 20,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.2rem 0.5rem", background: "rgba(255, 255, 255, 0.1)", borderRadius: 4, fontWeight: 700 }}>
                Standard License
              </span>
              <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", margin: "1rem 0 0.5rem" }}>
                ₹3,999 <span style={{ fontSize: "1rem", color: "#9ca3af", fontWeight: 400 }}>($49 USD)</span>
              </div>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Full source code for single business or client deployment.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem", color: "#d1d5db", lineHeight: 2 }}>
                <li>✓ Next.js 14 App Router + Tailwind CSS</li>
                <li>✓ WhatsApp Cloud API Webhook Integration</li>
                <li>✓ Gemini 2.5 Flash Triage Engine</li>
                <li>✓ Supabase PostgreSQL Schema (`schema.sql`)</li>
                <li>✓ Razorpay &amp; Stripe Milestone Payments</li>
              </ul>
            </div>
            <button
              onClick={() => handleBuy("standard")}
              style={{
                marginTop: "2rem",
                width: "100%",
                padding: "0.75rem",
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Get Standard License (₹3,999)
            </button>
          </div>

          {/* Extended Agency */}
          <div style={{
            background: "linear-gradient(160deg, rgba(245, 215, 110, 0.08), rgba(11, 15, 23, 0.95))",
            border: "2px solid rgba(245, 215, 110, 0.5)",
            borderRadius: 20,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative"
          }}>
            <div style={{
              position: "absolute",
              top: -12,
              right: 24,
              background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
              color: "#000",
              fontSize: "0.7rem",
              fontWeight: 900,
              padding: "0.2rem 0.75rem",
              borderRadius: 999,
              letterSpacing: "0.05em"
            }}>
              AGENCY FAVORITE
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", fontFamily: "monospace", textTransform: "uppercase", padding: "0.2rem 0.5rem", background: "rgba(245, 215, 110, 0.2)", color: "#f5d76e", borderRadius: 4, fontWeight: 700 }}>
                Extended Agency License
              </span>
              <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", margin: "1rem 0 0.5rem" }}>
                ₹7,999 <span style={{ fontSize: "1rem", color: "#9ca3af", fontWeight: 400 }}>($99 USD)</span>
              </div>
              <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Unlimited client deployments, complete white-label rights &amp; direct founder consultation.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem", color: "#d1d5db", lineHeight: 2 }}>
                <li>✓ Everything in Standard License</li>
                <li>✓ Unlimited Commercial Client Deployments</li>
                <li>✓ 100% White-Label Rebranding Rights</li>
                <li>✓ Direct Priority Architect Support (praveen@garudaos.in)</li>
                <li>✓ Free Lifetime Updates &amp; Feature Patches</li>
              </ul>
            </div>
            <button
              onClick={() => handleBuy("extended")}
              style={{
                marginTop: "2rem",
                width: "100%",
                padding: "0.75rem",
                borderRadius: 8,
                background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
                border: "none",
                color: "#05070b",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(245, 215, 110, 0.3)"
              }}
            >
              Get Extended Agency License (₹7,999)
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: "center",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          paddingTop: "2rem",
          color: "#6b7280",
          fontSize: "0.8rem",
          lineHeight: 1.6
        }}>
          <div>100% Anti-Fabrication Law · Engineered by <strong>Praveen Mahawar</strong></div>
          <div>Official Inquiries: <strong>praveen@garudaos.in</strong> | 24/7 Portal: <strong>www.garudaos.in/chat</strong></div>
          <div style={{ marginTop: "0.5rem" }}>GARUDA OS · Sovereign Enterprise Platform</div>
        </footer>
      </main>
    </div>
  );
}
