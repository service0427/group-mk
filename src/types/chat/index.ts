// 채팅 관련 타입 정의

export enum MessageStatus {
  PENDING = 'pending', // 전송 중
  SENT = 'sent',      // 전송됨
  DELIVERED = 'delivered', // 상대방 받음
  READ = 'read',      // 읽음
  FAILED = 'failed'   // 전송 실패
}

export enum ChatRole {
  USER = 'user',       // 일반 사용자
  ADMIN = 'admin',     // 관리자
  OPERATOR = 'operator', // 운영자
  SYSTEM = 'system'    // 시스템 메시지
}

export interface IMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: ChatRole;
  content: string;
  timestamp: string;
  status: MessageStatus;
  attachments?: IAttachment[];
  isDeleted?: boolean;
}

export interface IAttachment {
  id: string;
  messageId: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size?: number;
  thumbnail?: string;
}

export enum ChatRoomStatus {
  ACTIVE = 'active',       // 활성화
  ARCHIVED = 'archived',   // 보관됨
  CLOSED = 'closed'        // 닫힘
}

export interface IChatRoom {
  id: string;
  name?: string;
  participants: string[];
  lastMessageId?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  status: ChatRoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  id: string;
  roomId: string;
  userId: string;
  role: ChatRole;
  joinedAt: string;
  lastReadMessageId?: string;
  lastSeen?: string;
}

export interface ChatState {
  currentRoomId: string | null;
  rooms: IChatRoom[];
  messages: {
    [roomId: string]: IMessage[];
  };
  loading: boolean;
  error: Error | null;
}