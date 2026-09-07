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

export default function TermsOfService() {
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
        title="Terms of Service | GARUDA AI Operating System"
        description="Official Terms of Service for GARUDA AI (garudaos.in). Operational terms, commercial milestone agreements, intellectual property rights, and third-party API terms."
        canonical="https://www.garudaos.in/terms"
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
              TERMS OF SERVICE
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            onClick={() => navigate("/privacy")}
            style={{
              background: "transparent",
              border: "none",
              color: palette.muted,
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            Privacy Policy →
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
            USER AGREEMENT & COMMERCIAL COVENANT
          </p>
          <h1 style={{ fontSize: "2.3rem", fontWeight: 800, margin: "0 0 0.75rem 0", color: "#ffffff", letterSpacing: "-0.02em" }}>
            Terms of Service
          </h1>
          <p style={{ color: palette.muted, fontSize: "0.95rem", margin: 0 }}>
            Effective Date: September 7, 2026 | Last Updated: September 7, 2026 | Version: 2.1
          </p>
        </div>

        {/* Introduction */}
        <section style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "1.05rem", color: "#e2e8f0" }}>
            These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;Client&quot;, or &quot;Customer&quot;) and <strong>GARUDA AI Operating System</strong> (&quot;GARUDA&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), founded by <strong>Praveen Mahawar</strong>, governing your access to and use of{" "}
            <a href="https://www.garudaos.in" style={{ color: palette.gold, textDecoration: "underline" }}>
              https://www.garudaos.in
            </a>{" "}
            and all associated applications, autonomous AI agents, APIs, and commercial software services.
          </p>
          <p style={{ color: "#cbd5e1" }}>
            By visiting, accessing, registering, or commissioning work through GARUDA AI, you agree to be bound by these Terms and our{" "}
            <a href="/privacy" style={{ color: palette.gold, textDecoration: "underline" }}>Privacy Policy</a>. If you do not agree to these Terms, you must not access or use our platform.
          </p>
        </section>

        {/* Section 1: Services Provided */}
        <section style={{ marginBottom: "2.5rem", background: palette.panel, padding: "1.75rem", borderRadius: "12px", border: `1px solid ${palette.line}` }}>
          <h2 style={{ color: palette.gold, fontSize: "1.3rem", marginTop: 0 }}>
            1. Platform Services Description
          </h2>
          <p style={{ color: "#cbd5e1" }}>GARUDA AI delivers governed autonomous digital engineering across the following domains:</p>
          <ul style={{ paddingLeft: "1.25rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li><strong>Custom AI Development & Agent Engineering:</strong> Design, testing, and deployment of multi-agent graphs, RAG knowledge systems, and custom language model pipelines.</li>
            <li><strong>Full-Stack Software Engineering & SaaS MVPs:</strong> Production-ready web applications, microservices, secure authentication, and database schemas.</li>
            <li><strong>BOT-VERSE Studio & Omni-Channel Automation:</strong> Autonomous multi-modal media production, video scheduling, and social channel dispatch.</li>
            <li><strong>Interactive Commercial Scoping:</strong> Real-time Solution Architect consulting, milestone breakdown, and digital contract proposal generation.</li>
          </ul>
        </section>

        {/* Section 2: Third-Party Platform Integrations & YouTube API Terms */}
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
            THIRD-PARTY API COMPLIANCE
          </div>
          <h2 style={{ color: "#ffffff", fontSize: "1.4rem", marginTop: 0, marginBottom: "1rem" }}>
            2. Google & Third-Party Platform Terms
          </h2>
          <p style={{ color: "#e2e8f0" }}>
            When you connect external accounts (including Google, YouTube, GitHub, Telegram, or WhatsApp) to GARUDA AI or BOT-VERSE Studio:
          </p>
          <ul style={{ paddingLeft: "1.25rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <li>
              <strong>YouTube Terms of Service:</strong> By utilizing GARUDA’s YouTube integration features, you explicitly acknowledge and agree to be bound by the{" "}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: palette.gold, textDecoration: "underline" }}
              >
                YouTube Terms of Service
              </a>{" "}
              and the{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: palette.gold, textDecoration: "underline" }}
              >
                Google Privacy Policy
              </a>.
            </li>
            <li>
              <strong>Authorized Content Only:</strong> You warrant that you own or hold all required intellectual property rights, licenses, and releases for any media, audio, or video packages you instruct GARUDA AI to publish to your connected accounts.
            </li>
            <li>
              <strong>Google API Limited Use:</strong> GARUDA adheres strictly to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: palette.gold, textDecoration: "underline" }}
              >
                Google API Services User Data Policy
              </a>. Google user data is accessed solely for user-directed actions and is never sold, transferred for ads, or used to train general AI models without authorization.
            </li>
          </ul>
        </section>

        {/* Section 3: Commercial Agreements & Milestone Governance */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ color: palette.gold, fontSize: "1.3rem" }}>
            3. Commercial Engagements, Pricing & Deliverables
          </h2>
          <p style={{ color: "#cbd5e1" }}>
            All commercial software missions commissioned through GARUDA operate under our <strong>Anti-Fabrication Law</strong>:
          </p>
          <ul style={{ paddingLeft: "1.25rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li><strong>Milestone Structure:</strong> Projects typically follow a 50% Advance Kickoff Deposit upon contract authorization, with the remaining balance due upon verified final deliverable demonstration.</li>
            <li><strong>Cryptographic Evidence:</strong> Every milestone deliverable is sealed with a deterministic SHA-256 evidence hash. Clients receive real code repositories, test execution traces, and verified build artifacts.</li>
            <li><strong>Transparent Estimates:</strong> All quotes formulated by our Solution Architect represent fixed-price or clearly bounded scope milestones with zero hidden licensing fees.</li>
            <li><strong>Founder Authorization Gate:</strong> Critical state mutations and production releases require explicit Founder approval to guarantee operational safety.</li>
          </ul>
        </section>

        {/* Section 4: Intellectual Property Rights */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ color: palette.gold, fontSize: "1.3rem" }}>
            4. Intellectual Property & Ownership
          </h2>
          <ul style={{ paddingLeft: "1.25rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <li><strong>Client Deliverables:</strong> Upon full milestone settlement, the Client owns all custom source code, application assets, designs, and content created specifically for their bespoke project.</li>
            <li><strong>GARUDA Core Framework:</strong> The underlying GARUDA Operating System, Mother Brain routing kernel, agent orchestration architecture, and proprietary algorithms remain the exclusive intellectual property of Praveen Mahawar and GARUDA AI.</li>
            <li><strong>Client Materials:</strong> The Client retains full ownership of all proprietary data, logos, text briefs, and brand assets provided to GARUDA.</li>
          </ul>
        </section>

        {/* Section 5: Acceptable Use & Prohibited Conduct */}
        <section style={{ marginBottom: "2.5rem", background: palette.panel, padding: "1.75rem", borderRadius: "12px", border: `1px solid ${palette.line}` }}>
          <h2 style={{ color: palette.gold, fontSize: "1.3rem", marginTop: 0 }}>
            5. Acceptable Use & Prohibited Conduct
          </h2>
          <p style={{ color: "#cbd5e1" }}>You agree not to use GARUDA AI for any unlawful or prohibited activity, including:</p>
          <ul style={{ paddingLeft: "1.25rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>Generating or distributing malicious software, ransomware, phishing schemes, or spyware.</li>
            <li>Conducting unauthorized penetration testing, denial-of-service attacks, or reverse engineering of GARUDA core infrastructure.</li>
            <li>Publishing defamatory, obscene, infringing, or fraudulent media across connected social accounts.</li>
            <li>Attempting to bypass authentication gates, cryptographic seals, or Founder authorization checkpoints.</li>
          </ul>
        </section>

        {/* Section 6: Limitation of Liability */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ color: palette.gold, fontSize: "1.3rem" }}>
            6. Limitation of Liability & Warranty Disclaimer
          </h2>
          <p style={{ color: "#cbd5e1" }}>
            GARUDA AI provides platform features &quot;AS IS&quot; and &quot;AS AVAILABLE&quot;. While we rigorously regression-test all code and enforce deterministic quality gates, we do not warrant that third-party cloud APIs (e.g., Google, OpenAI, Groq, NVIDIA) will operate without external downtime. To the maximum extent permitted by applicable law, GARUDA AI and its founder shall not be liable for any indirect, incidental, consequential, or punitive damages arising from the use of or inability to use the platform.
          </p>
        </section>

        {/* Section 7: Governing Law & Dispute Resolution */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ color: palette.gold, fontSize: "1.3rem" }}>
            7. Governing Law & Jurisdiction
          </h2>
          <p style={{ color: "#cbd5e1" }}>
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. Any dispute, controversy, or claim arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts in Rajasthan, India.
          </p>
        </section>

        {/* Section 8: Contact */}
        <section
          style={{
            background: palette.panel,
            padding: "1.75rem",
            borderRadius: "12px",
            border: `1px solid ${palette.line}`
          }}
        >
          <h2 style={{ color: palette.gold, fontSize: "1.2rem", marginTop: 0 }}>
            8. Questions & Formal Inquiries
          </h2>
          <p style={{ color: "#cbd5e1", margin: "0 0 0.75rem 0" }}>
            For contractual inquiries, legal notices, or commercial discussions, please reach out directly:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", color: "#f1f5f9", fontSize: "0.95rem" }}>
            <div><strong>Entity:</strong> GARUDA AI Operating System (garudaos.in)</div>
            <div><strong>Founder:</strong> Praveen Mahawar</div>
            <div><strong>Official Email:</strong> <a href="mailto:garudaos.ai@gmail.com" style={{ color: palette.gold }}>garudaos.ai@gmail.com</a></div>
            <div><strong>Official Portal:</strong> <a href="https://www.garudaos.in" style={{ color: palette.gold }}>https://www.garudaos.in</a></div>
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
