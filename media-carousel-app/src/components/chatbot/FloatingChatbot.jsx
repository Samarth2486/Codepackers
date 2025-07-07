import React, { useState, useEffect, useRef } from "react";
import MessageBubbles from "./MessageBubbles";
import "./FloatingChatbot.css";
import { useTranslation } from "react-i18next";

const FloatingChatbot = () => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [typedMessage, setTypedMessage] = useState("");
  const [fullMessage, setFullMessage] = useState("");
  const [currentOptions, setCurrentOptions] = useState(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [threadId, setThreadId] = useState(
    localStorage.getItem("chat_thread_id") || ""
  );

  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingIntervalRef = useRef(null);

  const typingSpeed = 10;
  const API_BASE_URL =
    process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:5000";

  // Scroll tracking
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setIsUserScrolling(scrollTop + clientHeight < scrollHeight - 30);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Show welcome message on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setFullMessage(t("floatingChatbot.welcome"));
    }
  }, [isOpen, messages.length, t]);

  // Typing simulation
  useEffect(() => {
    if (!fullMessage) return;

    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    let index = 0;
    let typedSoFar = "";

    typingIntervalRef.current = setInterval(() => {
      typedSoFar += fullMessage.charAt(index);
      setTypedMessage(typedSoFar);
      index++;

      if (!isUserScrolling) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }

      if (index >= fullMessage.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { from: "ai", text: typedSoFar, options: currentOptions },
          ]);
          setTypedMessage("");
          setIsBotTyping(false);
          setFullMessage("");
          setCurrentOptions(null);
        }, 200);
      }
    }, typingSpeed);

    return () => clearInterval(typingIntervalRef.current);
  }, [fullMessage]);

  const handleSend = async (userInput) => {
    if (!userInput.trim()) return;

    setMessages((prev) => [...prev, { from: "user", text: userInput }]);
    setInput("");
    setIsBotTyping(true);

    // Stop any running typing effect
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

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

      // Update thread ID if changed
      if (data.thread_id && data.thread_id !== threadId) {
        setThreadId(data.thread_id);
        localStorage.setItem("chat_thread_id", data.thread_id);
      }

      setCurrentOptions(options);
      setFullMessage(botReply);
    } catch (error) {
      console.error("Error:", error);
      setFullMessage(t("floatingChatbot.error"));
    }
  };

  const handleOptionClick = (optionText) => {
    handleSend(optionText);
  };

  const resetChat = () => {
    const confirmReset = window.confirm(
      t("floatingChatbot.resetConfirm") || "Do you want to reset the chat?"
    );

    if (!confirmReset) return;

    // Reset state and localStorage
    localStorage.removeItem("chat_thread_id");
    setThreadId("");
    setMessages([]);
    setFullMessage("");
    setTypedMessage("");
    setIsBotTyping(false);
    setCurrentOptions(null);

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    setTimeout(() => {
      setFullMessage(t("floatingChatbot.welcome"));
    }, 300);
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

          <div className="chatbot-body" ref={chatContainerRef}>
            <MessageBubbles
              chat={messages}
              isBotTyping={isBotTyping}
              typedMessage={typedMessage}
              onOptionClick={handleOptionClick}
            />
            <div ref={messagesEndRef} />
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
