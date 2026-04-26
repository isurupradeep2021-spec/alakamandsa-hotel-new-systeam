import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { askChatbot } from "../api/service";

const moduleByRoute = [
  { prefix: "/rooms", module: "rooms", label: "Rooms" },
  { prefix: "/view-rooms", module: "rooms", label: "Rooms" },
  { prefix: "/book-room", module: "rooms", label: "Rooms" },
  { prefix: "/event", module: "events", label: "Events" },
  { prefix: "/menu-management", module: "restaurant", label: "Restaurant" },
  { prefix: "/table-reservations", module: "restaurant", label: "Restaurant" },
  { prefix: "/dining", module: "restaurant", label: "Restaurant" },
  { prefix: "/reserve-table", module: "restaurant", label: "Restaurant" },
  { prefix: "/payroll", module: "payroll", label: "Payroll" },
  { prefix: "/my-payroll", module: "payroll", label: "Payroll" },
  { prefix: "/staff", module: "payroll", label: "Payroll" },
];

function resolveModule(pathname) {
  return moduleByRoute.find((entry) => pathname.startsWith(entry.prefix)) || { module: "general", label: "General" };
}

function AiAssistantWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "This codebase chatbot answers from your hotel system data for rooms, events, restaurant operations, and payroll.",
    },
  ]);

  const activeContext = useMemo(() => resolveModule(location.pathname), [location.pathname]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    const nextMessages = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await askChatbot({
        message,
        module: activeContext.module,
        history: nextMessages.slice(-6).map((entry) => ({ role: entry.role, content: entry.content })),
      });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.data?.answer || "The chatbot returned an empty response.",
        },
      ]);
    } catch (error) {
      const apiMessage =
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.message;
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: apiMessage || "The chatbot is unavailable right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`ai-assistant ${open ? "open" : ""}`}>
      <button className="ai-assistant-toggle" type="button" onClick={() => setOpen((value) => !value)}>
        <span>AI Assistant</span>
        <small>{activeContext.label}</small>
      </button>

      {open && (
        <section className="ai-assistant-panel">
          <header className="ai-assistant-head">
            <div>
              <strong>AI Assistant</strong>
              <p>Answers from your own backend data for {activeContext.label.toLowerCase()}.</p>
            </div>
            <button type="button" className="ai-assistant-close" onClick={() => setOpen(false)}>
              Close
            </button>
          </header>

          <div className="ai-assistant-context">
            <span className="ai-chip active">{activeContext.label}</span>
            <span className="ai-chip">Rooms</span>
            <span className="ai-chip">Restaurant</span>
            <span className="ai-chip">Events</span>
            <span className="ai-chip">Payroll</span>
          </div>

          <div className="ai-assistant-thread">
            {messages.map((entry, index) => (
              <article key={`${entry.role}-${index}`} className={`ai-message ${entry.role}`}>
                <span className="ai-message-role">{entry.role === "assistant" ? "Chatbot" : "You"}</span>
                <p>{entry.content}</p>
              </article>
            ))}
            {loading && (
              <article className="ai-message assistant pending">
                <span className="ai-message-role">Chatbot</span>
                <p>Checking system data...</p>
              </article>
            )}
          </div>

          <form className="ai-assistant-form" onSubmit={sendMessage}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Ask about ${activeContext.label.toLowerCase()} or another hotel module...`}
              rows={3}
            />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

export default AiAssistantWidget;
