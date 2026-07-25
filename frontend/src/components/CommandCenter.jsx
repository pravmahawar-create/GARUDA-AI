import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function CommandCenter({ messages, question, loading, onQuestionChange, onSend }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <motion.section
      className="command-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="command-center__header">
        <div>
          <p className="eyebrow">Command Center</p>
          <h3>Ask GARUDA</h3>
        </div>
        <span className="status-pill">{loading ? "Thinking" : "Ready"}</span>
      </div>

      <div className="command-center__messages">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
            {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="composer">
        <input
          value={question}
          onChange={(event) => onQuestionChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onSend()}
          placeholder="Ask GARUDA about revenue, operations, or strategy..."
        />
        <button onClick={onSend}>Execute</button>
      </div>
    </motion.section>
  );
}
