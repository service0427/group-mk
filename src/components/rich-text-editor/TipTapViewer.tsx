import React from 'react';
import './tiptap-styles.css';
import './image-fix.css';

interface TipTapViewerProps {
  content: string;
  className?: string;
}

const TipTapViewer: React.FC<TipTapViewerProps> = ({
  content,
  className = ''
}) => {
  return (
    <div 
      className={`tiptap-content-viewer ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default TipTapViewer;