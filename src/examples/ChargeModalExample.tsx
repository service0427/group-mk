import React, { useState } from 'react';
import { ChargeModal } from '@/components/cash';
import { Button } from '@/components/ui/button';

export const ChargeModalExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">캐시 충전 모달 예제</h1>
      <p className="mb-4">아래 버튼을 클릭하여 캐시 충전 모달을 확인할 수 있습니다.</p>
      
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-green-500 hover:bg-green-600"
      >
        캐시 충전 모달 열기
      </Button>
      
      <ChargeModal 
        open={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </div>
  );
};

export default ChargeModalExample;