import React from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";

const palette = {
  bg: "#04070a",
  panel: "#0b0f16",
  panelSoft: "rgba(11, 15, 22, 0.75)",
  line: "rgba(245, 215, 110, 0.16)",
  text: "#f7f2dc",
  muted: "#9ca3af",
  gold: "#f5d76e",
  goldStrong: "#b8860b",
  blue: "#7dd3fc"
};

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: palette.bg,
        color: palette.text,
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        lineHeight: 1.7
      }}
    >
      <SEOHead
        title="Privacy Policy | GARUDA AI Operating System"
        description="Official Privacy Policy of GARUDA AI (garudaos.in). Comprehensive data governance, Google API Services User Data Policy disclosure, and user data rights."
        canonical="https://www.garudaos.in/privacy"
      />

      {/* Navigation Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2rem",
          borderBottom: `1px solid ${palette.line}`,
          background: "rgba(11, 15, 22, 0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: palette.muted,
              borderRadius: "6px",
              padding: "0.4rem 0.85rem",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600
            }}
          >
            ← Home
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "0.08em", color: "#ffffff" }}>
              GARUDA
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                background: "rgba(212,175,55,0.15)",
                color: palette.gold,
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                fontWeight: 700
              }}
            >
              PRIVACY POLICY
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            onClick={() => navigate("/terms")}
            style={{
              background: "transparent",
              border: "none",
              color: palette.muted,
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            Terms of Service →
          </button>
          <button
            type="button"
            onClick={() => navigate("/chat")}
            style={{
              background: "linear-gradient(135deg, #f5d76e 0%, #b8860b 100%)",
              color: "#05070a",
              border: "none",
              borderRadius: "6px",
              padding: "0.45rem 1rem",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            Contact Architect
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
        {/* Title Header */}
        <div style={{ marginBottom: "2.5rem", borderBottom: `1px solid ${palette.line}`, paddingBottom: "1.5rem" }}>
          <p style={{ color: palette.gold, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, margin: "0 0 0.5rem 0" }}>
            LEGAL & DATA GOVERNANCE
          </p>
          <h1 style={{ fontSize: "2.3rem", fontWeight: 800, margin: "0 0 0.75rem 0", color: "#ffffff", letterSpacing: "-0.02em" }}>
            Privacy Policy
          </h1>
          <p style={{ color: palette.muted, fontSize: "0.95rem", margin: 0 }}>
            Effective Date: September 7, 2026 | Last Updated: September 7, 2026 | Version: 2.1
          </p>
        </div>

        {/* Executive Introduction */}
        <section style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "1.05rem", color: "#e2e8f0" }}>
            Welcome to <strong>GARUDA AI</strong> (accessible at{" "}
            <a href="https://www.garudaos.in" style={{ color: palette.gold, textDecoration: "underline" }}>
              https://www.garudaos.in
            </a>
            ). GARUDA AI is an autonomous AI Operating System engineered by founder{" "}
            <strong>Praveen Mahawar</strong>, providing governed custom software engineering, business automation, and multi-channel creative platforms.
          </p>
          <p style={{ color: "#cbd5e1" }}>
            We respect your privacy, practice strict <strong>Anti-Fabrication and Zero-Data-Pollution Law</strong>, and are committed to safeguarding all personal information, client project assets, and third-party platform credentials entrusted to us. This Privacy Policy details the types of information we collect, how we use it, our strict limitations on sharing, and your comprehensive data rights.
          </p>
        </section>

        {/* Section 1: Information We Collect */}
        <section style={{ marginBottom: "2.5rem", background: palette.panel, padding: "1.75rem", borderRadius: "12px", border: `1px solid ${palette.line}` }}>
          <h2 style={{ color: palette.gold, fontSize: "1.3rem", marginTop: 0 }}>
            1. Information We Collect
          </h2>
          <ul style={{ paddingLeft: "1.25rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <li>
              <strong>Direct Inquiries & Project Briefs:</strong> When you submit a project scope brief, consult with our AI Solution Architect, or request a quote, we collect your name, email address, company name, project requirements, and budget specifications.
            </li>
            <li>
              <strong>Account & Session Authentication:</strong> When you authenticate via customer portal or founder session, we store session tokens, encrypted credentials, and timestamps to provide isolated and authenticated workspace access.
            </li>
            <li>
              <strong>Technical Usage & Telemetry Data:</strong> Browser type, operating system, IP address, referral URLs, page interaction metrics, and anonymous performance signals necessary for platform security and load balancing.
            </li>
            <li>
              <strong>Payment & Billing Data:</strong> Commercial milestone payments are processed through PCI-DSS compliant payment gateways (Razorpay). GARUDA does not store full credit card numbers or banking passwords on its servers.
            </li>
          </ul>
        </section>

        {/* Section 2: Google User Data & Google API Services Disclosure (MANDATORY FOR GOOGLE OAUTH) */}
        <section
          style={{
            marginBottom: "2.5rem",
            background: "rgba(212, 175, 55, 0.05)",
            padding: "2rem",
            borderRadius: "12px",
            border: `1px solid rgba(212, 175, 55, 0.35)`
          }}
        >
          <div style={{ display: "inline-block", background: "rgba(212,175,55,0.18)", color: palette.gold, padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.75rem", letterSpacing: "0.08em" }}>
            GOOGLE CLOUD OAUTH & API POLICY
          </div>
          <h2 style={{ color: "#ffffff", fontSize: "1.4rem", marginTop: 0, marginBottom: "1rem" }}>
            2. Google API Services User Data Policy & Limited Use Disclosure
          </h2>
          <p style={{ color: "#e2e8f0" }}>
            GARUDA AI provides omni-channel autonomous publishing and social integration features through our <strong>BOT-VERSE Studio</strong>. When you explicitly connect your Google Account via Google Cloud OAuth, the following terms strictly apply:
          </p>

          <h3 style={{ color: palette.gold, fontSize: "1.05rem", marginTop: "1.2rem" }}>
            A. Google Scopes Requested
          </h3>
          <ul style={{ paddingLeft: "1.25rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <li>
              <code>https://www.googleapis.com/auth/youtube.upload</code>: Used solely to upload video content generated or approved by the user directly to their designated YouTube channel.
            </li>
            <li>
              <code>https://www.googleapis.com/auth/youtube</code>: Used strictly to manage video metadata (title, description, tags, scheduling) as directed by the channel owner.
            </li>
            <li>
              <code>https://www.googleapis.com/auth/userinfo.email</code> & <code>https://www.googleapis.com/auth/userinfo.profile</code>: Used to display the authenticated channel owner identity within the user's private studio.
            </li>
          </ul>

          <h3 style={{ color: palette.gold, fontSize: "1.05rem", marginTop: "1.2rem" }}>
            B. How We Use Google User Data
          </h3>
          <p style={{ color: "#cbd5e1" }}>
            We access and process your Google account and YouTube data <strong>strictly to fulfill direct user-initiated actions</strong>: specifically, to push user-approved video packages, schedule automated publication times, and retrieve upload status within BOT-VERSE Studio.
          </p>

          <h3 style={{ color: palette.gold, fontSize: "1.05rem", marginTop: "1.2rem" }}>
            C. Google Limited Use Compliance (Zero Sale, Zero Ads, Zero Unauthorized AI Training)
          </h3>
          <p style={{ color: "#f7f2dc", fontWeight: 600 }}>
            GARUDA AI’s use and transfer to any other app of information received from Google APIs will adhere to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: palette.gold, textDecoration: "underline" }}
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
          <ul style={{ paddingLeft: "1.25rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <li>We do NOT sell Google user data to third parties under any circumstances.</li>
            <li>We do NOT transfer or disclose Google user data to third parties, except as strictly required by applicable law or to provide the user-initiated upload services.</li>
            <li>We do NOT use or transfer Google user data for serving personalized, retargeted, or behavioral advertisements.</li>
            <li>We do NOT use Google user data to develop, improve, or train generalized machine learning or artificial intelligence models without explicit, affirmative user authorization.</li>
          </ul>

          <h3 style={{ color: palette.gold, fontSize: "1.05rem", marginTop: "1.2rem" }}>
            D. Revocation & Data Deletion
          </h3>
          <p style={{ color: "#cbd5e1" }}>
            You may revoke GARUDA AI’s access to your Google account at any time via your{" "}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: palette.gold, textDecoration: "underline" }}
            >
              Google Account Third-Party Security Settings
            </a>
            . Upon revocation or upon your written request to <code>garudaos.ai@gmail.com</code>, all stored OAuth refresh tokens and temporary metadata will be permanently deleted from our databases within 24 hours.
          </p>
        </section>

        {/* Section 3: How We Use General Information */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ color: palette.gold, fontSize: "1.3rem" }}>
            3. How We Use Collected Information
          </h2>
          <p style={{ color: "#cbd5e1" }}>We utilize non-Google customer data strictly for the following legitimate purposes:</p>
          <ul style={{ paddingLeft: "1.25rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>To formulate milestone proposals, architecture specifications, and software deliverables.</li>
            <li>To provision authenticated customer dashboards and store mission histories.</li>
            <li>To verify delivery evidence with SHA-256 cryptographic hashes under our Anti-Fabrication Law.</li>
            <li>To communicate transaction receipts, milestone status updates, and critical security notices.</li>
            <li>To prevent fraud, denial-of-service, and malicious attacks on platform infrastructure.</li>
          </ul>
        </section>

        {/* Section 4: Data Retention & Security */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ color: palette.gold, fontSize: "1.3rem" }}>
            4. Data Retention, Storage & Cryptographic Security
          </h2>
          <p style={{ color: "#cbd5e1" }}>
            All platform data is transmitted using modern Transport Layer Security (TLS 1.3 encryption in transit) and stored in encrypted databases (AES-256 at rest). We retain project and account records only as long as necessary to fulfill commercial contracts, provide warranty support, or comply with legal accounting obligations. All generated deliverables receive cryptographic SHA-256 evidence seals to guarantee tamper resistance.
          </p>
        </section>

        {/* Section 5: Your Rights & GDPR/CCPA/DPDP Compliance */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ color: palette.gold, fontSize: "1.3rem" }}>
            5. Your Data Rights
          </h2>
          <p style={{ color: "#cbd5e1" }}>
            Depending on your location, you hold statutory rights regarding your personal information, including:
          </p>
          <ul style={{ paddingLeft: "1.25rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li><strong>Right to Access:</strong> Request a copy of the personal information we maintain about you.</li>
            <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete records.</li>
            <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request complete deletion of your account and associated personal data.</li>
            <li><strong>Right to Withdraw Consent:</strong> Revoke authorization for platform integrations or communications at any time.</li>
          </ul>
          <p style={{ color: "#cbd5e1", marginTop: "0.75rem" }}>
            To exercise any of these rights, email your request directly to <code>garudaos.ai@gmail.com</code>. We respond to all verified inquiries within 48 business hours.
          </p>
        </section>

        {/* Section 6: Policy Changes */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ color: palette.gold, fontSize: "1.3rem" }}>
            6. Changes to This Privacy Policy
          </h2>
          <p style={{ color: "#cbd5e1" }}>
            We may update this Privacy Policy from time to time to reflect technological, operational, or legal developments. Any changes will be published on this page with an updated &quot;Last Updated&quot; timestamp.
          </p>
        </section>

        {/* Section 7: Official Contact & Governance */}
        <section
          style={{
            background: palette.panel,
            padding: "1.75rem",
            borderRadius: "12px",
            border: `1px solid ${palette.line}`
          }}
        >
          <h2 style={{ color: palette.gold, fontSize: "1.2rem", marginTop: 0 }}>
            7. Official Contact & Data Protection Inquiries
          </h2>
          <p style={{ color: "#cbd5e1", margin: "0 0 0.75rem 0" }}>
            For privacy inquiries, data deletion requests, or questions regarding our Google API compliance, please contact our principal office:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", color: "#f1f5f9", fontSize: "0.95rem" }}>
            <div><strong>Entity:</strong> GARUDA AI Operating System (garudaos.in)</div>
            <div><strong>Founder & Controller:</strong> Praveen Mahawar</div>
            <div><strong>Official Email:</strong> <a href="mailto:garudaos.ai@gmail.com" style={{ color: palette.gold }}>garudaos.ai@gmail.com</a></div>
            <div><strong>Headquarters:</strong> Rajasthan, India</div>
            <div><strong>Official Platform:</strong> <a href="https://www.garudaos.in" style={{ color: palette.gold }}>https://www.garudaos.in</a></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${palette.line}`, padding: "2rem", textAlign: "center", color: palette.muted, fontSize: "0.85rem" }}>
        © {new Date().getFullYear()} GARUDA AI Operating System. All Rights Reserved. | Founder: Praveen Mahawar |{" "}
        <a href="/terms" style={{ color: palette.gold, textDecoration: "none" }}>Terms of Service</a> |{" "}
        <a href="/privacy" style={{ color: palette.gold, textDecoration: "none" }}>Privacy Policy</a>
      </footer>
    </div>
  );
}
