import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useAuthContext } from '@/auth';
import { supabase } from '@/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useChat } from '@/hooks/useChat';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUIVisibility } from '@/hooks/useUIVisibility';
import { USER_ROLES, PERMISSION_GROUPS, hasPermission } from '@/config/roles.config';
import { useLogoutContext } from '@/contexts/LogoutContext';
import { fileUploadService } from '@/services/fileUploadService';
import { STORAGE_CONFIG, getUploadPath } from '@/config/storage.config';
import type { AttachmentFile } from '@/types/guarantee-slot.types';
import { toast } from 'sonner';

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
  
  // 파일 첨부 관련 상태
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef<boolean>(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const expandedInputRef = useRef<HTMLInputElement>(null); // 확대 모달용 input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const expandedFileInputRef = useRef<HTMLInputElement>(null); // 확대 모달용 file input ref
  
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
  
  // 메시지가 추가되거나 확대 모달이 열리면 스크롤을 아래로 이동
  useEffect(() => {
    if (messagesEndRef.current && currentRoomId && messages[currentRoomId]?.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentRoomId, isChatExpanded]);
  
  
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
      // 채팅창이 열리면 입력 필드에 포커스
      if (!isOpen) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }
  };
  
  // 메시지 보내기
  const handleSendMessage = async () => {
    // 로그아웃 중이거나 (입력과 첨부파일이 모두 없거나) 사용자가 없으면 중단
    if (isLoggingOut || (!inputValue.trim() && attachments.length === 0) || !currentUser) return;
    
    try {
      if (!currentRoomId) {
        const newRoomId = await createChatRoom([], '운영자와의 대화');
        
        // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
        if (isLoggingOut || !isMountedRef.current) return;
        
        if (newRoomId) {
          await openChatRoom(newRoomId);
          const newMessageContent = inputValue.trim() || (attachments.length > 0 ? '파일을 보냈습니다.' : '');
          await sendChatMessage(newRoomId, newMessageContent, attachments.length > 0 ? attachments : undefined);
          
          // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
          if (isMountedRef.current) {
            setInputValue('');
            setAttachments([]);
            // 포커스 유지 - 확대 모달이면 확대 input에, 아니면 컴팩트 input에
            if (isChatExpanded) {
              expandedInputRef.current?.focus();
            } else {
              inputRef.current?.focus();
            }
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
            const newMessageContent = inputValue.trim() || (attachments.length > 0 ? '파일을 보냈습니다.' : '');
          await sendChatMessage(newRoomId, newMessageContent, attachments.length > 0 ? attachments : undefined);
            
            // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
            if (isMountedRef.current) {
              setInputValue('');
              setAttachments([]);
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
      // 파일 첨부만 있고 메시지가 없으면 기본 메시지 추가
      const messageContent = inputValue.trim() || (attachments.length > 0 ? '파일을 보냈습니다.' : '');
      
      const result = await sendChatMessage(currentRoomId, messageContent, attachments.length > 0 ? attachments : undefined);
      
      // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
      if (isLoggingOut || !isMountedRef.current) return;
      
      if (result) {
        // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
        if (isMountedRef.current) {
          setInputValue('');
          setAttachments([]);
          // 포커스 유지 - 확대 모달이면 확대 input에, 아니면 컴팩트 input에
          if (isChatExpanded) {
            expandedInputRef.current?.focus();
          } else {
            inputRef.current?.focus();
          }
        }
      } else {
        // 메시지 전송 실패 시 - 파일 첨부가 있으면 에러 표시만 하고 새 채팅방 생성하지 않음
        
        if (attachments.length > 0) {
          // 파일 첨부가 있는 경우 새 채팅방 생성하지 않고 에러만 표시
          setError('파일 전송에 실패했습니다. 다시 시도해주세요.');
        } else if (currentUser?.role && !hasPermission(currentUser.role, PERMISSION_GROUPS.ADMIN)) {
          const newRoomId = await createChatRoom([], '운영자와의 대화');
          
          // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 중단
          if (isLoggingOut || !isMountedRef.current) return;
          
          if (newRoomId) {
            await openChatRoom(newRoomId);
            const newMessageContent = inputValue.trim() || (attachments.length > 0 ? '파일을 보냈습니다.' : '');
          await sendChatMessage(newRoomId, newMessageContent, attachments.length > 0 ? attachments : undefined);
            
            // 컴포넌트가 마운트된 상태일 때만 상태 업데이트
            if (isMountedRef.current) {
              setInputValue('');
              setAttachments([]);
            }
          }
        }
      }
    } catch (err: any) {
      // 로그아웃 중이거나 컴포넌트가 언마운트되었으면 에러 메시지 표시하지 않음
      if (isLoggingOut || !isMountedRef.current) return;
      
      setError(err.message || '메시지 전송 중 오류가 발생했습니다.');
    } finally {
      // 항상 포커스 유지 - 확대 모달이면 확대 input에, 아니면 컴팩트 input에
      if (isMountedRef.current) {
        setTimeout(() => {
          if (isChatExpanded) {
            expandedInputRef.current?.focus();
          } else {
            inputRef.current?.focus();
          }
        }, 50);
      }
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
        `chat/${currentUser?.id || 'unknown'}`
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

  // 파일 선택 다이얼로그 열기
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // 이미지 클릭 처리 (모달 보기)
  const handleImageClick = (attachment: AttachmentFile) => {
    setSelectedImage({
      src: attachment.url,
      title: attachment.name
    });
    setIsImageModalOpen(true);
  };

  // 이미지 모달 닫기 함수
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
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setIsChatExpanded(true);
                  setIsOpen(false); // 기본 채팅창 닫기
                  
                  // 확대 모달이 열리면 짧은 딸레이 후 input에 포커스
                  setTimeout(() => {
                    expandedInputRef.current?.focus();
                    // 메시지 끝으로 스크롤
                    if (messagesEndRef.current) {
                      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="text-white/80 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10 transition-colors"
                title="크게 보기"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="chat-sticky-header-close"
              >
                &times;
              </button>
            </div>
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
                    
                    {/* 첨부파일 표시 - 컴팩트 버전 */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment: any, attachIndex: number) => (
                          <div key={attachIndex} className="p-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded">
                            <div className="flex items-center gap-2 mb-2">
                              {fileUploadService.isImageFile({ type: attachment.type } as File) ? (
                                <img 
                                  src={attachment.url} 
                                  alt={attachment.name}
                                  className="w-12 h-12 object-cover rounded cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => handleImageClick(attachment)}
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
                                  {fileUploadService.formatFileSize(attachment.size)}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {/* 이미지 파일인 경우 보기 버튼 */}
                              {fileUploadService.isImageFile({ type: attachment.type } as File) && (
                                <button
                                  onClick={() => handleImageClick(attachment)}
                                  className="text-primary hover:text-primary-dark text-xs px-2 py-1 rounded border border-primary hover:bg-primary/10 transition-colors flex items-center gap-1 flex-1"
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
                                  setDownloadingFile(attachment.url);
                                  const success = await fileUploadService.downloadFile(attachment.url, attachment.name);
                                  if (!success) {
                                    toast.error('파일 다운로드에 실패했습니다.');
                                  }
                                  setDownloadingFile(null);
                                }}
                                disabled={downloadingFile === attachment.url}
                                className="text-primary hover:text-primary-dark text-xs px-2 py-1 rounded border border-primary hover:bg-primary/10 transition-colors flex items-center gap-1 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
          
          {/* 첨부파일 미리보기 */}
          {attachments.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                첨부파일 ({attachments.length}개)
              </div>
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative group">
                    {fileUploadService.isImageFile({ type: attachment.type } as File) ? (
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
                            {fileUploadService.formatFileSize(attachment.size)}
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

          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={STORAGE_CONFIG.LIMITS.ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* 입력 영역 */}
          <div className="chat-sticky-input-area">
            <input
              ref={inputRef}
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
              disabled={loading || loadingMessages || (!inputValue.trim() && attachments.length === 0)}
              className="w-8 h-8 bg-primary hover:bg-primary-dark rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
            <button
              onClick={openFileDialog}
              disabled={loading || loadingMessages || uploadingFiles}
              className="w-8 h-8 bg-orange-600 hover:bg-orange-700 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="파일 첨부"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
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
      
      {/* 확대된 채팅 모달 - Portal로 body에 직접 렌더링 */}
      {isChatExpanded && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsChatExpanded(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 확대 모달 헤더 - ChatSticky 스타일 */}
            <div className="chat-sticky-header">
              <span className="chat-sticky-header-title">
                {currentRoom?.name || '운영자와의 채팅'}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setIsChatExpanded(false);
                    setIsOpen(true); // 기본 채팅창 다시 열기
                  }}
                  className="text-white/80 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10 transition-colors"
                  title="작게 보기"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 14h6m0 0v6m0-6-6 6m10-10h6m0 0v-6m0 6-6-6"/>
                  </svg>
                </button>
                <button 
                  onClick={() => setIsChatExpanded(false)}
                  className="chat-sticky-header-close"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* 확대 모달 메시지 영역 - ChatSticky 스타일 */}
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
                      
                      {/* 첨부파일 표시 - 확대 버전 */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.attachments.map((attachment: any, attachIndex: number) => (
                            <div key={attachIndex} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded">
                              {fileUploadService.isImageFile({ type: attachment.type } as File) ? (
                                <img 
                                  src={attachment.url} 
                                  alt={attachment.name}
                                  className="w-16 h-16 object-cover rounded cursor-pointer hover:scale-110 transition-transform"
                                  onClick={() => handleImageClick(attachment)}
                                  title="클릭하여 원본 보기"
                                />
                              ) : (
                                <div className="w-16 h-16 flex items-center justify-center bg-orange-100 dark:bg-orange-800 rounded">
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600 dark:text-orange-400">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                    <polyline points="10,9 9,9 8,9"/>
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate text-gray-800 dark:text-gray-200" title={attachment.name}>
                                  {attachment.name}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {fileUploadService.formatFileSize(attachment.size)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {attachment.type}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                {/* 이미지 파일인 경우 보기 버튼 */}
                                {fileUploadService.isImageFile({ type: attachment.type } as File) && (
                                  <button
                                    onClick={() => handleImageClick(attachment)}
                                    className="text-primary hover:text-primary-dark text-xs px-2 py-1 rounded border border-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                                    title="원본 보기"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                    setDownloadingFile(attachment.url);
                                    const success = await fileUploadService.downloadFile(attachment.url, attachment.name);
                                    if (!success) {
                                      toast.error('파일 다운로드에 실패했습니다.');
                                    }
                                    setDownloadingFile(null);
                                  }}
                                  disabled={downloadingFile === attachment.url}
                                  className="text-primary hover:text-primary-dark text-xs px-2 py-1 rounded border border-primary hover:bg-primary/10 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="파일 다운로드"
                                >
                                  {downloadingFile === attachment.url ? (
                                    <>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                                        <path d="M12 2v4m0 12v4m8-8h-4M6 12H2m15.364-6.364L14.95 8.05M9.05 14.95l-2.414 2.414M17.364 17.364L14.95 14.95M9.05 9.05L6.636 6.636"/>
                                      </svg>
                                      처리중...
                                    </>
                                  ) : (
                                    <>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

            {/* 확대 모달 첨부파일 미리보기 */}
            {attachments.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  첨부파일 ({attachments.length}개)
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="relative group">
                      {fileUploadService.isImageFile({ type: attachment.type } as File) ? (
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
                              {fileUploadService.formatFileSize(attachment.size)}
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

            {/* 확대 모달 입력 영역 - ChatSticky 스타일 */}
            <div className="chat-sticky-input-area">
              {/* 숨겨진 파일 입력 - 확대 모달용 */}
              <input
                ref={expandedFileInputRef}
                type="file"
                multiple
                accept={STORAGE_CONFIG.LIMITS.ALLOWED_TYPES.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <input
                ref={expandedInputRef}
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
                disabled={loading || loadingMessages || (!inputValue.trim() && attachments.length === 0)}
                className="w-8 h-8 bg-primary hover:bg-primary-dark rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
              <button
                onClick={() => expandedFileInputRef.current?.click()}
                disabled={loading || loadingMessages || uploadingFiles}
                className="w-8 h-8 bg-orange-600 hover:bg-orange-700 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="파일 첨부"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
                </svg>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 이미지 확대 모달 - Portal로 body에 직접 렌더링 */}
      {isImageModalOpen && selectedImage && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 p-4"
          onMouseDown={closeImageModal}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.src}
              alt={selectedImage.title}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl pointer-events-none"
            />
            <button
              className="w-12 h-12 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
              style={{ 
                position: 'fixed',
                top: '16px',
                right: '16px',
                left: 'auto',
                bottom: 'auto',
                zIndex: 1000000,
                pointerEvents: 'auto'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeImageModal();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-200">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-white bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg inline-block shadow-lg">
                {selectedImage.title}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ChatSticky;