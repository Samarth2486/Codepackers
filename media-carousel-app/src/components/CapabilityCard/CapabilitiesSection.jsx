import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CapabilityCard from '../CapabilityCard/CapabilityCard';
import CapabilityModal from '../CapabilityCard/CapabilityModal';
import { BrainCircuit, Smartphone, Database, Mic, Link, BarChart } from 'lucide-react';
import './CapabilitiesSection.css';

const CapabilitiesSection = () => {
  const [selected, setSelected] = useState(null);
  const { t } = useTranslation();

  const capabilities = [
    {
      id: 1,
      icon: <BrainCircuit size={36} strokeWidth={2} />,
      title: t('capabilities.ai.title'),
      description: t('capabilities.ai.description'),
      features: t('capabilities.ai.features', { returnObjects: true }),
      useCases: t('capabilities.ai.useCases', { returnObjects: true })
    },
    {
      id: 2,
      icon: <Smartphone size={36} strokeWidth={2} />,
      title: t('capabilities.web.title'),
      description: t('capabilities.web.description'),
      features: t('capabilities.web.features', { returnObjects: true }),
      useCases: t('capabilities.web.useCases', { returnObjects: true })
    },
    {
      id: 3,
      icon: <Database size={36} strokeWidth={2} />,
      title: t('capabilities.db.title'),
      description: t('capabilities.db.description'),
      features: t('capabilities.db.features', { returnObjects: true }),
      useCases: t('capabilities.db.useCases', { returnObjects: true })
    },
    {
      id: 4,
      icon: <Mic size={36} strokeWidth={2} />,
      title: t('capabilities.voice.title'),
      description: t('capabilities.voice.description'),
      features: t('capabilities.voice.features', { returnObjects: true }),
      useCases: t('capabilities.voice.useCases', { returnObjects: true })
    },
    {
      id: 5,
      icon: <Link size={36} strokeWidth={2} />,
      title: t('capabilities.integration.title'),
      description: t('capabilities.integration.description'),
      features: t('capabilities.integration.features', { returnObjects: true }),
      useCases: t('capabilities.integration.useCases', { returnObjects: true })
    },
    {
      id: 6,
      icon: <BarChart size={36} strokeWidth={2} />,
      title: t('capabilities.analytics.title'),
      description: t('capabilities.analytics.description'),
      features: t('capabilities.analytics.features', { returnObjects: true }),
      useCases: t('capabilities.analytics.useCases', { returnObjects: true })
    }
  ];

  return (
    <section className="capabilities-section">
      <h2>{t('capabilities.heading')}</h2>
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
