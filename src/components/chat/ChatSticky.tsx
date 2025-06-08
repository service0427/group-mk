import React, { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '@/auth';
import { supabase } from '@/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useChat } from '@/hooks/useChat';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUIVisibility } from '@/hooks/useUIVisibility';
import { USER_ROLES, PERMISSION_GROUPS, hasPermission } from '@/config/roles.config';
import { useLogoutContext } from '@/contexts/LogoutContext';

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
  const { isLoggingOut } = useLogoutContext();
  
  // 모든 상태 및 refs 정의
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const { isVisible } = useUIVisibility();
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef<boolean>(true);
  
  // Custom hooks
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // useChat hook
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
  
  // 컴포넌트 마운트/언마운트 관리
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  
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

  // 다크모드 전환 시 컴포넌트 강제 리렌더링
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    // 다크모드 전환 감지를 위한 MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && mutation.target === document.documentElement) {
          // 클래스 변경이 감지되면 컴포넌트 리렌더링
          forceUpdate({});
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      observer.disconnect();
    };
  }, []);
  
  // 메시지가 추가되면 스크롤을 아래로 이동
  useEffect(() => {
    if (messagesEndRef.current && currentRoomId && messages[currentRoomId]?.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentRoomId]);
  
  
  // 버튼 클래스 이름 동적 생성
  const buttonClassName = `chat-sticky-button ${isVisible ? 'visible' : 'hidden'}`;
  
  // 채팅방 초기화
  const initializeChat = async () => {
    if (!currentUser?.id || isLoggingOut) {
      setError('로그인이 필요합니다.');
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // 인증 토큰 확인
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || isLoggingOut) {
        throw new Error('인증 세션이 없습니다. 다시 로그인해 주세요.');
      }
      
      // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
      if (isLoggingOut || !isMountedRef.current) {
        return null;
      }
      
      // 채팅방 목록 가져오기
      await fetchChatRooms();
      
      // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
      if (isLoggingOut || !isMountedRef.current) {
        return null;
      }
      
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
      // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 에러 메시지 표시하지 않음
      if (isLoggingOut || !isMountedRef.current) {
        return null;
      }
      
      setError(err.message || '채팅 초기화 중 오류가 발생했습니다.');
      
      // 데이터베이스 진단 실행
      try {
        // 로그아웃 중이면 진단하지 않음
        if (isLoggingOut || !isMountedRef.current) {
          return null;
        }
        
        const diagnostics = await diagnoseDatabaseConnection();
        
        // 컴포넌트가 언마운트되었는지 다시 확인
        if (!isMountedRef.current) {
          return null;
        }
        
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
        // 진단 실패 시 무시
      }
      
      return null;
    } finally {
      // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };
  
  // 채팅창 열기/닫기
  const handleToggleChat = async () => {
    // 로그아웃 중이면 채팅창 열지 않음
    if (isLoggingOut) return;
    
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
    
    // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
    if (isMountedRef.current) {
      setIsOpen(!isOpen);
    }
  };
  
  // 메시지 보내기
  const handleSendMessage = async () => {
    // 로그아웃 중이거나 입력이 없거나 사용자가 없으면 중단
    if (isLoggingOut || !inputValue.trim() || !currentUser) return;
    
    try {
      if (!currentRoomId) {
        const newRoomId = await createChatRoom([], '운영자와의 대화');
        
        // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
        if (isLoggingOut || !isMountedRef.current) return;
        
        if (newRoomId) {
          await openChatRoom(newRoomId);
          await sendChatMessage(newRoomId, inputValue.trim());
          
          // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
          if (isMountedRef.current) {
            setInputValue('');
          }
        }
        return;
      }
      
      // 채팅방 상태 확인을 위해 최신 데이터 가져오기
      await fetchChatRooms();
      
      // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
      if (isLoggingOut || !isMountedRef.current) return;
      
      // 채팅방 상태 확인
      const currentRoom = rooms.find(room => room.id === currentRoomId);
      
      if (!currentRoom || currentRoom.status !== 'active') {
        // 일반 사용자만 새 채팅방 생성
        if (currentUser?.role && !hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN)) {
          const newRoomId = await createChatRoom([], '운영자와의 대화');
          
          // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
          if (isLoggingOut || !isMountedRef.current) return;
          
          if (newRoomId) {
            await openChatRoom(newRoomId);
            await sendChatMessage(newRoomId, inputValue.trim());
            
            // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
            if (isMountedRef.current) {
              setInputValue('');
            }
          }
        } else {
          // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
          if (isMountedRef.current) {
            setError('종료되거나 보관된 채팅방에는 메시지를 보낼 수 없습니다.');
          }
        }
        return;
      }
      
      // 활성 상태 채팅방에 메시지 전송
      const result = await sendChatMessage(currentRoomId, inputValue.trim());
      
      // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
      if (isLoggingOut || !isMountedRef.current) return;
      
      if (result) {
        // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
        if (isMountedRef.current) {
          setInputValue('');
        }
      } else {
        // 메시지 전송 실패 시 새 채팅방 생성 시도
        if (currentUser?.role && !hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN)) {
          const newRoomId = await createChatRoom([], '운영자와의 대화');
          
          // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
          if (isLoggingOut || !isMountedRef.current) return;
          
          if (newRoomId) {
            await openChatRoom(newRoomId);
            await sendChatMessage(newRoomId, inputValue.trim());
            
            // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
            if (isMountedRef.current) {
              setInputValue('');
            }
          }
        }
      }
    } catch (err: any) {
      // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 에러 메시지 표시하지 않음
      if (isLoggingOut || !isMountedRef.current) return;
      
      setError(err.message || '메시지 전송 중 오류가 발생했습니다.');
    }
  };
  
  // 수동으로 진단 실행 함수
  const runDiagnostics = async () => {
    // 로그아웃 중이면 진단하지 않음
    if (isLoggingOut) return;
    
    // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
    if (isMountedRef.current) {
      setIsLoading(true);
      setShowDiagnostic(true);
    }
    
    try {
      const result = await diagnoseDatabaseConnection();
      
      // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
      if (isLoggingOut || !isMountedRef.current) return;
      
      // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
      if (isMountedRef.current) {
        setDiagnosticResult(result);
        
        if (result.success) {
          setError('진단 결과: 데이터베이스 연결 및 테이블이 정상입니다.');
        } else {
          setError(result.errorMessage || '알 수 없는 오류');
        }
      }
    } catch (err: any) {
      // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 에러 메시지 표시하지 않음
      if (isLoggingOut || !isMountedRef.current) return;
      
      // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
      if (isMountedRef.current) {
        setError('진단 오류: ' + err.message);
      }
    } finally {
      // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };
  
  // 현재 채팅방 메시지 가져오기
  const currentMessages = currentRoomId ? messages[currentRoomId] || [] : [];
  
  // 현재 채팅방 정보 가져오기
  const currentRoom = currentRoomId ? rooms.find(room => room.id === currentRoomId) : null;
  
  // 로그아웃 중이거나 운영자/관리자인 경우 컴포넌트를 렌더링하지 않음
  if (isLoggingOut || (isAuthenticated && currentUser?.role &&
      hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN))) {
    return null;
  }

  return (
    <>
      <button 
        className={buttonClassName}
        onClick={handleToggleChat}
        aria-label="운영자와 채팅"
      >
        {/* SVG 아이콘 직접 사용 - 더 큰 크기와 명확한 색상 */}
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#ffffff" />
          <path d="M8 10h8M8 14h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      
      {isOpen && isAuthenticated && (
        <div className="chat-sticky-container">
          {/* 헤더 */}
          <div className="chat-sticky-header">
            <span className="chat-sticky-header-title">
              {currentRoom?.name || '운영자와의 채팅'}
            </span>
            <button 
              onClick={() => setIsOpen(false)}
              className="chat-sticky-header-close"
            >
              &times;
            </button>
          </div>
          
          {/* 메시지 영역 */}
          <div className="chat-sticky-messages">
            {(loading || loadingMessages) && currentMessages.length === 0 ? (
              <div className="chat-sticky-messages-loading">
                메시지를 불러오는 중...
              </div>
            ) : currentMessages.length === 0 ? (
              <div className="chat-sticky-messages-empty">
                <div className="chat-sticky-messages-empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                아직 대화 내용이 없습니다.<br/>
                문의사항을 남겨주시면 운영자가 답변드립니다.
              </div>
            ) : (
              currentMessages.map((message) => {
                const isMyMessage = message.senderId === currentUser?.id;
                const isSystemMessage = message.senderRole === 'system';
                const messageClasses = [
                  'chat-sticky-message',
                  isMyMessage && 'chat-sticky-message-mine',
                  !isMyMessage && !isSystemMessage && 'chat-sticky-message-other',
                  isSystemMessage && 'chat-sticky-message-system'
                ].filter(Boolean).join(' ');
                
                return (
                  <div
                    key={message.id}
                    className={messageClasses}
                  >
                    {/* 발신자 이름 (시스템 메시지이거나 사용자 메시지가 아닌 경우에만 표시) */}
                    {!isMyMessage && !isSystemMessage && (
                      <div className="chat-sticky-message-sender">
                        {message.senderName}
                      </div>
                    )}
                    
                    {/* 메시지 내용 */}
                    <div className="chat-sticky-message-content">{message.content}</div>
                    
                    {/* 메시지 시간 */}
                    <div className="chat-sticky-message-time">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* 입력 영역 */}
          <div className="chat-sticky-input-area">
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
              className="chat-sticky-input"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || loadingMessages || !inputValue.trim()}
              className="chat-sticky-send-button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
          
          {/* 에러 메시지 */}
          {error && (
            <div className="chat-sticky-error">
              {error}
              <div className="chat-sticky-error-buttons">
                <button
                  onClick={runDiagnostics}
                  className="chat-sticky-error-button"
                >
                  진단 실행
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    setShowDiagnostic(false);
                  }}
                  className="chat-sticky-error-close"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
          
          {/* 진단 결과 모달 */}
          {showDiagnostic && diagnosticResult && (
            <div className="chat-sticky-diagnostic">
              <h3 className="chat-sticky-diagnostic-title">데이터베이스 진단 결과</h3>
              
              <div className="chat-sticky-diagnostic-content">
                <div className={`chat-sticky-diagnostic-item ${diagnosticResult.authOk ? 'chat-sticky-diagnostic-item-success' : 'chat-sticky-diagnostic-item-error'}`}>
                  <div style={{ fontWeight: 'bold' }}>
                    인증 상태: {diagnosticResult.authOk ? '정상' : '오류'}
                  </div>
                </div>
                
                <div className={`chat-sticky-diagnostic-item ${diagnosticResult.tablesExist ? 'chat-sticky-diagnostic-item-success' : 'chat-sticky-diagnostic-item-error'}`}>
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
                <div className="chat-sticky-diagnostic-message chat-sticky-diagnostic-message-success">
                  모든 진단이 정상입니다. 그럼에도 문제가 발생한다면 권한 설정을 확인해주세요.
                </div>
              ) : (
                <div className="chat-sticky-diagnostic-message chat-sticky-diagnostic-message-error">
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
                  className="chat-sticky-diagnostic-close"
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