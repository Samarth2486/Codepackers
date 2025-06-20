import React, { useState, useEffect, useCallback } from "react";
import MessageBubbles from "./MessageBubbles";
import "./FloatingChatbot.css";

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);

  const API_BASE_URL =
    process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:5000";

  const typeMessage = useCallback((text) => {
    setMessages((prev) => [...prev, { from: "ai", text }]);
    setIsBotTyping(false);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      typeMessage("Hi there! I'm your AI assistant. How can I help you today?");
    }
  }, [isOpen, messages.length, typeMessage]);

  const handleSend = async (userInput) => {
    if (!userInput.trim()) return;

    setMessages((prev) => [...prev, { from: "user", text: userInput }]);
    setInput("");
    setIsBotTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      });

      const data = await response.json();
      const botReply =
        data.reply || "Sorry, I couldn't process that. Please try again.";

      typeMessage(botReply);
    } catch (error) {
      console.error("Error:", error);
      typeMessage("Oops! Something went wrong. Please try again later.");
    }
  };

  return (
    <>
      {!isOpen && (
        <div className="chatbot-tooltip-wrapper">
          <div className="chatbot-tooltip">Start a chat with Paul</div>
          <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
            <div className="chatbot-icon">💬</div>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="chatbot-popup">
          <div className="chatbot-header">
            <span className="chatbot-title">Paul - Codepackers AI Agent</span>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          <div className="chatbot-body">
            <MessageBubbles chat={messages} isBotTyping={isBotTyping} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            />
            <button onClick={() => handleSend(input)}>Send</button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
