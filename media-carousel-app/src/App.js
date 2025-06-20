import './App.css';
import CapabilityModal from './components/CapabilityCard/CapabilityModal';
import { useState } from 'react';
import FloatingChatbot from './components/chatbot/FloatingChatbot';
import Navbar from './components/Navbar/Navbar';
import MediaCarousel from './components/MediaCarousel/MediaCarousel';
import AIChatCarousel from './components/AIChatCarousel/AIChatCarousel';
import CapabilityCard from './components/CapabilityCard/CapabilityCard';
import VisitorForm from './components/VisitorForm/VisitorForm';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();

  const [selectedCap, setSelectedCap] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (cap) => {
    setSelectedCap(cap);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCap(null);
  };

  const mediaItems = [
    { type: 'image', src: '/assets/image0.jpg' },
    { type: 'video', src: '/assets/demo1_fixed.mp4' },
    { type: 'custom' },
    { type: 'video', src: '/assets/demo2_fixed.mp4' },
    { type: 'iframe', src: 'https://www.youtube.com/embed/FwOTs4UxQS4' },
    { type: 'image', src: '/assets/image1.jpg' },
    { type: 'iframe', src: 'https://www.youtube.com/embed/Cg2A3L58pY0' }
  ];

  const capabilities = [
    {
      title: t('capabilities.ai.title'),
      description: t('capabilities.ai.description'),
      icon: '🧠',
      features: t('capabilities.ai.features', { returnObjects: true }),
      useCases: t('capabilities.ai.useCases', { returnObjects: true })
    },
    {
      title: t('capabilities.web.title'),
      description: t('capabilities.web.description'),
      icon: '📱',
      features: t('capabilities.web.features', { returnObjects: true }),
      useCases: t('capabilities.web.useCases', { returnObjects: true })
    },
    {
      title: t('capabilities.db.title'),
      description: t('capabilities.db.description'),
      icon: '🗄️',
      features: t('capabilities.db.features', { returnObjects: true }),
      useCases: t('capabilities.db.useCases', { returnObjects: true })
    },
    {
      title: t('capabilities.voice.title'),
      description: t('capabilities.voice.description'),
      icon: '🎙️',
      features: t('capabilities.voice.features', { returnObjects: true }),
      useCases: t('capabilities.voice.useCases', { returnObjects: true })
    },
    {
      title: t('capabilities.integration.title'),
      description: t('capabilities.integration.description'),
      icon: '🔗',
      features: t('capabilities.integration.features', { returnObjects: true }),
      useCases: t('capabilities.integration.useCases', { returnObjects: true })
    },
    {
      title: t('capabilities.analytics.title'),
      description: t('capabilities.analytics.description'),
      icon: '📊',
      features: t('capabilities.analytics.features', { returnObjects: true }),
      useCases: t('capabilities.analytics.useCases', { returnObjects: true })
    }
  ];

  const analyticsData = [
    { name: 'Jan', users: 30 },
    { name: 'Feb', users: 80 },
    { name: 'Mar', users: 45 },
    { name: 'Apr', users: 60 }
  ];

  return (
    <div className="App">
      <Navbar />

      <section id="hero" className="hero">
        <h1>
          {t('hero.title')} <span>Codepackers</span>
        </h1>
        <p>{t('hero.subtitle')}</p>
      </section>

      <section id="ai-form" className="ai-form-wrapper">
        <div className="ai-form-left">
          <AIChatCarousel />
        </div>
        <div className="ai-form-right">
          <VisitorForm />
        </div>
      </section>

      <section id="media">
        <MediaCarousel mediaItems={mediaItems} />
      </section>

      <section id="capabilities" className="capabilities-section">
        <h2>{t('capabilities.heading')}</h2>
        <div className="capabilities-grid">
          {capabilities.map((cap, idx) => (
            <CapabilityCard
              key={idx}
              title={cap.title}
              description={cap.description}
              icon={cap.icon}
              features={cap.features}
              useCases={cap.useCases}
              onClick={() => openModal(cap)}
            />
          ))}
        </div>
      </section>

      <CapabilityModal
        isOpen={isModalOpen}
        onClose={closeModal}
        capability={selectedCap}
      />

      <section id="analytics" className="analytics-section">
        <h2>{t('analytics.heading')}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="users" fill="#1f3c88" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section id="contact" className="contact-section">
        <h2>{t('contact.heading')}</h2>
        <p>{t('contact.email')}: <a href="mailto:hello@codepackers.com">hello@codepackers.com</a></p>
        <p>{t('contact.phone')}: <a href="tel:+919876543210">+91-9876543210</a></p>
      </section>

      <FloatingChatbot />
    </div>
  );
}

export default App;
