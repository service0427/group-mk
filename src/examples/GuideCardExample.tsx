import React, { useState } from 'react';
import { GuideCard } from '@/components/notice';

const GuideCardExample: React.FC = () => {
  const [showInfoGuide, setShowInfoGuide] = useState(true);
  const [showWarningGuide, setShowWarningGuide] = useState(true);
  const [showSuccessGuide, setShowSuccessGuide] = useState(true);
  const [showDangerGuide, setShowDangerGuide] = useState(true);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4">안내 카드 예제</h2>
      
      {showInfoGuide && (
        <GuideCard
          variant="info"
          title="정보 안내"
          description="이 페이지에서는 다양한 정보를 확인할 수 있습니다."
          icon="info"
          onClose={() => setShowInfoGuide(false)}
        />
      )}
      
      {showWarningGuide && (
        <GuideCard
          variant="warning"
          title="주의 사항"
          description="서비스 이용 시 주의사항을 확인해 주세요."
          icon="shield-warning"
          onClose={() => setShowWarningGuide(false)}
        />
      )}
      
      {showSuccessGuide && (
        <GuideCard
          variant="success"
          title="작업 완료"
          description="모든 작업이 성공적으로 완료되었습니다."
          icon="check-circle"
          onClose={() => setShowSuccessGuide(false)}
        />
      )}
      
      {showDangerGuide && (
        <GuideCard
          variant="danger"
          title="오류 발생"
          description="작업 중 문제가 발생했습니다. 다시 시도해 주세요."
          icon="warning"
          onClose={() => setShowDangerGuide(false)}
        />
      )}
      
      <div className="pt-4">
        <h3 className="text-lg font-semibold mb-2">사용 방법</h3>
        <p>안내 카드는 다양한 스타일로 사용할 수 있으며, 페이지 상단에 중요 정보를 표시하는 데 적합합니다.</p>
        
        <div className="mt-4 space-y-2">
          <button 
            className="btn btn-primary btn-sm mr-2"
            onClick={() => setShowInfoGuide(true)}
            disabled={showInfoGuide}
          >
            정보 카드 표시
          </button>
          
          <button 
            className="btn btn-warning btn-sm mr-2"
            onClick={() => setShowWarningGuide(true)}
            disabled={showWarningGuide}
          >
            주의사항 카드 표시
          </button>
          
          <button 
            className="btn btn-success btn-sm mr-2"
            onClick={() => setShowSuccessGuide(true)}
            disabled={showSuccessGuide}
          >
            성공 카드 표시
          </button>
          
          <button 
            className="btn btn-danger btn-sm"
            onClick={() => setShowDangerGuide(true)}
            disabled={showDangerGuide}
          >
            오류 카드 표시
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuideCardExample;