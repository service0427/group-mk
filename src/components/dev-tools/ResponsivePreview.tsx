import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { KeenIcon } from '@/components/keenicons';

interface ResponsivePreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

type PreviewMode = 'mobile' | 'tablet' | 'desktop';

interface FrameSize {
  width: number;
  height: number;
  label: string;
}

const frameSizes: Record<PreviewMode, FrameSize> = {
  mobile: { width: 414, height: 896, label: 'iPhone 11 Pro Max' },
  tablet: { width: 768, height: 1024, label: 'iPad' },
  desktop: { width: 1920, height: 1080, label: 'Full HD' }
};

export const ResponsivePreview: React.FC<ResponsivePreviewProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<PreviewMode>('desktop');
  const [zoom, setZoom] = useState(80);
  const [error, setError] = useState(false);
  
  
  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  // 화면 크기에 따라 자동으로 줌 조절
  useEffect(() => {
    if (isOpen && mode) {
      const frameSize = frameSizes[mode];
      const viewportWidth = window.innerWidth - 64; // 패딩 고려
      const viewportHeight = window.innerHeight - 200; // 헤더와 하단 여백 고려
      
      const scaleX = viewportWidth / frameSize.width;
      const scaleY = viewportHeight / frameSize.height;
      const autoScale = Math.min(scaleX, scaleY, 1) * 100;
      
      // 화면에 맞게 자동 조절 (80% 고정)
      setZoom(80);
    }
  }, [mode, isOpen]);
  
  if (!isOpen) return null;
  
  const frameSize = frameSizes[mode];
  const scale = zoom / 100;
  
  // 새 창으로 열기
  const openInNewWindow = () => {
    const width = frameSize.width;
    const height = frameSize.height;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      window.location.href,
      `preview_${mode}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,status=no`
    );
    
    onClose();
  };
  
  return createPortal(
    <div className="fixed inset-0 bg-black/90 z-[999999] flex flex-col">
      {/* 헤더 */}
      <div className="bg-gray-900 dark:bg-coal-800 px-3 py-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-medium text-xs">반응형 미리보기</h2>
          <div className="flex gap-1">
            {/* 모바일 버튼 */}
            <button
              onClick={() => setMode('mobile')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors text-xs ${
                mode === 'mobile'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <KeenIcon icon="mobile" className="text-xs" />
              <span className="text-xs">모바일</span>
            </button>
            
            {/* 태블릿 버튼 */}
            <button
              onClick={() => setMode('tablet')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors text-xs ${
                mode === 'tablet'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <KeenIcon icon="tablet" className="text-xs" />
              <span className="text-xs">태블릿</span>
            </button>
            
            {/* 데스크톱 버튼 */}
            <button
              onClick={() => setMode('desktop')}
              className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors text-xs ${
                mode === 'desktop'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <KeenIcon icon="monitor" className="text-xs" />
              <span className="text-xs">데스크톱</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 새 창으로 열기 버튼 */}
          <button
            onClick={openInNewWindow}
            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 transition-colors"
          >
            <KeenIcon icon="external-link" className="text-xs" />
            <span className="text-xs">새 창으로 열기</span>
          </button>
          
          {/* 줌 컨트롤 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(Math.max(25, zoom - 10))}
              className="p-0.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              disabled={zoom <= 25}
            >
              <KeenIcon icon="minus-circle" className="text-xs" />
            </button>
            <span className="text-xs text-gray-300 min-w-[40px] text-center">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-0.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              disabled={zoom >= 200}
            >
              <KeenIcon icon="plus-circle" className="text-xs" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="px-1 py-0.5 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              100%
            </button>
          </div>
          
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="닫기 (ESC)"
          >
            <KeenIcon icon="cross" className="text-xs" />
          </button>
        </div>
      </div>
      
      {/* 프레임 영역 */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        <div
          className="bg-white shadow-2xl relative"
          style={{
            width: `${frameSize.width}px`,
            height: `${frameSize.height}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center',
          }}
        >
          {!error ? (
            <iframe
              src={window.location.href}
              className="w-full h-full"
              title="Responsive Preview"
              style={{
                border: 'none',
                width: '100%',
                height: '100%'
              }}
              onError={() => setError(true)}
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center p-8">
                <KeenIcon icon="warning" className="text-4xl text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">iframe 로드 실패</p>
                <button
                  onClick={openInNewWindow}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  새 창으로 열기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 크기 표시 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-coal-800 px-3 py-1.5 rounded-lg">
        <span className="text-white text-sm">
          {frameSize.label}: {frameSize.width} × {frameSize.height}
          {zoom !== 100 && ` (${zoom}%)`}
        </span>
      </div>
    </div>,
    document.body
  );
};