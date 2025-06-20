// AIChatCarousel.jsx
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

const HUMAN_TYPING_SPEED = 100;
const BOT_TYPING_SPEED = 20;
const RESET_LOOP_DELAY = 5000;
const BOT_TYPING_INDICATOR_DELAY = 800;

const AIChatCarousel = () => {
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [sendClicked, setSendClicked] = useState(false);
  const [loopKey, setLoopKey] = useState(0);

  useEffect(() => {
    const blink = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);
    return () => clearInterval(blink);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const playChatSequence = async () => {
      for (let i = 0; i < messages.length; i++) {
        const currentMsg = messages[i];
        if (isCancelled) return;

        if (currentMsg.sender === 'ai') {
          setBotTyping(true);
          await new Promise((r) => setTimeout(r, BOT_TYPING_INDICATOR_DELAY));
          setBotTyping(false);

          let aiText = '';
          for (let c = 0; c < currentMsg.text.length; c++) {
            if (isCancelled) return;
            aiText += currentMsg.text[c];
            setDisplayedMessages((prev) => {
              const updated = [...prev];
              if (updated[updated.length - 1]?.sender === 'ai') {
                updated[updated.length - 1].text = aiText;
              } else {
                updated.push({ sender: 'ai', text: aiText });
              }
              return updated;
            });
            await new Promise((r) => setTimeout(r, BOT_TYPING_SPEED));
          }
        }

        if (currentMsg.sender === 'user') {
          setIsTyping(true);
          let userInput = '';
          for (let c = 0; c < currentMsg.text.length; c++) {
            if (isCancelled) return;
            userInput += currentMsg.text[c];
            setInputText(userInput);
            await new Promise((r) => setTimeout(r, HUMAN_TYPING_SPEED));
          }

          setSendClicked(true);
          await new Promise((r) => setTimeout(r, 400));
          setDisplayedMessages((prev) => [...prev, { sender: 'user', text: userInput }]);
          setInputText('');
          setSendClicked(false);
          setIsTyping(false);
        }
      }

      setTimeout(() => {
        if (isCancelled) return;
        setDisplayedMessages([]);
        setInputText('');
        setLoopKey((prev) => prev + 1);
      }, RESET_LOOP_DELAY);
    };

    playChatSequence();

    return () => {
      isCancelled = true;
    };
  }, [loopKey]);

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

        {botTyping && (
          <div className="chat-bubble ai typing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <div className="fake-input" tabIndex="-1">
        {isTyping ? (
          <>
            <span style={{ whiteSpace: 'pre-wrap' }}>{inputText}</span>
            <span className={`cursor ${cursorVisible ? 'visible' : ''}`}>|</span>
          </>
        ) : (
          <span className="placeholder-text">
            <span className={`cursor ${cursorVisible ? 'visible' : ''}`}>|</span>
            Type your query
          </span>
        )}
      </div>

        <button className={`send-btn ${sendClicked ? 'clicked' : ''}`} disabled>
          ➤
        </button>
      </div>
    </div>
  );
};

export default AIChatCarousel;
