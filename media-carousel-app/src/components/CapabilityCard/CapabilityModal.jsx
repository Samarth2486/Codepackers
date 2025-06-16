import React, { useState } from 'react';
import './CapabilityModal.css';

const CapabilityModal = ({ isOpen, onClose, capability }) => {
  const [activeTab, setActiveTab] = useState('features');

  if (!isOpen || !capability) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-x" onClick={onClose}>×</button>
        <div className="modal-icon">{capability.icon}</div>
        <h2>{capability.title}</h2>
        <p>{capability.description}</p>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            Features
          </button>
          <button
            className={`tab ${activeTab === 'usecases' ? 'active' : ''}`}
            onClick={() => setActiveTab('usecases')}
          >
            Use Cases
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'features' ? (
            <ul>
              <li>Scalable AI architecture</li>
              <li>Multi-channel support</li>
              <li>Natural language understanding</li>
            </ul>
          ) : (
            <ul>
              <li>Customer support automation</li>
              <li>AI lead qualification</li>
              <li>Voice-enabled booking systems</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CapabilityModal;
