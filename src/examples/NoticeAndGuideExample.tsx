import React, { useState } from 'react';
import { GuideCard } from '@/components/notice';
import { CommonTemplate } from '@/components/pageTemplate';
import { Button } from '@/components/ui/button';

const NoticeAndGuideExample: React.FC = () => {
  const [showGuide, setShowGuide] = useState(true);
  const [guideVariant, setGuideVariant] = useState<'info' | 'warning' | 'success' | 'danger'>('info');
  
  return (
    <CommonTemplate
      title="안내 카드 예제"
      description="페이지 하단에 표시되는 안내 카드 예제입니다."
    >
      <div className="space-y-6 p-4">
        <div className="p-6 bg-white dark:bg-coal-600 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">안내 컴포넌트 예제</h2>
          <p className="mb-4">
            이 페이지는 안내 카드 컴포넌트의 사용법을 보여줍니다.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* 안내 카드 제어 */}
            <div className="border p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">안내 카드 설정</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-medium">표시 여부</label>
                  <Button 
                    variant={showGuide ? "destructive" : "default"}
                    onClick={() => setShowGuide(!showGuide)}
                  >
                    {showGuide ? "숨기기" : "표시하기"}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <label className="font-medium block">스타일 변경</label>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      className={guideVariant === 'info' ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                      onClick={() => setGuideVariant('info')}
                    >
                      정보
                    </Button>
                    <Button 
                      variant="outline" 
                      className={guideVariant === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' : ''}
                      onClick={() => setGuideVariant('warning')}
                    >
                      주의
                    </Button>
                    <Button 
                      variant="outline" 
                      className={guideVariant === 'success' ? 'bg-green-100 dark:bg-green-900/30' : ''}
                      onClick={() => setGuideVariant('success')}
                    >
                      성공
                    </Button>
                    <Button 
                      variant="outline" 
                      className={guideVariant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : ''}
                      onClick={() => setGuideVariant('danger')}
                    >
                      위험
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 dark:bg-coal-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">사용 방법</h3>
            <pre className="bg-black/10 dark:bg-black/20 p-3 rounded overflow-auto text-sm">
{`<GuideCard
  variant="info"
  title="안내 제목"
  description="안내 내용을 이곳에 작성합니다"
  icon="abstract-26"
  onClose={() => handleClose()}
/>`}
            </pre>
          </div>
        </div>
        
        {/* 예제 안내 카드 */}
        {showGuide && (
          <div className="mt-4">
            <GuideCard
              variant={guideVariant}
              title="안내 사항"
              description="이 페이지는 안내 카드 컴포넌트의 사용 예제를 보여주는 페이지입니다."
              icon="abstract-26"
              onClose={() => setShowGuide(false)}
            />
          </div>
        )}
        
        {/* 추가 컨텐츠 - 스크롤 확인용 */}
        <div className="p-6 bg-white dark:bg-coal-600 rounded-lg shadow-sm">
          <h2 className="text-lg font-bold mb-3">스크롤 테스트</h2>
          <p className="mb-4">아래로 스크롤하면 페이지 컨텐츠가 충분히 길어집니다.</p>
          <div className="h-[400px] bg-gray-100 dark:bg-coal-800 rounded-lg flex items-center justify-center">
            스크롤 영역
          </div>
        </div>
      </div>
    </CommonTemplate>
  );
};

export default NoticeAndGuideExample;