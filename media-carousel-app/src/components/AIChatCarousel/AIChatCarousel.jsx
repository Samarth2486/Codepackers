import React, { useEffect, useState, useRef } from 'react';
import './AIChatCarousel.css';
import { useTranslation } from 'react-i18next';

const AIChatCarousel = () => {
  const { t, i18n } = useTranslation();

  const messages = React.useMemo(() => [
    { sender: 'user', text: t('aiChatCarousel.messages.0') },
    { sender: 'ai', text: t('aiChatCarousel.messages.1') },
    { sender: 'user', text: t('aiChatCarousel.messages.2') },
  ], [t]);

  const HUMAN_TYPING_SPEED = 100;
  const BOT_TYPING_SPEED = 20;
  const RESET_LOOP_DELAY = 5000;
  const BOT_TYPING_INDICATOR_DELAY = 800;

  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [sendClicked, setSendClicked] = useState(false);
  const [loopKey, setLoopKey] = useState(0);
  const [showPause, setShowPause] = useState(false);

  const inputRef = useRef();

  useEffect(() => {
    let isCancelled = false;

    const playChatSequence = async () => {
      for (let i = 0; i < messages.length; i++) {
        const currentMsg = messages[i];
        if (isCancelled) return;

        if (currentMsg.sender === 'ai') {
          setBotTyping(true);
          setShowPause(true);
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
          setShowPause(false);
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
  }, [loopKey, messages]);

  useEffect(() => {
    setDisplayedMessages([]);
    setInputText('');
    setLoopKey((prev) => prev + 1);
  }, [i18n.language]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.scrollTop = inputRef.current.scrollHeight;
    }
  }, [inputText]);

  return (
    <div className="chat-carousel-container">
      <div className="chat-header">
        <div className="avatar-icon">💬</div>
        <div>
          <div className="chat-title">{t('aiChatCarousel.title')}</div>
          <div className="chat-subtitle">{t('aiChatCarousel.subtitle')}</div>
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
        <div className="fake-input" contentEditable={false} tabIndex="-1" ref={inputRef}>
          {inputText ? (
            <>
              <span className="typing-content">{inputText}</span>
              <span className="cursor" />
            </>
          ) : (
            <>
              <span className="cursor" />
              <span className="placeholder-text">{t('aiChatCarousel.placeholder')}</span>
            </>
          )}
        </div>

        <button 
          className={`send-btn ${sendClicked ? 'clicked' : ''}`} 
          disabled
        >
          {showPause ? (
            <svg width="18" height="18" viewBox="0 0 18 18" className="pause-square-icon">
              <rect x="3" y="3" width="12" height="12" rx="3" fill="white"/>
            </svg>
          ) : '➤'}
        </button>
      </div>
    </div>
  );
};

export default AIChatCarousel;
