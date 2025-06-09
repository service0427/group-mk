import React from 'react';
import { useServiceEffectModal } from '@/contexts/ServiceEffectModalContext';
import { ServiceEffectViewerModal } from './ServiceEffectViewerModal';

export const ServiceEffectModal: React.FC = () => {
  const { isOpen, serviceCategory, closeModal } = useServiceEffectModal();

  // isOpen이 false일 때는 렌더링하지 않음
  if (!isOpen) {
    return null;
  }

  return (
    <ServiceEffectViewerModal
      isOpen={isOpen}
      onClose={closeModal}
      serviceCategory={serviceCategory}
    />
  );
};