import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const GOLD = "#f5d76e";
const BG_PANEL = "#0a0f18";
const BORDER_GOLD = "rgba(245, 215, 110, 0.25)";
const BORDER_SUBTLE = "rgba(255, 255, 255, 0.08)";

const TIER_MAPPING = {
  "cloud-starter": {
    key: "CLOUD_STARTER",
    title: "Cloud Starter",
    pricing: "From ₹4,999 / month",
    summary: "Hosted Gateway Infrastructure with multi-rail orchestration & direct-to-bank settlement."
  },
  "cross-border-growth": {
    key: "CROSS_BORDER_GROWTH",
    title: "Cross-Border Growth",
    pricing: "From ₹49,000 setup + ₹9,999 / month",
    summary: "Multi-currency treasury orchestration across USD, AED, INR, GBP, EUR corridors."
  },
  "sovereign-enterprise": {
    key: "SOVEREIGN_ENTERPRISE",
    title: "Sovereign Enterprise",
    pricing: "Custom Sovereign Architecture",
    summary: "Private VPC / Dedicated Self-Hosted Infrastructure with custom routing & dedicated SLA."
  }
};

export default function FintechQualificationFlow({ initialTier, onSwitchToChat }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedTierSlug = initialTier || searchParams.get("tier") || "cloud-starter";
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    businessType: "D2C / E-commerce",
    moneyMovement: "domestic",
    corridors: "India (Domestic)",
    expectedMonthlyVolume: "< ₹10 lakh",
    requiredCurrencies: ["INR"],
    deploymentModel: "hosted",
    requiredIntegrations: ["REST API", "Webhooks", "Reconciliation"],
    implementationUrgency: "30–60 days",
    name: "",
    company: "",
    email: "",
    phone: "",
    country: "India",
    website: ""
  });

  // Pre-seed based on initial tier
  useEffect(() => {
    if (selectedTierSlug === "cross-border-growth") {
      setFormData((prev) => ({
        ...prev,
        businessType: "Exporter / International SaaS",
        moneyMovement: "cross-border",
        requiredCurrencies: ["INR", "USD", "AED"],
        corridors: "India, UAE, US",
        expectedMonthlyVolume: "₹10 lakh – ₹50 lakh"
      }));
    } else if (selectedTierSlug === "sovereign-enterprise") {
      setFormData((prev) => ({
        ...prev,
        businessType: "Fintech / Platform",
        moneyMovement: "both",
        deploymentModel: "privateVPC",
        requiredCurrencies: ["INR", "USD", "AED", "EUR"],
        expectedMonthlyVolume: "₹5 crore – ₹25 crore"
      }));
    }
  }, [selectedTierSlug]);

  const updateField = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData((prev) => {
      const arr = prev[field] || [];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter((x) => x !== item) };
      } else {
        return { ...prev, [field]: [...arr, item] };
      }
    });
  };

  // Deterministic Local Evaluation for Instant Visual Rationale
  const evaluateLocalFit = () => {
    let recTier = "CLOUD_STARTER";
    const dep = formData.deploymentModel.toLowerCase();
    const isEnterpriseBiz = ["Fintech", "NBFC", "Enterprise Platform"].some((b) => formData.businessType.includes(b));
    const isHighVol = formData.expectedMonthlyVolume.includes("25 crore+") || formData.expectedMonthlyVolume.includes("5 crore");
    const isMultiCurrency = formData.requiredCurrencies.some((c) => c !== "INR") || formData.moneyMovement !== "domestic";

    if (dep.includes("private") || dep.includes("self") || isEnterpriseBiz || isHighVol) {
      recTier = "SOVEREIGN_ENTERPRISE";
    } else if (isMultiCurrency || formData.businessType.includes("Exporter") || formData.businessType.includes("SaaS")) {
      recTier = "CROSS_BORDER_GROWTH";
    } else {
      recTier = "CLOUD_STARTER";
    }

    const details = {
      CLOUD_STARTER: {
        title: "Cloud Starter",
        pricing: "From ₹4,999 / month",
        desc: "Hosted gateway container with direct regulated provider execution and deterministic reconciliation."
      },
      CROSS_BORDER_GROWTH: {
        title: "Cross-Border Growth",
        pricing: "From ₹49,000 setup + ₹9,999 / month",
        desc: "Multi-currency treasury orchestration across international corridors with automated invoice-matching."
      },
      SOVEREIGN_ENTERPRISE: {
        title: "Sovereign Enterprise",
        pricing: "Custom Sovereign Architecture",
        desc: "Private VPC / Dedicated Self-Hosted gateway infrastructure with dedicated SLA and custom rails."
      }
    }[recTier];

    return { recTier, details };
  };

  const handleNext = () => {
    setErrorMsg("");
    if (currentStep === 8) {
      if (!formData.name.trim() || !formData.company.trim() || !formData.email.trim()) {
        setErrorMsg("Please provide your Name, Company, and Work Email to continue.");
        return;
      }
      if (!formData.email.includes("@")) {
        setErrorMsg("Please enter a valid corporate email address.");
        return;
      }
      handleSubmit();
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 9));
  };

  const handleBack = () => {
    setErrorMsg("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMsg("");

    const payload = {
      topic: "fintech-gateway",
      service: "fintech-gateway",
      fintechPayload: {
        identity: {
          name: formData.name,
          company: formData.company,
          email: formData.email,
          phone: formData.phone,
          country: formData.country
        },
        business: {
          businessType: formData.businessType,
          industry: "Digital Commerce & Fintech",
          website: formData.website,
          operatingCountries: [formData.country]
        },
        paymentRequirements: {
          selectedTier: selectedTierSlug,
          moneyMovement: formData.moneyMovement,
          expectedMonthlyVolume: formData.expectedMonthlyVolume,
          requiredCurrencies: formData.requiredCurrencies,
          sendingCountries: [formData.country],
          receivingCountries: [formData.country],
          paymentDirection: "both",
          settlementPreference: "T+1"
        },
        integration: {
          requiredIntegrations: formData.requiredIntegrations,
          APIRequired: formData.requiredIntegrations.includes("REST API"),
          webhookRequired: formData.requiredIntegrations.includes("Webhooks"),
          ERPRequired: formData.requiredIntegrations.includes("ERP Integration"),
          invoicingRequired: formData.requiredIntegrations.includes("Invoicing / Billing")
        },
        deployment: {
          deploymentModel: formData.deploymentModel
        },
        commercial: {
          implementationUrgency: formData.implementationUrgency,
          budgetRange: "Standard Commercial Tier"
        },
        metadata: {
          source: "fintech_qualification_flow",
          landingPage: "https://www.garudaos.in/chat?topic=fintech-gateway",
          selectedTier: selectedTierSlug
        }
      }
    };

    try {
      const res = await fetch("/api/project-scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to process qualification submission.");
      }
      setSubmissionResult(data);
      setCurrentStep(9); // Result screen
    } catch (err) {
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const { recTier, details: recDetails } = evaluateLocalFit();
  const selectedTierInfo = TIER_MAPPING[selectedTierSlug] || TIER_MAPPING["cloud-starter"];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "780px",
        margin: "0 auto",
        background: BG_PANEL,
        border: `1px solid ${BORDER_GOLD}`,
        borderRadius: "16px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Top Banner: Selected Tier Context */}
      <div
        style={{
          background: "linear-gradient(90deg, rgba(245,215,110,0.12), rgba(10,15,24,0.95))",
          borderBottom: `1px solid ${BORDER_SUBTLE}`,
          padding: "0.85rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.2rem" }}>🦅</span>
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: GOLD, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Commercial Architecture Qualification
            </div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
              Targeting: <strong style={{ color: "#fff" }}>{selectedTierInfo.title}</strong> ({selectedTierInfo.pricing})
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span
            style={{
              fontSize: "0.7rem",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              color: "#10b981",
              padding: "0.2rem 0.6rem",
              borderRadius: "999px",
              fontWeight: 700
            }}
          >
            Zero-Custody Architecture
          </span>
          {onSwitchToChat && (
            <button
              onClick={onSwitchToChat}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#cbd5e1",
                padding: "0.25rem 0.65rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                cursor: "pointer"
              }}
            >
              Open AI Chat 💬
            </button>
          )}
        </div>
      </div>

      {/* Step Progress Bar (Steps 1 to 8) */}
      {currentStep <= 8 && (
        <div style={{ padding: "0.9rem 1.25rem 0.3rem", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: GOLD, letterSpacing: "0.04em" }}>
              STEP {currentStep} OF 8
            </span>
            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
              {Math.round((currentStep / 8) * 100)}% Completed
            </span>
          </div>
          <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
            <div
              style={{
                width: `${(currentStep / 8) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #d4af37, #f5d76e)",
                transition: "width 0.3s ease"
              }}
            />
          </div>
        </div>
      )}

      {/* Main Form Body */}
      <div style={{ padding: "1.5rem 1.5rem", flex: 1 }}>
        {errorMsg && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#f87171",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              marginBottom: "1.25rem"
            }}
          >
            ⚠️ {errorMsg}
          </div>
        )}

        {/* STEP 1: What are you building? */}
        {currentStep === 1 && (
          <div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", color: "#fff", fontWeight: 700 }}>
              1. What kind of business or platform are you building?
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 1.2rem", lineHeight: 1.5 }}>
              Select your primary operational model so GARUDA can map appropriate transaction throughput and settlement state machines.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
              {[
                { title: "D2C / E-commerce", desc: "Online brands, retail commerce, high-volume consumer checkout" },
                { title: "SME / Digital Commerce", desc: "B2B merchants, professional services, corporate billing" },
                { title: "Exporter / International SaaS", desc: "Cross-border software, global agency billing, multi-currency invoicing" },
                { title: "Fintech / NBFC", desc: "Lending, disbursements, neo-banking, specialized credit flows" },
                { title: "Enterprise Platform / Marketplace", desc: "Multi-party settlement, sub-merchant routing, custom rails" },
                { title: "Other Specialized Workflow", desc: "Non-standard corporate treasury or proprietary network" }
              ].map((opt) => {
                const active = formData.businessType === opt.title;
                return (
                  <button
                    key={opt.title}
                    type="button"
                    onClick={() => updateField("businessType", opt.title)}
                    style={{
                      background: active ? "rgba(245,215,110,0.12)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${active ? GOLD : BORDER_SUBTLE}`,
                      borderRadius: "10px",
                      padding: "1rem",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ fontWeight: 700, color: active ? GOLD : "#fff", fontSize: "0.92rem", marginBottom: "0.25rem" }}>
                      {opt.title}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#8d95a7", lineHeight: 1.4 }}>
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Where will money move? */}
        {currentStep === 2 && (
          <div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", color: "#fff", fontWeight: 700 }}>
              2. Where will money move?
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 1.2rem", lineHeight: 1.5 }}>
              Define geographical corridors for payment collections and settlements.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {[
                { key: "domestic", title: "Domestic Only", desc: "Single country clearing (e.g. India UPI/IMPS/NEFT or UAE Local)" },
                { key: "cross-border", title: "Cross-Border Only", desc: "International client collections and foreign exchange repatriation" },
                { key: "both", title: "Both (Hybrid Multi-Rail)", desc: "Simultaneous domestic domestic checkouts and international corridors" }
              ].map((m) => {
                const active = formData.moneyMovement === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => updateField("moneyMovement", m.key)}
                    style={{
                      background: active ? "rgba(245,215,110,0.12)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${active ? GOLD : BORDER_SUBTLE}`,
                      borderRadius: "10px",
                      padding: "1rem",
                      textAlign: "left",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ fontWeight: 700, color: active ? GOLD : "#fff", fontSize: "0.92rem", marginBottom: "0.25rem" }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#8d95a7" }}>{m.desc}</div>
                  </button>
                );
              })}
            </div>

            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.4rem" }}>
              Key Countries / Corridors of Operation
            </label>
            <input
              type="text"
              value={formData.corridors}
              onChange={(e) => updateField("corridors", e.target.value)}
              placeholder="e.g. India, UAE, US, UK, Singapore..."
              style={{
                width: "100%",
                background: "rgba(0,0,0,0.3)",
                border: `1px solid ${BORDER_SUBTLE}`,
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                color: "#fff",
                fontSize: "0.9rem"
              }}
            />
          </div>
        )}

        {/* STEP 3: Monthly payment volume */}
        {currentStep === 3 && (
          <div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", color: "#fff", fontWeight: 700 }}>
              3. Approximate monthly transaction volume?
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 0.6rem", lineHeight: 1.5 }}>
              Used to calibrate gateway container concurrency, VAN generation buffers, and rate limits.
            </p>
            <div
              style={{
                background: "rgba(56, 189, 248, 0.08)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                padding: "0.5rem 0.8rem",
                borderRadius: "6px",
                fontSize: "0.74rem",
                color: "#38bdf8",
                marginBottom: "1.2rem"
              }}
            >
              ℹ️ Architecture &amp; capacity calibration only — not proof of funds or financial eligibility check.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
              {[
                "< ₹10 lakh",
                "₹10 lakh – ₹50 lakh",
                "₹50 lakh – ₹5 crore",
                "₹5 crore – ₹25 crore",
                "₹25 crore+",
                "Custom Enterprise"
              ].map((vol) => {
                const active = formData.expectedMonthlyVolume === vol;
                return (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => updateField("expectedMonthlyVolume", vol)}
                    style={{
                      background: active ? "rgba(245,215,110,0.12)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${active ? GOLD : BORDER_SUBTLE}`,
                      borderRadius: "10px",
                      padding: "0.9rem 1rem",
                      fontWeight: 700,
                      color: active ? GOLD : "#fff",
                      cursor: "pointer",
                      fontSize: "0.92rem",
                      textAlign: "center"
                    }}
                  >
                    {vol}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Currencies Needed */}
        {currentStep === 4 && (
          <div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", color: "#fff", fontWeight: 700 }}>
              4. Which currencies do you require?
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 0.6rem", lineHeight: 1.5 }}>
              Select all currencies your invoice workflows, checkout forms, or treasury dashboards must handle.
            </p>
            <div
              style={{
                background: "rgba(245, 215, 110, 0.08)",
                border: `1px solid ${BORDER_GOLD}`,
                padding: "0.5rem 0.8rem",
                borderRadius: "6px",
                fontSize: "0.74rem",
                color: "#fef08a",
                marginBottom: "1.2rem"
              }}
            >
              ⚠️ Architecture/workflow requirement — actual rail availability depends on regulated provider onboarding and commercial credentials.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
              {[
                { code: "INR", label: "Indian Rupee (INR)", flag: "🇮🇳" },
                { code: "USD", label: "US Dollar (USD)", flag: "🇺🇸" },
                { code: "AED", label: "UAE Dirham (AED)", flag: "🇦🇪" },
                { code: "GBP", label: "British Pound (GBP)", flag: "🇬🇧" },
                { code: "EUR", label: "Euro (EUR)", flag: "🇪🇺" },
                { code: "SGD", label: "Singapore Dollar", flag: "🇸🇬" }
              ].map((c) => {
                const active = formData.requiredCurrencies.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleArrayItem("requiredCurrencies", c.code)}
                    style={{
                      background: active ? "rgba(245,215,110,0.15)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${active ? GOLD : BORDER_SUBTLE}`,
                      borderRadius: "10px",
                      padding: "0.8rem",
                      cursor: "pointer",
                      textAlign: "center"
                    }}
                  >
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.2rem" }}>{c.flag}</div>
                    <div style={{ fontWeight: 700, color: active ? GOLD : "#fff", fontSize: "0.88rem" }}>
                      {c.code}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#8d95a7" }}>{c.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Deployment Model */}
        {currentStep === 5 && (
          <div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", color: "#fff", fontWeight: 700 }}>
              5. How do you want GARUDA deployed?
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 1.2rem", lineHeight: 1.5 }}>
              Select infrastructure tenancy and sovereignty controls.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
              {[
                {
                  key: "hosted",
                  title: "Hosted Gateway Infrastructure",
                  badge: "Cloud Starter / Growth",
                  desc: "Fully managed, secure cloud instance managed by GARUDA with automated updates and SSL."
                },
                {
                  key: "privateVPC",
                  title: "Private Dedicated VPC",
                  badge: "Enterprise",
                  desc: "Single-tenant container cluster deployed inside your dedicated AWS, GCP, or Azure VPC."
                },
                {
                  key: "selfHosted",
                  title: "Self-Hosted Sovereign Architecture",
                  badge: "Sovereign Enterprise",
                  desc: "On-premise or sovereign cloud deployment with source-level governance and zero external telemetry."
                },
                {
                  key: "enterpriseCustom",
                  title: "Custom Multi-Region Cluster",
                  badge: "Custom Review",
                  desc: "Bespoke geo-distributed routing cluster with active-active failover and private HSM signing."
                }
              ].map((dep) => {
                const active = formData.deploymentModel === dep.key;
                return (
                  <button
                    key={dep.key}
                    type="button"
                    onClick={() => updateField("deploymentModel", dep.key)}
                    style={{
                      background: active ? "rgba(245,215,110,0.12)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${active ? GOLD : BORDER_SUBTLE}`,
                      borderRadius: "10px",
                      padding: "1rem",
                      textAlign: "left",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: 700, color: active ? GOLD : "#fff", fontSize: "0.92rem" }}>
                        {dep.title}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.68rem", color: GOLD, background: "rgba(245,215,110,0.1)", padding: "0.15rem 0.45rem", borderRadius: "4px", fontWeight: 700, display: "inline-block", marginBottom: "0.4rem" }}>
                      {dep.badge}
                    </span>
                    <div style={{ fontSize: "0.76rem", color: "#8d95a7", lineHeight: 1.4 }}>{dep.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6: Integrations */}
        {currentStep === 6 && (
          <div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", color: "#fff", fontWeight: 700 }}>
              6. Which system integrations do you need?
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 1.2rem", lineHeight: 1.5 }}>
              Select the interfaces and workflows required by your engineering and finance operations.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
              {[
                "REST API",
                "Webhooks",
                "ERP Integration",
                "Invoicing / Billing",
                "Automated Reconciliation",
                "Treasury Dashboard",
                "Custom Multi-Rail Routing"
              ].map((item) => {
                const active = formData.requiredIntegrations.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem("requiredIntegrations", item)}
                    style={{
                      background: active ? "rgba(245,215,110,0.12)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${active ? GOLD : BORDER_SUBTLE}`,
                      borderRadius: "8px",
                      padding: "0.85rem 1rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem"
                    }}
                  >
                    <span style={{ color: active ? GOLD : "#4b5563", fontSize: "1.1rem" }}>
                      {active ? "☑" : "☐"}
                    </span>
                    <span style={{ fontWeight: 600, color: active ? "#fff" : "#cbd5e1", fontSize: "0.88rem" }}>
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 7: Timeline & Urgency */}
        {currentStep === 7 && (
          <div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", color: "#fff", fontWeight: 700 }}>
              7. How soon are you targeting implementation?
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 1.2rem", lineHeight: 1.5 }}>
              Helps us schedule engineering capacity and sandbox allocation.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
              {[
                { title: "Immediate / 30 Days", desc: "Ready to initiate sandbox testing and provider onboarding now" },
                { title: "30–60 days", desc: "Finalizing internal software architecture & banking approvals" },
                { title: "60–90 days", desc: "Q3/Q4 product launch roadmap" },
                { title: "Exploring / Research", desc: "Evaluating architecture options and cost comparisons" }
              ].map((t) => {
                const active = formData.implementationUrgency === t.title;
                return (
                  <button
                    key={t.title}
                    type="button"
                    onClick={() => updateField("implementationUrgency", t.title)}
                    style={{
                      background: active ? "rgba(245,215,110,0.12)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${active ? GOLD : BORDER_SUBTLE}`,
                      borderRadius: "10px",
                      padding: "1rem",
                      textAlign: "left",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ fontWeight: 700, color: active ? GOLD : "#fff", fontSize: "0.92rem", marginBottom: "0.25rem" }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#8d95a7" }}>{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 8: Contact & Corporate Identity */}
        {currentStep === 8 && (
          <div>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", color: "#fff", fontWeight: 700 }}>
              8. Contact &amp; Corporate Details
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "0 0 1.2rem", lineHeight: 1.5 }}>
              GARUDA uses these details to generate your preliminary commercial proposal draft and alert Founder Praveen Mahawar.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                  Your Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${BORDER_SUBTLE}`,
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    color: "#fff",
                    fontSize: "0.9rem"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => updateField("company", e.target.value)}
                  placeholder="e.g. Apex Global Tech Pvt Ltd"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${BORDER_SUBTLE}`,
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    color: "#fff",
                    fontSize: "0.9rem"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                  Corporate Work Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="e.g. rahul@apextech.com"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${BORDER_SUBTLE}`,
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    color: "#fff",
                    fontSize: "0.9rem"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                  Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${BORDER_SUBTLE}`,
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    color: "#fff",
                    fontSize: "0.9rem"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                  Country / Primary Jurisdiction
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  placeholder="e.g. India, UAE, UK, USA"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${BORDER_SUBTLE}`,
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    color: "#fff",
                    fontSize: "0.9rem"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.3rem" }}>
                  Company Website (Optional)
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://apextech.com"
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${BORDER_SUBTLE}`,
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    color: "#fff",
                    fontSize: "0.9rem"
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: "1.2rem", padding: "0.8rem", background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER_SUBTLE}`, borderRadius: "8px", fontSize: "0.75rem", color: "#8d95a7", lineHeight: 1.5 }}>
              🔒 <strong>Privacy &amp; Zero Custody Covenant:</strong> We never collect banking passwords, debit/credit cards, CVV, or private API secrets. Your data is used exclusively to generate your technical scoping proposal.
            </div>
          </div>
        )}

        {/* STEP 9: RESULT SCREEN ("YOUR PRELIMINARY GARUDA ARCHITECTURE") */}
        {currentStep === 9 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "2rem" }}>🎯</span>
              <h2 style={{ margin: "0.4rem 0 0.2rem", fontSize: "1.4rem", color: "#fff", fontWeight: 800 }}>
                YOUR PRELIMINARY GARUDA ARCHITECTURE
              </h2>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                Scoping formulated for <strong style={{ color: "#fff" }}>{formData.company || "Your Organization"}</strong>
              </div>
            </div>

            {/* Architecture Card */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(245,215,110,0.1), rgba(11,15,22,0.95))",
                border: `1px solid ${GOLD}`,
                borderRadius: "14px",
                padding: "1.5rem",
                marginBottom: "1.25rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.8rem" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                    Evaluated Recommendation
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: GOLD, marginTop: "0.15rem" }}>
                    {recDetails.title}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Indicative Pricing
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
                    {recDetails.pricing}
                  </div>
                </div>
              </div>

              <p style={{ color: "#cbd5e1", fontSize: "0.88rem", lineHeight: 1.6, margin: "0 0 1rem" }}>
                {recDetails.desc}
              </p>

              {/* Selected vs Recommended Comparison */}
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "0.8rem 1rem", borderRadius: "8px", border: `1px solid ${BORDER_SUBTLE}`, fontSize: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                  <span style={{ color: "#8d95a7" }}>Initial Exploration:</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{selectedTierInfo.title}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#8d95a7" }}>Evaluated Architecture:</span>
                  <span style={{ color: GOLD, fontWeight: 700 }}>{recDetails.title}</span>
                </div>
              </div>
            </div>

            {/* Provider Readiness & Gaps */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER_SUBTLE}`, borderRadius: "12px", padding: "1.2rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", marginBottom: "0.6rem" }}>
                Provider Compatibility &amp; Readiness
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                  <span style={{ color: "#e2e8f0" }}>• GARUDA Mock Bank (Sandbox Rails)</span>
                  <span style={{ color: "#10b981", fontWeight: 700, background: "rgba(16,185,129,0.1)", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                    OPERATIONAL (Instant)
                  </span>
                </div>
                {formData.requiredCurrencies.includes("INR") && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                    <span style={{ color: "#e2e8f0" }}>• ICICI Corporate Banking (INR Rails)</span>
                    <span style={{ color: "#f5d76e", fontWeight: 700, background: "rgba(245,215,110,0.1)", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                      ADAPTER READY (Requires Onboarding)
                    </span>
                  </div>
                )}
                {(formData.requiredCurrencies.includes("AED") || formData.moneyMovement.includes("cross")) && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                    <span style={{ color: "#e2e8f0" }}>• Wio Bank PJSC (UAE / AED Rails)</span>
                    <span style={{ color: "#f5d76e", fontWeight: 700, background: "rgba(245,215,110,0.1)", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                      SANDBOX READY (Requires Wio Keys)
                    </span>
                  </div>
                )}
                {(formData.requiredCurrencies.includes("GBP") || formData.requiredCurrencies.includes("EUR")) && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                    <span style={{ color: "#e2e8f0" }}>• Modulr UK/EU (GBP &amp; SEPA Rails)</span>
                    <span style={{ color: "#f5d76e", fontWeight: 700, background: "rgba(245,215,110,0.1)", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                      ADAPTER READY (Requires Approval)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Non-Binding Status Notice */}
            <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "10px", padding: "1rem", marginBottom: "1.5rem", fontSize: "0.8rem", color: "#a7f3d0", lineHeight: 1.5 }}>
              🛡️ <strong>Preliminary Architecture Fit — Non-Binding / Subject to Founder Approval</strong>
              <div style={{ marginTop: "0.3rem", color: "#94a3b8" }}>
                Commercial pricing shown is an indicative starting point. Your proposal draft has been created and logged for formal review by Founder Praveen Mahawar.
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap" }}>
              {submissionResult?.proposalId && (
                <button
                  type="button"
                  onClick={() => navigate(`/proposal/${submissionResult.proposalId}`)}
                  style={{
                    flex: "1 1 240px",
                    background: "linear-gradient(135deg, #d4af37, #f5d76e)",
                    color: "#05080e",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.85rem 1.4rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: "0.95rem"
                  }}
                >
                  📄 View Formal Proposal Draft (#{submissionResult.proposalId.slice(0, 14)}…)
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onSwitchToChat) onSwitchToChat();
                  else navigate("/chat");
                }}
                style={{
                  flex: "1 1 180px",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${BORDER_SUBTLE}`,
                  color: "#e2e8f0",
                  borderRadius: "8px",
                  padding: "0.85rem 1.2rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.9rem"
                }}
              >
                Discuss with AI Architect 💬
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons (Steps 1 to 8) */}
      {currentStep <= 8 && (
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "rgba(0,0,0,0.3)",
            borderTop: `1px solid ${BORDER_SUBTLE}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${BORDER_SUBTLE}`,
                color: "#cbd5e1",
                borderRadius: "8px",
                padding: "0.6rem 1.2rem",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            style={{
              background: "linear-gradient(135deg, #d4af37, #f5d76e)",
              color: "#05080e",
              border: "none",
              borderRadius: "8px",
              padding: "0.65rem 1.6rem",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(245,215,110,0.25)"
            }}
          >
            {submitting ? "Processing…" : currentStep === 8 ? "Formulate Architecture & Proposal →" : "Continue →"}
          </button>
        </div>
      )}
    </div>
  );
}
