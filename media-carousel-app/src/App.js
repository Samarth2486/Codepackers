import './App.css';
import CapabilityModal from './components/CapabilityCard/CapabilityModal';
import { useState } from 'react';
import FloatingChatbot from './components/chatbot/FloatingChatbot';
import Navbar from './components/Navbar/Navbar';
import MediaCarousel from './components/MediaCarousel/MediaCarousel';
import AIChatCarousel from './components/AIChatCarousel/AIChatCarousel';
import CapabilityCard from './components/CapabilityCard/CapabilityCard';
import VisitorForm from './components/VisitorForm/VisitorForm';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function App() {
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
    title: 'AI Conversational Agents',
    description: 'Designing human-like AI chatbots and voice assistants for seamless user interactions.',
    icon: '🧠',
    features: ['Scalable AI architecture', 'Multi-channel support', 'Natural language understanding'],
    useCases: ['Automated customer service', 'Internal knowledge bots', 'Voice AI for accessibility']
  },
  {
    title: 'Web & Mobile Apps',
    description: 'Building cross-platform applications with modern UI/UX and scalable backend.',
    icon: '📱',
    features: ['React Native and PWA support', 'Responsive UI/UX', 'Secure authentication and APIs'],
    useCases: ['eCommerce apps', 'CRM systems', 'Event booking platforms']
  },
  {
    title: 'Database Management Systems',
    description: 'Solutions for Task, Health, HR, and Customer Relations management.',
    icon: '🗄️',
    features: ['MySQL, PostgreSQL, MongoDB', 'Data backups and restore', 'Role-based access control'],
    useCases: ['HR data systems', 'Inventory tracking', 'CRM solutions']
  },
  {
    title: 'Voice-first & AI Apps',
    description: 'Building next-gen voice-command powered apps integrated with smart AI.',
    icon: '🎙️',
    features: ['Voice recognition SDKs', 'Text-to-speech integration', 'Voice-triggered workflows'],
    useCases: ['Accessibility tools', 'Smart home apps', 'Voice-enabled surveys']
  },
  {
    title: 'Systems Integration',
    description: 'Connecting tools, platforms, and databases into a unified smart ecosystem.',
    icon: '🔗',
    features: ['REST & GraphQL APIs', 'SSO (Single Sign-On)', 'Real-time data sync'],
    useCases: ['ERP/CRM integration', 'IoT dashboards', 'Data pipelines']
  },
  {
    title: 'Data Analytics',
    description: 'Visualizing data and extracting insights using dashboards and AI-driven analysis.',
    icon: '📊',
    features: ['BI dashboards', 'Custom KPIs', 'Automated data cleaning'],
    useCases: ['Sales analytics', 'User behavior tracking', 'Forecasting & predictions']
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
          Experience <span>Codepackers</span>
        </h1>
        <p>Innovative AI-first solutions & platform showcase</p>
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
        <h2>Codepackers Software Solutions</h2>
        <div className="capabilities-grid">
          {capabilities.map((cap, idx) => (
            <CapabilityCard
              key={idx}
              title={cap.title}
              description={cap.description}
              icon={cap.icon}
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
        <h2>Analytics Overview</h2>
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
        <h2>Contact Us</h2>
        <p>Email: <a href="mailto:hello@codepackers.com">hello@codepackers.com</a></p>
        <p>Phone: <a href="tel:+919876543210">+91-9876543210</a></p>
      </section>

      <FloatingChatbot />
    </div>
  );
}

export default App;
