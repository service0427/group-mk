import React, { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '@/auth';
import { supabase } from '@/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useChat } from '@/hooks/useChat';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { USER_ROLES, PERMISSION_GROUPS, hasPermission } from '@/config/roles.config';

// 데이터베이스 진단 결과 인터페이스
interface DiagnosticResult {
  success: boolean;
  authOk: boolean;
  tablesExist: boolean;
  errorMessage?: string;
  details?: any;
}

// Supabase 데이터베이스 연결 진단 함수
const diagnoseDatabaseConnection = async (): Promise<DiagnosticResult> => {
  const result: DiagnosticResult = {
    success: false,
    authOk: false,
    tablesExist: false
  };
  
  try {
    // 1. 인증 상태 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      result.errorMessage = '인증 세션을 가져올 수 없습니다: ' + (authError?.message || '세션 없음');
      return result;
    }
    
    result.authOk = true;
    
    // 2. 테이블 존재 여부 확인
    try {
      // chat_rooms 테이블 확인
      const { count: roomsCount, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*', { count: 'exact', head: true });
        
      if (roomsError) {
        if (roomsError.code === 'PGRST116') { // 테이블이 존재하지 않음
          result.errorMessage = 'chat_rooms 테이블이 존재하지 않습니다. SQL 스크립트를 실행해주세요.';
        } else {
          result.errorMessage = 'chat_rooms 테이블 접근 오류: ' + roomsError.message;
        }
        result.details = roomsError;
        return result;
      }
      
      // chat_messages 테이블 확인
      const { count: messagesCount, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true });
        
      if (messagesError) {
        if (messagesError.code === 'PGRST116') { // 테이블이 존재하지 않음
          result.errorMessage = 'chat_messages 테이블이 존재하지 않습니다. SQL 스크립트를 실행해주세요.';
        } else {
          result.errorMessage = 'chat_messages 테이블 접근 오류: ' + messagesError.message;
        }
        result.details = messagesError;
        return result;
      }
      
      // chat_participants 테이블 확인
      const { count: participantsCount, error: participantsError } = await supabase
        .from('chat_participants')
        .select('*', { count: 'exact', head: true });
        
      if (participantsError) {
        if (participantsError.code === 'PGRST116') { // 테이블이 존재하지 않음
          result.errorMessage = 'chat_participants 테이블이 존재하지 않습니다. SQL 스크립트를 실행해주세요.';
        } else {
          result.errorMessage = 'chat_participants 테이블 접근 오류: ' + participantsError.message;
        }
        result.details = participantsError;
        return result;
      }
      
      // 모든 테이블이 존재함
      result.tablesExist = true;
      result.success = true;
      result.details = {
        roomsCount,
        messagesCount,
        participantsCount
      };
      
      return result;
    } catch (dbError: any) {
      result.errorMessage = '데이터베이스 테이블 확인 중 오류 발생: ' + dbError.message;
      result.details = dbError;
      return result;
    }
  } catch (error: any) {
    result.errorMessage = '진단 과정에서 예상치 못한 오류 발생: ' + error.message;
    result.details = error;
    return result;
  }
};

/**
 * 스티키 채팅 아이콘 컴포넌트
 * 
 * 이 컴포넌트는 일반 사용자에게만 표시되는 채팅 아이콘입니다.
 * 관리자나 운영자에게는 표시되지 않습니다.
 * 사용자와 운영자 간의 실시간 채팅을 제공합니다.
 */
const ChatSticky: React.FC = () => {
  // 먼저 인증 정보를 확인하여 렌더링 여부를 결정
  const { isAuthenticated, currentUser } = useAuthContext();
  
  // 운영자나 관리자는 이 컴포넌트를 렌더링하지 않음
  // 이렇게 하면 불필요한 훅 호출과 상태 업데이트 방지
  if (isAuthenticated && currentUser?.role &&
      hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN)) {
    return null;
  }
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 모바일 미디어 쿼리 사용
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // 직접 가시성 상태 관리
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  
  // useChat 훅 사용 - 항상 호출해야 함 (조건부로 사용하면 안됨)
  // React 훅 규칙: 항상 동일한 순서로 호출되어야 함
  const {
    rooms,
    messages,
    currentRoomId,
    loading,
    loadingMessages,
    unreadCount,
    fetchChatRooms,
    fetchMessages,
    sendMessage: sendChatMessage,
    createChatRoom,
    openChatRoom,
    setCurrentRoomId
  } = useChat();
  // 대상 사용자 체크는 이미 상단에서 완료했으므로 여기서는 제거
  
  // 스크롤 위치에 따라 버튼 표시 여부 결정
  useEffect(() => {
    // 초기 렌더링 시 항상 보이도록 강제 설정
    setIsVisible(true);
    
    // 모바일이 아닌 경우 스크롤 이벤트 감시하지 않음
    if (!isMobile) {
      return;
    }
    
    // SPA에서 실제 스크롤되는 요소 찾기
    const mainContentElement = document.querySelector('main[role="content"]');
    const scrollElement = mainContentElement || window;
    
    // 초기 스크롤 위치 저장
    lastScrollYRef.current = scrollElement === window
      ? window.scrollY
      : (mainContentElement?.scrollTop || 0);
    
    // 스크롤 핸들러 함수
    function handleScroll() {
      // 현재 스크롤 위치 (메인 콘텐츠 또는 윈도우)
      const currentScrollY = scrollElement === window
        ? window.scrollY
        : (mainContentElement?.scrollTop || 0);
      
      // 이전 스크롤 위치
      const prevScrollY = lastScrollYRef.current;
      
      // 스크롤 방향 (true: 위로, false: 아래로)
      const isScrollingUp = currentScrollY < prevScrollY;
      
      // 화면 상단에 있는지 여부
      const isAtTop = currentScrollY < 100;
      
      // 화면 하단에 있는지 여부
      let isAtBottom = false;
      
      if (scrollElement === window) {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        isAtBottom = windowHeight + currentScrollY >= documentHeight - 100;
      } else if (mainContentElement) {
        const containerHeight = mainContentElement.clientHeight;
        const scrollHeight = mainContentElement.scrollHeight;
        isAtBottom = containerHeight + currentScrollY >= scrollHeight - 100;
      }
      
      // 버튼 표시 여부 결정 로직
      if (isScrollingUp || isAtTop || isAtBottom) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      // 현재 스크롤 위치를 이전 위치로 저장
      lastScrollYRef.current = currentScrollY;
    }
    
    // 스크롤 이벤트 리스너 등록
    scrollElement.addEventListener('scroll', handleScroll);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile]);
  
  // 스타일 값을 직접 지정
  // 모바일 여부에 따라 동적으로 스타일을 적용
  // 오른쪽에서 왼쪽으로 슬라이딩 효과를 위한 CSS 설정
  const rightPosition = isVisible ? '24px' : '-100px';
  const opacityValue = isVisible ? 1 : 0;
  
  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '60px',  // 푸터 위로 위치 조정 (60px로 낮춤)
    right: rightPosition,
    zIndex: 999, // 모달보다 낮은 z-index
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#4285F4',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    border: 'none',
    // 애니메이션 직접 적용 (오른쪽으로 사라지고 오른쪽에서 나타나는 효과)
    transition: 'right 0.3s ease-out, opacity 0.3s ease-out',
    animation: isVisible ? '2s ease-in-out infinite alternate none running customPulse' : 'none',
    // 투명도 직접 제어
    opacity: opacityValue,
    // 숨김 상태에서 마우스 이벤트 차단
    pointerEvents: !isVisible ? 'none' : 'auto',
  };
  
  // CSS 키프레임을 JS에서 생성하여 삽입
  useEffect(() => {
    // 기존 스타일이 있으면 제거
    const existingStyle = document.getElementById('chat-sticky-keyframes');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // 새로운 스타일 추가
    const styleEl = document.createElement('style');
    styleEl.id = 'chat-sticky-keyframes';
    styleEl.textContent = `
      @keyframes customPulse {
        0% { transform: scale(1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
        50% { transform: scale(1.05); box-shadow: 0 8px 24px rgba(66, 133, 244, 0.5); }
        100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      styleEl.remove();
    };
  }, []);
  
  // 메시지가 추가되면 스크롤을 아래로 이동
  useEffect(() => {
    if (messagesEndRef.current && currentRoomId && messages[currentRoomId]?.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentRoomId]);
  
  // 채팅방 초기화
  const initializeChat = async () => {
    if (!currentUser?.id) {
      setError('로그인이 필요합니다.');
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // 인증 토큰 확인
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('인증 세션이 없습니다. 다시 로그인해 주세요.');
      }
      
      // 채팅방 목록 가져오기
      await fetchChatRooms();
      
      // 현재 사용자가 관리자인지 확인
      if (currentUser?.role && hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN)) {
        // 관리자는 채팅방 목록이 있으면 첫 번째 채팅방 선택
        if (rooms.length > 0) {
          await openChatRoom(rooms[0].id);
          return rooms[0].id;
        }
        return null;
      }
      
      // 일반 사용자의 경우 기존 채팅방이 있으면 사용하고 없으면 새로 생성하지 않음
      // 실제 메시지 전송 시점에 채팅방 생성
      if (rooms.length > 0) {
        // 활성 상태인 채팅방이 있는지 확인
        const activeRoom = rooms.find(room => room.status === 'active');
        if (activeRoom) {
          await openChatRoom(activeRoom.id);
          return activeRoom.id;
        }
      }
      
      // 채팅방이 없거나 모두 비활성 상태인 경우에도 새로 생성하지 않음
      // 메시지를 보낼 때 생성할 예정
      return null;
    } catch (err: any) {
      
      setError(err.message || '채팅 초기화 중 오류가 발생했습니다.');
      
      // 데이터베이스 진단 실행
      try {
        const diagnostics = await diagnoseDatabaseConnection();
        setDiagnosticResult(diagnostics);
        
        if (!diagnostics.success) {
          // 진단 결과에 따라 보다 구체적인 오류 메시지 설정
          if (!diagnostics.authOk) {
            setError('인증 오류: ' + diagnostics.errorMessage);
          } else if (!diagnostics.tablesExist) {
            setError('데이터베이스 테이블 오류: ' + diagnostics.errorMessage);
          } else {
            setError(diagnostics.errorMessage || '알 수 없는 오류');
          }
        }
      } catch (diagError) {
        
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // 채팅창 열기/닫기
  const handleToggleChat = async () => {
    if (!isOpen) {
      // 열 때 채팅방 초기화
      if (isAuthenticated && currentUser) {
        await initializeChat();
      } else {
        setError('로그인이 필요합니다. 먼저 로그인해 주세요.');
      }
    } else {
      setCurrentRoomId(null);
    }
    
    setIsOpen(!isOpen);
  };
  
  // 메시지 보내기
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser) return;
    
    try {
      if (!currentRoomId) {
        const newRoomId = await createChatRoom([], '운영자와의 대화');
        if (newRoomId) {
          await openChatRoom(newRoomId);
          await sendChatMessage(newRoomId, inputValue.trim());
          setInputValue('');
        }
        return;
      }
      
      // 채팅방 상태 확인을 위해 최신 데이터 가져오기
      await fetchChatRooms();
      
      // 채팅방 상태 확인
      const currentRoom = rooms.find(room => room.id === currentRoomId);
      
      if (!currentRoom || currentRoom.status !== 'active') {
        // 일반 사용자만 새 채팅방 생성
        if (currentUser?.role && !hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN)) {
          const newRoomId = await createChatRoom([], '운영자와의 대화');
          if (newRoomId) {
            await openChatRoom(newRoomId);
            await sendChatMessage(newRoomId, inputValue.trim());
            setInputValue('');
          }
        } else {
          setError('종료되거나 보관된 채팅방에는 메시지를 보낼 수 없습니다.');
        }
        return;
      }
      
      // 활성 상태 채팅방에 메시지 전송
      const result = await sendChatMessage(currentRoomId, inputValue.trim());
      if (result) {
        setInputValue('');
      } else {
        // 메시지 전송 실패 시 새 채팅방 생성 시도
        if (currentUser?.role && !hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN)) {
          const newRoomId = await createChatRoom([], '운영자와의 대화');
          if (newRoomId) {
            await openChatRoom(newRoomId);
            await sendChatMessage(newRoomId, inputValue.trim());
            setInputValue('');
          }
        }
      }
    } catch (err: any) {
      
      setError(err.message || '메시지 전송 중 오류가 발생했습니다.');
    }
  };
  
  // 수동으로 진단 실행 함수
  const runDiagnostics = async () => {
    setIsLoading(true);
    setShowDiagnostic(true);
    
    try {
      const result = await diagnoseDatabaseConnection();
      setDiagnosticResult(result);
      
      if (result.success) {
        setError('진단 결과: 데이터베이스 연결 및 테이블이 정상입니다.');
      } else {
        setError(result.errorMessage || '알 수 없는 오류');
      }
    } catch (err: any) {
      
      setError('진단 오류: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 현재 채팅방 메시지 가져오기
  const currentMessages = currentRoomId ? messages[currentRoomId] || [] : [];
  
  // 현재 채팅방 정보 가져오기
  const currentRoom = currentRoomId ? rooms.find(room => room.id === currentRoomId) : null;
  
  return (
    <>
      <button 
        style={buttonStyle}
        onClick={handleToggleChat}
        aria-label="운영자와 채팅"
      >
        {/* SVG 아이콘 직접 사용 - 더 큰 크기와 명확한 색상 */}
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#ffffff" />
          <path d="M8 10h8M8 14h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
{/* 안 읽은 메시지 카운트 표시 제거 */}
      </button>
      
      {isOpen && isAuthenticated && (
        <div className="chat-container" style={{ 
          position: 'fixed', 
          bottom: '120px', 
          right: '24px', 
          zIndex: 1001, // 버튼보다는 높지만 모달보다는 낮게 설정
          width: '350px', 
          height: '500px',
          maxHeight: '80vh',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 헤더 */}
          <div style={{ 
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#4285F4',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.1)'
          }}>
            <span style={{ fontWeight: 'bold' }}>
              {currentRoom?.name || '운영자와의 채팅'}
            </span>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '20px',
                lineHeight: '20px'
              }}
            >
              &times;
            </button>
          </div>
          
          {/* 메시지 영역 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              backgroundColor: '#f5f5f5'
            }}
          >
            {(loading || loadingMessages) && currentMessages.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '100%',
                color: '#666'
              }}>
                메시지를 불러오는 중...
              </div>
            ) : currentMessages.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center',
                height: '100%',
                color: '#666',
                textAlign: 'center',
                fontSize: '13px'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                아직 대화 내용이 없습니다.<br/>
                문의사항을 남겨주시면 운영자가 답변드립니다.
              </div>
            ) : (
              currentMessages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    alignSelf: message.senderId === currentUser?.id ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    padding: '8px 10px',
                    borderRadius: message.senderId === currentUser?.id ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                    backgroundColor: message.senderRole === 'system' 
                      ? '#f0f0f0' 
                      : message.senderId === currentUser?.id 
                        ? '#4285F4' 
                        : 'white',
                    color: message.senderId === currentUser?.id ? 'white' : 'black',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    position: 'relative',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    margin: '2px 0'
                  }}
                >
                  {/* 발신자 이름 (시스템 메시지이거나 사용자 메시지가 아닌 경우에만 표시) */}
                  {message.senderId !== currentUser?.id && message.senderRole !== 'system' && (
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: 'bold',
                      marginBottom: '3px',
                      color: '#666'
                    }}>
                      {message.senderName}
                    </div>
                  )}
                  
                  {/* 메시지 내용 */}
                  <div style={{ fontSize: '13px' }}>{message.content}</div>
                  
                  {/* 메시지 시간 */}
                  <div 
                    style={{
                      fontSize: '9px',
                      color: message.senderId === currentUser?.id ? 'rgba(255,255,255,0.7)' : '#999',
                      marginTop: '3px',
                      textAlign: 'right'
                    }}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* 입력 영역 */}
          <div style={{
            borderTop: '1px solid #eee',
            padding: '12px',
            backgroundColor: 'white',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="메시지를 입력하세요..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={loading || loadingMessages}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                outline: 'none',
                fontSize: '13px'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || loadingMessages || !inputValue.trim()}
              style={{
                backgroundColor: '#4285F4',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                opacity: inputValue.trim() ? 1 : 0.6
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
          
          {/* 에러 메시지 */}
          {error && (
            <div style={{
              position: 'absolute',
              bottom: '60px',
              left: '12px',
              right: '12px',
              padding: '8px 12px',
              backgroundColor: '#f44336',
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px',
              zIndex: 9001
            }}>
              {error}
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <button
                  onClick={runDiagnostics}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '3px'
                  }}
                >
                  진단 실행
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    setShowDiagnostic(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: '11px'
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          )}
          
          {/* 진단 결과 모달 */}
          {showDiagnostic && diagnosticResult && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '300px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              padding: '16px',
              zIndex: 9002
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#333' }}>데이터베이스 진단 결과</h3>
              
              <div style={{ marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: diagnosticResult.authOk ? '#e8f5e9' : '#ffebee',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontWeight: 'bold' }}>
                    인증 상태: {diagnosticResult.authOk ? '정상' : '오류'}
                  </div>
                </div>
                
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: diagnosticResult.tablesExist ? '#e8f5e9' : '#ffebee',
                  borderRadius: '4px' 
                }}>
                  <div style={{ fontWeight: 'bold' }}>
                    데이터베이스 테이블: {diagnosticResult.tablesExist ? '정상' : '오류'}
                  </div>
                  {!diagnosticResult.tablesExist && (
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      원인: {diagnosticResult.errorMessage}
                    </div>
                  )}
                </div>
              </div>
              
              {diagnosticResult.success ? (
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: '#e8f5e9', 
                  color: '#2e7d32',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}>
                  모든 진단이 정상입니다. 그럼에도 문제가 발생한다면 권한 설정을 확인해주세요.
                </div>
              ) : (
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '16px' 
                }}>
                  <p style={{ margin: '0 0 8px' }}>
                    {diagnosticResult.errorMessage}
                  </p>
                  <p style={{ margin: '0', fontSize: '11px' }}>
                    Supabase 콘솔에서 chat_rooms, chat_messages, chat_participants 테이블을 확인하고 chat-schema.sql 스크립트를 실행했는지 확인해주세요.
                  </p>
                </div>
              )}
              
              <div style={{ textAlign: 'right' }}>
                <button 
                  onClick={() => setShowDiagnostic(false)} 
                  style={{
                    backgroundColor: '#f5f5f5',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    cursor: 'pointer'
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatSticky;