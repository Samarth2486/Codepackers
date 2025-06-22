import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CapabilityModal.css';
import { useTranslation } from 'react-i18next';

const CapabilityModal = ({ isOpen, onClose, capability }) => {
  const [activeTab, setActiveTab] = useState('features');
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef(null);
  const { t } = useTranslation();

  // Particle effect state
  const [particles, setParticles] = useState([]);

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      triggerCloseAnimation();
    }
  };

  const triggerCloseAnimation = () => {
    setIsClosing(true);
    
    // Create particle explosion
    const newParticles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 5,
      color: `hsl(${Math.random() * 60 + 200}, 80%, 60%)`,
      life: Math.random() * 0.7 + 0.3
    }));
    setParticles(newParticles);

    // Close after animation completes
    setTimeout(onClose, 800);
  };

  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && triggerCloseAnimation();
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Define renderList function
  const renderList = (items, fallbackKey) => {
    if (Array.isArray(items) && items.length > 0) {
      return (
        <ul>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    return <p className="tab-fallback">{t(fallbackKey)}</p>;
  };

  return (
    <AnimatePresence>
      {isOpen && capability && (
        <motion.div
          className="modal-overlay"
          onClick={handleClickOutside}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.4 }
          }}
        >
          {/* Particle explosion */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="particle"
              initial={{
                x: '50%',
                y: '50%',
                scale: 1,
                opacity: 1,
                backgroundColor: particle.color,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
              }}
              animate={{
                x: `${particle.x}%`,
                y: `${particle.y}%`,
                scale: [1, 1.5, 0],
                opacity: [1, 1, 0],
                rotate: Math.random() * 360
              }}
              transition={{
                duration: particle.life,
                ease: "easeOut"
              }}
            />
          ))}

          <motion.div
            ref={modalRef}
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            initial={{ 
              opacity: 0,
              scale: 0.8,
              y: 50
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { 
                duration: 0.5,
                ease: [0.175, 0.885, 0.32, 1.275]
              }
            }}
            exit={{
              opacity: 0,
              scale: isClosing ? [1, 1.2, 0.8] : 0.9,
              y: isClosing ? [0, -50, 100] : 40,
              rotateX: isClosing ? [0, 20, -45] : 0,
              rotateZ: isClosing ? [0, -10, 10] : 0,
              transition: {
                duration: 0.8,
                ease: [0.6, 0.05, 0.5, 0.95],
                scale: {
                  times: [0, 0.5, 1],
                  duration: 0.8
                },
                y: {
                  times: [0, 0.5, 1],
                  duration: 0.8
                },
                rotateX: {
                  times: [0, 0.5, 1],
                  duration: 0.8
                }
              }
            }}
          >
            <motion.button 
              className="close-x" 
              onClick={triggerCloseAnimation}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ 
                scale: 0,
                rotate: 180,
                transition: { duration: 0.3 }
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.8 }}
            >
              ×
            </motion.button>

            <div className="modal-icon">{capability.icon}</div>
            <h2>{capability.title}</h2>
            <p>{capability.description}</p>
            
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'features' ? 'active' : ''}`}
                onClick={() => setActiveTab('features')}
              >
                {t('capabilityModal.features')}
              </button>
              <button
                className={`tab ${activeTab === 'usecases' ? 'active' : ''}`}
                onClick={() => setActiveTab('usecases')}
              >
                {t('capabilityModal.useCases')}
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'features'
                ? renderList(capability.features, 'capabilityModal.noFeatures')
                : renderList(capability.useCases, 'capabilityModal.noUseCases')}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CapabilityModal;