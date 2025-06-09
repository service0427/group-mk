import React, { useState, useCallback } from 'react';
import { ServiceEffectModal } from './ServiceEffectModal';
import { ServiceType } from '@/types/service.types';

interface UseServiceEffectModalReturn {
  openServiceEffectModal: (serviceType: ServiceType, serviceName: string) => void;
  ServiceEffectModalComponent: React.FC;
}

export const useServiceEffectModal = (): UseServiceEffectModalReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>('NAVER_PLACE');
  const [serviceName, setServiceName] = useState('');

  const openServiceEffectModal = useCallback((type: ServiceType, name: string) => {
    setServiceType(type);
    setServiceName(name);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const ServiceEffectModalComponent: React.FC = () => (
    <ServiceEffectModal
      isOpen={isOpen}
      onClose={handleClose}
      serviceType={serviceType}
      serviceName={serviceName}
    />
  );

  return {
    openServiceEffectModal,
    ServiceEffectModalComponent
  };
};