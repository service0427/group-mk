/**
 * 채팅 기능 메인 컴포넌트
 * 
 * 이 컴포넌트는 채팅 아이콘, 채팅창, 채팅방 목록을 관리하고
 * 사용자와 운영자 간의 실시간 대화 기능을 제공합니다.
 * 
 * @author 장현 (jhjang)
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/auth';
import { useChat } from '@/hooks/useChat';
import { ChatIcon } from './ChatIcon';
import ChatWindow from './ChatWindow';
import ChatRoomList from './ChatRoomList';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components/keenicons';

interface ChatProps {
  open?: boolean;
  onClose?: () => void;
}

const Chat: React.FC<ChatProps> = ({ open: externalOpen, onClose: externalOnClose }) => {
  const { currentUser } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [showRoomList, setShowRoomList] = useState(false);
  const [minimize, setMinimize] = useState(false);
  
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
    if (!isOpen) {
      // 열 때는 최소화 상태 해제
      setMinimize(false);
      
      // 상태에 따른 로직 처리
      if (currentUser?.role === 'admin') {
        // 관리자는 항상 채팅방 목록으로
        setShowRoomList(true);
      } else {
        // 일반 사용자 - 항상 채팅방 목록 최신화
        await fetchChatRooms();
        
        // 현재 선택된 방이 있는지, 그리고 활성 상태인지 확인
        const currentRoom = currentRoomId ? rooms.find(room => room.id === currentRoomId) : null;
        
        if (currentRoom && currentRoom.status === 'active') {
          // 현재 선택된 방이 있고 활성 상태이면 그대로 사용
          setShowRoomList(false);
        } else {
          // 다른 활성화된 방이 있는지 확인
          const activeRoom = rooms.find(room => room.status === 'active');
          
          if (activeRoom) {
            // 다른 활성화된 방이 있으면 그 방 선택
            handleSelectRoom(activeRoom.id);
          } else {
            // 활성화된 방이 없으면 항상 새 채팅방 생성
            handleCreateChatRoom();
          }
        }
      }
    }
    
    setIsOpen(!isOpen);
    
    if (externalOnClose && isOpen) {
      externalOnClose();
    }
  };
  
  // 채팅방 최소화/복원
  const handleMinimize = () => {
    setMinimize(!minimize);
  };
  
  // 채팅방 선택 (먼저 정의)
  const handleSelectRoom = useCallback(async (roomId: string) => {
    setShowRoomList(false);
    await openChatRoom(roomId);
  }, [openChatRoom]);
  
  // 채팅방 생성
  const handleCreateChatRoom = useCallback(async () => {
    // 관리자 계정은 채팅방 생성이 필요없이 목록만 표시
    if (currentUser?.role === 'admin') {
      setShowRoomList(true);
      return;
    }
    
    try {
      // 항상 새 채팅방 생성
      const newRoomId = await createChatRoom([], '운영자와의 대화');
      
      if (newRoomId) {
        handleSelectRoom(newRoomId);
      }
    } catch (error) {
      console.error('채팅방 생성 오류:', error);
    }
  }, [currentUser?.role, createChatRoom, handleSelectRoom]);
  
  // 채팅방 목록으로 돌아가기
  const handleBackToList = () => {
    setCurrentRoomId(null);
    setShowRoomList(true);
  };
  
  // 메시지 전송
  const handleSendMessage = async (content: string) => {
    if (!currentRoomId) {
      console.error('선택된 채팅방이 없습니다.');
      
      // 채팅방이 없는 경우 새 채팅방 생성 (일반 사용자만)
      if (currentUser?.role !== 'admin') {
        const newRoomId = await createChatRoom([], '운영자와의 대화');
        if (newRoomId) {
          // 새 채팅방 생성 후 메시지 전송
          await handleSelectRoom(newRoomId);
          // 약간의 지연 후 메시지 전송 (채팅방 선택이 완료되도록)
          setTimeout(() => {
            sendMessage(newRoomId, content);
          }, 300);
        }
      }
      return;
    }
    
    // 채팅방이 활성 상태인지 확인 (실시간으로 최신 상태 가져오기)
    await fetchChatRooms(); // 최신 상태 업데이트
    
    const currentRoom = rooms.find(room => room.id === currentRoomId);
    if (!currentRoom || currentRoom.status !== 'active') {
      console.error('종료되거나 보관된 채팅방에는 메시지를 보낼 수 없습니다.');
      
      // 비활성 방인 경우 새 채팅방 생성 (일반 사용자만)
      if (currentUser?.role !== 'admin') {
        const newRoomId = await createChatRoom([], '운영자와의 대화');
        if (newRoomId) {
          // 새 채팅방 생성 후 메시지 전송
          await handleSelectRoom(newRoomId);
          // 약간의 지연 후 메시지 전송 (채팅방 선택이 완료되도록)
          setTimeout(() => {
            sendMessage(newRoomId, content);
          }, 300);
        }
      }
      return;
    }
    
    // 모든 검증을 통과한 경우에만 메시지 전송
    const result = await sendMessage(currentRoomId, content);
    if (!result) {
      console.error('메시지 전송 실패: 채팅방 상태 확인 필요');
      // 메시지 전송 실패 시 채팅방 목록 갱신
      await fetchChatRooms();
    }
  };
  
  // 외부에서 열기/닫기 제어
  useEffect(() => {
    if (externalOpen !== undefined) {
      setIsOpen(externalOpen);
    }
  }, [externalOpen]);
  
  // 컴포넌트 마운트시 채팅방 목록 가져오기 및 적절한 채팅방 관리
  useEffect(() => {
    const initializeChat = async () => {
      if (!currentUser?.id) return;
      
      try {
        // 채팅방 목록 가져오기
        await fetchChatRooms();
        
        // 일반 사용자이고 채팅창이 열려있을 때만 추가 처리
        if (isOpen && currentUser?.role !== 'admin') {
          
          // 1. 현재 선택된 방이 있고 활성 상태인지 확인
          const currentRoom = currentRoomId ? rooms.find(room => room.id === currentRoomId) : null;
          
          if (currentRoom && currentRoom.status === 'active' && currentRoomId) {
            // 현재 선택된 방이 있고 활성 상태이면 그대로 사용
            await handleSelectRoom(currentRoomId);
            return;
          }
          
          // 2. 현재 선택된 방이 없거나 비활성 상태라면
          // 다른 활성화된 방이 있는지 확인
          const activeRoom = rooms.find(room => room.status === 'active');
          
          if (activeRoom) {
            // 활성화된 방이 있으면 그 방을 선택
            await handleSelectRoom(activeRoom.id);
          } else {
            // 활성화된 방이 없으면 새 채팅방 생성
            await handleCreateChatRoom();
          }
        }
      } catch (error) {
        console.error('채팅 초기화 중 오류 발생:', error);
      }
    };
    
    initializeChat();
  }, [currentUser?.id, isOpen, fetchChatRooms, handleCreateChatRoom, handleSelectRoom, currentRoomId, rooms]);
  
  // 현재 채팅방에 따라 메시지 가져오기
  useEffect(() => {
    if (currentRoomId) {
      fetchMessages(currentRoomId);
    }
  }, [currentRoomId, fetchMessages]);
  
  // 현재 선택된 채팅방의 메시지
  const currentRoomMessages = (currentRoomId && messages[currentRoomId]) || [];
  const currentRoom = rooms.find(room => room.id === currentRoomId) || null;
  
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