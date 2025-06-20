import React, { useState } from 'react';
import CapabilityCard from '../CapabilityCard/CapabilityCard';
import CapabilityModal from '../CapabilityCard/CapabilityModal';
import { BrainCircuit, Smartphone, Database, Mic, Link, BarChart } from 'lucide-react';
import './CapabilitiesSection.css';

const capabilities = [
  {
    id: 1,
    icon: <BrainCircuit size={36} strokeWidth={2} />,
    title: 'AI Conversational Agents',
    description: 'Designing human-like AI chatbots and voice assistants for seamless user interactions.',
    features: ['Scalable AI architecture', 'Multi-channel support', 'Natural language understanding'],
    useCases: ['Automated customer service', 'Internal knowledge bots', 'Voice AI for accessibility']
  },
  {
    id: 2,
    icon: <Smartphone size={36} strokeWidth={2} />,
    title: 'Web & Mobile Apps',
    description: 'Building cross-platform applications with modern UI/UX and scalable backend.',
    features: ['React Native and PWA support', 'Responsive UI/UX', 'Secure authentication and APIs'],
    useCases: ['eCommerce apps', 'CRM systems', 'Event booking platforms']
  },
  {
    id: 3,
    icon: <Database size={36} strokeWidth={2} />,
    title: 'Database Management',
    description: 'Reliable solutions to manage enterprise data efficiently and securely.',
    features: ['MySQL, PostgreSQL, MongoDB', 'Data backups and restore', 'Role-based access control'],
    useCases: ['HR and employee data systems', 'Inventory and order tracking', 'Customer relationship management']
  },
  {
    id: 4,
    icon: <Mic size={36} strokeWidth={2} />,
    title: 'Voice-first AI Apps',
    description: 'Smart applications that understand and respond to voice commands.',
    features: ['Voice recognition SDKs', 'Text-to-speech integration', 'Voice-triggered workflows'],
    useCases: ['Accessibility tools', 'Smart home interfaces', 'Voice-enabled surveys']
  },
  {
    id: 5,
    icon: <Link size={36} strokeWidth={2} />,
    title: 'Systems Integration',
    description: 'Unify all your tools and platforms through custom integrations.',
    features: ['REST & GraphQL APIs', 'Single sign-on (SSO)', 'Real-time data syncing'],
    useCases: ['ERP and CRM integration', 'IoT dashboards', 'Analytics data pipelines']
  },
  {
    id: 6,
    icon: <BarChart size={36} strokeWidth={2} />,
    title: 'Data Analytics',
    description: 'Drive decisions with visual dashboards and AI-powered insights.',
    features: ['BI dashboards', 'Custom KPIs', 'Automated data cleaning'],
    useCases: ['Sales trends and reports', 'User behavior tracking', 'Forecasting & predictions']
  }
];

const CapabilitiesSection = () => {
  const [selected, setSelected] = useState(null);

  return (
    <section className="capabilities-section">
      <h2>Codepackers Software Solutions</h2>
      <div className="capabilities-grid">
        {capabilities.map((cap) => (
          <CapabilityCard
            key={cap.id}
            icon={cap.icon}
            title={cap.title}
            description={cap.description}
            features={cap.features}
            useCases={cap.useCases}
            onClick={setSelected}
          />
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
