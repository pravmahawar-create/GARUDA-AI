import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { askRag, checkHealth } from "./services/api";
import "./style.css";

function App() {
  const [health, setHealth] = useState("checking");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    { role: "garuda", text: "Welcome back, Founder. GARUDA is awake." }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkHealth()
      .then((data) => setHealth(data.status || "online"))
      .catch(() => setHealth("offline"));
  }, []);

  async function askGaruda() {
    const q = question.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);

    try {
      const data = await askRag(q);
      setMessages((prev) => [
        ...prev,
        { role: "garuda", text: data.answer || data.message || "No clear answer received." }
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "garuda", text: "Backend connection failed." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="kingdomOS">
      <section className="kingdomHero">
        <div className="sunGlow"></div>
        <div className="mountains"></div>
        <div className="portalGlass">
          <p className="eyebrow">GARUDA KINGDOM PORTAL</p>
          <h1>GARUDA</h1>
          <p className="tagline">One Command. Infinite Intelligence.</p>
          <div className="founderLine">Welcome back, Founder</div>
        </div>
      </section>

      <section className="osGrid">
        <aside className="leftDock">
          <div className="logoBlock">
            <strong>GARUDA</strong>
            <span>AI Operating System</span>
          </div>

          <button className="active">Companion</button>
          <button>Insurance AI</button>
          <button>Knowledge</button>
          <button>Mother Core</button>
          <button>Revenue Universe</button>

          <div className="liveStatus">Backend: {health}</div>
        </aside>

        <section className="chatCore">
          <div className="chatTop">
            <div>
              <p>GARUDA Companion</p>
              <h2>Ask GARUDA</h2>
            </div>
            <span>{loading ? "Thinking" : "Ready"}</span>
          </div>

          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={"bubble " + m.role}>{m.text}</div>
            ))}
            {loading && <div className="bubble garuda">GARUDA is thinking...</div>}
          </div>

          <div className="composer">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askGaruda()}
              placeholder="Ask GARUDA..."
            />
            <button onClick={askGaruda}>Ask</button>
          </div>
        </section>

        <aside className="motherCore">
          <p className="panelTitle">Mother Core</p>
          <div><span></span> Scanner Online</div>
          <div><span></span> Thinker Active</div>
          <div><span></span> Decision Engine</div>
          <div><span></span> Builder Ready</div>
          <div><span></span> Memory Loading</div>
        </aside>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);