import React from 'react';
import './CapabilityCard.css';

const CapabilityCard = ({ icon, title, description, onClick }) => {
  return (
    <div className="capability-card" onClick={onClick}>
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default CapabilityCard;

