import React, { useEffect, useRef } from 'react';
// @ts-ignore
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer';
import '@toast-ui/editor/dist/toastui-editor-viewer.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';

interface ToastUIViewerProps {
  content: string;
  height?: string;
  className?: string;
  theme?: 'light' | 'dark';
}

export const ToastUIViewer: React.FC<ToastUIViewerProps> = ({
  content = '',
  height = '400px',
  className = '',
  theme = 'light'
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<Viewer | null>(null);

  useEffect(() => {
    if (!viewerRef.current || viewerInstance.current) return;

    // DOM이 완전히 준비될 때까지 대기
    const timer = setTimeout(() => {
      if (!viewerRef.current) return;

      try {
        viewerInstance.current = new Viewer({
          el: viewerRef.current,
          height,
          initialValue: content,
          theme,
          usageStatistics: false,
        });
      } catch (error) {
        console.error('Toast UI Viewer initialization error:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (viewerInstance.current) {
        try {
          viewerInstance.current.destroy();
        } catch (error) {
          console.error('Toast UI Viewer destroy error:', error);
        }
        viewerInstance.current = null;
      }
    };
  }, [height, theme]);

  useEffect(() => {
    if (viewerInstance.current && content !== undefined) {
      viewerInstance.current.setMarkdown(content);
    }
  }, [content]);

  return (
    <div 
      ref={viewerRef} 
      className={`toast-ui-viewer ${className}`}
    />
  );
};