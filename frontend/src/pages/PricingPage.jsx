import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import BrandAssetImage from "../components/BrandAssetImage";

const GOLD = "#d4af37";
const GOLD_LIGHT = "#fef08a";
const BG = "#030712";
const PANEL = "#0a0f18";
const BORDER = "rgba(212, 175, 55, 0.2)";

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
    <div style={{ background: BG, color: "#fff", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <SEOHead
        title="GARUDA SaaS Pricing — Sovereign AI & Autonomous Engineering"
        description="Predictable subscription pricing for GARUDA AI Operating System. From solo developers to 50-seat enterprise fleets."
      />

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${BORDER}`, padding: "1.2rem 2rem", background: PANEL }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer" }} onClick={() => navigate("/")}>
            <BrandAssetImage name="garuda_symbol" width={32} height={32} alt="GARUDA" />
            <div>
              <div style={{ fontWeight: 900, fontSize: "1.1rem", letterSpacing: "0.08em", color: "#fff" }}>GARUDA OS</div>
              <div style={{ fontSize: "0.68rem", color: GOLD, letterSpacing: "0.05em" }}>SOVEREIGN PRICING</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => navigate("/app")}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "0.45rem 1rem", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer" }}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/demo")}
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b8860b)`, color: "#000", border: "none", padding: "0.45rem 1.2rem", borderRadius: 8, fontWeight: 800, fontSize: "0.85rem", cursor: "pointer" }}
            >
              Live Demo
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ textAlign: "center", padding: "4rem 1.5rem 2rem", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "inline-block", background: "rgba(212,175,55,0.1)", border: `1px solid ${GOLD}`, borderRadius: 999, padding: "0.3rem 1rem", fontSize: "0.8rem", color: GOLD_LIGHT, fontWeight: 700, marginBottom: "1rem" }}>
          ⚡ 100% Anti-Fabrication • Deterministic AI Workforce
        </div>
        <h1 style={{ fontSize: "2.7rem", fontWeight: 900, margin: "0 0 1rem", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          Predictable Power. <span style={{ color: GOLD }}>Sovereign Autonomy.</span>
        </h1>
        <p style={{ color: "#9ca3af", fontSize: "1.1rem", maxWidth: 650, margin: "0 auto 2rem", lineHeight: 1.6 }}>
          Choose the sovereign workforce tier tailored for your velocity. Transparent limits, zero hidden fees, and authoritative data privacy.
        </p>

        {/* Currency Switcher */}
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "0.3rem" }}>
          <button
            onClick={() => setCurrency("INR")}
            style={{
              background: currency === "INR" ? GOLD : "transparent",
              color: currency === "INR" ? "#000" : "#9ca3af",
              border: "none",
              borderRadius: 999,
              padding: "0.4rem 1.2rem",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            ₹ INR (India)
          </button>
          <button
            onClick={() => setCurrency("USD")}
            style={{
              background: currency === "USD" ? GOLD : "transparent",
              color: currency === "USD" ? "#000" : "#9ca3af",
              border: "none",
              borderRadius: 999,
              padding: "0.4rem 1.2rem",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            $ USD (Global)
          </button>
        </div>

        {statusMessage && (
          <div style={{ marginTop: "1.5rem", padding: "0.75rem 1.5rem", background: statusMessage.startsWith("✓") ? "rgba(117,244,171,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${statusMessage.startsWith("✓") ? "#75f4ab" : "#f87171"}`, borderRadius: 8, display: "inline-block", color: statusMessage.startsWith("✓") ? "#75f4ab" : "#f87171", fontSize: "0.9rem", fontWeight: 700 }}>
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
                  background: PANEL,
                  border: isCurrent ? "2px solid #75f4ab" : isPopular ? `2px solid ${GOLD}` : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "2rem 1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  boxShadow: isPopular ? "0 10px 40px rgba(212,175,55,0.12)" : "none"
                }}
              >
                {isPopular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(135deg, ${GOLD}, #b8860b)`, color: "#000", fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.2rem 0.8rem", borderRadius: 999 }}>
                    Most Popular
                  </div>
                )}

                <div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", marginBottom: "0.3rem" }}>
                    {plan.name}
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: "0.82rem", minHeight: 36, marginBottom: "1.2rem", lineHeight: 1.4 }}>
                    {plan.tagline || `${plan.limits?.seats || 1} team seat(s) • ${plan.limits?.maxProjects || 10} projects`}
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "2.4rem", fontWeight: 900, color: isPopular ? GOLD_LIGHT : "#fff" }}>
                      {price}
                    </span>
                    <span style={{ color: "#6b7280", fontSize: "0.9rem", marginLeft: "0.4rem" }}>/ month</span>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.2rem", marginBottom: "1.5rem" }}>
                    <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: GOLD, fontWeight: 800, marginBottom: "0.8rem" }}>
                      Plan Limits & Capacity
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "1.2rem" }}>
                      <div>👥 <strong>{plan.limits?.seats || 1}</strong> Team Seat(s)</div>
                      <div>⚡ <strong>{((plan.limits?.maxTokensPerMonth || 1000000) / 1000000).toFixed(1)}M</strong> Monthly Tokens</div>
                      <div>🎨 <strong>{plan.limits?.maxGenerationsPerMonth || 100}</strong> Autonomous Media Gen</div>
                      <div>📂 <strong>{plan.limits?.maxProjects === 9999 ? "Unlimited" : plan.limits?.maxProjects}</strong> Active Projects</div>
                    </div>

                    <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", fontWeight: 800, marginBottom: "0.8rem" }}>
                      Key Features
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {(plan.features || []).map((feat, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.82rem", color: "#9ca3af", lineHeight: 1.4 }}>
                          <span style={{ color: "#75f4ab", fontWeight: 800 }}>✓</span>
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
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: "0.92rem",
                    cursor: isCurrent ? "default" : "pointer",
                    border: "none",
                    background: isCurrent
                      ? "rgba(117,244,171,0.15)"
                      : isPopular
                        ? `linear-gradient(135deg, ${GOLD}, #b8860b)`
                        : "rgba(255,255,255,0.08)",
                    color: isCurrent ? "#75f4ab" : isPopular ? "#000" : "#fff",
                    boxShadow: isPopular && !isCurrent ? "0 4px 20px rgba(212,175,55,0.25)" : "none",
                    transition: "all 0.2s"
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
        <div style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(10,15,24,0.9) 100%)", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "2.5rem 2rem", textAlign: "center" }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: "0 0 0.8rem" }}>
            Need Custom Workflows or Sovereign Air-Gapped Deployment?
          </h3>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem", maxWidth: 650, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
            GARUDA engineering pods can be deployed on private bare-metal servers or enterprise clusters. All commercial enterprise contracts include signed SLAs and formal B2B GST tax compliance.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/demo")}
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b8860b)`, color: "#000", border: "none", padding: "0.75rem 2rem", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}
            >
              Book Strategic Architecture Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
