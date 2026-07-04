import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [health, setHealth] = useState("checking");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "garuda",
      text: "Namaste Founder. GARUDA backend connected hai. Aap insurance ya knowledge base se question puch sakte ho."
    }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data.status || "online"))
      .catch(() => setHealth("offline"));
  }, []);

  async function askGaruda() {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: cleanQuestion }]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/rag/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question: cleanQuestion })
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "garuda",
          text:
            data.answer ||
            data.message ||
            "GARUDA ko answer mila, lekin response format clear nahi hai."
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "garuda",
          text: "Backend se connect nahi ho paaya. Server check karo."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="logo">GARUDA</div>
        <div className="status">Backend: {health}</div>
        <nav>
          <button>Companion</button>
          <button>Insurance AI</button>
          <button>Knowledge</button>
          <button>Mother Core</button>
        </nav>
      </aside>

      <section className="mainPanel">
        <header className="topbar">
          <div>
            <p className="eyebrow">India&apos;s Personal AI Operating System</p>
            <h1>Good Evening, Founder</h1>
          </div>
          <div className="pill">RAG Engine Ready</div>
        </header>

        <section className="cards">
          <div>MongoDB<br /><strong>{health}</strong></div>
          <div>Knowledge<br /><strong>Connected</strong></div>
          <div>Mother Core<br /><strong>Active</strong></div>
        </section>

        <section className="chatPanel">
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {loading && <div className="message garuda">GARUDA thinking...</div>}
          </div>

          <div className="composer">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askGaruda()}
              placeholder="Ask GARUDA about insurance knowledge..."
            />
            <button onClick={askGaruda}>Ask</button>
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);