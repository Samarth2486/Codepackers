import React from 'react';
import './BotOptions.css';

const BotOptions = ({ options, onSelect }) => (
  <div className="bot-options">
    {options.map((opt, idx) => (
      <button key={idx} onClick={() => onSelect(opt.next)}>
        {opt.label}
      </button>
    ))}
  </div>
);

export default BotOptions;
