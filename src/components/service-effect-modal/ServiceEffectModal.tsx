import React from 'react';
import { useServiceEffectModal } from '@/contexts/ServiceEffectModalContext';
import { ServiceEffectViewerModal } from './ServiceEffectViewerModal';

export const ServiceEffectModal: React.FC = () => {
  const { isOpen, serviceCategory, closeModal } = useServiceEffectModal();

  return (
    <ServiceEffectViewerModal
      isOpen={isOpen}
      onClose={closeModal}
      serviceCategory={serviceCategory}
    />
  );
};