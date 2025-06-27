import React from 'react';
import './BotOptions.css';
import { useTranslation } from 'react-i18next';

const BotOptions = ({ options, onSelect }) => {
  const { t } = useTranslation();

  return (
    <div className="bot-options">
      {options.map((opt, idx) => (
        <button key={idx} onClick={() => onSelect(opt.next)}>
          {t(opt.label)}
        </button>
      ))}
    </div>
  );
};

export default BotOptions;
