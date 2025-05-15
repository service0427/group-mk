/**
 * 채팅 기능 메인 컴포넌트
 * 
 * 이 컴포넌트는 채팅 아이콘, 채팅창, 채팅방 목록을 관리하고
 * 사용자와 운영자 간의 실시간 대화 기능을 제공합니다.
 * 
 * @author 장현 (jhjang)
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '@/auth';
import { useChat } from '@/hooks/useChat';
import { ChatIcon } from './ChatIcon';
import ChatWindow from './ChatWindow';
import ChatRoomList from './ChatRoomList';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components/keenicons';
import { useLogoutContext } from '@/contexts/LogoutContext';

interface ChatProps {
  open?: boolean;
  onClose?: () => void;
}

const Chat: React.FC<ChatProps> = ({ open: externalOpen, onClose: externalOnClose }) => {
  const { currentUser } = useAuthContext();
  const { isLoggingOut } = useLogoutContext();
  const [isOpen, setIsOpen] = useState(false);
  const [showRoomList, setShowRoomList] = useState(false);
  const [minimize, setMinimize] = useState(false);
  // 컴포넌트가 마운트된 상태인지 추적하는 ref
  const isMountedRef = useRef<boolean>(true);
  
  // 컴포넌트 마운트/언마운트 처리
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const {
    rooms,
    messages,
    currentRoomId,
    loading,
    loadingMessages,
    unreadCount,
    fetchChatRooms,
    fetchMessages,
    sendMessage,
    createChatRoom,
    openChatRoom,
    setCurrentRoomId
  } = useChat();
  
  // 채팅창 열기/닫기
  const handleToggleChat = async () => {
    // 로그아웃 중이면 채팅창 열지 않음
    if (isLoggingOut) return;
    
    if (!isOpen) {
      // 열 때는 최소화 상태 해제
      if (isMountedRef.current) {
        setMinimize(false);
      }
      
      // 상태에 따른 로직 처리
      if (currentUser?.role === 'admin') {
        // 관리자는 항상 채팅방 목록으로
        if (isMountedRef.current) {
          setShowRoomList(true);
        }
      } else {
        // 로그아웃 중이면 중단
        if (isLoggingOut) return;
        
        // 일반 사용자 - 항상 채팅방 목록 최신화
        await fetchChatRooms();
        
        // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
        if (isLoggingOut || !isMountedRef.current) return;
        
        // 현재 선택된 방이 있는지, 그리고 활성 상태인지 확인
        const currentRoom = currentRoomId ? rooms.find(room => room.id === currentRoomId) : null;
        
        if (currentRoom && currentRoom.status === 'active') {
          // 현재 선택된 방이 있고 활성 상태이면 그대로 사용
          if (isMountedRef.current) {
            setShowRoomList(false);
          }
        } else {
          // 다른 활성화된 방이 있는지 확인
          const activeRoom = rooms.find(room => room.status === 'active');
          
          if (activeRoom) {
            // 다른 활성화된 방이 있으면 그 방 선택
            handleSelectRoom(activeRoom.id);
          } else {
            // 활성화된 방이 없어도 채팅방은 생성하지 않고 빈 채팅창만 표시
            if (isMountedRef.current) {
              setShowRoomList(false);
            }
          }
        }
      }
    }
    
    // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
    if (isMountedRef.current) {
      setIsOpen(!isOpen);
    }
    
    if (externalOnClose && isOpen) {
      externalOnClose();
    }
  };
  
  // 채팅방 최소화/복원
  const handleMinimize = () => {
    // 로그아웃 중이면 처리하지 않음
    if (isLoggingOut) return;
    
    // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
    if (isMountedRef.current) {
      setMinimize(!minimize);
    }
  };
  
  // 채팅방 선택 (먼저 정의)
  const handleSelectRoom = useCallback(async (roomId: string) => {
    // 로그아웃 중이면 처리하지 않음
    if (isLoggingOut) return;
    
    // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
    if (isMountedRef.current) {
      setShowRoomList(false);
    }
    
    await openChatRoom(roomId);
    
    // 로그아웃 중이거나 컴포넌트가 언마운트되었는지 다시 확인
    if (isLoggingOut || !isMountedRef.current) return;
  }, [openChatRoom, isLoggingOut]);
  
  // 채팅방 생성
  const handleCreateChatRoom = useCallback(async () => {
    // 로그아웃 중이면 처리하지 않음
    if (isLoggingOut) return;
    
    // 관리자 계정은 채팅방 생성이 필요없이 목록만 표시
    if (currentUser?.role === 'admin') {
      // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
      if (isMountedRef.current) {
        setShowRoomList(true);
      }
      return;
    }
    
    try {
      // 항상 새 채팅방 생성
      const newRoomId = await createChatRoom([], '운영자와의 대화');
      
      // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
      if (isLoggingOut || !isMountedRef.current) return;
      
      if (newRoomId) {
        handleSelectRoom(newRoomId);
      }
    } catch (error) {
      // 오류 처리 - 로그아웃 중이면 무시
      if (isLoggingOut || !isMountedRef.current) return;
    }
  }, [currentUser?.role, createChatRoom, handleSelectRoom, isLoggingOut]);
  
  // 채팅방 목록으로 돌아가기
  const handleBackToList = () => {
    // 로그아웃 중이면 처리하지 않음
    if (isLoggingOut) return;
    
    // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
    if (isMountedRef.current) {
      setCurrentRoomId(null);
      setShowRoomList(true);
    }
  };
  
  // 메시지 전송
  const handleSendMessage = async (content: string) => {
    // 로그아웃 중이면 처리하지 않음
    if (isLoggingOut) return;
    
    if (!currentRoomId) {
      // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
      if (isLoggingOut || !isMountedRef.current) return;
      
      // 채팅방이 없는 경우 새 채팅방 생성 (일반 사용자만)
      if (currentUser?.role !== 'admin') {
        // 메시지 전송 시점에 채팅방 생성
        const newRoomId = await createChatRoom([], '운영자와의 대화');
        
        // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
        if (isLoggingOut || !isMountedRef.current) return;
        
        if (newRoomId) {
          // 새 채팅방 생성 후 메시지 전송
          await handleSelectRoom(newRoomId);
          
          // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
          if (isLoggingOut || !isMountedRef.current) return;
          
          // 약간의 지연 후 메시지 전송 (채팅방 선택이 완료되도록)
          setTimeout(() => {
            // 타임아웃 내에서 로그아웃 상태 다시 확인
            if (isLoggingOut || !isMountedRef.current) return;
            sendMessage(newRoomId, content);
          }, 300);
        }
      }
      return;
    }
    
    // 채팅방이 활성 상태인지 확인 (실시간으로 최신 상태 가져오기)
    await fetchChatRooms(); // 최신 상태 업데이트
    
    // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
    if (isLoggingOut || !isMountedRef.current) return;
    
    const currentRoom = rooms.find(room => room.id === currentRoomId);
    if (!currentRoom || currentRoom.status !== 'active') {
      // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
      if (isLoggingOut || !isMountedRef.current) return;
      
      // 비활성 방인 경우 새 채팅방 생성 (일반 사용자만)
      if (currentUser?.role !== 'admin') {
        const newRoomId = await createChatRoom([], '운영자와의 대화');
        
        // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
        if (isLoggingOut || !isMountedRef.current) return;
        
        if (newRoomId) {
          // 새 채팅방 생성 후 메시지 전송
          await handleSelectRoom(newRoomId);
          
          // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
          if (isLoggingOut || !isMountedRef.current) return;
          
          // 약간의 지연 후 메시지 전송 (채팅방 선택이 완료되도록)
          setTimeout(() => {
            // 타임아웃 내에서 로그아웃 상태 다시 확인
            if (isLoggingOut || !isMountedRef.current) return;
            sendMessage(newRoomId, content);
          }, 300);
        }
      }
      return;
    }
    
    // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
    if (isLoggingOut || !isMountedRef.current) return;
    
    // 모든 검증을 통과한 경우에만 메시지 전송
    const result = await sendMessage(currentRoomId, content);
    
    // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
    if (isLoggingOut || !isMountedRef.current) return;
    
    if (!result) {
      // 메시지 전송 실패 시 채팅방 목록 갱신
      await fetchChatRooms();
    }
  };
  
  // 외부에서 열기/닫기 제어
  useEffect(() => {
    // 로그아웃 중이면 처리하지 않음
    if (isLoggingOut) return;
    
    if (externalOpen !== undefined && isMountedRef.current) {
      setIsOpen(externalOpen);
    }
  }, [externalOpen, isLoggingOut]);
  
  // 컴포넌트 마운트시 채팅방 목록 가져오기 및 적절한 채팅방 관리
  useEffect(() => {
    // 로그아웃 중이면 초기화하지 않음
    if (isLoggingOut) return;
    
    const initializeChat = async () => {
      // 로그아웃 중이거나 사용자가 없으면 중단
      if (isLoggingOut || !currentUser?.id) return;
      
      try {
        // 채팅방 목록 가져오기
        await fetchChatRooms();
        
        // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
        if (isLoggingOut || !isMountedRef.current) return;
        
        // 일반 사용자이고 채팅창이 열려있을 때만 추가 처리
        if (isOpen && currentUser?.role !== 'admin') {
          // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
          if (isLoggingOut || !isMountedRef.current) return;
          
          // 1. 현재 선택된 방이 있고 활성 상태인지 확인
          const currentRoom = currentRoomId ? rooms.find(room => room.id === currentRoomId) : null;
          
          if (currentRoom && currentRoom.status === 'active' && currentRoomId) {
            // 현재 선택된 방이 있고 활성 상태이면 그대로 사용
            await handleSelectRoom(currentRoomId);
            
            // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
            if (isLoggingOut || !isMountedRef.current) return;
            
            return;
          }
          
          // 2. 현재 선택된 방이 없거나 비활성 상태라면
          // 다른 활성화된 방이 있는지 확인
          const activeRoom = rooms.find(room => room.status === 'active');
          
          if (activeRoom) {
            // 활성화된 방이 있으면 그 방을 선택
            await handleSelectRoom(activeRoom.id);
            
            // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
            if (isLoggingOut || !isMountedRef.current) return;
          }
          // 활성화된 방이 없어도 자동으로 채팅방을 생성하지 않음
        }
      } catch (error) {
        // 오류 처리 - 로그아웃 중이거나 컴포넌트가 언마운트되었으면 무시
        if (isLoggingOut || !isMountedRef.current) return;
      }
    };
    
    initializeChat();
  }, [currentUser?.id, isOpen, fetchChatRooms, handleSelectRoom, currentRoomId, rooms, isLoggingOut]);
  
  // 현재 채팅방에 따라 메시지 가져오기
  useEffect(() => {
    // 로그아웃 중이면 메시지를 가져오지 않음
    if (isLoggingOut) return;
    
    if (currentRoomId) {
      fetchMessages(currentRoomId);
    }
  }, [currentRoomId, fetchMessages, isLoggingOut]);
  
  // 현재 선택된 채팅방의 메시지
  const currentRoomMessages = (currentRoomId && messages[currentRoomId]) || [];
  const currentRoom = rooms.find(room => room.id === currentRoomId) || null;
  
  // 로그아웃 중이면 컴포넌트를 렌더링하지 않음
  if (isLoggingOut) {
    return null;
  }
  
  return (
    <>
      {/* 채팅 아이콘 */}
      <ChatIcon
        unreadCount={unreadCount}
        onClick={handleToggleChat}
      />
      
      {/* 채팅창 */}
      {isOpen && (
        <>
          {/* 채팅방 목록 모달 */}
          {showRoomList && (
            <Modal
              open={showRoomList}
              onClose={() => setShowRoomList(false)}
              className="z-50"
            >
              <ModalContent className="w-full max-w-md mx-auto">
                <ModalHeader>
                  <ModalTitle>대화 목록</ModalTitle>
                  <button
                    className="btn btn-icon btn-sm btn-light rounded-full"
                    onClick={() => setShowRoomList(false)}
                  >
                    <KeenIcon icon="cross" />
                  </button>
                </ModalHeader>
                
                <ModalBody className="p-0 max-h-[60vh] overflow-y-auto">
                  <ChatRoomList
                    rooms={rooms}
                    currentRoomId={currentRoomId}
                    onSelectRoom={handleSelectRoom}
                    loading={loading}
                  />
                </ModalBody>
              </ModalContent>
            </Modal>
          )}
          
          {/* 채팅 창 - 선택된 채팅방이 있을 때 */}
          {!showRoomList && (
            <ChatWindow
              room={currentRoom}
              messages={currentRoomMessages}
              loading={loadingMessages}
              onClose={handleToggleChat}
              onSend={handleSendMessage}
              onMinimize={handleMinimize}
              minimize={minimize}
            />
          )}
          
          {/* 채팅방 목록 버튼 */}
          {!showRoomList && !minimize && rooms.length > 1 && (
            <button
              className="fixed bottom-20 right-[26rem] z-40 btn btn-icon btn-primary rounded-full shadow-md"
              onClick={handleBackToList}
              aria-label="채팅방 목록"
            >
              <KeenIcon icon="arrow-left" />
            </button>
          )}
          
          {/* 최소화된 상태일 때 표시할 작은 아이콘 */}
          {minimize && (
            <div
              className="fixed bottom-20 right-20 z-40 bg-primary text-white rounded-full p-2 shadow-md cursor-pointer"
              onClick={handleMinimize}
            >
              <div className="relative">
                <KeenIcon icon="chat-message" className="text-lg" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1 min-w-[16px] h-[16px] flex items-center justify-center text-xs font-medium">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Chat;