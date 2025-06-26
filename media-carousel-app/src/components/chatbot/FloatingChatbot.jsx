import React, { useState, useEffect, useCallback } from "react";
import MessageBubbles from "./MessageBubbles";
import "./FloatingChatbot.css";
import { useTranslation } from "react-i18next";

const FloatingChatbot = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);

  const [threadId, setThreadId] = useState(() => {
    return localStorage.getItem("chat_thread_id") || null;
  });

  const API_BASE_URL =
    process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:5000";

  const typeMessage = useCallback((text, options = null) => {
    setMessages((prev) => [...prev, { from: "ai", text, options }]);
    setIsBotTyping(false);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      typeMessage(t("floatingChatbot.welcome"));
    }
  }, [isOpen, messages.length, typeMessage, t]);

  const handleSend = async (userInput) => {
    if (!userInput.trim()) return;

    setMessages((prev) => [...prev, { from: "user", text: userInput }]);
    setInput("");
    setIsBotTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userInput,
          thread_id: threadId,
        }),
      });

      const data = await response.json();
      const botReply = data.reply || t("floatingChatbot.noReply");
      const options = data.options || null;

      if (data.thread_id && !threadId) {
        setThreadId(data.thread_id);
        localStorage.setItem("chat_thread_id", data.thread_id);
      }

      typeMessage(botReply, options);
    } catch (error) {
      console.error("Error:", error);
      typeMessage(t("floatingChatbot.error"));
    }
  };

  const handleOptionClick = (optionText) => {
    handleSend(optionText);
  };

  const resetChat = () => {
    const confirmReset = window.confirm("Do you want to reset the chat?");
    if (confirmReset) {
      localStorage.removeItem("chat_thread_id");
      setThreadId(null);
      setMessages([]);
    }
  };

  return (
    <>
      {!isOpen && (
        <div className="chatbot-tooltip-wrapper">
          <div className="chatbot-tooltip">{t("floatingChatbot.tooltip")}</div>
          <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
            <div className="chatbot-icon">💬</div>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="chatbot-popup">
          <div className="chatbot-header">
            <span className="chatbot-title">{t("floatingChatbot.header")}</span>
            <div className="chatbot-header-buttons">
              <button className="chatbot-reset" onClick={resetChat}>
                ⟳
              </button>
              <button
                className="chatbot-close"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
          </div>

          <div className="chatbot-body">
            <MessageBubbles
              chat={messages}
              isBotTyping={isBotTyping}
              onOptionClick={handleOptionClick}
            />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder={t("floatingChatbot.inputPlaceholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            />
            <button onClick={() => handleSend(input)}>
              {t("floatingChatbot.send")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
