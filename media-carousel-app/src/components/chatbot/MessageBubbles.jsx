import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./MessageBubbles.css";
import { useTranslation } from "react-i18next";

const MessageBubbles = ({ chat, isBotTyping, onOptionClick = () => {} }) => {
  const { t } = useTranslation();
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [expandedIndexes, setExpandedIndexes] = useState([]);

  const isNearBottom = () => {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight < 50;
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isNearBottom()) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [chat.length, isBotTyping]);

  const toggleExpand = (idx) => {
    setExpandedIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const MAX_CHARS = 250;

  return (
    <div className="chat-messages" ref={containerRef}>
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
                  {isExpanded ? t("messageBubbles.showLess") : t("messageBubbles.readMore")}
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
                  >
                    {typeof opt === "string" ? t(`chatbot.${opt}`) : opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {isBotTyping && (
        <div className="chat-bubble ai typing-indicator">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageBubbles;
