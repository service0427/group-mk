import React from 'react';
import { useToast } from '@/providers';

/**
 * Example component showing how to use the custom toast component
 */
const CustomToastExample: React.FC = () => {
  const toast = useToast();

  return (
    <div className="p-6 bg-card shadow-sm rounded-lg border border-border">
      <h2 className="text-xl font-semibold mb-4">Custom Toast Examples</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          className="btn btn-success"
          onClick={() => toast.success('성공적으로 처리되었습니다.')}
        >
          Success Toast
        </button>
        
        <button
          className="btn btn-danger"
          onClick={() => toast.error('처리 중 오류가 발생했습니다.')}
        >
          Error Toast
        </button>
        
        <button
          className="btn btn-info"
          onClick={() => toast.info('작업이 진행 중입니다.')}
        >
          Info Toast
        </button>
        
        <button
          className="btn btn-warning"
          onClick={() => toast.warning('주의가 필요한 작업입니다.')}
        >
          Warning Toast
        </button>
        
        <button
          className="btn btn-primary"
          onClick={() => 
            toast.success('상단 왼쪽에 표시됩니다.', { position: 'top-left' })
          }
        >
          Top Left Position
        </button>
        
        <button
          className="btn btn-primary"
          onClick={() => 
            toast.success('상단 오른쪽에 표시됩니다.', { position: 'top-right' })
          }
        >
          Top Right Position
        </button>
        
        <button
          className="btn btn-primary"
          onClick={() => 
            toast.success('하단 왼쪽에 표시됩니다.', { position: 'bottom-left' })
          }
        >
          Bottom Left Position
        </button>
        
        <button
          className="btn btn-primary"
          onClick={() => 
            toast.success('하단 오른쪽에 표시됩니다.', { position: 'bottom-right' })
          }
        >
          Bottom Right Position
        </button>
        
        <button
          className="btn btn-secondary col-span-2"
          onClick={() => 
            toast.success('10초 동안 표시됩니다.', { duration: 10000 })
          }
        >
          Long Duration (10s)
        </button>
        
        <button
          className="btn btn-secondary col-span-2"
          onClick={() => 
            toast.success('1초 동안 표시됩니다.', { duration: 1000 })
          }
        >
          Short Duration (1s)
        </button>
      </div>
    </div>
  );
};

export default CustomToastExample;