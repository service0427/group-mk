import clsx from 'clsx';
import { type ReactNode } from 'react';

import { useSettings } from '../../providers/SettingsProvider';
import { TSettingsContainer } from '@/config';

export interface TPageContainerProps {
  children?: ReactNode;
  width?: TSettingsContainer;
  className?: string;
  fullWidth?: boolean; // 전체 너비 옵션 추가
}

const Container = ({ children, width, className = '', fullWidth = false }: TPageContainerProps) => {
  const { settings } = useSettings();
  const { container } = settings;
  const widthMode = width ?? container;

  // 컨테이너 클래스 결정
  let containerClass = '';
  if (fullWidth) {
    // fullWidth가 true일 경우 새로운 클래스 사용
    containerClass = 'container-full-width';
  } else {
    // 기존 로직 유지
    containerClass = widthMode === 'fixed' ? 'container-fixed' : 'container-fluid';
  }

  return (
    <div className={clsx(className, containerClass)}>
      {children}
    </div>
  );
};

export { Container };
