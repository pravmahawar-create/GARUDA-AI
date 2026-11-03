import React from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import BrandAssetImage from "../components/BrandAssetImage";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 60%), #030712",
        color: "#f8fafc",
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center"
      }}
    >
      <SEOHead
        title="404 — Page Not Found | GARUDA OS"
        description="The requested page could not be found on the GARUDA OS platform."
        canonical="https://www.garudaos.in/404"
        noindex={true}
      />

      <div
        style={{
          width: 72,
          height: 72,
          marginBottom: "1.5rem",
          display: "grid",
          placeItems: "center"
        }}
      >
        <BrandAssetImage
          src="/images/garuda_eagle_sigil.png"
          alt="GARUDA Sigil"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      <div
        style={{
          fontSize: "0.8rem",
          fontWeight: 800,
          letterSpacing: "0.22em",
          color: "#d4af37",
          textTransform: "uppercase",
          marginBottom: "0.5rem"
        }}
      >
        ✦ 404 STATUS • ROUTE UNRECOGNIZED
      </div>

      <h1
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(2rem, 5vw, 3.2rem)",
          fontWeight: 700,
          color: "#ffffff",
          margin: "0 0 1rem"
        }}
      >
        Page Not Found
      </h1>

      <p
        style={{
          maxWidth: 540,
          color: "#94a3b8",
          fontSize: "1.05rem",
          lineHeight: 1.6,
          margin: "0 0 2rem"
        }}
      >
        The coordinate you are navigating to does not exist or has been relocated across our sovereign architecture.
      </p>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 600
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            background: "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)",
            color: "#030712",
            border: "none",
            borderRadius: 999,
            padding: "0.85rem 1.8rem",
            fontSize: "0.95rem",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(212, 175, 55, 0.3)"
          }}
        >
          Return to Home
        </button>

        <button
          type="button"
          onClick={() => navigate("/solutions")}
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            color: "#f8fafc",
            border: "1px solid rgba(212, 175, 55, 0.25)",
            borderRadius: 999,
            padding: "0.85rem 1.8rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Explore Solutions
        </button>

        <button
          type="button"
          onClick={() => navigate("/pricing")}
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            color: "#f8fafc",
            border: "1px solid rgba(212, 175, 55, 0.25)",
            borderRadius: 999,
            padding: "0.85rem 1.8rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Pricing Plans
        </button>

        <button
          type="button"
          onClick={() => navigate("/chat")}
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            color: "#f8fafc",
            border: "1px solid rgba(212, 175, 55, 0.25)",
            borderRadius: 999,
            padding: "0.85rem 1.8rem",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Talk to AI Architect
        </button>
      </div>
    </main>
  );
}
