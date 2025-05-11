import React from 'react';
import { IToolbarProps } from './types';

interface StyledToolbarProps {
  bgClass?: string;
  textClass?: string;
  title: string;
  description?: string;
  hideDescription?: boolean;
  toolbarActions?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * 대시보드 스타일의 툴바 컴포넌트
 * 색상 배경과 그라데이션을 적용한 스타일로 표시됨
 */
const StyledToolbar: React.FC<StyledToolbarProps> = ({ 
  bgClass = 'bg-gradient-to-r from-primary to-info',
  textClass = 'text-white', 
  title,
  description,
  hideDescription = false,
  toolbarActions,
  children 
}) => {
  return (
    <div className={`${bgClass} ${textClass} rounded-lg shadow-md px-5 py-5 mb-8 dark:shadow-none`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold mb-1">{title}</h2>
          {!hideDescription && description && (
            <p className="text-sm md:text-base opacity-80">{description}</p>
          )}
        </div>
        {toolbarActions && (
          <div className="mt-3 lg:mt-0 flex flex-wrap gap-2 justify-start lg:justify-end">
            {toolbarActions}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export { StyledToolbar };