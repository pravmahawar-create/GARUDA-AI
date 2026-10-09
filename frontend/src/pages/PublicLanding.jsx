import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BrandAssetImage from "../components/BrandAssetImage";
import SEOHead from "../components/SEOHead";
import ProjectScopeForm from "../components/ProjectScopeForm";
import WhatsAppQuickCTA from "../components/WhatsAppQuickCTA";
import LiveGarudaPlayground from "../components/LiveGarudaPlayground";
import { trackEvent } from "../utils/telemetry";

const palette = {
  // Foundation Canvas (Warm premium ivory / atmospheric off-white)
  canvas: "#F6F4EE",
  canvasIvory: "#FAF9F6",
  canvasSubtle: "#F2EFE8",
  card: "#FFFFFF",

  // Text Hierarchy (Rich graphite, not flat black)
  text: "#17181B",
  textBody: "#292B30",
  muted: "#525866",
  subtle: "#8A8D95",

  // Signature GARUDA Gold (Metalic, warm, expensive)
  gold: "#B38235",
  goldPrimary: "#C48B28",
  goldDeep: "#9E6D1C",
  goldLight: "#D6A84F",
  goldGradient: "linear-gradient(135deg, #C48B28 0%, #9E6D1C 100%)",
  goldHalo: "rgba(179, 130, 53, 0.12)",

  // Functional Status Accents
  green: "#059669",
  greenBg: "rgba(5, 150, 105, 0.08)",
  red: "#DC2626",
  redBg: "rgba(220, 38, 38, 0.08)",
  indigo: "#343A67",
  indigoBg: "rgba(52, 58, 103, 0.08)",

  // Borders
  border: "rgba(23, 24, 27, 0.08)",
  borderSubtle: "rgba(23, 24, 27, 0.05)",
  borderGold: "rgba(179, 130, 53, 0.35)",

  // Deep Obsidian Dark Workspace (Command Console & Grounded Footer)
  obsidian: "#10141D",
  obsidianDeep: "#0B0E14",
  obsidianCard: "#151B26",
  obsidianBorder: "rgba(255, 255, 255, 0.08)"
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, ease: "easeOut" }
};

const SectionHeading = ({ kicker, title, highlight, sub }) => (
  <motion.div {...fadeUp} style={{ textAlign: "center", maxWidth: 780, margin: "0 auto 3rem" }}>
    <p style={{
      color: palette.goldDeep,
      letterSpacing: "0.14em",
      fontSize: "0.76rem",
      fontWeight: 700,
      margin: "0 0 0.75rem",
      textTransform: "uppercase",
      fontFamily: "'Inter', sans-serif"
    }}>
      ✦ {kicker}
    </p>
    <h2 style={{
      fontSize: "clamp(1.95rem, 3.2vw, 2.75rem)",
      fontWeight: 700,
      lineHeight: 1.18,
      margin: 0,
      color: palette.text,
      fontFamily: "'Playfair Display', Georgia, serif",
      letterSpacing: "-0.015em"
    }}>
      {title}{" "}
      {highlight && (
        <span style={{ color: palette.gold, fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif" }}>
          {highlight}
        </span>
      )}
    </h2>
    {sub && (
      <p style={{
        color: palette.muted,
        fontSize: "1.02rem",
        lineHeight: 1.65,
        margin: "0.9rem auto 0",
        maxWidth: 640,
        fontFamily: "'Inter', sans-serif"
      }}>
        {sub}
      </p>
    )}
  </motion.div>
);

const structuredSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "GARUDA OS",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "49",
        "highPrice": "999",
        "priceCurrency": "USD"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How much does a WhatsApp AI receptionist cost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Next.js 14 source code starter kit is $49 (₹3,999) with lifetime updates. Done-for-you turnkey clinic or business setup starts at $199 (₹9,999)."
          }
        },
        {
          "@type": "Question",
          "name": "Can GARUDA book clinic appointments automatically?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. GARUDA automatically triages patient urgency, checks clinic availability, reserves slots, and alerts human staff immediately if emergency symptoms are detected."
          }
        },
        {
          "@type": "Question",
          "name": "How does milestone payment protection work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "All custom software projects operate on a 50/50 milestone basis: 50% upfront to initiate architecture, and 50% upon verified staging demonstration."
          }
        }
      ]
    }
  ]
};

export default function PublicLanding({ onGetStarted, onFounderLogin }) {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [universeCategory, setUniverseCategory] = useState("all");

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
    trackEvent("faq_toggle", { index });
  };

  const handleDeployClinic = () => {
    trackEvent("playground_clinic_cta_clicked");
    document.getElementById("project-scope")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeploySales = () => {
    trackEvent("playground_sales_cta_clicked");
    document.getElementById("project-scope")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGetStarterKit = () => {
    trackEvent("playground_starter_cta_clicked");
    navigate("/starter");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: palette.canvas,
      color: palette.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      WebkitFontSmoothing: "antialiased",
      position: "relative",
      overflowX: "hidden"
    }}>
      <SEOHead
        title="GARUDA OS — Autonomous AI Systems & WhatsApp AI Receptionists"
        description="Deploy autonomous AI systems, 24/7 WhatsApp AI receptionists, and production software workflows engineered around your business rules. Next.js 14 Starter Kit available ($49 / ₹3,999)."
        canonical="https://www.garudaos.in/"
        structuredData={structuredSchema}
      />

      {/* 01 — Reference Luxury Navigation Bar */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.85rem clamp(1.25rem, 4vw, 3.5rem)",
        borderBottom: `1px solid ${palette.border}`,
        background: "rgba(246, 244, 238, 0.92)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        position: "sticky",
        top: 0,
        zIndex: 60
      }}>
        {/* Brand Sigil & Editorial Logo */}
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
        </button>

        {/* Minimal Nav Links */}
        <nav className="garuda-desktop-nav">
          <a
            href="/"
            style={{
              color: palette.text,
              textDecoration: "none",
              fontSize: "0.88rem",
              fontWeight: 600,
              borderBottom: `2px solid ${palette.gold}`,
              paddingBottom: "4px"
            }}
          >
            Home
          </a>
          <a href="/solutions" style={{ color: "#525866", textDecoration: "none", fontSize: "0.88rem", fontWeight: 500 }}>
            Solutions
          </a>
          <a href="/audit" style={{ color: "#f87171", textDecoration: "none", fontSize: "0.88rem", fontWeight: 600 }}>
            ⚡ Free Audit
          </a>
          <a href="#how-it-works" style={{ color: "#525866", textDecoration: "none", fontSize: "0.88rem", fontWeight: 500 }}>
            Use Cases
          </a>
          <a href="/pricing" style={{ color: "#525866", textDecoration: "none", fontSize: "0.88rem", fontWeight: 500 }}>
            Pricing
          </a>
          <a href="#ecosystem" style={{ color: "#525866", textDecoration: "none", fontSize: "0.88rem", fontWeight: 500 }}>
            27 Universes
          </a>
          <a href="#faq" style={{ color: "#525866", textDecoration: "none", fontSize: "0.88rem", fontWeight: 500 }}>
            Resources
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Persistent High-Value CTA Button */}
          <button
            type="button"
            onClick={() => {
              trackEvent("nav_cta_deploy_click");
              document.getElementById("project-scope")?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              background: palette.goldGradient,
              border: "none",
              color: "#FFFFFF",
              borderRadius: 999,
              padding: "0.55rem 1.35rem",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.86rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              boxShadow: "0 6px 18px rgba(179, 130, 53, 0.32)",
              transition: "all 0.16s ease"
            }}
          >
            <span>Deploy Your AI System</span>
            <span>→</span>
          </button>

          {/* Founder Cockpit VIP Access */}
          <button
            type="button"
            className="founder-nav-btn"
            onClick={onFounderLogin}
            title="Founder Console Access"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "#17181B",
              border: "1px solid rgba(179, 130, 53, 0.4)",
              color: "#FAF9F6",
              borderRadius: 999,
              padding: "0.45rem 0.95rem",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.78rem",
              boxShadow: "0 2px 8px rgba(23, 24, 27, 0.15)",
              transition: "all 0.16s ease"
            }}
          >
            <span>👑</span>
            <span>Founder</span>
          </button>
        </div>
      </header>

      {/* 02 — Asymmetric Cinematic Hero Section (Pixel-Aligned with Approved Reference) */}
      <section style={{
        position: "relative",
        padding: "clamp(3.5rem, 6vw, 5.5rem) clamp(1.25rem, 4vw, 3.5rem) clamp(2.5rem, 4vw, 4rem)",
        background: palette.canvas,
        overflow: "hidden"
      }}>
        {/* Aerodynamic Background Flowing Contour SVG */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/garuda_contour_lines.svg)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center top",
          backgroundSize: "cover",
          pointerEvents: "none",
          opacity: 0.85,
          zIndex: 1
        }} />

        {/* Ambient Warm Golden Luminous Radial Glow */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "25%",
          width: "50vw",
          height: "40vw",
          background: "radial-gradient(circle, rgba(201, 154, 50, 0.08) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 1
        }} />

        {/* Cinematic Himalayan Mountain Silhouette & Soaring Eagle Atmosphere */}
        <div className="hero-art-atmospheric">
          <img
            src="/images/garuda_himalayan_eagle.webp"
            alt="GARUDA Himalayan Eagle Flight"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              objectFit: "contain",
              objectPosition: "top right"
            }}
          />
        </div>

        {/* Main 2-Column Responsive Hero Container */}
        <div className="hero-layout-grid">
          {/* Left Column: Eyebrow + Editorial Headline + CTAs + Trust Points */}
          <div style={{ maxWidth: 600, textAlign: "left" }}>
            {/* Eyebrow Tag */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.55rem",
              padding: "0.38rem 1rem",
              borderRadius: 999,
              border: "1px solid rgba(179, 130, 53, 0.35)",
              background: "rgba(255, 255, 255, 0.8)",
              color: palette.text,
              fontSize: "0.74rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              marginBottom: "1.4rem",
              boxShadow: "0 2px 8px rgba(179, 130, 53, 0.08)"
            }}>
              <span style={{ color: palette.gold }}>✦</span>
              <span>AUTONOMOUS BUSINESS EXECUTION ENGINE</span>
            </div>

            {/* Editorial Luxury Headline */}
            <h1
              className="hero-headline-editorial"
              aria-label="Autonomous AI Systems That Run Your Business While You Sleep."
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(2.3rem, 3.8vw, 3.8rem)",
                fontWeight: 700,
                lineHeight: 1.14,
                margin: "0 0 1.35rem",
                letterSpacing: "-0.015em",
                color: palette.text
              }}>
              <span style={{ display: "block" }}>Autonomous AI Systems</span>
              <span style={{ display: "block" }}>That Run Your Business</span>
              <span style={{
                display: "block",
                color: palette.gold,
                fontStyle: "italic",
                fontFamily: "'Playfair Display', Georgia, serif"
              }}>
                While You Sleep.
              </span>
            </h1>

            {/* Human-First Supporting Copy */}
            <p style={{
              color: palette.muted,
              fontSize: "clamp(1rem, 1.4vw, 1.1rem)",
              lineHeight: 1.68,
              margin: "0 0 2rem",
              fontFamily: "'Inter', sans-serif",
              maxWidth: 520
            }}>
              From 24/7 WhatsApp customer receptionists to AI-powered operations, GARUDA builds, deploys and runs custom AI systems for your business — so you can focus on what truly matters.
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="hero-cta-group" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginBottom: "2.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  trackEvent("primary_cta_click", { location: "hero" });
                  document.getElementById("project-scope")?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  background: palette.goldGradient,
                  color: "#FFFFFF",
                  border: "none",
                  padding: "0.95rem 2rem",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: "0.96rem",
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(179, 130, 53, 0.32)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  transition: "all 0.16s ease"
                }}
              >
                <span>Deploy Your AI System</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  trackEvent("secondary_cta_click", { location: "hero" });
                  navigate("/starter");
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.85)",
                  border: "1px solid rgba(179, 130, 53, 0.4)",
                  color: palette.text,
                  padding: "0.95rem 1.8rem",
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: "0.94rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                  transition: "all 0.16s ease"
                }}
              >
                Explore Starter Kit ($49)
              </button>
            </div>

            {/* 4 Micro Capability Indicators */}
            <div className="hero-indicators-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))",
              gap: "1.1rem",
              paddingTop: "1.4rem",
              borderTop: "1px solid rgba(23, 24, 27, 0.08)",
              maxWidth: 540
            }}>
              {[
                { icon: "⚡", bold: "Deploy in days", sub: "not months" },
                { icon: "🛡️", bold: "Human", sub: "when it matters" },
                { icon: "📈", bold: "Custom for", sub: "your business" },
                { icon: "🌐", bold: "Built for", sub: "real-world use" }
              ].map(item => (
                <div key={item.bold} style={{ display: "flex", alignItems: "flex-start", gap: "0.55rem" }}>
                  <span style={{ fontSize: "1.15rem", lineHeight: 1.2 }}>{item.icon}</span>
                  <div style={{ fontSize: "0.78rem", lineHeight: 1.35 }}>
                    <div style={{ fontWeight: 700, color: palette.text }}>{item.bold}</div>
                    <div style={{ color: palette.muted }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Floating Obsidian AI Command Console */}
          <div style={{ position: "relative", zIndex: 3, width: "100%" }}>
            <LiveGarudaPlayground
              onDeployClinic={handleDeployClinic}
              onDeploySales={handleDeploySales}
              onGetStarterKit={handleGetStarterKit}
            />
          </div>
        </div>

        {/* 03 — Three Clear Commercial Paths (Matching Exact Reference Layout) */}
        <div className="hero-pricing-strip" id="products">
          <div className="hero-pricing-grid">
            {/* Card 1: Turnkey AI Systems (Featured / Most Popular in Reference) */}
            <div style={{
              background: "rgba(255, 255, 255, 0.95)",
              border: "1.5px solid rgba(179, 130, 53, 0.45)",
              borderRadius: 22,
              padding: "2.4rem 2.1rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              boxShadow: "0 18px 48px rgba(179, 130, 53, 0.12), 0 2px 8px rgba(0, 0, 0, 0.03)",
              transition: "all 0.16s ease"
            }}>
              {/* Top Right Floating Badge */}
              <div style={{
                position: "absolute",
                top: 18,
                right: 18,
                background: palette.goldGradient,
                color: "#FFFFFF",
                padding: "0.28rem 0.8rem",
                borderRadius: 999,
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.06em",
                boxShadow: "0 4px 12px rgba(179, 130, 53, 0.3)"
              }}>
                MOST POPULAR
              </div>

              <div>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(179, 130, 53, 0.12)",
                  border: "1px solid rgba(179, 130, 53, 0.3)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1.4rem",
                  marginBottom: "1.2rem"
                }}>
                  🚀
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.45rem", fontWeight: 700, margin: "0 0 0.4rem", color: palette.text }}>
                  Turnkey AI Systems
                </h3>
                <p style={{ color: palette.muted, fontSize: "0.88rem", lineHeight: 1.5, margin: "0 0 1.25rem" }}>
                  Fully deployed, done-for-you solutions.
                </p>
                <div style={{ fontSize: "1.85rem", fontWeight: 800, color: palette.goldDeep, marginBottom: "1.3rem", display: "flex", alignItems: "baseline", gap: "0.45rem" }}>
                  <span>$199</span>
                  <span style={{ fontSize: "1.1rem", color: palette.text, fontWeight: 700 }}>/ ₹9,999</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.85rem", color: palette.textBody, fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: palette.gold, fontWeight: 800 }}>✓</span> Custom AI system for your business
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: palette.gold, fontWeight: 800 }}>✓</span> Setup, deployment and training
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: palette.gold, fontWeight: 800 }}>✓</span> Ongoing support and optimization
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  trackEvent("pricing_clinic_click");
                  document.getElementById("project-scope")?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  background: palette.goldGradient,
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 12,
                  padding: "0.95rem",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(179, 130, 53, 0.32)",
                  transition: "all 0.16s ease"
                }}
              >
                Discuss Your Project →
              </button>
            </div>

            {/* Card 2: Starter Kits */}
            <div style={{
              background: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: 22,
              padding: "2.4rem 2.1rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.03)",
              transition: "all 0.16s ease"
            }}>
              <div>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(23, 24, 27, 0.04)",
                  border: `1px solid ${palette.border}`,
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1.4rem",
                  marginBottom: "1.2rem"
                }}>
                  📦
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.45rem", fontWeight: 700, margin: "0 0 0.4rem", color: palette.text }}>
                  Starter Kits
                </h3>
                <p style={{ color: palette.muted, fontSize: "0.88rem", lineHeight: 1.5, margin: "0 0 1.25rem" }}>
                  Source code + setup guides
                </p>
                <div style={{ fontSize: "1.85rem", fontWeight: 800, color: palette.goldDeep, marginBottom: "1.3rem", display: "flex", alignItems: "baseline", gap: "0.45rem" }}>
                  <span>$49</span>
                  <span style={{ fontSize: "1.1rem", color: palette.text, fontWeight: 700 }}>/ ₹3,999</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.85rem", color: palette.textBody, fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: palette.gold, fontWeight: 800 }}>✓</span> Complete source code
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: palette.gold, fontWeight: 800 }}>✓</span> Step-by-step setup instructions
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: palette.gold, fontWeight: 800 }}>✓</span> Start building immediately
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  trackEvent("pricing_starter_click");
                  navigate("/starter");
                }}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(179, 130, 53, 0.45)",
                  color: palette.text,
                  borderRadius: 12,
                  padding: "0.95rem",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                  transition: "all 0.16s ease"
                }}
              >
                Explore Starter Kit →
              </button>
            </div>

            {/* Card 3: Custom Architecture (Enterprise) */}
            <div style={{
              background: palette.card,
              border: `1px solid ${palette.border}`,
              borderRadius: 22,
              padding: "2.4rem 2.1rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.03)",
              transition: "all 0.16s ease"
            }}>
              <div>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(23, 24, 27, 0.04)",
                  border: `1px solid ${palette.border}`,
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1.4rem",
                  marginBottom: "1.2rem"
                }}>
                  🏢
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.45rem", fontWeight: 700, margin: "0 0 0.4rem", color: palette.text }}>
                  Custom Architecture
                </h3>
                <p style={{ color: palette.muted, fontSize: "0.88rem", lineHeight: 1.5, margin: "0 0 1.25rem" }}>
                  For complex and enterprise needs
                </p>
                <div style={{ fontSize: "1.85rem", fontWeight: 800, color: palette.goldDeep, marginBottom: "1.3rem", display: "flex", alignItems: "baseline", gap: "0.45rem" }}>
                  <span>$999+</span>
                  <span style={{ fontSize: "1.05rem", color: palette.muted, fontWeight: 600 }}>Custom Scope</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.85rem", color: palette.textBody, fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: palette.gold, fontWeight: 800 }}>✓</span> Tailored to your exact requirements
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: palette.gold, fontWeight: 800 }}>✓</span> Advanced integrations
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: palette.gold, fontWeight: 800 }}>✓</span> Dedicated support and development
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  trackEvent("pricing_enterprise_click");
                  document.getElementById("project-scope")?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(179, 130, 53, 0.45)",
                  color: palette.text,
                  borderRadius: 12,
                  padding: "0.95rem",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                  transition: "all 0.16s ease"
                }}
              >
                Get a Custom Quote →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 05 — The GARUDA Ecosystem (27 Intelligent Universes - Matching Reference) */}
      <section id="ecosystem" style={{
        padding: "clamp(4.5rem, 7vw, 6.5rem) clamp(1.25rem, 4vw, 4rem)",
        background: palette.canvasSubtle,
        borderTop: `1px solid ${palette.border}`,
        borderBottom: `1px solid ${palette.border}`,
        position: "relative"
      }}>
        <div style={{
          maxWidth: 1240,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1.5rem",
          marginBottom: "2.5rem"
        }}>
          <div>
            <p style={{
              color: palette.goldDeep,
              letterSpacing: "0.14em",
              fontSize: "0.76rem",
              fontWeight: 700,
              margin: "0 0 0.6rem",
              textTransform: "uppercase"
            }}>
              ✦ THE GARUDA ECOSYSTEM
            </p>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2rem, 3.4vw, 2.8rem)",
              fontWeight: 700,
              lineHeight: 1.15,
              margin: "0 0 0.8rem",
              color: palette.text
            }}>
              27 Intelligent Universes.{" "}
              <span style={{ color: palette.gold, fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif" }}>
                Endless Possibilities.
              </span>
            </h2>
            <p style={{ color: palette.muted, fontSize: "1.02rem", maxWidth: 660, margin: 0, lineHeight: 1.6 }}>
              From healthcare to finance, education to manufacturing — GARUDA's 27 universes bring autonomous AI to every industry.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/case-studies")}
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(179, 130, 53, 0.4)",
              color: palette.text,
              borderRadius: 999,
              padding: "0.65rem 1.4rem",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <span>Explore All Universes</span>
            <span>→</span>
          </button>
        </div>

        {/* 27 Universes Specialized Studio Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.4rem",
          maxWidth: 1240,
          margin: "0 auto"
        }}>
          {[
            {
              title: "PAWAN Coding Studio",
              tag: "ENGINEERING",
              route: "/pawan",
              icon: "⚡",
              desc: "Autonomous software engineering daemon with automated git governance and test validation."
            },
            {
              title: "Vidya Education Studio",
              tag: "ACADEMICS",
              route: "/scholar",
              icon: "🎓",
              desc: "Multi-language knowledge engine, syllabus alignment, and automated academic assessment."
            },
            {
              title: "GARUDA DOST",
              tag: "AGRITECH & RURAL",
              route: "/dost",
              icon: "🌾",
              desc: "Vernacular agricultural intelligence, market price analysis, and rural enterprise support."
            },
            {
              title: "Enterprise Solutions",
              tag: "CASE STUDIES",
              route: "/case-studies",
              icon: "📋",
              desc: "Verified production deployments across clinic reception, billing, and retail operations."
            }
          ].map(uni => (
            <div
              key={uni.title}
              onClick={() => navigate(uni.route)}
              style={{
                background: "#FFFFFF",
                border: `1px solid ${palette.border}`,
                borderRadius: 16,
                padding: "1.6rem",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
                transition: "all 0.16s ease"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{uni.icon}</span>
                <span style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: palette.goldDeep,
                  background: "rgba(179, 130, 53, 0.1)",
                  padding: "0.2rem 0.55rem",
                  borderRadius: 6
                }}>
                  {uni.tag}
                </span>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.45rem", color: palette.text }}>
                {uni.title}
              </h3>
              <p style={{ margin: "0 0 1rem", fontSize: "0.86rem", color: palette.muted, lineHeight: 1.55 }}>
                {uni.desc}
              </p>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: palette.goldDeep, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                Launch Studio →
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Governed Proof & Trust Strip */}
      <section style={{
        padding: "1.8rem clamp(1.25rem, 4vw, 4rem)",
        borderTop: `1px solid ${palette.border}`,
        borderBottom: `1px solid ${palette.border}`,
        background: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(8px)",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.5rem",
          maxWidth: 1200,
          margin: "0 auto",
          textAlign: "center"
        }}>
          {[
            { icon: "⚡", title: "Sub-Second Triage", subtitle: "Instant classification & priority routing" },
            { icon: "🛡️", title: "100% Code Ownership", subtitle: "Full source code, no vendor lock-in" },
            { icon: "💬", title: "WhatsApp Cloud API", subtitle: "Official Meta-compliant business messaging" },
            { icon: "⚠️", title: "Human Safeguard", subtitle: "Automated escalation when judgment is needed" }
          ].map((item) => (
            <div key={item.title} style={{ padding: "0.6rem 1rem" }}>
              <div style={{ fontSize: "1.35rem", marginBottom: "0.3rem" }}>{item.icon}</div>
              <div style={{ color: palette.text, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "0.92rem" }}>
                {item.title}
              </div>
              <div style={{ color: palette.muted, fontSize: "0.8rem", marginTop: "2px" }}>{item.subtitle}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 06 — How It Works (3 Clear Steps) */}
      <section id="how-it-works" style={{ padding: "clamp(4.5rem, 7vw, 6.5rem) clamp(1.25rem, 4vw, 4rem)", background: palette.canvas }}>
        <SectionHeading
          kicker="Clear Engagement Process"
          title="How Autonomous Systems Are"
          highlight="Delivered."
          sub="No theoretical debates or endless consulting. A disciplined 3-step execution model."
        />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.8rem",
          maxWidth: 1100,
          margin: "0 auto"
        }}>
          {[
            {
              step: "01",
              title: "Scope & Business Rules Intake",
              desc: "We analyze your exact customer communication flows, operating bottlenecks, and required integrations."
            },
            {
              step: "02",
              title: "Deterministic Build & Sandbox Testing",
              desc: "Your system is built inside a private staging environment and tested against high-volume test scenarios."
            },
            {
              step: "03",
              title: "Governed Live Deployment",
              desc: "System launches with live WhatsApp Cloud API webhooks, automated logging, and built-in human escalation rules."
            }
          ].map((s) => (
            <div
              key={s.step}
              style={{
                padding: "2.2rem 2rem",
                borderRadius: 18,
                border: `1px solid ${palette.border}`,
                background: palette.card,
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)"
              }}
            >
              <div style={{ fontFamily: "ui-monospace, monospace", color: palette.goldDeep, fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.75rem" }}>
                {s.step}
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.55rem", color: palette.text }}>
                {s.title}
              </h3>
              <p style={{ margin: 0, color: palette.muted, fontSize: "0.92rem", lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 07 & 08 — Proof & Governed Execution with Human Oversight */}
      <section id="proof" style={{ padding: "clamp(4.5rem, 7vw, 6.5rem) clamp(1.25rem, 4vw, 4rem)", background: palette.canvasSubtle }}>
        <SectionHeading
          kicker="Governed Execution Standard"
          title="Automated When Predictable. Human When It Matters."
          sub="We design AI systems that respect operational boundaries. Here is exactly what is automated versus escalated."
        />

        <div style={{
          maxWidth: 1040,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.8rem"
        }}>
          {/* Automated Column */}
          <div style={{
            padding: "2.2rem 2rem",
            borderRadius: 20,
            border: "1px solid rgba(5, 150, 105, 0.22)",
            background: palette.card,
            boxShadow: "0 4px 18px rgba(5, 150, 105, 0.04)"
          }}>
            <h3 style={{ color: palette.green, fontSize: "1.18rem", fontWeight: 700, margin: "0 0 1.2rem", fontFamily: "'Playfair Display', Georgia, serif" }}>
              ✔ What GARUDA Autonomously Handles:
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem", color: palette.textBody, fontSize: "0.92rem" }}>
              <li>• Instant 24/7 reply to repetitive inquiries in under 45 seconds</li>
              <li>• Patient symptom &amp; urgency triage based on clinical keywords</li>
              <li>• Lead qualification (budget, scope, timeline verification)</li>
              <li>• Structured task logging &amp; CRM record creation</li>
              <li>• Automated payment link generation &amp; receipt issuance</li>
            </ul>
          </div>

          {/* Escalation Column */}
          <div style={{
            padding: "2.2rem 2rem",
            borderRadius: 20,
            border: "1px solid rgba(220, 38, 38, 0.22)",
            background: palette.card,
            boxShadow: "0 4px 18px rgba(220, 38, 38, 0.04)"
          }}>
            <h3 style={{ color: palette.red, fontSize: "1.18rem", fontWeight: 700, margin: "0 0 1.2rem", fontFamily: "'Playfair Display', Georgia, serif" }}>
              ⚠️ What Triggers Human Escalation:
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem", color: palette.textBody, fontSize: "0.92rem" }}>
              <li>• Medical emergencies, acute clinical distress, or trauma</li>
              <li>• Angry or emotionally distressed customer communications</li>
              <li>• Custom enterprise requests outside established rule boundaries</li>
              <li>• Payment disputes or manual refund authorizations</li>
              <li>• Any scenario where human clinical or legal judgment is required</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 09 — High-Intent FAQ (SEO Schema Ready) */}
      <section id="faq" style={{ padding: "clamp(4.5rem, 7vw, 6.5rem) clamp(1.25rem, 4vw, 4rem)", background: palette.canvas }}>
        <SectionHeading
          kicker="Frequently Asked Questions"
          title="Clear Answers on Setup, Pricing &amp;"
          highlight="Compliance."
          sub="Everything you need to know before putting an autonomous system into production."
        />

        <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: "0.95rem" }}>
          {[
            {
              q: "How much does a WhatsApp AI receptionist cost?",
              a: "Our Next.js 14 source code starter kit is $49 (₹3,999) one-time with full source code ownership. Done-for-you turnkey clinic or business setup starts at $199 (₹9,999). For larger enterprise systems, we provide custom milestone-based quotes."
            },
            {
              q: "Can GARUDA book clinic appointments automatically?",
              a: "Yes. GARUDA automatically triages patient urgency, checks clinic hours, reserves slots, and immediately alerts human staff if acute symptoms or emergencies are detected."
            },
            {
              q: "What is included in the Next.js 14 Starter Kit?",
              a: "You receive 17 verified source files: Next.js 14 App Router, Meta WhatsApp Cloud API webhook handler, Supabase database schema, Gemini 2.5 triage logic, and Razorpay/Stripe billing code."
            },
            {
              q: "How does the 50/50 milestone payment structure work?",
              a: "For custom client projects, 50% is paid upfront to initiate technical architecture and staging deployment. The remaining 50% is released only after you verify the working demonstration on staging."
            },
            {
              q: "Is WhatsApp Cloud API compliance guaranteed?",
              a: "GARUDA's architecture strictly follows the documented Meta WhatsApp Cloud API integration flow, including official webhook verification and secure dispatch. However, Meta account approval, messaging templates, opt-in adherence, and ongoing account standing remain subject to Meta's business policies and the customer's messaging practices."
            }
          ].map((item, idx) => (
            <div
              key={item.q}
              style={{
                borderRadius: 16,
                border: `1px solid ${palette.border}`,
                background: palette.card,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                overflow: "hidden"
              }}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "1.35rem 1.6rem",
                  background: "none",
                  border: "none",
                  color: palette.text,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1.08rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span>{item.q}</span>
                <span style={{ color: palette.goldDeep, fontSize: "1.35rem", transform: openFaq === idx ? "rotate(45deg)" : "none", transition: "transform 0.16s ease" }}>
                  +
                </span>
              </button>
              {openFaq === idx && (
                <div style={{ padding: "0 1.6rem 1.45rem", color: "#525866", fontSize: "0.94rem", lineHeight: 1.65, borderTop: `1px solid ${palette.borderSubtle}`, paddingTop: "0.9rem" }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 10 — Project Scope Request Intake */}
      <section id="project-scope" style={{ padding: "clamp(4.5rem, 7vw, 6.5rem) clamp(1.25rem, 4vw, 4rem)", position: "relative", background: palette.canvasSubtle }}>
        <SectionHeading
          kicker="Start Your Deployment"
          title="Direct Founder Scoping &amp; System Briefing"
          sub="Submit your business requirements below to receive a structured scope brief and timeline directly from Praveen Mahawar."
        />
        <ProjectScopeForm theme="light" />
      </section>

      {/* 11 — Progressive Disclosure: Deep Ecosystem Directory */}
      <section style={{ padding: "2.8rem clamp(1.25rem, 4vw, 4rem)", borderTop: "1px solid rgba(179, 130, 53, 0.25)", background: palette.obsidian }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.2rem" }}>
          <div>
            <h4 style={{ color: "#ffffff", fontFamily: "'Playfair Display', Georgia, serif", margin: "0 0 0.35rem", fontSize: "1.15rem", fontWeight: 700 }}>
              Technical Depth &amp; Autonomous Workspaces
            </h4>
            <p style={{ margin: 0, color: "#8D95A7", fontSize: "0.85rem" }}>
              Explore GARUDA's specialized studios, sovereign engines, and developer environments.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <button type="button" onClick={() => navigate("/pawan")} style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(179, 130, 53, 0.35)", color: palette.goldLight, padding: "0.45rem 1rem", borderRadius: 8, fontSize: "0.82rem", cursor: "pointer", fontWeight: 700 }}>
              ⚡ PAWAN Coding Studio
            </button>
            <button type="button" onClick={() => navigate("/scholar")} style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", padding: "0.45rem 1rem", borderRadius: 8, fontSize: "0.82rem", cursor: "pointer", fontWeight: 700 }}>
              🎓 Vidya Studio
            </button>
            <button type="button" onClick={() => navigate("/dost")} style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399", padding: "0.45rem 1rem", borderRadius: 8, fontSize: "0.82rem", cursor: "pointer", fontWeight: 700 }}>
              🌾 GARUDA DOST
            </button>
            <button type="button" onClick={() => navigate("/case-studies")} style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#ffffff", padding: "0.45rem 1rem", borderRadius: 8, fontSize: "0.82rem", cursor: "pointer", fontWeight: 700 }}>
              📋 Case Studies
            </button>
          </div>
        </div>
      </section>

      {/* Crawlable Grounded Dark Obsidian Footer */}
      <footer style={{ padding: "3.5rem clamp(1.25rem, 4vw, 4rem) 2.5rem", borderTop: "1px solid rgba(255, 255, 255, 0.06)", background: palette.obsidianDeep, color: "#9ca3af", fontSize: "0.85rem", lineHeight: 1.7 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2.2rem", marginBottom: "2.5rem", textAlign: "left" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
              <img src="/images/garuda_eagle_sigil.png" alt="GARUDA" style={{ width: 24, height: 20, objectFit: "contain" }} />
              <span style={{ color: palette.goldLight, fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.1rem", fontWeight: 700 }}>
                GARUDA OS
              </span>
            </div>
            <p style={{ margin: 0, lineHeight: 1.6, color: "#8D95A7" }}>
              Autonomous AI Operating System and commercial software engineering practice. Founded and architected by Praveen Mahawar. Official Portal: https://www.garudaos.in.
            </p>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", fontFamily: "'Inter', sans-serif", margin: "0 0 0.8rem 0", fontSize: "0.9rem", fontWeight: 700 }}>Commercial Products</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              <li><a href="/starter" style={{ color: palette.goldLight, textDecoration: "none", fontWeight: 700 }}>Next.js 14 AI Starter Kit ($49)</a></li>
              <li><a href="/whatsapp-bot" style={{ color: "#9ca3af", textDecoration: "none" }}>WhatsApp AI Receptionist</a></li>
              <li><a href="/fintech-gateway" style={{ color: "#9ca3af", textDecoration: "none" }}>Multi-Rail Fintech Gateway</a></li>
              <li><a href="/billing" style={{ color: "#9ca3af", textDecoration: "none" }}>GARUDA Billing Engine</a></li>
              <li><a href="/cybershield" style={{ color: "#9ca3af", textDecoration: "none" }}>CyberShield™ Anti-Troll Defense</a></li>
              <li><a href="/health" style={{ color: "#9ca3af", textDecoration: "none" }}>GARUDA Aahar Clinical Health</a></li>
              <li><a href="/pricing" style={{ color: "#9ca3af", textDecoration: "none" }}>Transparent SaaS Plans</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", fontFamily: "'Inter', sans-serif", margin: "0 0 0.8rem 0", fontSize: "0.9rem", fontWeight: 700 }}>Problem Solutions (48h)</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              <li><a href="/solutions/struggling-with-pwa-mobile-web-app-problems" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 600 }}>📱 Struggling with PWA? Fix Mobile Lag</a></li>
              <li><a href="/solutions/phd-research-paper-ugc-care-scopus-anti-plagiarism" style={{ color: "#9ca3af", textDecoration: "none" }}>🎓 PhD Research & Academic Integrity</a></li>
              <li><a href="/solutions/retail-billing-gst-invoice-speed-bottlenecks" style={{ color: "#9ca3af", textDecoration: "none" }}>🛒 Retail POS & GST Checkout Speed</a></li>
              <li><a href="/solutions/online-brand-defamation-social-media-troll-bsa-evidence" style={{ color: "#9ca3af", textDecoration: "none" }}>🛡️ Brand Defamation & BSA Evidence</a></li>
              <li><a href="/solutions/election-constituency-booth-voter-data-intelligence" style={{ color: "#9ca3af", textDecoration: "none" }}>🗳️ Election War Room & Booth Cadre</a></li>
              <li><a href="/solutions/clinical-diet-timetable-diabetes-bp-fatty-liver" style={{ color: "#9ca3af", textDecoration: "none" }}>🥗 Multi-Disease Clinical Diet Timetable</a></li>
              <li><a href="/solutions" style={{ color: palette.goldLight, textDecoration: "none", fontWeight: 700 }}>Browse All 21 Solutions →</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", fontFamily: "'Inter', sans-serif", margin: "0 0 0.8rem 0", fontSize: "0.9rem", fontWeight: 700 }}>Engineering Services</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              <li><a href="/audit" style={{ color: "#f87171", textDecoration: "none", fontWeight: 600 }}>⚡ Free Lead-Leak & Speed Audit</a></li>
              <li><a href="/services/whatsapp-telegram-ai-bots" style={{ color: "#9ca3af", textDecoration: "none" }}>WhatsApp Automation Bots</a></li>
              <li><a href="/services/ai-agent-development" style={{ color: "#9ca3af", textDecoration: "none" }}>Autonomous AI Agents</a></li>
              <li><a href="/services/custom-software-development" style={{ color: "#9ca3af", textDecoration: "none" }}>Custom Software Engineering</a></li>
              <li><a href="/services/saas-mvp-development" style={{ color: "#9ca3af", textDecoration: "none" }}>SaaS MVP Development</a></li>
              <li><a href="/services/business-automation" style={{ color: "#9ca3af", textDecoration: "none" }}>Business Workflow Automation</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", fontFamily: "'Inter', sans-serif", margin: "0 0 0.8rem 0", fontSize: "0.9rem", fontWeight: 700 }}>Platform &amp; Governance</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              <li><a href="/what-is-garuda-ai" style={{ color: "#9ca3af", textDecoration: "none" }}>What is GARUDA AI?</a></li>
              <li><a href="/case-studies" style={{ color: "#9ca3af", textDecoration: "none" }}>Verified Case Studies</a></li>
              <li><a href="/garuda-ai-vs-garuda-linux" style={{ color: "#9ca3af", textDecoration: "none" }}>GARUDA AI vs Garuda Linux</a></li>
              <li><a href="/guides" style={{ color: palette.goldLight, textDecoration: "none", fontWeight: 600 }}>Engineering &amp; AI Guides →</a></li>
              <li><a href="/chat" style={{ color: "#9ca3af", textDecoration: "none" }}>Talk to AI Architect</a></li>
              <li>
                <button type="button" onClick={onFounderLogin} style={{ background: "none", border: "none", color: palette.goldLight, cursor: "pointer", fontSize: "inherit", padding: 0, textDecoration: "underline" }}>
                  Founder Console →
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.75rem", color: "#8D95A7", display: "flex", flexDirection: "column", gap: "0.6rem", alignItems: "center" }}>
          <div>
            © {new Date().getFullYear()} GARUDA AI Operating System. Built for deterministic, governed custom software and AI operations.
          </div>
          <div style={{ display: "flex", gap: "1.2rem", fontSize: "0.85rem", flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/praveen-mahawar" style={{ color: palette.goldLight, textDecoration: "none", fontWeight: 700 }}>Praveen Mahawar (Founder)</a>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
            <a href="/privacy" style={{ color: palette.goldLight, textDecoration: "none" }}>Privacy Policy</a>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>•</span>
            <a href="/terms" style={{ color: palette.goldLight, textDecoration: "none" }}>Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Business Inquiry CTA */}
      <WhatsAppQuickCTA />
    </div>
  );
}