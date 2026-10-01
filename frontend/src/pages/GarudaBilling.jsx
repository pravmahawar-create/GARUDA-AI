import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BrandAssetImage from "../components/BrandAssetImage";
import SEOHead from "../components/SEOHead";

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
  green: "#15803d",
  greenBg: "rgba(22, 163, 74, 0.12)",
  blue: "#0284c7",
  obsidian: "#10141D",
  obsidianDeep: "#0B0E14",
  obsidianCard: "#151B26"
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
    <div style={{
      background: palette.canvas,
      color: palette.text,
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      WebkitFontSmoothing: "antialiased"
    }}>
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
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        background: "rgba(246, 244, 238, 0.92)",
        borderBottom: `1px solid ${palette.border}`,
        padding: "0.85rem clamp(1.25rem, 4vw, 3.5rem)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <img
            src="/images/garuda_eagle_sigil.png"
            alt="GARUDA Sigil"
            style={{ width: "34px", height: "28px", objectFit: "contain" }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.25rem",
              fontWeight: "700",
              letterSpacing: "0.06em",
              color: palette.text
            }}>
              GARUDA BILLING
            </div>
            <div style={{
              fontSize: "0.6rem",
              color: palette.muted,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              marginTop: "3px"
            }}>
              High-Velocity Retail & Wholesale POS
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => navigate("/chat?ref=billing")}
            style={{
              background: palette.goldGradient,
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "0.65rem 1.35rem",
              fontWeight: "600",
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "transform 0.15s ease",
              boxShadow: "0 2px 10px rgba(179, 130, 53, 0.25)"
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
            background: "rgba(179, 130, 53, 0.1)",
            border: `1px solid ${palette.borderGold}`,
            fontSize: "0.75rem",
            fontWeight: "600",
            letterSpacing: "0.1em",
            color: palette.goldDeep,
            marginBottom: "1.5rem",
            textTransform: "uppercase"
          }}>
            ⚡ Forensically Verified V4.1 Engine
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2rem, 5vw, 3.75rem)",
            fontWeight: "700",
            lineHeight: "1.15",
            letterSpacing: "-0.01em",
            color: palette.text,
            marginBottom: "1.5rem",
            maxWidth: "900px",
            marginInline: "auto"
          }}>
            GST Billing Software Engineered <span style={{
              background: palette.goldGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>Around Your Business</span>
          </h1>

          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: palette.muted,
            maxWidth: "760px",
            margin: "0 auto 2.5rem",
            lineHeight: "1.65"
          }}>
            Most billing software demos stop at the UI. GARUDA Billing completes the entire business transaction:
            real GSTIN entry, verified tax calculations, thermal receipt printing, and official Tax Invoices in sub-second time.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3.5rem" }}>
            <button
              onClick={() => navigate("/chat?ref=billing")}
              style={{
                background: palette.goldGradient,
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "0.85rem 2rem",
                fontWeight: "600",
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(179, 130, 53, 0.25)"
              }}
            >
              Get Custom Billing MVP
            </button>
            <a
              href="https://www.youtube.com/shorts/E8rU8Nks44g"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: palette.card,
                color: palette.text,
                border: `1px solid ${palette.border}`,
                borderRadius: "8px",
                padding: "0.85rem 1.75rem",
                fontWeight: "600",
                fontSize: "1rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
              }}
            >
              ▶ Watch Proof Film (63s)
            </a>
          </div>
        </motion.div>

        {/* Live Forensic Proof Card - High-tech Obsidian Panel */}
        <motion.div {...fadeUp} style={{
          background: `linear-gradient(180deg, ${palette.obsidian} 0%, ${palette.obsidianDeep} 100%)`,
          border: `1px solid ${palette.borderGold}`,
          borderRadius: "16px",
          padding: "2rem",
          maxWidth: "860px",
          margin: "0 auto",
          textAlign: "left",
          boxShadow: "0 24px 60px rgba(16, 20, 29, 0.25)",
          color: "#f7f2dc"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            paddingBottom: "1rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "0.5rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🧾</span>
              <span style={{ fontWeight: "700", color: "#F5D76E", fontSize: "0.95rem", letterSpacing: "0.04em" }}>
                REAL VERIFIED TRANSACTION AUDIT
              </span>
            </div>
            <span style={{
              fontSize: "0.75rem",
              background: "rgba(117, 244, 171, 0.15)",
              color: "#75f4ab",
              padding: "0.25rem 0.6rem",
              borderRadius: "4px",
              fontWeight: "600"
            }}>
              ✓ OCR VERIFIED PROOF
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.72rem", color: "#8d95a7", letterSpacing: "0.05em", textTransform: "uppercase" }}>INVOICE NUMBER</div>
              <div style={{ fontSize: "1.15rem", fontWeight: "700", color: "#ffffff", marginTop: "4px" }}>#0001</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.72rem", color: "#8d95a7", letterSpacing: "0.05em", textTransform: "uppercase" }}>BUSINESS ENTITY</div>
              <div style={{ fontSize: "1.15rem", fontWeight: "700", color: "#ffffff", marginTop: "4px" }}>Sharma Hardware</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.72rem", color: "#8d95a7", letterSpacing: "0.05em", textTransform: "uppercase" }}>VERIFIED GSTIN</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#7dd3fc", fontFamily: "monospace", marginTop: "4px" }}>23AABCS1429B1ZB</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "0.72rem", color: "#8d95a7", letterSpacing: "0.05em", textTransform: "uppercase" }}>FINAL TAX INVOICE TOTAL</div>
              <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#75f4ab", marginTop: "4px" }}>₹4,661.00</div>
            </div>
          </div>

          <div style={{
            fontSize: "0.85rem",
            color: "#b0b8c8",
            lineHeight: "1.6",
            background: "rgba(0,0,0,0.35)",
            padding: "1rem",
            borderRadius: "8px",
            borderLeft: "3px solid #F5D76E"
          }}>
            <strong style={{ color: "#ffffff" }}>Forensic Proof Note:</strong> Subtotal ₹3,950.00 + CGST (9%) ₹355.50 + SGST (9%) ₹355.50 = ₹4,661.00. Zero simulated calculations. Tested against official Indian GST calculation rules.
          </div>
        </motion.div>
      </section>

      {/* Core Architectural Capabilities */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 1.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: "700",
            color: palette.text
          }}>
            Engineered For Speed, Reliability & Precision
          </h2>
          <p style={{ color: palette.muted, maxWidth: "600px", margin: "0.5rem auto 0", fontSize: "1rem" }}>
            Built with modern offline-first web technologies and hardware-accelerated rendering.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {CAPABILITIES.map((cap, idx) => (
            <motion.div
              key={idx}
              {...fadeUp}
              style={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                borderRadius: "14px",
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <span style={{
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    color: palette.goldDeep,
                    background: "rgba(179, 130, 53, 0.1)",
                    padding: "0.25rem 0.55rem",
                    borderRadius: "4px",
                    letterSpacing: "0.06em"
                  }}>
                    {cap.badge}
                  </span>
                  <span style={{
                    fontSize: "0.75rem",
                    color: palette.green,
                    background: palette.greenBg,
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    fontWeight: "600"
                  }}>
                    {cap.metric}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: palette.text, marginBottom: "0.75rem" }}>
                  {cap.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: palette.muted, lineHeight: "1.6" }}>
                  {cap.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQs Section */}
      <section style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "2rem",
          fontWeight: "700",
          color: palette.text,
          textAlign: "center",
          marginBottom: "2.5rem"
        }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              style={{
                background: palette.card,
                border: `1px solid ${palette.border}`,
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)"
              }}
            >
              <h3 style={{
                fontSize: "1.05rem",
                fontWeight: "700",
                color: palette.goldDeep,
                marginBottom: "0.5rem"
              }}>
                {faq.q}
              </h3>
              <p style={{ fontSize: "0.92rem", color: palette.muted, lineHeight: "1.6", margin: 0 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Call to Action */}
      <footer style={{
        borderTop: `1px solid ${palette.border}`,
        padding: "3.5rem 1.5rem",
        textAlign: "center",
        background: palette.canvasIvory
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.75rem",
          fontWeight: "700",
          color: palette.text,
          marginBottom: "1rem"
        }}>
          Ready to Upgrade Your Business Invoicing?
        </h2>
        <p style={{ color: palette.muted, maxWidth: "550px", margin: "0 auto 2rem", fontSize: "0.95rem" }}>
          Experience bespoke software built by the GARUDA engineering workforce. Fast, reliable, and tailored to your inventory.
        </p>
        <button
          onClick={() => navigate("/chat?ref=billing")}
          style={{
            background: palette.goldGradient,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            padding: "0.85rem 2.25rem",
            fontWeight: "600",
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(179, 130, 53, 0.25)"
          }}
        >
          Talk to GARUDA Engineering
        </button>
        <div style={{ fontSize: "0.75rem", color: palette.subtle, marginTop: "2rem" }}>
          © {new Date().getFullYear()} GARUDA OS. All rights reserved. Sovereign Anti-Fabrication Engineering.
        </div>
      </footer>
    </div>
  );
}
