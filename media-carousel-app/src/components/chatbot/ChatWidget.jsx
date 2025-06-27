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
  const [expandedMessages, setExpandedMessages] = useState({});

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingSpeed = 10; // Fast typing speed (ms per character)

  // Auto-scroll management (FIXED: Added chat dependency)
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 30;
      setIsUserScrolling(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll when new messages arrive (FIXED)
  useEffect(() => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat, isUserScrolling]); // Added chat dependency

  // Initialize chatbot
  useEffect(() => {
    if (currentNode === 'start') {
      const startMsg = decisionTree.start.message;
      const options = decisionTree.start.options || null;
      setCurrentOptions(options);
      setIsTyping(true);
      setTimeout(() => setFullMessage(t(`chatbot.${startMsg}`)), 1000);
    }
  }, [currentNode, t]);

  // Typing effect implementation
  useEffect(() => {
    if (fullMessage) {
      let index = 0;
      setTypedMessage('');
      const messageLength = fullMessage.length;

      const interval = setInterval(() => {
        setTypedMessage((prev) => prev + fullMessage.charAt(index));
        index++;

        if (!isUserScrolling) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }

        if (index >= messageLength) {
          clearInterval(interval);
          setTimeout(() => {
            setChat((prev) => [
              ...prev,
              { 
                from: 'bot', 
                text: fullMessage, 
                options: currentOptions,
                id: Date.now()
              },
            ]);
            setTypedMessage('');
            setIsTyping(false);
            setFullMessage('');
            setCurrentOptions(null);
            
            if (!isUserScrolling) {
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }
          }, 200);
        }
      }, typingSpeed);

      return () => clearInterval(interval);
    }
  }, [fullMessage, currentOptions, isUserScrolling, typingSpeed]);

  // Toggle message expansion
  const toggleExpand = (id) => {
    setExpandedMessages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handle option selection (FIXED: Added setIsTyping)
  const handleOptionClick = (nextNodeKey) => {
    const option = decisionTree[currentNode]?.options?.find(opt => opt.next === nextNodeKey);
    const labelKey = option?.label || nextNodeKey;

    setChat((prev) => [...prev, { 
      from: 'user', 
      text: t(`chatbot.${labelKey}`),
      id: Date.now()
    }]);

    if (nextNodeKey === 'freeInput') {
      setChat((prev) => [...prev, { 
        from: 'bot', 
        text: t(`chatbot.${decisionTree.freeInput.message}`),
        id: Date.now()
      }]);
      setCurrentNode('freeInput');
    } else {
      const next = decisionTree[nextNodeKey];
      if (next) {
        setCurrentNode(nextNodeKey);
        setCurrentOptions(next.options || null);
        setIsTyping(true); // Show typing indicator
        setTimeout(() => {
          setFullMessage(t(`chatbot.${next.message}`));
        }, 1000);
      }
    }
  };

  // Handle user message submission (FIXED: Added setIsTyping)
  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    setChat((prev) => [...prev, { 
      from: 'user', 
      text: userInput,
      id: Date.now()
    }]);
    setUserInput('');
    setIsTyping(true); // Show typing indicator
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
        {chat.map((msg) => (
          <div key={msg.id}>
            <div className={`chatbot-msg ${msg.from}`}>
              {msg.text.length > 300 && !expandedMessages[msg.id] ? (
                <>
                  {msg.text.substring(0, 300)}... 
                  <button 
                    className="read-more-btn" 
                    onClick={() => toggleExpand(msg.id)}
                  >
                    {t('chatbot.readMore')}
                  </button>
                </>
              ) : msg.text}
            </div>
            {msg.from === 'bot' && msg.options && (
              <div className="bot-options">
                {msg.options.map((opt, optIdx) => (
                  <button key={optIdx} onClick={() => handleOptionClick(opt.next)}>
                    {t(`chatbot.${opt.label}`)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {typedMessage && (
          <div className="chatbot-msg bot typewriter">{typedMessage}</div>
        )}

        {isTyping && !typedMessage && (
          <div className="chatbot-msg bot typing-indicator">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
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
                {t(`chatbot.${opt.label}`)}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default ChatWidget;
