import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { askRag, checkHealth } from "./services/api";
import "./style.css";

function App() {
  const [health, setHealth] = useState("checking");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    { role: "garuda", text: "Welcome back, Praveen. GARUDA Genesis is online." }
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
    <main className="garuda-os">
      <aside className="sidebar">
        <div className="brandMark">GARUDA</div>
        <p className="brandSub">Personal AI Operating System</p>

        <nav className="nav">
          <button className="active">Companion</button>
          <button>Insurance AI</button>
          <button>Knowledge Universe</button>
          <button>Mother Core</button>
          <button>Revenue Engine</button>
        </nav>

        <div className="miniStatus">
          <span className="pulse"></span>
          Backend {health}
        </div>
      </aside>

      <section className="workspace">
        <header className="portalHeader">
          <div>
            <p className="eyebrow">GARUDA Genesis</p>
            <h1>Welcome back, Founder.</h1>
            <p className="subtitle">Command your AI universe from one intelligent cockpit.</p>
          </div>
          <div className="coreSeal">G</div>
        </header>

        <section className="missionGrid">
          <div className="missionCard primary">
            <p>Companion</p>
            <h3>Online</h3>
          </div>
          <div className="missionCard">
            <p>MongoDB</p>
            <h3>{health}</h3>
          </div>
          <div className="missionCard">
            <p>RAG Engine</p>
            <h3>Ready</h3>
          </div>
          <div className="missionCard">
            <p>Knowledge</p>
            <h3>47 Docs</h3>
          </div>
        </section>

        <section className="commandCenter">
          <div className="chatPanel">
            <div className="chatHeader">
              <div>
                <p>GARUDA Companion</p>
                <strong>Ask from ABSLI knowledge base</strong>
              </div>
              <span>{loading ? "Thinking" : "Ready"}</span>
            </div>

            <div className="messages">
              {messages.map((message, index) => (
                <div key={index} className={"bubble " + message.role}>
                  {message.text}
                </div>
              ))}
              {loading && <div className="bubble garuda">GARUDA is thinking...</div>}
            </div>

            <div className="composer">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && askGaruda()}
                placeholder="Ask GARUDA about insurance, policy, or knowledge..."
              />
              <button onClick={askGaruda}>Ask</button>
            </div>
          </div>

          <aside className="motherPanel">
            <p className="panelTitle">Mother Core</p>
            <div><span></span> Scanner Active</div>
            <div><span></span> Planner Ready</div>
            <div><span></span> Builder Online</div>
            <div><span></span> Validator Passed</div>
            <div><span></span> Memory Loaded</div>
          </aside>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
