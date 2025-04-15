import clsx from 'clsx';
import { type ReactNode } from 'react';

import { useSettings } from '../../providers/SettingsProvider';
import { TSettingsContainer } from '@/config';

export interface TPageContainerProps {
  children?: ReactNode;
  width?: TSettingsContainer;
  className?: string;
}

const Container = ({ children, width, className = '' }: TPageContainerProps) => {
  const { settings } = useSettings();
  const { container } = settings;
  const widthMode = width ?? container;

  return (
    <div className={clsx(className, widthMode === 'fixed' ? 'container-fixed' : 'container-fluid')}>
      {children}
    </div>
  );
};

export { Container };
