import React from "react";
import { trackEvent } from "../utils/telemetry";

const RAW_PHONE = (import.meta.env.VITE_WHATSAPP_NUMBER || "").trim();
const PHONE_NUMBER = RAW_PHONE.replace(/[^0-9]/g, "");
const DEFAULT_TEXT = encodeURIComponent("Hi Praveen, I would like to discuss a custom AI / software project scope for my business.");

export default function WhatsAppQuickCTA({
  phoneNumber = PHONE_NUMBER,
  text = DEFAULT_TEXT,
  label = "Chat with Founder on WhatsApp",
  style = {}
}) {
  // If no legitimate WhatsApp number is configured by the founder in environment variables,
  // do NOT display a placeholder or fake phone number.
  if (!phoneNumber || phoneNumber.length < 8) {
    return null;
  }

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${text}`;

  const handleClick = () => {
    trackEvent("whatsapp_cta_click", {
      phone: phoneNumber,
      landingPath: window.location.pathname
    });
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      style={{
        position: "fixed",
        bottom: "1.75rem",
        right: "1.75rem",
        zIndex: 99,
        display: "flex",
        alignItems: "center",
        gap: "0.65rem",
        padding: "0.75rem 1.25rem",
        borderRadius: "999px",
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: "#ffffff",
        textDecoration: "none",
        fontWeight: 700,
        fontSize: "0.88rem",
        boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
        border: "1px solid rgba(255,255,255,0.2)",
        backdropFilter: "blur(8px)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        ...style
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
        e.currentTarget.style.boxShadow = "0 12px 28px rgba(16,185,129,0.45)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(16,185,129,0.35)";
      }}
    >
      <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>💬</span>
      <span>{label}</span>
    </a>
  );
}
