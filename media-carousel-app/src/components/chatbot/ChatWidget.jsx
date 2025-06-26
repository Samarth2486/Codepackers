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
  const [currentOptions, setCurrentOptions] = useState(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Track user manual scroll
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
      setIsUserScrolling(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto scroll if bot is typing and user hasn’t scrolled manually
  useEffect(() => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [typedMessage, chat]);

  useEffect(() => {
    if (currentNode === 'start') {
      const startMsg = decisionTree.start.message;
      const options = decisionTree.start.options || null;
      setCurrentOptions(options);
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
          setChat((prev) => [...prev, { from: 'bot', text: fullMessage, options: currentOptions }]);
          setIsTyping(false);
          setFullMessage('');
          setCurrentOptions(null);
        }
      }, 10); // 💨 fast typing like ChatGPT
      return () => clearInterval(interval);
    }
  }, [fullMessage, currentOptions]);

  const handleOptionClick = (nextNodeKey) => {
    const label = decisionTree[currentNode]?.options?.find(opt => opt.next === nextNodeKey)?.label
      || nextNodeKey;

    setChat((prev) => [...prev, { from: 'user', text: label }]);

    if (nextNodeKey === 'freeInput') {
      setChat((prev) => [...prev, { from: 'bot', text: decisionTree.freeInput.message }]);
      setCurrentNode('freeInput');
    } else {
      const next = decisionTree[nextNodeKey];
      if (next) {
        setCurrentNode(nextNodeKey);
        setCurrentOptions(next.options || null);
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

      <div className="chatbot-messages" ref={chatContainerRef}>
        {chat.map((msg, idx) => (
          <div key={idx}>
            <div className={`chatbot-msg ${msg.from}`}>{msg.text}</div>
            {msg.from === 'bot' && msg.options && (
              <div className="bot-options">
                {msg.options.map((opt, optIdx) => (
                  <button key={optIdx} onClick={() => handleOptionClick(opt.next)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
        !isTyping && !fullMessage && currentOptions && (
          <div className="bot-options">
            {currentOptions.map((opt, idx) => (
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
