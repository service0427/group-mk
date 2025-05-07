import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '@/auth';
import { supabase } from '@/supabase';
import { 
  IMessage, 
  IChatRoom,
  ChatRoomStatus,
  MessageStatus,
  ChatRole
} from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';

export const useChat = () => {
  const { currentUser } = useAuthContext();
  const [rooms, setRooms] = useState<IChatRoom[]>([]);
  const [messages, setMessages] = useState<{[roomId: string]: IMessage[]}>({});
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // ref를 사용하여 최신 상태 값에 접근 (useEffect 의존성 배열 문제 해결)
  const roomsRef = useRef<IChatRoom[]>(rooms);
  const currentRoomIdRef = useRef<string | null>(currentRoomId);
  
  // 상태가 변경될 때마다 ref 업데이트
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);
  
  useEffect(() => {
    currentRoomIdRef.current = currentRoomId;
  }, [currentRoomId]);

  // 채팅방 목록 가져오기
  const fetchChatRooms = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      
      // 현재 사용자가 참여한 채팅방 목록 가져오기
      const { data: participantsData, error: participantsError } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', currentUser.id);
      
      if (participantsError) {
        throw new Error(participantsError.message);
      }
      
      if (!participantsData || participantsData.length === 0) {
        // 참여한 채팅방이 없으면 빈 배열 반환
        setRooms([]);
        setLoading(false);
        return;
      }
      
      const roomIds = participantsData.map((p) => p.room_id);
      
      // 채팅방 정보 가져오기 - last_message 관계 오류로 인해 기본 필드만 조회
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds)
        .order('updated_at', { ascending: false });
      
      if (roomsError) {
        throw new Error(roomsError.message);
      }
      
      // 각 채팅방의 안 읽은 메시지 수 가져오기
      const unreadPromises = roomIds.map(async (roomId) => {
        // 사용자의 마지막 읽은 메시지 ID 가져오기
        const { data: participantData } = await supabase
          .from('chat_participants')
          .select('last_read_message_id')
          .eq('room_id', roomId)
          .eq('user_id', currentUser.id)
          .single();
        
        const lastReadMessageId = participantData?.last_read_message_id;
        
        // 마지막으로 읽은 메시지 이후의 메시지 수 가져오기
        if (lastReadMessageId) {
          const { count } = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact' })
            .eq('room_id', roomId)
            .neq('sender_id', currentUser.id) // 내가 보낸 메시지 제외
            .gt('id', lastReadMessageId); // 마지막으로 읽은 메시지 이후
          
          return { roomId, unreadCount: count || 0 };
        } else {
          // 마지막 읽은 메시지가 없는 경우 모든 메시지 카운트
          const { count } = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact' })
            .eq('room_id', roomId)
            .neq('sender_id', currentUser.id); // 내가 보낸 메시지 제외
          
          return { roomId, unreadCount: count || 0 };
        }
      });
      
      const unreadResults = await Promise.all(unreadPromises);
      const unreadMap = unreadResults.reduce((acc, { roomId, unreadCount }) => {
        acc[roomId] = unreadCount;
        return acc;
      }, {} as {[roomId: string]: number});
      
      // 총 안 읽은 메시지 수 계산
      const totalUnread = unreadResults.reduce((sum, { unreadCount }) => sum + unreadCount, 0);
      setUnreadCount(totalUnread);
      
      // 각 채팅방의 마지막 메시지 정보 가져오기
      const lastMessagesPromises = roomsData
        .filter(room => room.last_message_id) // last_message_id가 있는 경우만
        .map(async (room) => {
          try {
            const { data, error } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('id', room.last_message_id)
              .single();
            
            if (error) {
              console.error(`채팅방 ${room.id}의 마지막 메시지 조회 오류:`, error.message);
              return { roomId: room.id, message: null };
            }
            
            return { roomId: room.id, message: data };
          } catch (err) {
            console.error(`채팅방 ${room.id}의 마지막 메시지 조회 중 오류 발생`, err);
            return { roomId: room.id, message: null };
          }
        });
      
      const lastMessagesResults = await Promise.all(lastMessagesPromises);
      const lastMessagesMap = lastMessagesResults.reduce((acc, { roomId, message }) => {
        if (message) {
          acc[roomId] = message;
        }
        return acc;
      }, {} as {[roomId: string]: any});
      
      // 데이터 변환 및 상태 업데이트 - 별도로 가져온 마지막 메시지 정보 활용
      const formattedRooms: IChatRoom[] = roomsData.map((room) => {
        const lastMessage = lastMessagesMap[room.id];
        return {
          id: room.id,
          name: room.name,
          participants: [],
          lastMessageId: room.last_message_id || null,
          lastMessage: lastMessage?.content || null,
          lastMessageTime: lastMessage?.created_at || null,
          unreadCount: unreadMap[room.id] || 0,
          status: room.status,
          createdAt: room.created_at,
          updatedAt: room.updated_at
        };
      });
      
      setRooms(formattedRooms);
    } catch (err: any) {
      console.error('채팅방 목록을 가져오는 중 오류 발생:', err.message);
      setError(new Error('채팅방 목록을 불러오는데 실패했습니다.'));
      
      // 오류 시 빈 배열로 초기화
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // 특정 채팅방의 메시지 가져오기
  const fetchMessages = useCallback(async (roomId: string, limit = 50) => {
    if (!currentUser?.id || !roomId) return;
    
    try {
      setLoadingMessages(true);
      
      // 메시지 가져오기
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // 데이터 변환
      const formattedMessages: IMessage[] = data.map((message) => ({
        id: message.id,
        roomId: message.room_id,
        senderId: message.sender_id,
        senderName: message.sender_name,
        senderRole: message.sender_role,
        content: message.content,
        timestamp: message.created_at,
        status: message.status,
        isDeleted: message.is_deleted,
        attachments: message.attachments || []
      })).reverse(); // 시간순으로 정렬
      
      // 메시지 상태 업데이트
      setMessages((prev) => ({
        ...prev,
        [roomId]: formattedMessages
      }));
      
      // 메시지를 읽었음을 서버에 알림
      updateLastReadMessage(roomId, formattedMessages[formattedMessages.length - 1]?.id);
      
      // 읽은 후 unreadCount 업데이트
      setRooms((prev) => 
        prev.map((room) => 
          room.id === roomId ? { ...room, unreadCount: 0 } : room
        )
      );
    } catch (err: any) {
      console.error('메시지를 가져오는 중 오류 발생:', err.message);
      setError(new Error('메시지를 불러오는데 실패했습니다.'));
      
      // 오류 시 빈 배열로 초기화
      setMessages((prev) => ({
        ...prev,
        [roomId]: []
      }));
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUser?.id]);

  // 메시지 읽음 상태 업데이트
  const updateLastReadMessage = async (roomId: string, messageId?: string) => {
    if (!currentUser?.id || !roomId || !messageId) return;
    
    try {
      // 참가자 정보 업데이트
      await supabase
        .from('chat_participants')
        .update({
          last_read_message_id: messageId,
          last_seen: new Date().toISOString()
        })
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id);
    } catch (err: any) {
      console.error('읽음 상태 업데이트 중 오류 발생:', err.message);
    }
  };

  // 메시지 전송하기
  const sendMessage = async (roomId: string, content: string, attachments?: any[]) => {
    if (!currentUser?.id || !roomId || !content.trim()) return null;
    
    try {
      // 메시지 생성
      const newMessage = {
        id: uuidv4(),
        room_id: roomId,
        sender_id: currentUser.id,
        sender_name: currentUser.full_name,
        sender_role: currentUser.role as ChatRole,
        content: content.trim(),
        status: MessageStatus.SENT,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attachments: attachments || [],
        is_deleted: false
      };
      
      // 메시지 저장
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([newMessage])
        .select();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // 채팅방 업데이트
      await supabase
        .from('chat_rooms')
        .update({
          last_message_id: newMessage.id,
          updated_at: newMessage.created_at
        })
        .eq('id', roomId);
      
      // 마지막 읽은 메시지 업데이트
      await updateLastReadMessage(roomId, newMessage.id);
      
      // 로컬 메시지 상태 업데이트
      const formattedMessage: IMessage = {
        id: newMessage.id,
        roomId: newMessage.room_id,
        senderId: newMessage.sender_id,
        senderName: newMessage.sender_name || '사용자',
        senderRole: newMessage.sender_role || ChatRole.USER,
        content: newMessage.content,
        timestamp: newMessage.created_at,
        status: newMessage.status,
        attachments: newMessage.attachments
      };
      
      setMessages((prev) => {
        const roomMessages = prev[roomId] || [];
        return {
          ...prev,
          [roomId]: [...roomMessages, formattedMessage]
        };
      });
      
      // 채팅방 목록 업데이트
      setRooms((prev) => 
        prev.map((room) => {
          if (room.id === roomId) {
            return {
              ...room,
              lastMessageId: newMessage.id,
              lastMessage: newMessage.content,
              lastMessageTime: newMessage.created_at,
              updatedAt: newMessage.created_at
            };
          }
          return room;
        }).sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      );
      
      return formattedMessage;
    } catch (err: any) {
      console.error('메시지 전송 중 오류 발생:', err.message);
      return null;
    }
  };

  // 새 채팅방 생성
  const createChatRoom = async (participantIds: string[], name?: string) => {
    if (!currentUser?.id) return null;
    
    try {
      // 여기서 관리자 검사 로직을 제거하고 항상 채팅방 생성 가능하도록 수정
      
      // 채팅방 생성
      const newRoomId = uuidv4();
      const now = new Date().toISOString();
      
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .insert([{
          id: newRoomId,
          name: name || '운영자와의 대화',
          status: ChatRoomStatus.ACTIVE,
          created_at: now,
          updated_at: now
        }]);
      
      if (roomError) {
        throw new Error(roomError.message);
      }
      
      // 참가자 추가 (현재 사용자)
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert([{
          id: uuidv4(),
          room_id: newRoomId,
          user_id: currentUser.id,
          role: currentUser.role || 'user',
          joined_at: now
        }]);
      
      if (participantError) {
        throw new Error(participantError.message);
      }
      
      // 시스템 메시지 추가 (채팅방 생성 메시지)
      const systemMessage = {
        id: uuidv4(),
        room_id: newRoomId,
        sender_id: 'system',
        sender_name: 'System',
        sender_role: ChatRole.SYSTEM,
        content: '채팅방이 생성되었습니다. 문의사항을 남겨주시면 빠르게 답변드리겠습니다.',
        status: MessageStatus.DELIVERED,
        created_at: now,
        updated_at: now
      };
      
      await supabase
        .from('chat_messages')
        .insert([systemMessage]);
      
      // 채팅방 업데이트
      await supabase
        .from('chat_rooms')
        .update({
          last_message_id: systemMessage.id,
        })
        .eq('id', newRoomId);
      
      // 채팅방 리스트 새로고침
      await fetchChatRooms();
      
      return newRoomId;
    } catch (err: any) {
      console.error('채팅방 생성 중 오류 발생:', err.message);
      setError(new Error(err.message));
      return null;
    }
  };

  // 채팅방 열기
  const openChatRoom = async (roomId: string) => {
    setCurrentRoomId(roomId);
    await fetchMessages(roomId);
  };

  // 채팅방 나가기
  const leaveChatRoom = async (roomId: string) => {
    if (!currentUser?.id || !roomId) return false;
    
    try {
      // 참가자 제거
      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // 참가자가 남아있는지 확인
      const { data, error: countError } = await supabase
        .from('chat_participants')
        .select('id', { count: 'exact' })
        .eq('room_id', roomId);
      
      if (countError) {
        throw new Error(countError.message);
      }
      
      // 남은 참가자가 없으면 채팅방 삭제
      if (!data || data.length === 0) {
        await supabase
          .from('chat_rooms')
          .update({ status: ChatRoomStatus.CLOSED })
          .eq('id', roomId);
      }
      
      // 로컬 상태 업데이트
      setRooms((prev) => prev.filter((room) => room.id !== roomId));
      setMessages((prev) => {
        const newMessages = { ...prev };
        delete newMessages[roomId];
        return newMessages;
      });
      
      // 현재 보고 있던 채팅방이면 null로 설정
      if (currentRoomId === roomId) {
        setCurrentRoomId(null);
      }
      
      return true;
    } catch (err: any) {
      console.error('채팅방 나가기 중 오류 발생:', err.message);
      return false;
    }
  };

  // 채팅방 검색하기
  const searchMessages = async (roomId: string, query: string) => {
    if (!currentUser?.id || !roomId || !query.trim()) return [];
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // 데이터 변환
      return data.map((message) => ({
        id: message.id,
        roomId: message.room_id,
        senderId: message.sender_id,
        senderName: message.sender_name,
        senderRole: message.sender_role,
        content: message.content,
        timestamp: message.created_at,
        status: message.status,
        attachments: message.attachments || []
      })).reverse();
    } catch (err: any) {
      console.error('메시지 검색 중 오류 발생:', err.message);
      return [];
    }
  };

  // 컴포넌트 마운트 시 초기 데이터 로드 - 운영자/관리자가 아닌 경우에만 실행
  useEffect(() => {
    // 운영자나 관리자인 경우 채팅 데이터를 로드하지 않음
    if (currentUser?.role && (currentUser.role === 'admin' || currentUser.role === 'operator')) {
      return;
    }
    
    if (currentUser?.id) {
      try {
        fetchChatRooms();
      } catch (err) {
        console.error('Chat: Error fetching initial chat data', err);
      }
    }
  }, [currentUser?.id, currentUser?.role, fetchChatRooms]);

  // 실시간 구독 설정 - 운영자/관리자가 아닌 경우에만 실행
  useEffect(() => {
    // 사용자 정보가 없거나 운영자/관리자인 경우 구독하지 않음
    if (!currentUser?.id) return;
    
    // 운영자나 관리자인 경우 채팅 구독을 설정하지 않음
    if (currentUser.role && (currentUser.role === 'admin' || currentUser.role === 'operator')) {
      return;
    }
    
    // 안전을 위한 rooms 비어있는지 확인
    if (!Array.isArray(rooms)) {
      return;
    }
    
    // 클라이언트 측 재연결 로직
    let retryCount = 0;
    const maxRetries = 5;
    const retryTimeout = 3000; // 3초
    
    const setupSubscription = () => {
      // 새로운 메시지 구독
      const messageChannel = supabase
        .channel('chat-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
          },
          async (payload) => {
            const newMessage = payload.new as any;
            
            // 현재 참여 중인 채팅방의 메시지만 수신 (ref 사용)
            if (roomsRef.current.some((room: IChatRoom) => room.id === newMessage.room_id)) {
              // 데이터 변환
              const formattedMessage: IMessage = {
                id: newMessage.id,
                roomId: newMessage.room_id,
                senderId: newMessage.sender_id,
                senderName: newMessage.sender_name,
                senderRole: newMessage.sender_role,
                content: newMessage.content,
                timestamp: newMessage.created_at,
                status: newMessage.status,
                attachments: newMessage.attachments || []
              };
              
              // 메시지가 현재 보고 있는 채팅방이 아니면 안 읽은 메시지로 카운트 (ref 사용)
              if (currentRoomIdRef.current !== newMessage.room_id && newMessage.sender_id !== currentUser.id) {
                setRooms(prev => 
                  prev.map(room => 
                    room.id === newMessage.room_id
                      ? { 
                          ...room, 
                          unreadCount: (room.unreadCount || 0) + 1,
                          lastMessageId: newMessage.id,
                          lastMessage: newMessage.content,
                          lastMessageTime: newMessage.created_at,
                          updatedAt: newMessage.created_at
                        }
                      : room
                  ).sort((a, b) => 
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                  )
                );
                
                // 총 안 읽은 메시지 수 증가
                setUnreadCount(prev => prev + 1);
              } else if (currentRoomIdRef.current === newMessage.room_id) {
                // 현재 보고 있는 채팅방이면 읽음 처리
                updateLastReadMessage(newMessage.room_id, newMessage.id);
                
                // 채팅방 목록 업데이트
                setRooms(prev => 
                  prev.map(room => 
                    room.id === newMessage.room_id
                      ? { 
                          ...room, 
                          lastMessageId: newMessage.id,
                          lastMessage: newMessage.content,
                          lastMessageTime: newMessage.created_at,
                          updatedAt: newMessage.created_at
                        }
                      : room
                  ).sort((a, b) => 
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                  )
                );
              }
              
              // 메시지 상태 업데이트
              setMessages(prev => {
                const roomMessages = prev[newMessage.room_id] || [];
                
                // 중복 체크
                if (!roomMessages.some(msg => msg.id === formattedMessage.id)) {
                  return {
                    ...prev,
                    [newMessage.room_id]: [...roomMessages, formattedMessage]
                  };
                }
                
                return prev;
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
          },
          (payload) => {
            const updatedMessage = payload.new as any;
            
            // 메시지 상태 업데이트
            setMessages(prev => {
              const roomMessages = prev[updatedMessage.room_id] || [];
              return {
                ...prev,
                [updatedMessage.room_id]: roomMessages.map(msg => 
                  msg.id === updatedMessage.id
                    ? {
                        ...msg,
                        content: updatedMessage.content,
                        status: updatedMessage.status,
                        isDeleted: updatedMessage.is_deleted,
                        attachments: updatedMessage.attachments || []
                      }
                    : msg
                )
              };
            });
            
            // 마지막 메시지 업데이트 (ref 사용)
            if (roomsRef.current.some((room: IChatRoom) => room.lastMessageId === updatedMessage.id)) {
              setRooms(prev => 
                prev.map(room => 
                  room.lastMessageId === updatedMessage.id
                    ? {
                        ...room,
                        lastMessage: updatedMessage.content,
                        updatedAt: updatedMessage.updated_at
                      }
                    : room
                )
              );
            }
          }
        )
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            retryCount = 0;
          } else if (status === 'CHANNEL_ERROR') {            
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(() => {
                setupSubscription();
              }, retryTimeout * retryCount);
            }
          }
        });
      
      // 새로운 채팅방 구독
      const roomChannel = supabase
        .channel('chat-rooms')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_participants',
            filter: `user_id=eq.${currentUser.id}`
          },
          async () => {
            // 새로운 채팅방 추가되면 목록 새로고침
            await fetchChatRooms();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'chat_participants',
            filter: `user_id=eq.${currentUser.id}`
          },
          () => {
            // 참가자에서 제거되면 목록 새로고침
            fetchChatRooms();
          }
        )
        .subscribe();
      
      // 구독 해제 함수 반환
      return () => {
        supabase.removeChannel(messageChannel);
        supabase.removeChannel(roomChannel);
      };
    };
    
    const unsubscribe = setupSubscription();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  // 안전한 의존성 배열 - 로그아웃 시 rooms가 정의되지 않는 문제 방지
  }, [currentUser?.id, fetchChatRooms]);

  return {
    rooms,
    messages,
    currentRoomId,
    loading,
    loadingMessages,
    error,
    unreadCount,
    fetchChatRooms,
    fetchMessages,
    sendMessage,
    createChatRoom,
    openChatRoom,
    leaveChatRoom,
    setCurrentRoomId,
    searchMessages,
    updateLastReadMessage
  };
};