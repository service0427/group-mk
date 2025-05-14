import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommonTemplate } from '@/components/pageTemplate';
import { KeenIcon } from '@/components/keenicons';
import { TipTapEditor } from '@/components/rich-text-editor';
import { supabase } from '@/supabase';
import { toast } from 'sonner'; // sonner 라이브러리의 toast 함수 사용

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

// 공지사항 유형 정의
interface Notice {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  is_important: boolean;
  author_id: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string;
  expires_at: string | null;
}

// 공지사항 상세 컴포넌트
interface NoticeDetailProps {
  notice: Notice | null;
  onClose: () => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (notice: Notice) => void;
}

const NoticeDetail: React.FC<NoticeDetailProps> = ({ notice, onClose, onUpdate, onDelete }) => {
  const [title, setTitle] = useState(notice?.title || '');
  const [content, setContent] = useState(notice?.content || '');
  const [isActive, setIsActive] = useState(notice?.is_active || false);
  const [isImportant, setIsImportant] = useState(notice?.is_important || false);
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<any>(null);

  // notice가 변경될 때 상태 업데이트
  useEffect(() => {
    if (notice) {
      setTitle(notice.title || '');
      setContent(notice.content || '');
      setIsActive(notice.is_active || false);
      setIsImportant(notice.is_important || false);
    }
  }, [notice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notice) {
      setIsLoading(true);
      try {
        // 이미 state에 저장된 content 사용
        await onUpdate(notice.id, {
          title,
          content, // 에디터에서 변경 시 setContent로 업데이트된 값 사용
          is_active: isActive,
          is_important: isImportant
        });
        toast("공지사항이 업데이트 되었습니다.");
        onClose();
      } catch (error) {
        toast.error("공지사항 업데이트 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!notice) return null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[80vh] w-full">
      {/* 고정 헤더 영역 (제목, 제목 입력, 내용 레이블, 이미지 첨부 버튼) */}
      <div className="flex-shrink-0 p-3 sm:p-6 w-full bg-background">
        <div className="mb-5 w-full">
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">제목</label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-background focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div className="w-full">
          <label htmlFor="content" className="block text-sm font-medium text-foreground mb-1">내용</label>
        </div>
      </div>
      
      {/* 스크롤 가능한 내용 영역 (에디터만) */}
      <div className="flex-grow overflow-y-auto px-3 sm:px-6 w-full">
        {notice && (
          <TipTapEditor
            key={`notice-${notice.id}`} // 공지사항 ID가 변경될 때마다 컴포넌트를 완전히 새로 생성
            content={content}
            onChange={setContent}
            placeholder="공지사항 내용을 입력하세요..."
          />
        )}
      </div>

      {/* 고정된 하단 설정 및 버튼 영역 */}
      <div className="flex-shrink-0 border-t bg-muted/30 p-3 sm:p-4 w-full overflow-hidden">
        {/* 설정 옵션 */}
        <div className="space-y-2 mb-4 w-full">
          <div className="flex justify-between items-center bg-background p-3 rounded-md">
            <label className="block text-sm font-medium text-foreground min-w-[70px] sm:min-w-[80px]">표시여부</label>
            <div className="flex items-center justify-end gap-3 w-[200px]">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-primary scale-110 sm:scale-125"
              />
              <label htmlFor="isActive" className="text-sm text-foreground whitespace-nowrap w-[120px] text-right">
                {isActive ? '표시됨' : '감춰짐'}
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center bg-background p-3 rounded-md">
            <label className="block text-sm font-medium text-foreground min-w-[70px] sm:min-w-[80px]">중요 공지</label>
            <div className="flex items-center justify-end gap-3 w-[200px]">
              <Switch
                id="isImportant"
                checked={isImportant}
                onCheckedChange={setIsImportant}
                className="data-[state=checked]:bg-primary scale-110 sm:scale-125"
              />
              <label htmlFor="isImportant" className="text-sm text-foreground whitespace-nowrap w-[120px] text-right">
                {isImportant ? '중요 공지' : '일반 공지'}
              </label>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-between space-x-3 pt-2">
          <div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (notice) {
                  onDelete(notice);
                }
                onClose();
              }}
              className="px-4"
              disabled={isLoading}
            >
              삭제하기
            </Button>
          </div>
          <div className="flex space-x-3">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white px-4"
              disabled={isLoading}
            >
              {isLoading ? '저장 중...' : '저장하기'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4"
              disabled={isLoading}
            >
              취소
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

// 새 공지사항 작성 컴포넌트
interface CreateNoticeProps {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const CreateNotice: React.FC<CreateNoticeProps> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isImportant, setIsImportant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<any>(null);

  // CreateNotice 컴포넌트 마운트 시 자동으로 초기화됨

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // state에 저장된 content 사용
      await onSave({
        title,
        content, // 에디터에서 변경 시 setContent로 업데이트된 값
        is_active: isActive,
        is_important: isImportant
      });
      toast("공지사항이 등록되었습니다.");
      onClose();
    } catch (error) {
      toast.error("공지사항 등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[80vh] w-full">
      {/* 고정 헤더 영역 (제목, 제목 입력, 내용 레이블, 이미지 첨부 버튼) */}
      <div className="flex-shrink-0 p-3 sm:p-6 w-full bg-background">
        <div className="mb-5 w-full">
          <label htmlFor="new-title" className="block text-sm font-medium text-foreground mb-1">제목</label>
          <Input
            id="new-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-background focus:ring-primary focus:border-primary"
            placeholder="공지사항 제목을 입력하세요"
            required
          />
        </div>

        <div className="w-full">
          <label htmlFor="new-content" className="block text-sm font-medium text-foreground mb-1">내용</label>
        </div>
      </div>
      
      {/* 스크롤 가능한 내용 영역 (에디터만) */}
      <div className="flex-grow overflow-y-auto px-3 sm:px-6 w-full">
        <TipTapEditor
          key="new-notice"
          content={content}
          onChange={setContent}
          placeholder="공지사항 내용을 입력하세요..."
        />
      </div>

      {/* 고정된 하단 설정 및 버튼 영역 */}
      <div className="flex-shrink-0 border-t bg-muted/30 p-3 sm:p-4 w-full overflow-hidden">
        {/* 설정 옵션 */}
        <div className="space-y-2 mb-4 w-full">
          <div className="flex justify-between items-center bg-background p-3 rounded-md">
            <label className="block text-sm font-medium text-foreground min-w-[70px] sm:min-w-[80px]">표시여부</label>
            <div className="flex items-center justify-end gap-3 w-[200px]">
              <Switch
                id="new-isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-primary scale-110 sm:scale-125"
              />
              <label htmlFor="new-isActive" className="text-sm text-foreground whitespace-nowrap w-[120px] text-right">
                {isActive ? '표시됨' : '감춰짐'}
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center bg-background p-3 rounded-md">
            <label className="block text-sm font-medium text-foreground min-w-[70px] sm:min-w-[80px]">중요 공지</label>
            <div className="flex items-center justify-end gap-3 w-[200px]">
              <Switch
                id="new-isImportant"
                checked={isImportant}
                onCheckedChange={setIsImportant}
                className="data-[state=checked]:bg-primary scale-110 sm:scale-125"
              />
              <label htmlFor="new-isImportant" className="text-sm text-foreground whitespace-nowrap w-[120px] text-right">
                {isImportant ? '중요 공지' : '일반 공지'}
              </label>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end space-x-3 pt-2">
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white px-4"
            disabled={isLoading}
          >
            {isLoading ? '등록 중...' : '등록하기'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-4"
            disabled={isLoading}
          >
            취소
          </Button>
        </div>
      </div>
    </form>
  );
};

// 삭제 확인 대화상자 컴포넌트
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  isLoading: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  isLoading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
        <div className="bg-background py-3 px-6 border-b">
          <DialogTitle className="text-lg font-medium text-foreground">삭제 확인</DialogTitle>
        </div>
        <div className="p-6 bg-background">
          <div className="mb-5">
            <p className="text-foreground">
              <span className="font-medium text-foreground">"{title}"</span> 공지사항을 삭제하시겠습니까?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-2 border-t mt-6">
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white px-4"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? '삭제 중...' : '삭제하기'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4"
              disabled={isLoading}
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 페이지네이션 컴포넌트
interface NoticePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const NoticePagination: React.FC<NoticePaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}) => {
  // 입력 필드에 표시할 페이지 번호 상태
  const [inputPage, setInputPage] = useState<string>(currentPage.toString());

  // 페이지가 변경될 때 입력 필드 업데이트
  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  // 입력 필드에서 엔터 키 처리
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(inputPage);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        onPageChange(pageNum);
      } else {
        // 입력이 유효하지 않으면 현재 페이지로 다시 설정
        setInputPage(currentPage.toString());
      }
    }
  };

  // 입력 필드 값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자만 입력 허용
    const value = e.target.value.replace(/[^0-9]/g, '');
    setInputPage(value);
  };

  // 입력 필드가 포커스를 잃었을 때 처리
  const handleInputBlur = () => {
    const pageNum = parseInt(inputPage);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      // 입력이 유효하지 않으면 현재 페이지로 다시 설정
      setInputPage(currentPage.toString());
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center p-6 border-t border-border bg-card gap-4">
      <div className="hidden md:flex items-center gap-3 order-2 md:order-1 min-w-[200px]">
        <span className="text-sm text-muted-foreground whitespace-nowrap">페이지당 표시:</span>
        <select
          className="select select-sm select-bordered flex-grow min-w-[100px]"
          name="perpage"
          value={itemsPerPage}
          onChange={onItemsPerPageChange}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      <div className="flex items-center gap-3 order-1 md:order-2">
        <div className="flex items-center gap-2">
          <button
            className="btn btn-icon btn-sm btn-light"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
          </button>

          {/* 페이지 입력 필드 및 총 페이지 수 */}
          <div className="flex items-center h-9">
            <div className="h-full flex items-center border border-border rounded shadow-sm bg-background dark:border-gray-600 dark:bg-gray-800 px-2">
              <input
                type="text"
                className="w-7 h-6 px-0 text-center bg-transparent border-0 focus:outline-none dark:text-gray-200"
                value={inputPage}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                aria-label="페이지 번호"
              />
            </div>
            <span className="text-muted-foreground px-2 dark:text-gray-400">/ {totalPages}</span>
          </div>

          <button
            className="btn btn-icon btn-sm btn-light"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const NoticePageComponent = () => {
  // 상태 관리
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // 공지사항 목록 가져오기
  const fetchNotices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 전체 개수 먼저 조회
      const countResponse = await supabase
        .from('notice')
        .select('id', { count: 'exact', head: true });

      if (countResponse.error) throw countResponse.error;

      // 전체 개수 설정 및 페이지 계산
      const count = countResponse.count || 0;
      setTotalCount(count);
      setTotalPages(Math.max(1, Math.ceil(count / itemsPerPage)));

      // 페이지네이션 적용하여 데이터 조회
      const { data, error } = await supabase
        .from('notice')
        .select('*')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      setNotices(data || []);
    } catch (err: any) {

      setError('공지사항을 불러오는데 실패했습니다.');
      toast.error("공지사항 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 공지사항 가져오기
  useEffect(() => {
    fetchNotices();
  }, [currentPage, itemsPerPage]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 페이지당 항목 수 변경 핸들러
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // 페이지당 항목 수 변경 시 첫 페이지로 이동
  };

  // 공지사항 상세 열기
  const openDetail = async (notice: Notice) => {
    try {
      // 선택한 공지사항의 최신 데이터를 다시 가져옴
      const { data, error } = await supabase
        .from('notice')
        .select('*')
        .eq('id', notice.id)
        .single();

      if (error) throw error;

      // 최신 데이터로 상태 업데이트
      setSelectedNotice(data || notice);
      setIsDetailOpen(true);

    } catch (err) {
      console.error('공지사항 상세 조회 오류:', err);
      // 오류 발생 시 원본 데이터 사용
      setSelectedNotice(notice);
      setIsDetailOpen(true);
    }
  };

  // 공지사항 업데이트
  const updateNotice = async (id: string, data: any) => {
    try {
      const { error } = await supabase
        .from('notice')
        .update({
          title: data.title,
          content: data.content,
          is_active: data.is_active,
          is_important: data.is_important,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // 업데이트 후 목록 새로고침
      await fetchNotices();
      return;
    } catch (err) {

      throw err;
    }
  };

  // 새 공지사항 저장
  const saveNewNotice = async (data: any) => {
    try {
      // 로그인한 사용자의 ID 가져오기 (예시)
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData.user?.id;

      const { error } = await supabase
        .from('notice')
        .insert({
          title: data.title,
          content: data.content,
          is_active: data.is_active,
          is_important: data.is_important,
          author_id: userId, // 로그인한 사용자의 ID 
          view_count: 0
        });

      if (error) throw error;

      // 추가 후 목록 새로고침
      await fetchNotices();
    } catch (err) {

      throw err;
    }
  };

  // 공지사항 삭제 확인 다이얼로그 열기
  const openDeleteConfirm = (notice: Notice) => {
    setNoticeToDelete(notice);
    setIsDeleteConfirmOpen(true);
  };

  // 공지사항 삭제 실행
  const confirmDelete = async () => {
    if (noticeToDelete) {
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('notice')
          .delete()
          .eq('id', noticeToDelete.id);

        if (error) throw error;

        // 삭제 후 목록 새로고침
        await fetchNotices();

        toast("공지사항이 삭제되었습니다.");

        setIsDeleteConfirmOpen(false);
        setNoticeToDelete(null);
      } catch (err) {

        toast.error("공지사항 삭제 중 오류가 발생했습니다.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // 활성 상태 변경 핸들러
  const handleToggleActive = async (notice: Notice, newValue: boolean) => {
    try {
      const { error } = await supabase
        .from('notice')
        .update({
          is_active: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', notice.id);

      if (error) throw error;

      // 업데이트 후 목록 새로고침
      await fetchNotices();

      toast(`공지사항이 ${newValue ? '표시' : '숨김'} 상태로 변경되었습니다.`);
    } catch (err) {

      toast.error("상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 날짜 형식 변환 함수
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '-').replace(/\.$/, '');
  };

  // 페이지 이동 관련
  const navigate = useNavigate();
  
  // 새 공지사항 페이지로 이동
  const handleCreateNewNotice = () => {
    navigate('/admin/site/notice/new');
  };
  
  // 공지사항 편집 페이지로 이동
  const handleEditNotice = (noticeId: string) => {
    navigate(`/admin/site/notice/edit/${noticeId}`);
  };
  
  // 툴바 액션 버튼 (새 페이지 이동 방식)
  const toolbarActions = (
    <Button onClick={handleCreateNewNotice}>
      <KeenIcon icon="plus" className="md:me-2 flex-none" />
      <span className="hidden md:inline">새 공지사항</span>
    </Button>
  );

  return (
    <CommonTemplate
      title="공지사항 관리"
      description="관리자 메뉴 > 사이트 관리 > 공지사항 관리"
      toolbarActions={toolbarActions}
      showPageMenu={false}
    >
      <div className="flex flex-col space-y-4">
        <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          <div className="p-5 flex justify-between items-center border-b">
            <h3 className="text-lg font-medium text-card-foreground">공지사항 목록</h3>
          </div>

          {/* 상단 페이지네이션 - 모바일에서는 숨김 */}
          <div className="hidden md:block">
            <NoticePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>

          <div className="overflow-x-hidden w-full">
            {isLoading ? (
              <div className="p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <p>{error}</p>
                <Button
                  variant="outline"
                  onClick={fetchNotices}
                  className="mt-4"
                >
                  다시 시도
                </Button>
              </div>
            ) : (
              <div className="bg-card w-full">
                {/* 데스크톱용 테이블 (md 이상 화면에서만 표시) */}
                <div className="hidden md:block overflow-x-hidden w-full">
                  {notices.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      공지사항이 없습니다
                    </div>
                  ) : (
                    <table className="table align-middle text-sm w-full max-w-full text-left border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-muted dark:bg-gray-800/60">
                          <th className="py-3 px-3 text-center font-medium w-[60px]">No</th>
                          <th className="py-3 px-3 text-start font-medium">제목</th>
                          <th className="py-3 px-3 text-center font-medium w-[100px] hidden md:table-cell">표시 상태</th>
                          <th className="py-3 px-3 text-center font-medium w-[100px] hidden md:table-cell">표시 설정</th>
                          <th className="py-3 px-3 text-center font-medium w-[90px] hidden lg:table-cell">등록일</th>
                          <th className="py-3 px-3 text-center font-medium w-[90px] hidden lg:table-cell">수정일</th>
                          <th className="py-3 px-3 text-center font-medium w-[100px]">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notices.map((notice, index) => (
                          <tr key={notice.id} className="border-b border-border hover:bg-muted/40">
                            <td className="py-3 px-3 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td className="py-3 px-3">
                              <button
                                className="hover:text-blue-600 text-left font-medium truncate max-w-[250px] md:max-w-[350px] lg:max-w-full block"
                                onClick={() => openDetail(notice)}
                                title={notice.title}
                              >
                                {notice.is_important && (
                                  <span className="mr-1 inline-flex items-center justify-center bg-red-100 text-red-800 text-xs font-medium rounded px-1 dark:bg-red-900/50 dark:text-red-300">중요</span>
                                )}
                                {notice.title}
                              </button>
                            </td>
                            <td className="py-3 px-3 text-center hidden md:table-cell">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${notice.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800/70 dark:text-gray-300'
                                }`}>
                                {notice.is_active ? '표시' : '감춤'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center hidden md:table-cell">
                              <div className="flex justify-center">
                                <Switch
                                  checked={notice.is_active}
                                  onCheckedChange={(checked) => handleToggleActive(notice, checked)}
                                />
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center text-sm whitespace-nowrap hidden lg:table-cell">{formatDate(notice.created_at)}</td>
                            <td className="py-3 px-3 text-center text-sm whitespace-nowrap hidden lg:table-cell">{formatDate(notice.updated_at)}</td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex justify-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEditNotice(notice.id)}
                                  className="h-8 w-8"
                                  title="수정"
                                >
                                  <KeenIcon icon="pencil" style="outline" className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => openDeleteConfirm(notice)}
                                  className="h-8 w-8"
                                  title="삭제"
                                >
                                  <KeenIcon icon="trash" style="outline" className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 모바일용 카드 리스트 (md 미만 화면에서만 표시) */}
                <div className="block md:hidden w-full overflow-x-hidden">
                  {notices.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      공지사항이 없습니다
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700 w-full max-w-full">
                      {notices.map((notice, index) => (
                        <div key={notice.id} className="p-4 hover:bg-muted/40">
                          <div className="flex gap-3">
                            {/* 왼쪽 번호 표시 */}
                            <div className="flex-none w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground/60 font-medium text-sm">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </div>

                            {/* 오른쪽 내용 영역 */}
                            <div className="flex-1 min-w-0 max-w-full">
                              {/* 헤더 영역: 제목과 중요 표시 */}
                              <div className="mb-2">
                                <h3 className="font-medium text-foreground flex items-center gap-1 truncate max-w-[95%]" onClick={() => openDetail(notice)}>
                                  {notice.is_important && (
                                    <span className="inline-flex items-center justify-center bg-red-100 text-red-800 text-xs font-medium rounded px-1 dark:bg-red-900/50 dark:text-red-300 flex-shrink-0">중요</span>
                                  )}
                                  <span className="truncate">{notice.title}</span>
                                </h3>
                              </div>

                              {/* 등록일/수정일 정보 */}
                              <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-3">
                                <div className="flex items-center">
                                  <KeenIcon icon="calendar" style="solid" className="mr-1 w-3 h-3" />
                                  <span>등록: {formatDate(notice.created_at)}</span>
                                </div>
                                <div className="flex items-center">
                                  <KeenIcon icon="calendar" style="solid" className="mr-1 w-3 h-3" />
                                  <span>수정: {formatDate(notice.updated_at)}</span>
                                </div>
                              </div>

                              {/* 액션 버튼 영역 */}
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col items-start gap-1">
                                    <span className="text-xs text-muted-foreground">표시:</span>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={notice.is_active}
                                        onCheckedChange={(checked) => handleToggleActive(notice, checked)}
                                      />
                                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${notice.is_active
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800/70 dark:text-gray-300'
                                        }`}>
                                        {notice.is_active ? '표시' : '감춤'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditNotice(notice.id);
                                    }}
                                    className="h-9 w-9"
                                    title="수정"
                                  >
                                    <KeenIcon icon="pencil" style="outline" className="w-5 h-5" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDeleteConfirm(notice);
                                    }}
                                    className="h-9 w-9"
                                    title="삭제"
                                  >
                                    <KeenIcon icon="trash" style="outline" className="w-5 h-5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 하단 페이지네이션 */}
          <NoticePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>

        {/* 안내 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 p-5">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">공지사항 관리 안내</h3>
          <div className="space-y-2 text-blue-700 dark:text-blue-200 text-sm">
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">공지사항 등록</span>: 사용자들에게 중요한 정보나 업데이트 내용을 알리는 데 사용됩니다.</p>
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">표시 설정</span>: '표시' 상태로 설정된 공지사항만 사용자에게 노출됩니다.</p>
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">중요 공지</span>: '중요 공지'로 설정된 공지사항은 상단에 고정되어 노출됩니다.</p>
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">관리 기능</span>: 등록된 공지사항을 수정하거나 삭제할 수 있습니다.</p>
          </div>
        </div>
      </div>

      {/* 공지사항 상세 다이얼로그 */}
      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          // 다이얼로그가 닫힐 때 선택된 공지사항 초기화
          if (!open) {
            setSelectedNotice(null);
          }
          setIsDetailOpen(open);
        }}
      >
        <DialogContent className="max-w-[900px] w-full p-0 overflow-hidden">
          <div className="bg-background py-2 sm:py-3 px-3 sm:px-5 border-b w-full">
            <DialogTitle className="text-base sm:text-lg font-medium text-foreground">공지사항 상세</DialogTitle>
          </div>
          <div className="bg-background flex flex-col max-h-[80vh] w-full">
            <NoticeDetail
              notice={selectedNotice}
              onClose={() => setIsDetailOpen(false)}
              onUpdate={updateNotice}
              onDelete={openDeleteConfirm}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={noticeToDelete?.title || ''}
        isLoading={isDeleting}
      />
    </CommonTemplate>
  );
};

export { NoticePageComponent };