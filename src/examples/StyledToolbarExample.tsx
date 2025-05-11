import React from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { StyledToolbar } from '@/partials/toolbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/container';

export const StyledToolbarExample: React.FC = () => {
  return (
    <CommonTemplate
      title="기본 툴바 예제"
      description="기본 툴바 스타일 예제입니다."
      showPageMenu={false}
      toolbarActions={
        <>
          <Button 
            variant="outline"
          >
            기본 액션 버튼
          </Button>
        </>
      }
    >
      <Card className="p-5 mb-5">
        <h3 className="text-lg font-semibold mb-3">기본 툴바</h3>
        <p>
          위에 보이는 것이 기본 툴바 스타일입니다. 
        </p>
      </Card>

      {/* 스타일된 툴바 예제 */}
      <Container>
        <StyledToolbar
          title="스타일 툴바 예제"
          description="대시보드 스타일의 툴바를 사용하는 예제입니다."
          bgClass="bg-gradient-to-r from-blue-500 to-indigo-600"
          textClass="text-white"
          toolbarActions={
            <>
              <Button 
                variant="outline" 
                className="ml-2 bg-blue-600 text-white hover:bg-blue-700"
              >
                액션 버튼
              </Button>
            </>
          }
        />

        <Card className="p-5 mb-5">
          <h3 className="text-lg font-semibold mb-3">파란색 그라데이션</h3>
          <p>
            위에 보이는 것이 파란색 그라데이션 툴바 스타일입니다.
          </p>
        </Card>

        <StyledToolbar
          title="보라색 스타일"
          description="보라색 배경의 툴바 스타일입니다."
          bgClass="bg-purple-600"
          textClass="text-white"
          toolbarActions={
            <>
              <Button 
                variant="outline" 
                className="ml-2 bg-purple-600 text-white hover:bg-purple-700"
              >
                액션 버튼
              </Button>
            </>
          }
        />

        <Card className="p-5 mb-5">
          <h3 className="text-lg font-semibold mb-3">보라색 배경</h3>
          <p>
            위에 보이는 것이 보라색 배경 툴바 스타일입니다.
          </p>
        </Card>

        <StyledToolbar
          title="초록색 스타일"
          description="초록색 배경의 툴바 스타일입니다."
          bgClass="bg-green-600"
          textClass="text-white"
          toolbarActions={
            <>
              <Button 
                variant="outline" 
                className="ml-2 bg-green-600 text-white hover:bg-green-700"
              >
                액션 버튼
              </Button>
            </>
          }
        />

        <Card className="p-5">
          <h3 className="text-lg font-semibold mb-3">초록색 배경</h3>
          <p>
            위에 보이는 것이 초록색 배경 툴바 스타일입니다.
          </p>
        </Card>
      </Container>
    </CommonTemplate>
  );
};

export default StyledToolbarExample;