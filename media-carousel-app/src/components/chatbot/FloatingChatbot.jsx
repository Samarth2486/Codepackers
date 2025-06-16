import React, { useState, useEffect } from 'react';
import MessageBubbles from './MessageBubbles';
import decisionTree from './decisionTree';
import './FloatingChatbot.css';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [currentNode, setCurrentNode] = useState('start');

  const showBotMessage = (nodeKey) => {
    const node = decisionTree[nodeKey];
    if (!node) return;

    setIsBotTyping(true);

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { from: 'ai', text: node.message, options: node.options?.map(opt => opt.label) }
      ]);
      setIsBotTyping(false);
      setCurrentNode(nodeKey);
    }, 800);
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) showBotMessage('start');
  }, [isOpen]);

  const handleSend = (userInput) => {
    if (!userInput.trim()) return;

    setMessages(prev => [...prev, { from: 'user', text: userInput }]);
    setInput('');
    setIsBotTyping(true);

    setTimeout(() => {
      const current = decisionTree[currentNode];
      const matchedOption = current?.options?.find(opt => opt.label.toLowerCase() === userInput.toLowerCase());

      if (matchedOption) {
        showBotMessage(matchedOption.next);
      } else {
        setMessages(prev => [
          ...prev,
          { from: 'ai', text: `Thanks for sharing! We'll get back to you shortly.` }
        ]);
        setIsBotTyping(false);
      }
    }, 800);
  };

  const handleOptionClick = (optionLabel) => handleSend(optionLabel);

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
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="chatbot-body">
            <MessageBubbles chat={messages} isBotTyping={isBotTyping} onOptionClick={handleOptionClick} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend(input)}
            />
            <button onClick={() => handleSend(input)}>Send</button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
