import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./MessageBubbles.css";

const MessageBubbles = ({ chat, isBotTyping, onOptionClick = () => {} }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isBotTyping]);

  return (
    <div className="chat-messages">
      {chat.map((msg, idx) => (
        <div key={idx} className={`chat-bubble ${msg.from}`}>
          <div className="markdown-content">
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>

          {msg.options && (
            <div className="chat-options">
              {msg.options.map((opt, i) => (
                <button
                  key={i}
                  className="option-button"
                  onClick={() => onOptionClick(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {isBotTyping && (
        <div className="chat-bubble ai typing-indicator">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      )}

      {/* Auto scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageBubbles;
