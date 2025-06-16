import React, { useState } from 'react';
import CapabilityCard from '../CapabilityCard/CapabilityCard';
import CapabilityModal from '../CapabilityCard/CapabilityModal';
import { BrainCircuit, Smartphone, Database, Mic, Link, BarChart } from 'lucide-react';
import './CapabilitiesSection.css';

const capabilities = [
  {
    icon: <BrainCircuit size={36} strokeWidth={2} />,
    title: 'AI Conversational Agents',
    description: 'Human-like AI chatbots and voice assistants for seamless interaction.',
    features: ['Natural language understanding', 'Multilingual support', 'Custom workflows'],
    useCases: ['Customer support', 'Virtual assistants', 'Internal team bots'],
  },
  {
    icon: <Smartphone size={36} strokeWidth={2} />,
    title: 'Web & Mobile Apps',
    description: 'Cross-platform apps with modern UI/UX and scalable backend.',
    features: ['React Native', 'Progressive Web Apps', 'Backend APIs'],
    useCases: ['eCommerce apps', 'CRM systems', 'Booking platforms'],
  },
  {
    icon: <Database size={36} strokeWidth={2} />,
    title: 'Database Management',
    description: 'Efficient tools for managing enterprise data and customer relations.',
    features: ['MySQL, MongoDB', 'Data backups', 'Role-based access'],
    useCases: ['HR systems', 'Inventory tracking', 'Customer DBs'],
  },
  {
    icon: <Mic size={36} strokeWidth={2} />,
    title: 'Voice-first AI Apps',
    description: 'Next-gen voice-command powered apps integrated with smart AI.',
    features: ['Voice SDKs', 'Text-to-Speech', 'Voice-triggered automation'],
    useCases: ['Voice assistants', 'Accessibility tools', 'Smart home interfaces'],
  },
  {
    icon: <Link size={36} strokeWidth={2} />,
    title: 'Systems Integration',
    description: 'Connect tools, platforms and databases into a unified ecosystem.',
    features: ['API bridges', 'Data syncing', 'Single sign-on'],
    useCases: ['ERP integration', 'Analytics pipeline', 'IoT control centers'],
  },
  {
    icon: <BarChart size={36} strokeWidth={2} />,
    title: 'Data Analytics',
    description: 'Dashboard-driven insights and AI-powered analytics.',
    features: ['BI dashboards', 'Data cleaning', 'Custom KPIs'],
    useCases: ['Sales trends', 'User behavior tracking', 'Forecasting'],
  }
];

const CapabilitiesSection = () => {
  const [selected, setSelected] = useState(null);

  return (
    <section className="capabilities-section">
      <h2>Codepackers Software Solutions</h2>
      <div className="capabilities-grid">
        {capabilities.map((cap, idx) => (
          <CapabilityCard key={idx} {...cap} onClick={() => setSelected(cap)} />
        ))}
      </div>
      <CapabilityModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        capability={selected}
      />
    </section>
  );
};

export default CapabilitiesSection;
