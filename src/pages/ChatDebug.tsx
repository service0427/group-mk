import React, { useEffect } from 'react';
import { ChatSticky } from '@/components/chat';
import { useAuthContext } from '@/auth';

/**
 * 채팅 디버그 페이지
 * 
 * 이 페이지는 채팅 컴포넌트가 정상적으로 표시되는지 확인하기 위한 디버그 용도의 페이지입니다.
 */
const ChatDebug: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuthContext();
    
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">채팅 디버그 페이지</h1>
      <p className="mb-4">이 페이지는 채팅 컴포넌트의 테스트를 위한 페이지입니다.</p>
      <p className="mb-4">오른쪽 하단에 스티키 채팅 아이콘이 표시되어야 합니다.</p>
      <div className="p-4 bg-red-100 rounded-lg mb-4">
        <p className="text-red-700">
          스티키 채팅이 표시되지 않는다면 다음을 확인해보세요:
        </p>
        <ul className="list-disc ml-6 mt-2 text-red-700">
          <li>CSS가 제대로 로드되었는지 확인 (개발자 도구에서 .chat-icon-button 스타일 확인)</li>
          <li>ChatSticky 컴포넌트가 정상적으로 렌더링 되었는지 확인</li>
          <li>z-index 값이 다른 요소에 의해 가려지지 않는지 확인</li>
        </ul>
      </div>
      
      {/* 항상 표시되는 채팅 아이콘 */}
      <ChatSticky />
    </div>
  );
};

export default ChatDebug;