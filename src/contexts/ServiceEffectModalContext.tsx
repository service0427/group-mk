import React, { createContext, useState, useCallback, ReactNode, useContext } from 'react';
import { ServiceEffectCategory } from '@/types/service-effect.types';
import { ServiceEffectModal } from '@/components/service-effect-modal';

interface ServiceEffectModalContextType {
  isOpen: boolean;
  serviceCategory: ServiceEffectCategory | null;
  openModal: (category: ServiceEffectCategory) => void;
  closeModal: () => void;
}

export const ServiceEffectModalContext = createContext<ServiceEffectModalContextType | undefined>(undefined);

export const ServiceEffectModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [serviceCategory, setServiceCategory] = useState<ServiceEffectCategory | null>(null);

  const openModal = useCallback((category: ServiceEffectCategory) => {
    setServiceCategory(category);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setServiceCategory(null);
  }, []);

  return (
    <ServiceEffectModalContext.Provider value={{ isOpen, serviceCategory, openModal, closeModal }}>
      {children}
      <ServiceEffectModal />
    </ServiceEffectModalContext.Provider>
  );
};

export const useServiceEffectModal = () => {
  const context = useContext(ServiceEffectModalContext);
  if (!context) {
    throw new Error('useServiceEffectModal must be used within ServiceEffectModalProvider');
  }
  return context;
};