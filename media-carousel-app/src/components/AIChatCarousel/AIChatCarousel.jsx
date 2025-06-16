import React, { useEffect, useState } from 'react';
import './AIChatCarousel.css';

const messages = [
  { sender: 'user', text: 'Show me the Q3 sales report for the Delhi region' },
  {
    sender: 'ai',
    text: "I've found the Q3 sales report for Delhi. The region showed 23% growth with ₹2.4 crores in revenue. Would you like me to break this down by product categories?"
  },
  { sender: 'user', text: 'Please, provide me breakdown of top three product categories' }
];

const TYPING_DELAY = 100;
const DOTS_DELAY = 1500;
const LOOP_DELAY = 2500;

const AIChatCarousel = () => {
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [typing, setTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState('dots');

  useEffect(() => {
    if (currentIndex < messages.length) {
      setTyping(true);
      setCurrentText('');
      setPhase('dots');

      const dotsTimer = setTimeout(() => {
        setPhase('typing');
        typeMessage(messages[currentIndex].text, 0);
      }, DOTS_DELAY);

      return () => clearTimeout(dotsTimer);
    } else {
      const loopTimer = setTimeout(() => {
        setDisplayedMessages([]);
        setCurrentIndex(0);
      }, LOOP_DELAY);

      return () => clearTimeout(loopTimer);
    }
  }, [currentIndex]);

  const typeMessage = (message, index) => {
    if (index <= message.length) {
      setCurrentText(message.slice(0, index));
      setTimeout(() => typeMessage(message, index + 1), TYPING_DELAY);
    } else {
      setDisplayedMessages(prev => [...prev, messages[currentIndex]]);
      setTyping(false);
      setCurrentText('');
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div className="chat-carousel-container">
      <div className="chat-header">
        <div className="avatar-icon">💬</div>
        <div>
          <div className="chat-title">Paul - My Enterprise AI Agent</div>
          <div className="chat-subtitle">Multilingual</div>
        </div>
      </div>

      <div className="chat-bubble-wrapper">
        {displayedMessages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.sender}`}>
            {msg.text}
          </div>
        ))}

        {typing && (
          <div className={`chat-bubble ${messages[currentIndex]?.sender || 'ai'}`}>
            {phase === 'dots' ? (
              <span className={`typing`}>
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </span>
            ) : (
              <span className="typewriter-text">
                {currentText}
                <span className="cursor" />
              </span>
            )}
          </div>
        )}
      </div>

      <div className="chat-footer">
        <span className="dot blue"></span>
        <span className="dot green"></span>
        <span className="dot pink"></span>
      </div>
    </div>
  );
};

export default AIChatCarousel;