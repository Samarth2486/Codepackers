import React from 'react';
import './CapabilityCard.css';

const CapabilityCard = ({ icon, title, description, features, useCases, onClick }) => {
  const handleClick = () => {
    onClick({
      icon,
      title,
      description,
      features,
      useCases
    });
  };

  return (
    <div className="capability-card" onClick={handleClick}>
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default CapabilityCard;

