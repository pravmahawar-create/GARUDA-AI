const fs = require("fs");
const path = require("path");

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log("UI Builder wrote:", file);
}

console.log("GARUDA Genesis UI Builder");
console.log("=========================");

write("frontend/src/services/api.js", `const API_BASE = "http://localhost:3000";

export async function checkHealth() {
  const res = await fetch(\`\${API_BASE}/api/health\`);
  return res.json();
}

export async function askRag(question) {
  const res = await fetch(\`\${API_BASE}/api/rag/answer\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });

  return res.json();
}
`);

write("frontend/src/App.jsx", `import React, { useEffect, useState } from "react";
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
`);

write("frontend/src/style.css", `*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;background:#02050a;color:#fff}.garuda-os{min-height:100vh;display:grid;grid-template-columns:300px 1fr;background:radial-gradient(circle at 70% 0%,rgba(21,119,93,.35),transparent 35%),radial-gradient(circle at 10% 10%,rgba(212,175,55,.16),transparent 28%),#02050a}.sidebar{padding:32px;border-right:1px solid rgba(255,255,255,.08);background:rgba(5,10,18,.76);backdrop-filter:blur(20px)}.brandMark{font-size:34px;font-weight:900;letter-spacing:6px;color:#f7d76a}.brandSub{color:#8fa3bd;font-size:13px;margin-top:8px}.nav{margin-top:42px;display:grid;gap:12px}.nav button{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#dce7f5;padding:15px 16px;border-radius:16px;text-align:left;font-weight:700;cursor:pointer}.nav button.active,.nav button:hover{background:linear-gradient(135deg,#f5d76e,#b98d26);color:#061018}.miniStatus{margin-top:46px;color:#9ff5b6;font-weight:700}.pulse{width:10px;height:10px;border-radius:50%;display:inline-block;background:#42ff83;margin-right:8px;box-shadow:0 0 18px #42ff83}.workspace{padding:38px;overflow:auto}.portalHeader{min-height:220px;border:1px solid rgba(255,255,255,.08);border-radius:34px;padding:38px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,rgba(20,48,58,.82),rgba(7,12,22,.92)),radial-gradient(circle at 80% 20%,rgba(245,215,110,.35),transparent 28%);box-shadow:0 25px 80px rgba(0,0,0,.38)}.eyebrow{color:#f5d76e;font-weight:900;letter-spacing:3px;text-transform:uppercase}.portalHeader h1{font-size:58px;line-height:1;margin:12px 0}.subtitle{color:#b8c6d8;font-size:18px}.coreSeal{width:118px;height:118px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#f7db78,#a87516);color:#061018;font-size:58px;font-weight:900;box-shadow:0 0 80px rgba(245,215,110,.38)}.missionGrid{margin-top:24px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.missionCard{padding:24px;border-radius:24px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.055)}.missionCard.primary{background:linear-gradient(135deg,rgba(212,175,55,.26),rgba(255,255,255,.05))}.missionCard p{color:#92a6bf;margin:0 0 10px}.missionCard h3{margin:0;font-size:24px}.commandCenter{margin-top:24px;display:grid;grid-template-columns:1fr 290px;gap:22px}.chatPanel,.motherPanel{border:1px solid rgba(255,255,255,.08);border-radius:28px;background:rgba(7,13,24,.82);box-shadow:0 25px 70px rgba(0,0,0,.28)}.chatPanel{padding:24px}.chatHeader{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:18px}.chatHeader p{margin:0;color:#f5d76e;font-weight:900}.chatHeader strong{display:block;margin-top:6px;color:#dfe9f7}.chatHeader span{padding:9px 14px;border-radius:999px;background:rgba(66,255,131,.12);color:#8dffb1;font-weight:800}.messages{height:390px;overflow:auto;padding:22px 4px}.bubble{max-width:78%;padding:16px 18px;border-radius:20px;margin:0 0 14px;line-height:1.55}.bubble.garuda{background:#101d31;color:#dce8f8;border:1px solid rgba(255,255,255,.06)}.bubble.user{margin-left:auto;background:linear-gradient(135deg,#f5d76e,#b98d26);color:#07111d;font-weight:700}.composer{display:flex;gap:12px}.composer input{flex:1;border:1px solid rgba(255,255,255,.1);background:#081222;color:white;padding:18px;border-radius:18px;font-size:16px}.composer button{width:120px;border:0;border-radius:18px;background:linear-gradient(135deg,#f5d76e,#b98d26);color:#061018;font-weight:900;cursor:pointer}.motherPanel{padding:24px}.panelTitle{color:#f5d76e;font-weight:900;letter-spacing:2px;text-transform:uppercase}.motherPanel div{margin-top:18px;padding:14px;border-radius:16px;background:rgba(255,255,255,.055);color:#dce8f8;font-weight:700}.motherPanel span{width:9px;height:9px;background:#42ff83;border-radius:50%;display:inline-block;margin-right:10px}@media(max-width:1000px){.garuda-os{grid-template-columns:1fr}.sidebar{display:none}.missionGrid,.commandCenter{grid-template-columns:1fr}.portalHeader h1{font-size:40px}.coreSeal{display:none}}`);

console.log("GARUDA Genesis UI generated.");
