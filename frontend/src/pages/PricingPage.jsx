import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import BrandAssetImage from "../components/BrandAssetImage";

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
  obsidianDeep: "#0B0E14"
};

const GOLD = palette.gold;
const GOLD_LIGHT = palette.goldLight;
const BG = palette.canvas;
const PANEL = palette.card;
const BORDER = palette.border;

export default function PricingPage() {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState("INR");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSub, setCurrentSub] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/billing/plans").then((r) => r.json()).catch(() => ({ data: [] })),
      fetch("/api/billing/subscription").then((r) => r.json()).catch(() => ({ data: null }))
    ]).then(([plansRes, subRes]) => {
      if (!active) return;
      if (plansRes && plansRes.data) {
        setPlans(plansRes.data);
      }
      if (subRes && subRes.data) {
        setCurrentSub(subRes.data);
      }
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, []);

  const handleSubscribe = async (planId) => {
    try {
      setProcessingPlan(planId);
      setStatusMessage("");

      if (planId === "personal") {
        setStatusMessage("Personal plan is automatically active for sovereign local execution.");
        setProcessingPlan(null);
        return;
      }

      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, interval: "monthly", currency })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to initialize checkout.");
      }

      // Check if Razorpay script is loaded or redirect to checkout
      const order = data.data;
      if (window.Razorpay) {
        const options = {
          key: order.keyId,
          amount: order.amount * 100,
          currency: order.currency,
          name: "GARUDA AI Operating System",
          description: order.notes?.description || "GARUDA SaaS Subscription",
          order_id: order.orderId.startsWith("order_") && !order.orderId.includes("placeholder") ? order.orderId : undefined,
          handler: async (response) => {
            const actRes = await fetch("/api/billing/activate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                plan: planId,
                interval: "monthly",
                paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
                orderId: order.orderId
              })
            });
            const actData = await actRes.json();
            if (actData.success) {
              setCurrentSub(actData.data);
              setStatusMessage(`✓ Upgraded to ${planId.toUpperCase()} tier successfully!`);
            }
          },
          theme: { color: "#d4af37" }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Direct simulation / activation fallback
        const actRes = await fetch("/api/billing/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: planId,
            interval: "monthly",
            paymentId: `pay_direct_${Date.now()}`,
            orderId: order.orderId
          })
        });
        const actData = await actRes.json();
        if (actData.success) {
          setCurrentSub(actData.data);
          setStatusMessage(`✓ Subscription activated! Plan: ${planId.toUpperCase()}`);
        }
      }
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setProcessingPlan(null);
    }
  };

  const defaultPlans = [
    {
      planId: "personal",
      name: "Sovereign Personal",
      priceInr: 0,
      priceUsd: 0,
      tagline: "For solo developers & local sovereign builders",
      limits: { maxTokensPerMonth: 500000, maxGenerationsPerMonth: 50, maxProjects: 3, seats: 1 },
      features: [
        "Local Sovereign Model Inference",
        "Single Developer Seat",
        "Standard Execution Engine",
        "Community Support & GitHub Discussions",
        "Full Data Ownership & Local Storage"
      ]
    },
    {
      planId: "creator",
      name: "Creator Pro",
      priceInr: 1499,
      priceUsd: 19,
      popular: true,
      tagline: "For agile founders, creators & freelance engineers",
      limits: { maxTokensPerMonth: 2000000, maxGenerationsPerMonth: 250, maxProjects: 10, seats: 2 },
      features: [
        "Cloud & Local Sovereign Inference",
        "2 Team Seats & Scoped Access",
        "Priority Autonomous Task Runners",
        "Tenant API Key Access (grd_live_)",
        "Verified Email Support SLA",
        "Automated Multi-Brain Schedulers"
      ]
    },
    {
      planId: "sme",
      name: "SME Commercial",
      priceInr: 4999,
      priceUsd: 59,
      tagline: "For growing startups, agencies & IT teams",
      limits: { maxTokensPerMonth: 10000000, maxGenerationsPerMonth: 1000, maxProjects: 50, seats: 10 },
      features: [
        "Full Autonomous Multi-Agent Pipeline",
        "10 Team Seats & Role Scoping",
        "Enterprise High-Throughput API Keys",
        "Custom Workflow & Tool Automation",
        "Priority Response SLA & Outbound Funnels",
        "Automated B2B GST Tax Invoices"
      ]
    },
    {
      planId: "enterprise",
      name: "Enterprise Titan",
      priceInr: 19999,
      priceUsd: 249,
      tagline: "For high-scale enterprises needing private GPU fleets",
      limits: { maxTokensPerMonth: 50000000, maxGenerationsPerMonth: 5000, maxProjects: 9999, seats: 50 },
      features: [
        "Dedicated High-Velocity GPU Clusters",
        "Air-Gapped Sovereign On-Premises Option",
        "50 Team Seats with Custom Permissions",
        "Unlimited Autonomous Workflows",
        "Private System Escalation & Direct Founder Strategic Hotline",
        "Dedicated Engineering Workforce Pods"
      ]
    }
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <div style={{
      background: palette.canvas,
      color: palette.text,
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      WebkitFontSmoothing: "antialiased"
    }}>
      <SEOHead
        title="GARUDA AI Pricing | SaaS Subscriptions & Custom Project Rates | GARUDA"
        description="Transparent pricing for GARUDA AI: SaaS subscriptions from ₹0 to ₹19,999/mo and fixed-price custom AI, software & automation projects with 50% milestone governance."
        canonical="https://www.garudaos.in/pricing"
      />

      {/* Header */}
      <header style={{
        borderBottom: `1px solid ${palette.border}`,
        padding: "0.85rem clamp(1.25rem, 4vw, 3.5rem)",
        background: "rgba(246, 244, 238, 0.92)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
              SOVEREIGN PRICING
            </span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <button
              onClick={() => navigate("/app")}
              style={{
                background: "transparent",
                border: `1px solid ${palette.border}`,
                color: palette.text,
                padding: "0.45rem 1.1rem",
                borderRadius: 999,
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.16s ease"
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/demo")}
              style={{
                background: palette.goldGradient,
                color: "#FFFFFF",
                border: "none",
                padding: "0.48rem 1.25rem",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: "0.84rem",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(179, 130, 53, 0.28)",
                transition: "all 0.16s ease"
              }}
            >
              Live Demo
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ textAlign: "center", padding: "4rem 1.5rem 2rem", maxWidth: 900, margin: "0 auto" }}>
        <div style={{
          display: "inline-block",
          background: "#FFFFFF",
          border: `1px solid ${palette.borderGold}`,
          borderRadius: 999,
          padding: "0.35rem 1rem",
          fontSize: "0.76rem",
          color: palette.text,
          fontWeight: 700,
          marginBottom: "1rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}>
          ✦ 100% Anti-Fabrication • Deterministic AI Workforce
        </div>
        <h1 style={{
          fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700,
          margin: "0 0 1rem",
          letterSpacing: "-0.015em",
          lineHeight: 1.18,
          color: palette.text
        }}>
          Predictable Power.{" "}
          <span style={{ color: palette.gold, fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif" }}>
            Sovereign Autonomy.
          </span>
        </h1>
        <p style={{ color: palette.muted, fontSize: "1.06rem", maxWidth: 650, margin: "0 auto 2rem", lineHeight: 1.6 }}>
          Choose the sovereign workforce tier tailored for your velocity. Transparent limits, zero hidden fees, and authoritative data privacy.
        </p>

        {/* Currency Switcher */}
        <div style={{
          display: "inline-flex",
          background: "#FFFFFF",
          border: `1px solid ${palette.border}`,
          borderRadius: 999,
          padding: "0.3rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}>
          <button
            onClick={() => setCurrency("INR")}
            style={{
              background: currency === "INR" ? palette.goldGradient : "transparent",
              color: currency === "INR" ? "#FFFFFF" : palette.muted,
              border: "none",
              borderRadius: 999,
              padding: "0.45rem 1.25rem",
              fontWeight: 700,
              fontSize: "0.84rem",
              cursor: "pointer",
              transition: "all 0.16s ease"
            }}
          >
            ₹ INR (India)
          </button>
          <button
            onClick={() => setCurrency("USD")}
            style={{
              background: currency === "USD" ? palette.goldGradient : "transparent",
              color: currency === "USD" ? "#FFFFFF" : palette.muted,
              border: "none",
              borderRadius: 999,
              padding: "0.45rem 1.25rem",
              fontWeight: 700,
              fontSize: "0.84rem",
              cursor: "pointer",
              transition: "all 0.16s ease"
            }}
          >
            $ USD (Global)
          </button>
        </div>

        {statusMessage && (
          <div style={{
            marginTop: "1.5rem",
            padding: "0.75rem 1.5rem",
            background: statusMessage.startsWith("✓") ? "rgba(5,150,105,0.08)" : "rgba(220,38,38,0.08)",
            border: `1px solid ${statusMessage.startsWith("✓") ? "#059669" : "#dc2626"}`,
            borderRadius: 999,
            display: "inline-block",
            color: statusMessage.startsWith("✓") ? "#059669" : "#dc2626",
            fontSize: "0.88rem",
            fontWeight: 700
          }}>
            {statusMessage}
          </div>
        )}
      </section>

      {/* Pricing Cards Grid */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {displayPlans.map((plan) => {
            const isCurrent = currentSub?.plan === plan.planId;
            const price = currency === "INR" ? `₹${(plan.priceInr || 0).toLocaleString("en-IN")}` : `$${plan.priceUsd || 0}`;
            const isPopular = plan.popular || plan.planId === "creator";

            return (
              <div
                key={plan.planId}
                style={{
                  background: "#FFFFFF",
                  border: isCurrent
                    ? "2px solid #059669"
                    : isPopular
                      ? `2px solid ${palette.gold}`
                      : `1px solid ${palette.border}`,
                  borderRadius: 20,
                  padding: "2rem 1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  boxShadow: isPopular ? "0 10px 30px rgba(179, 130, 53, 0.15)" : "0 4px 20px rgba(0,0,0,0.04)"
                }}
              >
                {isPopular && (
                  <div style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: palette.goldGradient,
                    color: "#FFFFFF",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "0.22rem 0.85rem",
                    borderRadius: 999,
                    boxShadow: "0 2px 8px rgba(179, 130, 53, 0.3)"
                  }}>
                    Most Popular
                  </div>
                )}

                <div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: palette.text, marginBottom: "0.3rem" }}>
                    {plan.name}
                  </div>
                  <div style={{ color: palette.muted, fontSize: "0.82rem", minHeight: 36, marginBottom: "1.2rem", lineHeight: 1.4 }}>
                    {plan.tagline || `${plan.limits?.seats || 1} team seat(s) • ${plan.limits?.maxProjects || 10} projects`}
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "2.4rem", fontWeight: 800, color: palette.text }}>
                      {price}
                    </span>
                    <span style={{ color: palette.muted, fontSize: "0.9rem", marginLeft: "0.4rem" }}>/ month</span>
                  </div>

                  <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: "1.2rem", marginBottom: "1.5rem" }}>
                    <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: palette.goldDeep, fontWeight: 800, marginBottom: "0.8rem" }}>
                      Plan Limits & Capacity
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem", color: palette.textBody, marginBottom: "1.2rem" }}>
                      <div>👥 <strong>{plan.limits?.seats || 1}</strong> Team Seat(s)</div>
                      <div>⚡ <strong>{((plan.limits?.maxTokensPerMonth || 1000000) / 1000000).toFixed(1)}M</strong> Monthly Tokens</div>
                      <div>🎨 <strong>{plan.limits?.maxGenerationsPerMonth || 100}</strong> Autonomous Media Gen</div>
                      <div>📂 <strong>{plan.limits?.maxProjects === 9999 ? "Unlimited" : plan.limits?.maxProjects}</strong> Active Projects</div>
                    </div>

                    <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: palette.muted, fontWeight: 800, marginBottom: "0.8rem" }}>
                      Key Features
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {(plan.features || []).map((feat, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.82rem", color: palette.textBody, lineHeight: 1.4 }}>
                          <span style={{ color: "#059669", fontWeight: 800 }}>✓</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe(plan.planId)}
                  disabled={isCurrent || processingPlan === plan.planId}
                  style={{
                    width: "100%",
                    padding: "0.85rem 1rem",
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    cursor: isCurrent ? "default" : "pointer",
                    border: "none",
                    background: isCurrent
                      ? "rgba(5,150,105,0.12)"
                      : isPopular
                        ? palette.goldGradient
                        : "rgba(23,24,27,0.06)",
                    color: isCurrent ? "#059669" : isPopular ? "#FFFFFF" : palette.text,
                    boxShadow: isPopular && !isCurrent ? "0 4px 15px rgba(179, 130, 53, 0.28)" : "none",
                    transition: "all 0.16s ease"
                  }}
                >
                  {isCurrent
                    ? "✓ Active Plan"
                    : processingPlan === plan.planId
                      ? "Processing…"
                      : plan.planId === "personal"
                        ? "Free Forever"
                        : `Upgrade to ${plan.name.split(" ")[0]}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Enterprise / Strategic Advisory Banner */}
      <section style={{ maxWidth: 1000, margin: "0 auto 5rem", padding: "0 1.5rem" }}>
        <div style={{
          background: "linear-gradient(180deg, #10141D 0%, #0B0E14 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 22,
          padding: "2.5rem 2rem",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(10, 14, 22, 0.35)"
        }}>
          <h3 style={{
            fontSize: "1.5rem",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            color: "#FFFFFF",
            margin: "0 0 0.8rem"
          }}>
            Need Custom Workflows or Sovereign Air-Gapped Deployment?
          </h3>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem", maxWidth: 650, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
            GARUDA engineering pods can be deployed on private bare-metal servers or enterprise clusters. All commercial enterprise contracts include signed SLAs and formal B2B GST tax compliance.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/demo")}
              style={{
                background: palette.goldGradient,
                color: "#FFFFFF",
                border: "none",
                padding: "0.75rem 2rem",
                borderRadius: 999,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(179, 130, 53, 0.3)",
                transition: "all 0.16s ease"
              }}
            >
              Book Strategic Architecture Demo →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
