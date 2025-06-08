import { useState, useEffect } from 'react';

// Footer와 ChatSticky의 표시 상태를 공유하는 전역 상태
let globalUIVisible = true;
let globalForceVisible = false;
const listeners: Set<(visible: boolean) => void> = new Set();

export const useUIVisibility = () => {
  const [isVisible, setIsVisible] = useState(globalUIVisible);
  const [forceVisible, setForceVisibleLocal] = useState(globalForceVisible);

  useEffect(() => {
    const listener = (visible: boolean) => {
      setIsVisible(visible);
      setForceVisibleLocal(globalForceVisible);
    };

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setGlobalVisible = (visible: boolean, force: boolean = false) => {
    globalUIVisible = visible;
    globalForceVisible = force;
    listeners.forEach(listener => listener(visible));
  };

  return {
    isVisible,
    forceVisible,
    setGlobalVisible
  };
};