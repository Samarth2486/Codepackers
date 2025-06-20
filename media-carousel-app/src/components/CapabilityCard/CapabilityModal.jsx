import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CapabilityModal.css';

const CapabilityModal = ({ isOpen, onClose, capability }) => {
  const [activeTab, setActiveTab] = useState('features');
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && capability && (
        <motion.div
          className="modal-overlay"
          onClick={handleClickOutside}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            ref={modalRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.8, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
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
                capability?.features?.length > 0 ? (
                  <ul>
                    {capability.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="tab-fallback">No features listed.</p>
                )
              ) : (
                capability?.useCases?.length > 0 ? (
                  <ul>
                    {capability.useCases.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="tab-fallback">No use cases listed.</p>
                )
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CapabilityModal;
