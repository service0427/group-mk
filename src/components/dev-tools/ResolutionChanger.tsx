import React, { useState } from 'react';
import { KeenIcon } from '@/components/keenicons';
import { ResponsivePreview } from './ResponsivePreview';

export const ResolutionChanger: React.FC = () => {
  const [showPreview, setShowPreview] = useState(false);

  const handleClick = () => {
    setShowPreview(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors bg-purple-100/80 dark:bg-purple-800/50 text-purple-600 dark:text-purple-300 hover:bg-purple-200/80 dark:hover:bg-purple-700/50"
        title="반응형 미리보기"
      >
        <KeenIcon icon="devices" className="text-sm flex-shrink-0" />
        <span className="whitespace-nowrap">미리보기</span>
      </button>
      
      <ResponsivePreview 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)} 
      />
    </>
  );
};