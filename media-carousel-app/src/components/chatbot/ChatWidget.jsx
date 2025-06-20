import React, { useState, useEffect, useRef } from 'react';
import decisionTree from './decisionTree';
import './ChatWidget.css';
import { useTranslation } from 'react-i18next';

const ChatWidget = () => {
  const { t } = useTranslation();

  const [chat, setChat] = useState([]);
  const [currentNode, setCurrentNode] = useState('start');
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  const [fullMessage, setFullMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, typedMessage]);

  useEffect(() => {
    if (currentNode === 'start') {
      const startMsg = decisionTree.start.message;
      setIsTyping(true);
      setTimeout(() => setFullMessage(startMsg), 1000);
    }
  }, [currentNode]);

  useEffect(() => {
    if (fullMessage) {
      let index = 0;
      setTypedMessage('');
      const interval = setInterval(() => {
        setTypedMessage((prev) => prev + fullMessage.charAt(index));
        index++;
        if (index >= fullMessage.length) {
          clearInterval(interval);
          setChat((prev) => [...prev, { from: 'bot', text: fullMessage }]);
          setIsTyping(false);
          setFullMessage('');
        }
      }, 40);
      return () => clearInterval(interval);
    }
  }, [fullMessage]);

  const handleOptionClick = (nextNodeKey) => {
    const label = decisionTree[currentNode]?.options?.find(opt => opt.next === nextNodeKey)?.label;
    if (label) {
      setChat((prev) => [...prev, { from: 'user', text: label }]);
    }

    if (nextNodeKey === 'freeInput') {
      setChat((prev) => [...prev, { from: 'bot', text: decisionTree.freeInput.message }]);
      setCurrentNode('freeInput');
    } else {
      const next = decisionTree[nextNodeKey];
      if (next) {
        setCurrentNode(nextNodeKey);
        setIsTyping(true);
        setTimeout(() => {
          setFullMessage(next.message);
        }, 1000);
      }
    }
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    setChat((prev) => [...prev, { from: 'user', text: userInput }]);
    setUserInput('');
    setIsTyping(true);
    setTimeout(() => {
      setFullMessage(t('chatbot.thankyou'));
    }, 1000);
  };

  return (
    <div className="chatbot-window">
      <div className="chatbot-header">
        {t('chatbot.header')}
        <button className="chatbot-close-btn" onClick={() => window.location.reload()}>×</button>
      </div>

      <div className="chatbot-messages">
        {chat.map((msg, idx) => (
          <div key={idx} className={`chatbot-msg ${msg.from}`}>{msg.text}</div>
        ))}

        {isTyping && (
          <div className="chatbot-msg bot typing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}

        {typedMessage && (
          <div className="chatbot-msg bot typewriter">{typedMessage}</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {currentNode === 'freeInput' ? (
        <form className="chatbot-input" onSubmit={handleUserSubmit}>
          <input
            type="text"
            placeholder={t('chatbot.inputPlaceholder')}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
          <button type="submit">{t('chatbot.send')}</button>
        </form>
      ) : (
        !isTyping && !fullMessage && decisionTree[currentNode]?.options && (
          <div className="bot-options">
            {decisionTree[currentNode].options.map((opt, idx) => (
              <button key={idx} onClick={() => handleOptionClick(opt.next)}>
                {opt.label}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default ChatWidget;
