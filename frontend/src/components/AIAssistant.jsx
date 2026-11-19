import { useState, useRef, useEffect } from "react";
import { FaRobot, FaPaperPlane, FaTimes, FaSpinner } from "react-icons/fa";
import { sendAIChat } from "../api/api";

const CRM_API = (import.meta.env.VITE_API_URL || "http://localhost:5002").replace(/\/$/, "");

export default function AIAssistant({ selectedContact, currentPage }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm the DPS CRM Assistant. Ask me anything about how to use the app — like \"How do I send a campaign?\" or \"Where are uploaded documents?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const data = await sendAIChat({
        message: text,
        context: {
          page: currentPage || window.location.pathname,
          selectedContact: selectedContact
            ? { firstName: selectedContact.firstName, lastName: selectedContact.lastName, email: selectedContact.email }
            : null,
          role: user?.role || null,
        },
      });
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error: ${error.message || "Could not get a response. Please try again."}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        className="ai-assistant-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        {open ? <FaTimes /> : <FaRobot />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="ai-assistant-panel">
          <div className="ai-assistant-header">
            <FaRobot className="me-2" />
            <strong>DPS CRM Assistant</strong>
            <button
              type="button"
              className="ai-assistant-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          <div className="ai-assistant-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`ai-msg ai-msg--${msg.role}`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="ai-msg ai-msg--assistant ai-msg--loading">
                <FaSpinner className="spin" /> Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="ai-assistant-input" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
    </>
  );
}