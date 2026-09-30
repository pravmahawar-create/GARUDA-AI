import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BrandAssetImage from "../components/BrandAssetImage";
import SEOHead from "../components/SEOHead";

const palette = {
  bg: "#04070a",
  panel: "#0b0f16",
  panelSoft: "rgba(11, 15, 22, 0.75)",
  line: "rgba(245, 215, 110, 0.16)",
  text: "#f7f2dc",
  muted: "#8d95a7",
  gold: "#f5d76e",
  goldStrong: "#b8860b",
  green: "#75f4ab",
  blue: "#7dd3fc"
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5, ease: "easeOut" }
};

const CAPABILITIES = [
  {
    title: "Instant GST Tax Invoicing",
    badge: "GSTIN VERIFIED",
    desc: "Single-tap GSTIN auto-lookup with HSN code mapping, auto CGST/SGST/IGST tax calculation, and compliant Tax Invoice formatting.",
    metric: "1.2s per invoice"
  },
  {
    title: "100% Offline-First Reliability",
    badge: "ZERO DOWNTIME",
    desc: "Full local SQLite/IndexedDB data ledger. Continue billing seamlessly during internet blackouts with automatic bi-directional cloud sync.",
    metric: "100% Offline Capable"
  },
  {
    title: "Thermal & Laser Print Engine",
    badge: "ESC/POS READY",
    desc: "Direct USB, Bluetooth, and network thermal printing (2-inch, 3-inch slips) alongside clean A4/A5 GST Tax Invoices with customizable logos.",
    metric: "Instant Print"
  },
  {
    title: "Direct WhatsApp & SMS Delivery",
    badge: "PAPERLESS LEDGER",
    desc: "Deliver verified digital invoice PDFs directly to customer WhatsApp numbers instantly upon transaction completion.",
    metric: "0 Click WhatsApp Delivery"
  }
];

const FAQS = [
  {
    q: "Is GARUDA Billing compliant with Indian GST laws?",
    a: "Yes. GARUDA Billing generates fully compliant GST Tax Invoices featuring verified GSTIN headers, customer billing details, HSN/SAC breakdowns, reverse charge flags, and CGST/SGST/IGST split accounting."
  },
  {
    q: "Does GARUDA Billing work without internet?",
    a: "Yes. GARUDA Billing is built with an offline-first local database. Cashiers can scan items, generate bills, and print receipts without an active internet connection. All data synchronizes automatically once connectivity restores."
  },
  {
    q: "Can GARUDA Billing be customized for specific wholesale or retail workflows?",
    a: "Yes. Unlike rigid off-the-shelf software, GARUDA Billing is engineered by GARUDA OS directly around your business workflows—including custom barcode formats, bulk rate tiers, multi-counter synchronization, and ERP integrations."
  },
  {
    q: "How can I get a demo or deployment for my business?",
    a: "You can book an interactive live demo directly through the GARUDA engineering portal at garudaos.in/chat or connect with our solutions team for custom scoping."
  }
];

export default function GarudaBilling() {
  const navigate = useNavigate();

  const billingSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "GARUDA Billing",
    "operatingSystem": "Web, Windows, Android",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": "High-velocity offline-first GST Billing Software engineered for Indian retail and wholesale enterprises."
  };

  return (
    <div style={{ background: palette.bg, color: palette.text, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <SEOHead
        title="GARUDA Billing — GST Billing Software Engineered Around Your Business"
        description="High-velocity offline-first POS & GST Tax Invoice software engineered for Indian retail and wholesale businesses. Auto GSTIN calculation, thermal print engine, and instant WhatsApp delivery."
        canonical="https://www.garudaos.in/billing"
        schema={billingSchema}
      />

      {/* Top Header Bar */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(12px)",
        background: "rgba(4, 7, 10, 0.85)",
        borderBottom: `1px solid ${palette.line}`,
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: "1280px",
        margin: "0 auto"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }} onClick={() => navigate("/")}>
          <BrandAssetImage
            assetKey="official_logo"
            alt="GARUDA Logo"
            style={{ width: "36px", height: "36px", objectFit: "contain" }}
          />
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: "700", letterSpacing: "0.05em", color: palette.gold }}>GARUDA BILLING</div>
            <div style={{ fontSize: "0.7rem", color: palette.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>High-Velocity Retail POS</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => navigate("/chat?ref=billing")}
            style={{
              background: `linear-gradient(135deg, ${palette.gold}, ${palette.goldStrong})`,
              color: "#04070a",
              border: "none",
              borderRadius: "6px",
              padding: "0.6rem 1.25rem",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "transform 0.15s ease",
              boxShadow: "0 2px 10px rgba(245, 215, 110, 0.25)"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Book Live Demo
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 1.5rem 3rem", textAlign: "center" }}>
        <motion.div {...fadeUp}>
          <div style={{
            display: "inline-block",
            padding: "0.35rem 0.85rem",
            borderRadius: "999px",
            background: "rgba(245, 215, 110, 0.1)",
            border: `1px solid ${palette.line}`,
            fontSize: "0.75rem",
            fontWeight: "600",
            letterSpacing: "0.1em",
            color: palette.gold,
            marginBottom: "1.5rem",
            textTransform: "uppercase"
          }}>
            ⚡ Forensically Verified V4.1 Engine
          </div>

          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.75rem)",
            fontWeight: "800",
            lineHeight: "1.15",
            letterSpacing: "-0.02em",
            color: "#ffffff",
            marginBottom: "1.5rem",
            maxWidth: "900px",
            marginInline: "auto"
          }}>
            GST Billing Software Engineered <span style={{ color: palette.gold }}>Around Your Business</span>
          </h1>

          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            color: palette.muted,
            maxWidth: "760px",
            margin: "0 auto 2.5rem",
            lineHeight: "1.6"
          }}>
            Most billing software demos stop at the UI. GARUDA Billing completes the entire business transaction:
            real GSTIN entry, verified tax calculations, thermal receipt printing, and official Tax Invoices in sub-second time.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" }}>
            <button
              onClick={() => navigate("/chat?ref=billing")}
              style={{
                background: `linear-gradient(135deg, ${palette.gold}, ${palette.goldStrong})`,
                color: "#04070a",
                border: "none",
                borderRadius: "8px",
                padding: "0.85rem 2rem",
                fontWeight: "700",
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(245, 215, 110, 0.3)"
              }}
            >
              Get Custom Billing MVP
            </button>
            <a
              href="https://www.youtube.com/shorts/E8rU8Nks44g"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                color: palette.text,
                border: `1px solid ${palette.line}`,
                borderRadius: "8px",
                padding: "0.85rem 1.75rem",
                fontWeight: "600",
                fontSize: "1rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              ▶ Watch Proof Film (63s)
            </a>
          </div>
        </motion.div>

        {/* Live Proof Card */}
        <motion.div {...fadeUp} style={{
          background: palette.panel,
          border: `1px solid ${palette.line}`,
          borderRadius: "16px",
          padding: "2rem",
          maxWidth: "860px",
          margin: "0 auto",
          textAlign: "left",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${palette.line}`, paddingBottom: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🧾</span>
              <span style={{ fontWeight: "700", color: palette.gold, fontSize: "0.95rem" }}>REAL VERIFIED TRANSACTION AUDIT</span>
            </div>
            <span style={{ fontSize: "0.75rem", background: "rgba(117, 244, 171, 0.15)", color: palette.green, padding: "0.25rem 0.6rem", borderRadius: "4px", fontWeight: "600" }}>
              ✓ OCR VERIFIED PROOF
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", color: palette.muted }}>INVOICE NUMBER</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ffffff" }}>#0001</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", color: palette.muted }}>BUSINESS ENTITY</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ffffff" }}>Sharma Hardware</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", color: palette.muted }}>VERIFIED GSTIN</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "700", color: palette.blue, fontFamily: "monospace" }}>23AABCS1429B1ZB</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.75rem", color: palette.muted }}>FINAL TAX INVOICE TOTAL</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "800", color: palette.green }}>₹4,661.00</div>
            </div>
          </div>

          <div style={{ fontSize: "0.85rem", color: palette.muted, lineHeight: "1.6", background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "8px", borderLeft: `3px solid ${palette.gold}` }}>
            <strong style={{ color: palette.text }}>Forensic Proof Note:</strong> Subtotal ₹3,950.00 + CGST (9%) ₹355.50 + SGST (9%) ₹355.50 = ₹4,661.00. Zero simulated calculations. Tested against official Indian GST calculation rules.
          </div>
        </motion.div>
      </section>

      {/* Core Architectural Capabilities */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 1.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: "700", color: "#ffffff" }}>
            Engineered For Speed, Reliability & Precision
          </h2>
          <p style={{ color: palette.muted, maxWidth: "600px", margin: "0.5rem auto 0" }}>
            Built with modern offline-first web technologies and hardware-accelerated rendering.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {CAPABILITIES.map((cap, idx) => (
            <motion.div
              key={idx}
              {...fadeUp}
              style={{
                background: palette.panel,
                border: `1px solid ${palette.line}`,
                borderRadius: "12px",
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: "700", color: palette.gold, background: "rgba(245, 215, 110, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                    {cap.badge}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: palette.green, fontWeight: "600" }}>{cap.metric}</span>
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#ffffff", marginBottom: "0.75rem" }}>{cap.title}</h3>
                <p style={{ fontSize: "0.875rem", color: palette.muted, lineHeight: "1.6" }}>{cap.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQs Section */}
      <section style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#ffffff", textAlign: "center", marginBottom: "2.5rem" }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ background: palette.panel, border: `1px solid ${palette.line}`, borderRadius: "10px", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "600", color: palette.gold, marginBottom: "0.5rem" }}>{faq.q}</h3>
              <p style={{ fontSize: "0.9rem", color: palette.muted, lineHeight: "1.6", margin: 0 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Call to Action */}
      <footer style={{ borderTop: `1px solid ${palette.line}`, padding: "3rem 1.5rem", textAlign: "center", background: "#020406" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#ffffff", marginBottom: "1rem" }}>
          Ready to Upgrade Your Business Invoicing?
        </h2>
        <p style={{ color: palette.muted, maxWidth: "550px", margin: "0 auto 2rem", fontSize: "0.95rem" }}>
          Experience bespoke software built by the GARUDA engineering workforce. Fast, reliable, and tailored to your inventory.
        </p>
        <button
          onClick={() => navigate("/chat?ref=billing")}
          style={{
            background: `linear-gradient(135deg, ${palette.gold}, ${palette.goldStrong})`,
            color: "#04070a",
            border: "none",
            borderRadius: "8px",
            padding: "0.85rem 2.25rem",
            fontWeight: "700",
            fontSize: "1rem",
            cursor: "pointer"
          }}
        >
          Talk to GARUDA Engineering
        </button>
        <div style={{ fontSize: "0.75rem", color: palette.muted, marginTop: "2rem" }}>
          © {new Date().getFullYear()} GARUDA OS. All rights reserved. Sovereign Anti-Fabrication Engineering.
        </div>
      </footer>
    </div>
  );
}
