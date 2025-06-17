import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useAuthContext } from '@/auth';
import { supabase, supabaseAdmin } from '@/supabase';
import { IMessage, IChatRoom, ChatRole, MessageStatus } from '@/types/chat';
import { CommonTemplate } from '@/components/pageTemplate';
import { useDialog } from '@/providers';
import { useRealtimeSubscription } from '@/hooks';
import { fileUploadService } from '@/services/fileUploadService';
import { STORAGE_CONFIG } from '@/config/storage.config';
import type { AttachmentFile } from '@/types/guarantee-slot.types';
import { toast } from 'sonner';

// 메시지 아이템 컴포넌트를 메모이제이션하여 불필요한 렌더링 방지
const MessageItem = memo(({
  message,
  isCurrentUser,
  onImageClick,
  onFileDownload,
  downloadingFile
}: {
  message: IMessage;
  isCurrentUser: boolean;
  onImageClick: (attachment: AttachmentFile) => void;
  onFileDownload: (attachment: AttachmentFile) => void;
  downloadingFile: string | null;
}) => {
  return (
    <div
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 ${message.senderRole === 'system'
            ? 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white'
            : isCurrentUser
              ? 'bg-blue-500 dark:bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white border dark:border-slate-600'
          }`}
      >
        {/* 발신자 이름 및 역할 */}
        {!isCurrentUser && message.senderRole !== 'system' && (
          <div className="text-xs font-medium text-gray-500 dark:text-white mb-1">
            {message.senderName}
            <span className="ml-2 text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-slate-600 rounded">
              {message.senderRole === 'user' ? '사용자' :
                message.senderRole === 'operator' ? '운영자' :
                  message.senderRole === 'admin' ? '관리자' : message.senderRole}
            </span>
          </div>
        )}

        {/* 메시지 내용 */}
        <div className="text-sm whitespace-pre-wrap text-current">{message.content}</div>

        {/* 첨부파일 표시 */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment: any, attachIndex: number) => (
              <div key={attachIndex} className="p-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded">
                <div className="flex items-center gap-2 mb-2">
                  {attachment.type === 'image' ? (
                    <img 
                      src={attachment.url} 
                      alt={attachment.name}
                      className="w-12 h-12 object-cover rounded cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => onImageClick(attachment)}
                      title="클릭하여 원본 보기"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-orange-100 dark:bg-orange-800 rounded">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600 dark:text-orange-400">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate text-gray-800 dark:text-gray-200" title={attachment.name}>
                      {attachment.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {attachment.size ? fileUploadService.formatFileSize(attachment.size) : ''}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {/* 이미지 파일인 경우 보기 버튼 */}
                  {attachment.type === 'image' && (
                    <button
                      onClick={() => onImageClick(attachment)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-1 flex-1"
                      title="원본 보기"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      보기
                    </button>
                  )}
                  
                  {/* 다운로드 버튼 */}
                  <button
                    onClick={async () => {
                      if (downloadingFile) return;
                      onFileDownload(attachment);
                    }}
                    disabled={downloadingFile === attachment.url}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs px-2 py-1 rounded border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-1 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="파일 다운로드"
                  >
                    {downloadingFile === attachment.url ? (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                          <path d="M12 2v4m0 12v4m8-8h-4M6 12H2m15.364-6.364L14.95 8.05M9.05 14.95l-2.414 2.414M17.364 17.364L14.95 14.95M9.05 9.05L6.636 6.636"/>
                        </svg>
                        처리중...
                      </>
                    ) : (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7,10 12,15 17,10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        다운로드
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 타임스탬프 */}
        <div className="text-right mt-1">
          <span className="text-xs opacity-70 text-current">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
});

// 채팅방 상태에 따른 정렬 함수 (컴포넌트 외부에 선언하여 재사용)
const sortRoomsByStatusAndTime = (rooms: any[]) => {
  return [...rooms].sort((a, b) => {
    // 상태에 따른 가중치 부여 (active > closed > archived)
    const getStatusWeight = (status: string) => {
      switch (status) {
        case 'active': return 3;
        case 'closed': return 2;
        case 'archived': return 1;
        default: return 0;
      }
    };

    const weightA = getStatusWeight(a.status);
    const weightB = getStatusWeight(b.status);

    // 상태가 다르면 상태 가중치로 정렬
    if (weightA !== weightB) {
      return weightB - weightA;
    }

    // 상태가 같으면 업데이트 시간으로 정렬
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
};

const ChatManagePage: React.FC = () => {
  const { currentUser } = useAuthContext();

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<IMessage[]>([]);
  const [roomPage, setRoomPage] = useState(0);
  const [hasMoreRooms, setHasMoreRooms] = useState(true);
  const roomPageSize = 20; // 한 번에 로드할 채팅방 수
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'closed'>('all'); // 채팅 상태 필터
  const [isMobileView, setIsMobileView] = useState(false); // 모바일 화면 여부
  const [showChatList, setShowChatList] = useState(true); // 모바일에서 채팅방 목록 표시 여부
  
  // 파일 첨부 관련 상태
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 사용자 역할 확인 (관리자 또는 운영자)

  // 개발 단계에서는 모든 사용자가 접근 가능하도록 항상 true로 설정
  const isOperator = true;

  // 메시지 페이지네이션을 위한 상태 추가
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagePageSize = 30; // 한 번에 가져올 메시지 수

  // 채팅방 메시지 가져오기 (페이지네이션 + 관리자 클라이언트 사용)
  const fetchRoomMessages = useCallback(async (roomId: string, page = 0, append = false) => {
    if (!roomId) return;

    try {
      setLoadingMessages(true);

      // 메시지 가져오기 - 관리자 클라이언트 + 페이지네이션 적용
      const { data, error, count } = await supabaseAdmin
        .from('chat_messages')
        .select('id, room_id, sender_id, sender_name, sender_role, content, created_at, status, attachments', { count: 'exact' })
        .eq('room_id', roomId)
        .order('created_at', { ascending: false }) // 최신 메시지부터 가져오기
        .range(page * messagePageSize, (page + 1) * messagePageSize - 1);

      if (error) {
        
        if (!append) setCurrentMessages([]);
        return;
      }

      // 더 가져올 메시지가 있는지 확인
      if (count) {
        setHasMoreMessages((page + 1) * messagePageSize < count);
      } else {
        setHasMoreMessages(false);
      }

      if (!data || data.length === 0) {
        if (!append) setCurrentMessages([]);
        return;
      }

      // 데이터 변환 - 필요한 필드만 매핑
      const formattedMessages: IMessage[] = data.map((message) => ({
        id: message.id,
        roomId: message.room_id,
        senderId: message.sender_id,
        senderName: message.sender_name || '사용자',
        senderRole: message.sender_role || 'user',
        content: message.content,
        timestamp: message.created_at,
        status: message.status || 'sent',
        attachments: message.attachments || []
      })).reverse(); // UI에 표시하기 위해 다시 역순으로

      // 메시지 저장 (append가 true면 기존 메시지에 추가하면서 중복 제거)
      if (append) {
        setCurrentMessages(prev => {
          // 새 메시지와 기존 메시지를 합치기 전에 ID로 체크하여 중복 제거
          const existingIds = new Set(prev.map(msg => msg.id));
          const uniqueNewMessages = formattedMessages.filter(msg => !existingIds.has(msg.id));

          return [...prev, ...uniqueNewMessages];
        });
      } else {
        setCurrentMessages(formattedMessages);
      }

      // 현재 페이지 업데이트
      setCurrentPage(page);

    } catch (error) {
      
      if (!append) setCurrentMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [messagePageSize]);

  // 이전 메시지 로드
  const loadMoreMessages = useCallback(() => {
    if (currentRoomId && hasMoreMessages && !loadingMessages) {
      fetchRoomMessages(currentRoomId, currentPage + 1, true);
    }
  }, [currentRoomId, hasMoreMessages, loadingMessages, currentPage, fetchRoomMessages]);

  // 마지막 읽은 메시지 업데이트
  const updateLastReadMessage = async (roomId: string, messageId: string) => {
    if (!currentUser?.id) return;

    try {
      await supabase
        .from('chat_participants')
        .update({
          last_read_message_id: messageId,
          last_seen: new Date().toISOString()
        })
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id);
    } catch (error) {
      
    }
  };

  // UUID 생성 함수 (crypto.randomUUID 대체)
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // 메시지 보내기 (순차적 처리로 외래 키 제약 조건 위반 방지)
  const { showAlert } = useDialog();
  
  const handleSendMessage = useCallback(async () => {
    if ((!inputValue.trim() && attachments.length === 0) || !currentRoomId || !currentUser?.id) return;

    // 채팅방이 활성 상태가 아니면 메시지 전송 불가
    const roomInfo = allRooms.find(room => room.id === currentRoomId);
    if (!roomInfo || roomInfo.status !== 'active') {
      showAlert('알림', '종료되거나 보관된 채팅방에는 메시지를 보낼 수 없습니다.');
      return;
    }

    try {
      const messageId = generateUUID();
      const now = new Date().toISOString();
      const messageContent = inputValue.trim() || (attachments.length > 0 ? '파일을 보냈습니다.' : '');

      // 1. 먼저 입력창 초기화 (UI 반응성 개선)
      setInputValue('');
      setAttachments([]);

      // 2. 로컬에 메시지 추가 (즉시 표시)
      const newMessage: IMessage = {
        id: messageId,
        roomId: currentRoomId,
        senderId: currentUser.id,
        senderName: currentUser.full_name || '운영자',
        senderRole: ChatRole.OPERATOR,
        content: messageContent,
        timestamp: now,
        status: MessageStatus.SENT,
        attachments: attachments.length > 0 ? attachments.map((att, idx) => ({
          id: `${messageId}-${idx}`,
          messageId: messageId,
          type: fileUploadService.isImageFile({ type: att.type } as File) ? 'image' as const : 'file' as const,
          url: att.url,
          name: att.name,
          size: att.size
        })) : undefined
      };

      // 로컬 메시지 목록에 추가 (즉시 표시, 중복 방지)
      setCurrentMessages(prev => {
        // 이미 같은 ID의 메시지가 있는지 확인
        if (prev.some(msg => msg.id === newMessage.id)) {
          return prev; // 중복이면 변경하지 않음
        }
        return [...prev, newMessage]; // 중복이 아니면 추가
      });

      // 로컬 채팅방 목록 업데이트 (즉시 반영)
      setAllRooms(prev => {
        const roomIndex = prev.findIndex(r => r.id === currentRoomId);
        if (roomIndex >= 0) {
          const updatedRooms = [...prev];
          updatedRooms[roomIndex] = {
            ...updatedRooms[roomIndex],
            lastMessage: messageContent,
            lastMessageTime: now,
            updatedAt: now
          };

          // 가장 최근 대화를 맨 위로 정렬
          updatedRooms.sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          return updatedRooms;
        }
        return prev;
      });

      // 3. 서버에 메시지 저장 (순차적으로 처리하여 외래 키 제약 조건 위반 방지)

      // 먼저 메시지 저장
      const { data: messageData, error: messageError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          id: messageId,
          room_id: currentRoomId,
          sender_id: currentUser.id,
          sender_name: currentUser.full_name || '운영자',
          sender_role: 'operator',
          content: messageContent,
          status: 'sent',
          created_at: now,
          updated_at: now,
          attachments: attachments.length > 0 ? attachments.map((att, idx) => ({
            id: `${messageId}-${idx}`,
            messageId: messageId,
            type: fileUploadService.isImageFile({ type: att.type } as File) ? 'image' : 'file',
            url: att.url,
            name: att.name,
            size: att.size
          })) : null
        })
        .select();

      // 메시지 저장 오류 확인
      if (messageError) {
        
        throw new Error(messageError.message);
      }

      // 메시지가 성공적으로 저장된 후에만 채팅방 업데이트
      if (messageData) {
        // 채팅방 업데이트
        const { error: roomError } = await supabaseAdmin
          .from('chat_rooms')
          .update({
            last_message_id: messageId,
            updated_at: now
          })
          .eq('id', currentRoomId);

        if (roomError) {
          
          // 메시지는 이미 저장됐으므로 심각한 오류는 아님
          
        }
      }

    } catch (error) {
      showAlert('오류', '메시지 전송 중 오류가 발생했습니다');
    }
  }, [inputValue, currentRoomId, currentUser, showAlert, attachments, allRooms]);

  // 모든 채팅방 가져오기 (페이지네이션 적용 + 관리자 클라이언트 사용 + 상태 필터링)
  const fetchAllChatRooms = useCallback(async (page = 0) => {
    try {
      setIsLoading(true);

      // 페이지가 변경되면 roomPage 업데이트
      setRoomPage(page);

      // 쿼리 객체 생성 - 관리자 클라이언트를 사용하여 RLS 정책 우회 + 페이지네이션 적용
      let query = supabaseAdmin
        .from('chat_rooms')
        .select('id, name, status, created_at, updated_at, last_message_id', { count: 'exact' });

      // 상태 필터 적용
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // 업데이트 시간순으로 정렬 (상태별 정렬은 JS에서 처리)
      query = query
        .order('updated_at', { ascending: false }); // 최근 업데이트 순

      // 페이지네이션 적용
      const { data: roomsData, error: roomsError, count } = await query
        .range(page * roomPageSize, (page + 1) * roomPageSize - 1);

      if (roomsError) {
        
        if (page === 0) setAllRooms([]);
        return;
      }

      if (!roomsData || roomsData.length === 0) {
        if (page === 0) setAllRooms([]);
        setHasMoreRooms(false);
        return;
      }

      // 더 가져올 채팅방이 있는지 확인
      if (count) {
        setHasMoreRooms((page + 1) * roomPageSize < count);
      } else {
        setHasMoreRooms(false);
      }

      // 마지막 메시지 정보를 효율적으로 가져오기 (단일 쿼리로)
      let lastMessageInfo: Record<string, { content: string, timestamp: string }> = {};

      // 마지막 메시지 ID가 있는 방만 필터링
      const roomsWithLastMessages = roomsData.filter(room => room.last_message_id);

      if (roomsWithLastMessages.length > 0) {
        // 모든 메시지 ID 목록 추출
        const messageIds = roomsWithLastMessages.map(room => room.last_message_id);

        // 단일 쿼리로 모든 마지막 메시지 데이터 가져오기
        const { data: messagesData } = await supabaseAdmin
          .from('chat_messages')
          .select('id, content, created_at, room_id')
          .in('id', messageIds);

        if (messagesData) {
          // 메시지 ID로 인덱싱하여 빠르게 접근할 수 있도록 함
          lastMessageInfo = messagesData.reduce<Record<string, { content: string, timestamp: string }>>((acc, msg) => {
            acc[msg.id] = {
              content: msg.content,
              timestamp: msg.created_at
            };
            return acc;
          }, {});
        }
      }

      // 채팅방 정보 바로 설정 (최소 정보만 유지)
      const simpleRooms = roomsData.map(room => {
        const lastMessage = room.last_message_id ? lastMessageInfo[room.last_message_id] : null;

        return {
          id: room.id,
          name: room.name || '채팅방',
          status: room.status,
          createdAt: room.created_at,
          updatedAt: room.updated_at,
          userName: '사용자',  // 기본값으로 설정
          lastMessage: lastMessage?.content || '',
          lastMessageTime: lastMessage?.timestamp || ''
        };
      });

      // 컴포넌트 외부에 정의된 정렬 함수 사용

      // 상태 우선순위에 따라 정렬된 채팅방 목록 생성
      const sortedRooms = sortRoomsByStatusAndTime(simpleRooms);

      // 페이지가 0이면 새로 설정, 아니면 기존 데이터에 추가
      if (page === 0) {
        setAllRooms(sortedRooms);
      } else {
        // 추가할 때도 전체 목록을 재정렬
        setAllRooms(prev => {
          const combined = [...prev, ...sortedRooms];
          return sortRoomsByStatusAndTime(combined);
        });
      }

    } catch (error) {
      
      if (page === 0) {
        setAllRooms([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [roomPageSize, statusFilter]);

  // 더 많은 채팅방 로드
  const loadMoreRooms = useCallback(() => {
    if (hasMoreRooms && !isLoading) {
      fetchAllChatRooms(roomPage + 1);
    }
  }, [hasMoreRooms, isLoading, roomPage, fetchAllChatRooms]);

  // 초기 로드
  useEffect(() => {
    // 운영자 페이지에서는 모든 채팅방 로드
    fetchAllChatRooms();

    // 화면 크기 감지 함수
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768); // 768px 미만일 때 모바일 화면으로 간주
    };

    // 초기 화면 크기 감지
    handleResize();

    // 화면 크기 변경 시 이벤트 리스너 추가
    window.addEventListener('resize', handleResize);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 필터 변경 시 채팅방 목록 다시 로드
  useEffect(() => {
    // 필터가 변경되면 첫 페이지부터 다시 로드
    setAllRooms([]);
    setRoomPage(0);
    fetchAllChatRooms(0);
  }, [statusFilter, fetchAllChatRooms]);

  // 실시간 메시지 구독 설정 (최적화 버전)
  const lastSubscriptionTimeRef = useRef(new Date().toISOString());
  
  useRealtimeSubscription({
    channelName: `chat-messages-${currentRoomId}`,
    event: 'INSERT',
    table: 'chat_messages',
    filter: currentRoomId ? `room_id=eq.${currentRoomId}` : undefined,
    enabled: !!(currentUser?.id && currentRoomId),
    onMessage: useCallback((payload) => {
      const newMessage = payload.new as any;
      const myUserId = currentUser?.id;

      // 내가 보낸 메시지는 이미 UI에 표시됐으므로 처리 스킵
      if (newMessage.sender_id === myUserId) {
        return;
      }

      // 저장 시점보다 이후에 생성된 메시지인지 확인 (동일 메시지 중복 처리 방지)
      if (newMessage.created_at <= lastSubscriptionTimeRef.current) {
        return;
      }

      // 단일 메시지만 추가 (전체 리스트 다시 로드하지 않음)
      const formattedMessage: IMessage = {
        id: newMessage.id,
        roomId: newMessage.room_id,
        senderId: newMessage.sender_id,
        senderName: newMessage.sender_name || '사용자',
        senderRole: newMessage.sender_role || 'user',
        content: newMessage.content,
        timestamp: newMessage.created_at,
        status: newMessage.status || 'sent',
        attachments: newMessage.attachments || []
      };

      // 기존 메시지 목록에 새 메시지 추가 (중복 체크)
      setCurrentMessages(prev => {
        // 이미 같은 ID의 메시지가 있는지 확인
        if (prev.some(msg => msg.id === formattedMessage.id)) {
          return prev; // 중복이면 변경하지 않음
        }
        return [...prev, formattedMessage]; // 중복이 아니면 추가
      });

      // 효율성을 위해 메모이제이션된 함수 활용
      // 채팅방 목록의 마지막 메시지 정보만 업데이트
      setAllRooms(prev => {
        const updatedRooms = [...prev];
        const roomIndex = updatedRooms.findIndex(r => r.id === currentRoomId);

        if (roomIndex >= 0) {
          updatedRooms[roomIndex] = {
            ...updatedRooms[roomIndex],
            lastMessage: newMessage.content,
            lastMessageTime: newMessage.created_at,
            updatedAt: newMessage.created_at
          };

          // 가장 최근 대화를 맨 위로 정렬
          updatedRooms.sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }

        return updatedRooms;
      });
    }, [currentUser?.id, currentRoomId]),
    onError: (error) => {
      console.error('채팅 메시지 구독 오류:', error);
    }
  });

  // 구독 시점 업데이트
  useEffect(() => {
    if (currentRoomId) {
      lastSubscriptionTimeRef.current = new Date().toISOString();
    }
  }, [currentRoomId]);

  // 채팅방 선택 및 운영자 참여 처리 (최적화 버전)
  const handleSelectRoom = useCallback(async (roomId: string) => {
    // 이미 선택된 방이면 다시 로드하지 않음 (모바일에서는 채팅 화면으로 전환)
    if (roomId === currentRoomId) {
      if (isMobileView) {
        setShowChatList(false); // 모바일에서 채팅 화면으로 전환
      }
      return;
    }

    // 1. 먼저 UI 업데이트 및 상태 초기화 (사용자 경험 개선)
    setCurrentRoomId(roomId);
    setCurrentPage(0);
    setHasMoreMessages(true);
    setCurrentMessages([]);  // 메시지 목록 초기화로 깜박임 방지

    // 모바일에서 채팅방 선택 시 채팅 화면으로 전환
    if (isMobileView) {
      setShowChatList(false);
    }

    // 2. 메시지 로드 (첫 페이지만, 사용자가 바로 볼 수 있도록)
    fetchRoomMessages(roomId, 0, false)
      .then(() => {
        // 메시지 로드 완료 후 스크롤을 맨 아래로 내림
        if (messagesContainerRef.current) {
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
          }, 300); // DOM 업데이트를 위해 약간의 지연 시간 부여
        }
        // 첨부파일 초기화
        setAttachments([]);
      })
      .catch(error => {
        // 오류 처리
      });

    // 3. 백그라운드에서 운영자 참여 처리 (병렬로 처리)
    if (currentUser?.id) {
      // 비동기 처리를 별도 스레드에서 수행하여 UI 차단 방지
      setTimeout(async () => {
        try {
          // 관리자 클라이언트 사용
          // 채팅방에 운영자가 이미 참여자로 등록되어 있는지 확인
          const { data: participantData, error: participantError } = await supabaseAdmin
            .from('chat_participants')
            .select('id')
            .eq('room_id', roomId)
            .eq('user_id', currentUser.id)
            .maybeSingle();  // single()보다 오류 없이 처리

          // 참여자로 등록되어 있지 않은 경우에만 추가
          if (!participantData) {
            // 새 참가자 추가
            const { error: insertError } = await supabaseAdmin
              .from('chat_participants')
              .insert({
                id: generateUUID(),
                room_id: roomId,
                user_id: currentUser.id,
                role: 'operator',
                joined_at: new Date().toISOString()
              });

            if (insertError) {
              
            }
          }
        } catch (error) {
          
          // 에러가 발생해도 사용자 경험에 영향을 주지 않음
        }
      }, 0);
    }
  }, [currentRoomId, currentUser?.id, fetchRoomMessages, isMobileView]);

  // 채팅방 상태 변경 함수
  const updateChatRoomStatus = useCallback(async (roomId: string, status: 'active' | 'archived' | 'closed') => {
    if (!roomId) return;

    try {
      const now = new Date().toISOString();

      // 채팅방 상태 업데이트
      const { error } = await supabaseAdmin
        .from('chat_rooms')
        .update({
          status,
          updated_at: now
        })
        .eq('id', roomId);

      if (error) {
        showAlert('오류', `채팅방 상태 변경 중 오류가 발생했습니다: ${error.message}`);
        return;
      }

      // 시스템 메시지 추가 (상태 변경을 채팅방에 알림)
      const messageId = generateUUID();
      let messageContent = '';

      switch (status) {
        case 'closed':
          messageContent = '운영자가 상담을 종료했습니다. 새로운 문의는 새 채팅을 시작해주세요.';
          break;
        case 'active':
          messageContent = '운영자가 상담을 다시 시작했습니다.';
          break;
        case 'archived':
          messageContent = '이 채팅방은 보관 처리되었습니다. 더 이상 메시지를 보낼 수 없습니다.';
          break;
      }

      const { error: messageError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          id: messageId,
          room_id: roomId,
          sender_id: 'system',
          sender_name: 'System',
          sender_role: 'system',
          content: messageContent,
          status: 'sent',
          created_at: now,
          updated_at: now
        });

      if (messageError) {
        
      }

      // 채팅방 업데이트 (마지막 메시지 설정)
      await supabaseAdmin
        .from('chat_rooms')
        .update({
          last_message_id: messageId,
          updated_at: now
        })
        .eq('id', roomId);

      // 로컬 채팅방 상태 업데이트 및 재정렬
      setAllRooms(prev => {
        // 상태 업데이트
        const updatedRooms = prev.map(room =>
          room.id === roomId
            ? { ...room, status, updatedAt: now, lastMessage: messageContent, lastMessageTime: now }
            : room
        );

        // 컴포넌트 외부에 정의된 정렬 함수 사용하여 재정렬
        return sortRoomsByStatusAndTime(updatedRooms);
      });

      // 메시지 목록 새로고침 (시스템 메시지 표시)
      if (currentRoomId === roomId) {
        fetchRoomMessages(roomId, 0, false);
      }

      // 채팅방 목록 새로고침
      fetchAllChatRooms(0);
    } catch (error) {
      showAlert('오류', '채팅방 상태 변경 중 오류가 발생했습니다.');
    }
  }, [currentRoomId, fetchRoomMessages, showAlert]);

  // showConfirm 불러오기
  const { showConfirm } = useDialog();

  // 채팅 상담 종료
  const closeChatRoom = useCallback((roomId: string) => {
    showConfirm(
      '상담 종료',
      '상담을 종료하시겠습니까?',
      (confirmed) => {
        if (confirmed) {
          updateChatRoomStatus(roomId, 'closed');
        }
      },
      {
        confirmText: '종료',
        cancelText: '취소',
        confirmButtonClass: 'bg-danger hover:bg-danger/90 text-white'
      }
    );
  }, [updateChatRoomStatus, showConfirm]);

  // 채팅 상담 재개 기능 제거 - 상담 종료 후에는 새 채팅방으로 진행해야 함

  // 채팅 보관
  const archiveChatRoom = useCallback((roomId: string) => {
    showConfirm(
      '채팅 보관',
      '채팅을 보관하시겠습니까?',
      (confirmed) => {
        if (confirmed) {
          updateChatRoomStatus(roomId, 'archived');
        }
      },
      {
        confirmText: '보관',
        cancelText: '취소',
        confirmButtonClass: 'bg-primary hover:bg-primary/90 text-white'
      }
    );
  }, [updateChatRoomStatus, showConfirm]);

  // 현재 선택된 방 정보 메모이제이션
  const currentRoomInfo = useMemo(() => {
    if (!currentRoomId) return null;
    return allRooms.find(room => room.id === currentRoomId) || null;
  }, [currentRoomId, allRooms]);

  // 모바일에서 채팅방 목록으로 돌아가기
  const handleBackToList = useCallback(() => {
    setShowChatList(true);
  }, []);

  // 메시지 컨테이너 참조 
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 스크롤 이벤트 감지로 자동 페이지 로드 (스크롤이 맨 위로 올라갔을 때)
  useEffect(() => {
    if (!messagesContainerRef.current) return;

    let isScrolling = false;
    const debounceTimeout = 100; // 100ms 디바운스

    const handleScroll = () => {
      if (isScrolling) return;

      isScrolling = true;

      // 일정 시간 후에 이벤트 처리
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        // 스크롤이 거의 최상단에 있고, 더 불러올 메시지가 있을 때
        if (container.scrollTop <= 50 && hasMoreMessages && !loadingMessages) {
          loadMoreMessages();
        }

        isScrolling = false;
      }, debounceTimeout);
    };

    const messageContainer = messagesContainerRef.current;
    messageContainer.addEventListener('scroll', handleScroll);

    // 클린업
    return () => {
      if (messageContainer) {
        messageContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasMoreMessages, loadingMessages, loadMoreMessages]);

  // 메시지 ID 중복 제거를 위한 처리
  const uniqueMessages = useMemo(() => {
    // 중복 ID 필터링
    const messageMap = new Map();
    currentMessages.forEach((message) => {
      // 같은 ID의 메시지가 있으면 최신 것으로 업데이트
      messageMap.set(message.id, message);
    });

    // 맵에서 다시 배열로 변환
    return Array.from(messageMap.values());
  }, [currentMessages]);

  // 메시지가 추가되면 자동으로 스크롤을 맨 아래로 내림
  useEffect(() => {
    // 메시지가 있을 때만 스크롤
    if (uniqueMessages.length > 0 && messagesContainerRef.current) {
      const container = messagesContainerRef.current;

      // 현재 스크롤 위치가 거의 맨 아래에 있는 경우에만 자동 스크롤 
      // (또는 내가 보낸 메시지가 마지막인 경우)
      const isNearBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 150;
      const lastMessage = uniqueMessages[uniqueMessages.length - 1];
      const isMyLastMessage = lastMessage && lastMessage.senderId === currentUser?.id;

      if (isNearBottom || isMyLastMessage) {
        // setTimeout을 사용하여 DOM 업데이트 이후에 스크롤
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 100);
      }
    }
  }, [uniqueMessages, currentUser?.id]);

  // 파일 선택 처리
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    try {
      const fileArray = Array.from(files);
      
      // 파일 타입 및 크기 검증
      const validFiles = fileArray.filter(file => {
        if (!fileUploadService.isValidFileSize(file, STORAGE_CONFIG.LIMITS.MAX_FILE_SIZE_MB)) {
          toast.error(`${file.name}은(는) 파일 크기가 ${STORAGE_CONFIG.LIMITS.MAX_FILE_SIZE_MB}MB를 초과합니다.`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      // 파일 업로드 (chat 폴더 사용)
      const { data: uploadedFiles, errors } = await fileUploadService.uploadMultipleFiles(
        validFiles, 
        STORAGE_CONFIG.UPLOADS_BUCKET, 
        `chat/${currentUser?.id || 'admin'}`
      );

      if (errors.length > 0) {
        console.error('일부 파일 업로드 실패:', errors);
        toast.error('일부 파일 업로드에 실패했습니다.');
      }

      if (uploadedFiles.length > 0) {
        setAttachments(prev => [...prev, ...uploadedFiles]);
        toast.success(`${uploadedFiles.length}개 파일이 첨부되었습니다.`);
      }
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      toast.error('파일 업로드에 실패했습니다.');
    } finally {
      setUploadingFiles(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 첨부파일 제거
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 이미지 클릭 처리 (모달 보기)
  const handleImageClick = (attachment: AttachmentFile) => {
    setSelectedImage({
      src: attachment.url,
      title: attachment.name
    });
    setIsImageModalOpen(true);
  };

  // 이미지 모달 닫기
  const closeImageModal = useCallback(() => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  }, []);

  // ESC 키로 이미지 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImageModalOpen) {
        closeImageModal();
      }
    };

    if (isImageModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isImageModalOpen, closeImageModal]);

  // 파일 다운로드 처리
  const handleFileDownload = async (attachment: AttachmentFile) => {
    if (downloadingFile) return; // 이미 다운로드 중이면 무시

    try {
      setDownloadingFile(attachment.url);
      
      if (fileUploadService.isImageFile({ type: attachment.type } as File)) {
        // 이미지는 모달에서 보기
        handleImageClick(attachment);
      } else {
        // 일반 파일은 다운로드
        const success = await fileUploadService.downloadFile(attachment.url, attachment.name);
        if (success) {
          toast.success('파일 다운로드가 시작되었습니다.');
        } else {
          toast.error('파일 다운로드에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('파일 처리 실패:', error);
      toast.error('파일 처리 중 오류가 발생했습니다.');
    } finally {
      setDownloadingFile(null);
    }
  };

  {/* 개발 단계에서는 접근 제한 제거 */ }

  return (
    <CommonTemplate
      title="채팅 관리 페이지"
      description="실시간 채팅 상담 내역을 관리하고 응답합니다"
      showPageMenu={false}
      childrenClassName=""
    >
      <div
        className={`${isMobileView ? 'flex flex-col' : 'flex'} border dark:border-slate-700 rounded-lg overflow-hidden mt-2`}
        style={{ height: 'calc(90vh - 220px)' }}
      >
        {/* 채팅방 목록 */}
        <div
          className={`
            ${isMobileView
              ? (showChatList ? 'block' : 'hidden')
              : 'w-1/3 border-r dark:border-slate-700'
            }
            overflow-y-auto bg-gray-50 dark:bg-slate-900
          `}
        >
          <div className="p-4 bg-blue-600 dark:bg-blue-900 text-white font-medium flex flex-col">
            <div className="flex justify-between items-center w-full">
              <div>채팅방 목록 ({allRooms.length})</div>
              <button
                onClick={() => { setAllRooms([]); setRoomPage(0); fetchAllChatRooms(0); }}
                className="text-xs bg-blue-700 dark:bg-blue-800 py-1 px-2 rounded hover:bg-blue-800 dark:hover:bg-blue-900"
                title="새로고침"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2v6h-6M3 22v-6h6M3 10C3 4.5 7.5 2 12 2M21 14c0 5.5-4.5 8-9 8" />
                </svg>
              </button>
            </div>

            {/* 채팅 상태 필터 버튼 */}
            <div className="flex mt-3 text-xs space-x-1">
              <button
                className={`py-1 px-2 rounded transition-colors ${statusFilter === 'all'
                    ? 'bg-white text-blue-700 dark:bg-coal-900 dark:text-blue-300 font-medium'
                    : 'bg-blue-700 dark:bg-blue-800 text-white hover:bg-blue-800 dark:hover:bg-blue-900'
                  }`}
                onClick={() => setStatusFilter('all')}
              >
                전체
              </button>
              <button
                className={`py-1 px-2 rounded transition-colors ${statusFilter === 'active'
                    ? 'bg-white text-blue-700 dark:bg-coal-900 dark:text-blue-300 font-medium'
                    : 'bg-blue-700 dark:bg-blue-800 text-white hover:bg-blue-800 dark:hover:bg-blue-900'
                  }`}
                onClick={() => setStatusFilter('active')}
              >
                활성
              </button>
              <button
                className={`py-1 px-2 rounded transition-colors ${statusFilter === 'archived'
                    ? 'bg-white text-blue-700 dark:bg-coal-900 dark:text-blue-300 font-medium'
                    : 'bg-blue-700 dark:bg-blue-800 text-white hover:bg-blue-800 dark:hover:bg-blue-900'
                  }`}
                onClick={() => setStatusFilter('archived')}
              >
                보관
              </button>
              <button
                className={`py-1 px-2 rounded transition-colors ${statusFilter === 'closed'
                    ? 'bg-white text-blue-700 dark:bg-coal-900 dark:text-blue-300 font-medium'
                    : 'bg-blue-700 dark:bg-blue-800 text-white hover:bg-blue-800 dark:hover:bg-blue-900'
                  }`}
                onClick={() => setStatusFilter('closed')}
              >
                종료
              </button>
            </div>
          </div>

          {allRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-white">
              {isLoading ? '채팅방 로딩 중...' : '채팅방이 없습니다.'}
            </div>
          ) : (
            <div>
              {allRooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => handleSelectRoom(room.id)}
                  className={`p-4 border-b dark:border-slate-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${currentRoomId === room.id ? 'bg-blue-50 dark:bg-blue-800/60' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium dark:text-white">{room.name || '익명 대화'}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-300 mb-1">
                        {room.userName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-white mt-1 truncate" style={{ maxWidth: '200px' }}>
                        {room.lastMessage || '새 대화'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-xs text-gray-500 dark:text-white">
                        {room.lastMessageTime ? new Date(room.lastMessageTime).toLocaleDateString() : ''}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-white mt-1">
                        {room.status === 'active' ?
                          <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-700 text-green-800 dark:text-white rounded-full text-xs">활성</span> :
                          room.status === 'closed' ?
                            <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-700 text-red-800 dark:text-white rounded-full text-xs">종료</span> :
                            room.status === 'archived' ?
                              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-white rounded-full text-xs">보관</span> :
                              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white rounded-full text-xs">비활성</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* 더 많은 채팅방 불러오기 버튼 */}
              {hasMoreRooms && (
                <div className="p-4 text-center">
                  <button
                    onClick={loadMoreRooms}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-xs flex items-center gap-2 mx-auto disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="dark:text-white">로딩 중...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                        <span className="dark:text-white">더 많은 채팅방 보기</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* 로딩 인디케이터 (첫 페이지 로딩 시) */}
              {isLoading && roomPage === 0 && (
                <div className="p-4 text-center">
                  <div className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white rounded text-xs flex items-center mx-auto inline-flex">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="dark:text-white">채팅방 로딩 중...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 채팅창 */}
        <div
          className={`
            ${isMobileView
              ? (showChatList ? 'hidden' : 'block')
              : 'w-2/3'
            }
            flex flex-col dark:bg-black
          `}
        >
          {/* 채팅창 헤더 */}
          <div className="p-4 bg-gray-100 dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center">
              {/* 모바일에서만 표시되는 뒤로가기 버튼 */}
              {isMobileView && (
                <button
                  onClick={handleBackToList}
                  className="mr-2 bg-blue-500 dark:bg-blue-600 text-white p-1 rounded-full"
                  aria-label="채팅방 목록으로 돌아가기"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              )}
              <div className={isMobileView ? "flex flex-col space-y-0.5" : ""}>
                <div className="font-medium dark:text-white flex items-center">
                  {currentRoomInfo
                    ? (
                      <>
                        <span>{currentRoomInfo.name || '운영자와의 대화'}</span>
                        {/* 모바일과 PC 모두 제목 오른쪽에 상태 배지 표시 */}
                        <span className={`ml-2 px-2 py-0.5 text-[10px] rounded-full inline-block
                          ${currentRoomInfo.status === 'active'
                            ? 'bg-green-100 dark:bg-green-700 text-green-800 dark:text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white'}`}
                        >
                          {currentRoomInfo.status === 'active' ? '활성' : '비활성'}
                        </span>
                      </>
                    )
                    : '채팅방을 선택해주세요'
                  }
                </div>
                {currentRoomInfo && (
                  <div className="text-xs text-gray-500 dark:text-white mt-1">
                    {isMobileView ? (
                      // 모바일 버전: 각 정보를 별도 라인으로 표시
                      <>
                        <div>사용자: {currentRoomInfo.userName || '사용자'}</div>
                        <div>생성일: {new Date(currentRoomInfo.createdAt).toLocaleDateString()}</div>
                      </>
                    ) : (
                      // 데스크톱 버전: 인라인으로 표시 (단, 상태 배지는 제외)
                      <>
                        <span className="mr-2">사용자: {currentRoomInfo.userName || '사용자'}</span>
                        <span className="text-xs">
                          생성일: {new Date(currentRoomInfo.createdAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            {currentRoomId && (
              <div className="flex items-center gap-3">
                {/* 첫 번째 컬럼: 새로고침 버튼 */}
                <div className="flex items-center self-center">
                  <button
                    onClick={() => fetchRoomMessages(currentRoomId, 0, false)}
                    className="text-xs px-2 py-1 bg-gray-200 dark:bg-coal-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-coal-600"
                    title="메시지 새로고침"
                    disabled={loadingMessages}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loadingMessages ? "animate-spin" : ""}>
                      <path d="M21 2v6h-6M3 22v-6h6M3 10C3 4.5 7.5 2 12 2M21 14c0 5.5-4.5 8-9 8" />
                    </svg>
                  </button>
                </div>

                {/* 두 번째 컬럼: 상담 종료 및 보관 버튼 (세로 배치) */}
                <div className="flex flex-col gap-1">
                  {/* 상담 종료 버튼 */}
                  {currentRoomInfo && currentRoomInfo.status === 'active' && (
                    <button
                      onClick={() => closeChatRoom(currentRoomId)}
                      className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 w-16 text-center"
                      title="상담 종료"
                    >
                      상담 종료
                    </button>
                  )}

                  {/* 보관 버튼 */}
                  {currentRoomInfo && currentRoomInfo.status !== 'archived' && (
                    <button
                      onClick={() => archiveChatRoom(currentRoomId)}
                      className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 w-16 text-center"
                      title="채팅 보관"
                    >
                      보관
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 메시지 영역 */}
          <div
            ref={messagesContainerRef}
            className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-slate-900"
            id="chat-messages-container"
          >
            {!currentRoomId ? (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-white">
                {isMobileView ? '채팅방을 선택해주세요' : '좌측에서 채팅방을 선택해주세요'}
              </div>
            ) : currentMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-white">
                {loadingMessages ? '메시지를 불러오는 중...' : '메시지가 없습니다'}
              </div>
            ) : (
              <div className="space-y-3">
                {/* 이전 메시지 로드 버튼 */}
                {hasMoreMessages && (
                  <div className="flex justify-center my-4">
                    <button
                      onClick={loadMoreMessages}
                      disabled={loadingMessages}
                      className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-xs flex items-center gap-2 disabled:opacity-50"
                    >
                      {loadingMessages ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="dark:text-white">이전 메시지 로드 중...</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 15l-6-6-6 6" />
                          </svg>
                          <span className="dark:text-white">이전 메시지 더 보기</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {uniqueMessages.map(message => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isCurrentUser={message.senderId === currentUser?.id}
                    onImageClick={handleImageClick}
                    onFileDownload={handleFileDownload}
                    downloadingFile={downloadingFile}
                  />
                ))}

                {/* 로딩 인디케이터 (첫 페이지 로딩 시) */}
                {loadingMessages && currentPage === 0 && (
                  <div className="flex justify-center my-4">
                    <div className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-white rounded text-xs flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="dark:text-white">메시지 로딩 중...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 메시지 입력 */}
          {currentRoomId && currentRoomInfo && currentRoomInfo.status === 'active' ? (
            <div className="bg-white dark:bg-slate-800 border-t dark:border-slate-700">
              {/* 첨부파일 미리보기 */}
              {attachments.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    첨부파일 ({attachments.length}개)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="relative group">
                        {attachment.type && attachment.type.startsWith('image/') ? (
                          <div className="relative">
                            <img 
                              src={attachment.url} 
                              alt={attachment.name}
                              className="w-16 h-16 object-cover rounded border cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => handleImageClick(attachment)}
                              title="클릭하여 원본 보기"
                            />
                            <button
                              onClick={() => handleRemoveAttachment(index)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded min-w-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600 dark:text-orange-400 flex-shrink-0">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14,2 14,8 20,8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                              <polyline points="10,9 9,9 8,9"/>
                            </svg>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate max-w-24 text-gray-800 dark:text-gray-200" title={attachment.name}>
                                {attachment.name}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {attachment.size ? fileUploadService.formatFileSize(attachment.size) : ''}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveAttachment(index)}
                              className="w-4 h-4 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center flex-shrink-0"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 메시지 입력 영역 */}
              <div className="px-3 pt-3 pb-3 flex items-center gap-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 border rounded-lg px-3 py-2 outline-none text-sm resize-none dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-white dark:placeholder-opacity-70 h-10 m-0 leading-normal"
                  placeholder="메시지를 입력하세요..."
                  rows={1}
                  disabled={loadingMessages || uploadingFiles}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputValue.trim() && attachments.length === 0) || loadingMessages || uploadingFiles}
                  className="w-10 h-10 bg-blue-500 dark:bg-blue-800 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-blue-600 dark:hover:bg-blue-900 transition-colors"
                  title="전송"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFiles || loadingMessages}
                  className="w-10 h-10 bg-orange-600 dark:bg-orange-700 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-orange-700 dark:hover:bg-orange-800 transition-colors"
                  title="파일 첨부"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept={STORAGE_CONFIG.LIMITS.ALLOWED_TYPES.join(',')}
                />
              </div>
            </div>
          ) : currentRoomId && currentRoomInfo && currentRoomInfo.status !== 'active' ? (
            <div className="p-4 bg-gray-100 dark:bg-slate-800 border-t dark:border-slate-700 text-center text-gray-500 dark:text-white font-medium">
              {currentRoomInfo.status === 'closed' ?
                '이 상담은 종료되었습니다. 더 이상 메시지를 보낼 수 없습니다.' :
                currentRoomInfo.status === 'archived' ?
                  '이 채팅은 보관 처리되었습니다. 더 이상 메시지를 보낼 수 없습니다.' :
                  '이 채팅은 비활성 상태입니다. 더 이상 메시지를 보낼 수 없습니다.'}
            </div>
          ) : null}
        </div>
      </div>
      
      {/* 이미지 모달 */}
      {isImageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75"
            >
              ×
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.title}
              className="max-w-full max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-white text-center mt-2">{selectedImage.title}</div>
          </div>
        </div>
      )}
    </CommonTemplate>
  );
};

export default ChatManagePage;