import React, { useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./MessageBubbles.css";
import { useTranslation } from "react-i18next";

const MessageBubbles = ({
  chat,
  isBotTyping,
  typedMessage,
  onOptionClick = () => {},
}) => {
  const { t } = useTranslation();
  const bottomRef = useRef(null);
  const [expandedIndexes, setExpandedIndexes] = useState([]);
  const MAX_CHARS = 250;

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat, isBotTyping, typedMessage]);

  const toggleExpand = (idx) => {
    setExpandedIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="chat-messages">
      {chat.map((msg, idx) => {
        const isExpanded = expandedIndexes.includes(idx);
        const showReadMore = msg.text.length > MAX_CHARS;
        const displayedText =
          showReadMore && !isExpanded
            ? msg.text.slice(0, MAX_CHARS) + "..."
            : msg.text;

        return (
          <div key={idx} className={`chat-bubble ${msg.from}`}>
            <div className="markdown-content">
              <ReactMarkdown>{displayedText}</ReactMarkdown>
              {showReadMore && (
                <button
                  className="read-more-btn"
                  onClick={() => toggleExpand(idx)}
                >
                  {isExpanded
                    ? t("messageBubbles.showLess")
                    : t("messageBubbles.readMore")}
                </button>
              )}
            </div>

            {msg.options && (
              <div className="chat-options">
                {msg.options.map((opt, i) => (
                  <button
                    key={i}
                    className="option-button"
                    onClick={() => onOptionClick(opt)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onOptionClick(opt)}
                  >
                    {typeof opt === "string" ? t(`chatbot.${opt}`) : opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* 3-dot typing indicator BEFORE typedMessage begins */}
      {isBotTyping && typedMessage === "" && (
        <div className="chat-bubble ai typing-indicator">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      )}

      {/* Character-by-character typing */}
      {typedMessage && (
        <div className="chat-bubble ai">
          <div className="markdown-content">
            <ReactMarkdown>{typedMessage}</ReactMarkdown>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageBubbles;
