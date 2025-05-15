import React, { useState, useEffect } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { KeenIcon } from '@/components/keenicons';
import { supabase } from '@/supabase';
import { toast } from 'sonner';

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

// FAQ 유형 정의
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
  author_id: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// 카테고리별 배경색 설정
const getCategoryColor = (category: string) => {
  switch (category) {
    case '결제':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case '포인트':
      return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case '계정':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
    case '광고':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
    case '기타':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800/70 dark:text-gray-300';
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
  }
};

// FAQ 카테고리 목록
const faqCategories = ['전체', '결제', '포인트', '계정', '광고', '기타'];

// FAQ 상세 컴포넌트
interface FAQDetailProps {
  faq: FAQ | null;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (faq: FAQ) => void;
}

const FAQDetail: React.FC<FAQDetailProps> = ({ faq, onClose, onUpdate, onDelete }) => {
  const [question, setQuestion] = useState(faq?.question || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [category, setCategory] = useState(faq?.category || '결제');
  const [isActive, setIsActive] = useState(faq?.is_active || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (faq) {
      setIsLoading(true);
      try {
        await onUpdate(faq.id, {
          question,
          answer,
          category,
          is_active: isActive
        });
        toast("FAQ가 업데이트 되었습니다.");
        onClose();
      } catch (error) {
        toast.error("FAQ 업데이트 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!faq) return null;

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5">
        <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">카테고리</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="select w-full p-2 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
          required
        >
          {faqCategories.slice(1).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="mb-5">
        <label htmlFor="question" className="block text-sm font-medium text-foreground mb-1">질문</label>
        <Input
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full bg-background focus:ring-primary focus:border-primary"
          required
        />
      </div>

      <div className="mb-5">
        <label htmlFor="answer" className="block text-sm font-medium text-foreground mb-1">답변</label>
        <textarea
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full min-h-[300px] p-3 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary resize-none textarea-visible-border"
          required
        />
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-foreground">표시여부</label>
          <div className="flex items-center gap-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <label htmlFor="isActive" className="text-sm text-foreground">
              {isActive ? '표시됨' : '감춰짐'}
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between space-x-3 pt-2 border-t mt-6">
        <div>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (faq) {
                onDelete(faq);
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
    </form>
  );
};

// 새 FAQ 작성 컴포넌트
interface CreateFAQProps {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const CreateFAQ: React.FC<CreateFAQProps> = ({ onClose, onSave }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('결제');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        question,
        answer,
        category,
        is_active: isActive
      });
      toast("FAQ가 등록되었습니다.");
      onClose();
    } catch (error) {
      toast.error("FAQ 등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5">
        <label htmlFor="new-category" className="block text-sm font-medium text-foreground mb-1">카테고리</label>
        <select
          id="new-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
          required
        >
          {faqCategories.slice(1).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="mb-5">
        <label htmlFor="new-question" className="block text-sm font-medium text-foreground mb-1">질문</label>
        <Input
          id="new-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full bg-background focus:ring-primary focus:border-primary"
          placeholder="FAQ 질문을 입력하세요"
          required
        />
      </div>

      <div className="mb-5">
        <label htmlFor="new-answer" className="block text-sm font-medium text-foreground mb-1">답변</label>
        <textarea
          id="new-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="FAQ 답변을 입력하세요"
          className="w-full min-h-[300px] p-3 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary resize-none textarea-visible-border"
          required
        />
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-foreground">표시여부</label>
          <div className="flex items-center gap-2">
            <Switch
              id="new-isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <label htmlFor="new-isActive" className="text-sm text-foreground">
              {isActive ? '표시됨' : '감춰짐'}
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-2 border-t mt-6">
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
    </form>
  );
};

// 삭제 확인 대화상자 컴포넌트
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  question: string;
  isLoading: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  question,
  isLoading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
        <DialogHeader className="bg-background py-3 px-6">
          <DialogTitle className="text-lg font-medium text-foreground">삭제 확인</DialogTitle>
        </DialogHeader>
        <div className="p-6 bg-background">
          <div className="mb-5">
            <p className="text-foreground">
              <span className="font-medium text-foreground">"{question}"</span> FAQ를 삭제하시겠습니까?
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
interface FAQPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const FAQPagination: React.FC<FAQPaginationProps> = ({
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

const FAQPageComponent = () => {
  // 상태 관리
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [faqToDelete, setFAQToDelete] = useState<FAQ | null>(null);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [isDeleting, setIsDeleting] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // FAQ 목록 가져오기
  const fetchFAQs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 전체 개수 먼저 조회 (필터링 적용)
      let countQuery = supabase
        .from('faq')
        .select('id', { count: 'exact', head: true });

      // 카테고리 필터링 적용
      if (activeCategory !== '전체') {
        countQuery = countQuery.eq('category', activeCategory);
      }

      const countResponse = await countQuery;

      if (countResponse.error) throw countResponse.error;

      // 전체 개수 설정 및 페이지 계산
      const count = countResponse.count || 0;
      setTotalCount(count);
      setTotalPages(Math.max(1, Math.ceil(count / itemsPerPage)));

      // 페이지네이션 및 필터링 적용하여 데이터 조회
      let dataQuery = supabase
        .from('faq')
        .select('*')
        .order('created_at', { ascending: false });

      // 카테고리 필터링 적용
      if (activeCategory !== '전체') {
        dataQuery = dataQuery.eq('category', activeCategory);
      }

      // 페이지네이션 적용
      dataQuery = dataQuery.range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      const { data, error } = await dataQuery;

      if (error) throw error;
      setFAQs(data || []);
    } catch (err: any) {

      setError('FAQ를 불러오는데 실패했습니다.');
      toast.error("FAQ 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 FAQ 가져오기
  useEffect(() => {
    fetchFAQs();
  }, [currentPage, itemsPerPage, activeCategory]);

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

  // FAQ 상세 열기
  const openDetail = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setIsDetailOpen(true);
  };

  // FAQ 업데이트
  const updateFAQ = async (id: string, data: any) => {
    try {
      const { error } = await supabase
        .from('faq')
        .update({
          question: data.question,
          answer: data.answer,
          category: data.category,
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // 업데이트 후 목록 새로고침
      await fetchFAQs();
      return;
    } catch (err) {

      throw err;
    }
  };

  // 활성 상태 변경 핸들러
  const handleToggleActive = async (faq: FAQ, newValue: boolean) => {
    try {
      const { error } = await supabase
        .from('faq')
        .update({
          is_active: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', faq.id);

      if (error) throw error;

      // 업데이트 후 목록 새로고침
      await fetchFAQs();

      toast(`FAQ가 ${newValue ? '표시' : '숨김'} 상태로 변경되었습니다.`);
    } catch (err) {

      toast.error("상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 새 FAQ 저장
  const saveNewFAQ = async (data: any) => {
    try {
      // 로그인한 사용자의 ID 가져오기
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData.user?.id;

      const { error } = await supabase
        .from('faq')
        .insert({
          question: data.question,
          answer: data.answer,
          category: data.category,
          is_active: data.is_active,
          author_id: userId
        });

      if (error) throw error;

      // 추가 후 목록 새로고침
      await fetchFAQs();
    } catch (err) {

      throw err;
    }
  };

  // FAQ 삭제 확인 다이얼로그 열기
  const openDeleteConfirm = (faq: FAQ) => {
    setFAQToDelete(faq);
    setIsDeleteConfirmOpen(true);
  };

  // FAQ 삭제 실행
  const confirmDelete = async () => {
    if (faqToDelete) {
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('faq')
          .delete()
          .eq('id', faqToDelete.id);

        if (error) throw error;

        // 삭제 후 목록 새로고침
        await fetchFAQs();

        toast("FAQ가 삭제되었습니다.");

        setIsDeleteConfirmOpen(false);
        setFAQToDelete(null);
      } catch (err) {

        toast.error("FAQ 삭제 중 오류가 발생했습니다.");
      } finally {
        setIsDeleting(false);
      }
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

  // 툴바 액션 버튼
  const toolbarActions = (
    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
      <DialogTrigger asChild>
        <Button>
          <KeenIcon icon="plus" className="md:me-2 flex-none" />
          <span className="hidden md:inline">새 FAQ 등록</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <DialogHeader className="bg-background py-4 px-8">
          <DialogTitle className="text-lg font-medium text-foreground">새 FAQ 작성</DialogTitle>
        </DialogHeader>
        <div className="p-8 bg-background">
          <CreateFAQ
            onClose={() => setIsCreateOpen(false)}
            onSave={saveNewFAQ}
          />
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <CommonTemplate
      title="FAQ 관리"
      description="관리자 메뉴 > 사이트 관리 > FAQ 관리"
      toolbarActions={toolbarActions}
      showPageMenu={false}
    >
      <div className="flex flex-col space-y-4">
        {/* 카테고리 필터 */}
        <div className="bg-card rounded-lg shadow-sm p-5 border border-border">
          <div className="flex flex-wrap gap-2">
            {faqCategories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => {
                  setActiveCategory(category);
                  setCurrentPage(1); // 카테고리 변경 시 첫 페이지로 이동
                }}
                className={`${activeCategory === category ? 'bg-primary text-white' : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          <div className="p-5 flex justify-between items-center border-b">
            <h3 className="text-lg font-medium text-card-foreground">FAQ 목록 ({activeCategory})</h3>
          </div>

          {/* 상단 페이지네이션 - 모바일에서는 숨김 */}
          <div className="hidden md:block">
            <FAQPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <p>{error}</p>
                <Button
                  variant="outline"
                  onClick={fetchFAQs}
                  className="mt-4"
                >
                  다시 시도
                </Button>
              </div>
            ) : (
              <div className="bg-card">
                {/* 데스크톱용 테이블 (md 이상 화면에서만 표시) */}
                <div className="hidden md:block overflow-x-auto">
                  {faqs.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      FAQ가 없습니다
                    </div>
                  ) : (
                    <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-muted dark:bg-gray-800/60">
                          <th className="py-3 px-3 text-center font-medium w-[60px]">No</th>
                          <th className="py-3 px-3 text-center font-medium w-[100px] hidden md:table-cell">카테고리</th>
                          <th className="py-3 px-3 text-start font-medium">질문</th>
                          <th className="py-3 px-3 text-center font-medium w-[100px] hidden md:table-cell">표시 상태</th>
                          <th className="py-3 px-3 text-center font-medium w-[100px] hidden md:table-cell">표시 설정</th>
                          <th className="py-3 px-3 text-center font-medium w-[90px] hidden lg:table-cell">등록일</th>
                          <th className="py-3 px-3 text-center font-medium w-[90px] hidden lg:table-cell">수정일</th>
                          <th className="py-3 px-3 text-center font-medium w-[100px]">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faqs.map((faq, index) => (
                          <tr key={faq.id} className="border-b border-border hover:bg-muted/40">
                            <td className="py-3 px-3 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td className="py-3 px-3 text-center hidden md:table-cell">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(faq.category)}`}>
                                {faq.category}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <button
                                className="hover:text-blue-600 text-left font-medium truncate max-w-[250px] md:max-w-[350px] lg:max-w-full block"
                                onClick={() => openDetail(faq)}
                                title={faq.question}
                              >
                                {faq.question}
                              </button>
                            </td>
                            <td className="py-3 px-3 text-center hidden md:table-cell">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${faq.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800/70 dark:text-gray-300'
                                }`}>
                                {faq.is_active ? '표시' : '감춤'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center hidden md:table-cell">
                              <div className="flex justify-center">
                                <Switch
                                  checked={faq.is_active}
                                  onCheckedChange={(checked) => handleToggleActive(faq, checked)}
                                />
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center text-sm whitespace-nowrap hidden lg:table-cell">{formatDate(faq.created_at)}</td>
                            <td className="py-3 px-3 text-center text-sm whitespace-nowrap hidden lg:table-cell">{formatDate(faq.updated_at)}</td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex justify-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => openDetail(faq)}
                                  className="h-8 w-8"
                                  title="수정"
                                >
                                  <KeenIcon icon="pencil" style="outline" className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => openDeleteConfirm(faq)}
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
                <div className="block md:hidden">
                  {faqs.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      FAQ가 없습니다
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {faqs.map((faq, index) => (
                        <div key={faq.id} className="p-4 hover:bg-muted/40">
                          <div className="flex gap-3">
                            {/* 왼쪽 번호 표시 */}
                            <div className="flex-none w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground/60 font-medium text-sm">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </div>

                            {/* 오른쪽 내용 영역 */}
                            <div className="flex-1 min-w-0">
                              {/* 헤더 영역: 제목만 표시 */}
                              <div className="mb-2">
                                <h3 className="font-medium text-foreground truncate" onClick={() => openDetail(faq)}>
                                  {faq.question}
                                </h3>
                              </div>

                              {/* 카테고리 정보 */}
                              <div className="mb-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(faq.category)}`}>
                                  {faq.category}
                                </span>
                              </div>

                              {/* 등록일/수정일 정보 */}
                              <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-3">
                                <div className="flex items-center">
                                  <KeenIcon icon="calendar" style="solid" className="mr-1 w-3 h-3" />
                                  <span>등록: {formatDate(faq.created_at)}</span>
                                </div>
                                <div className="flex items-center">
                                  <KeenIcon icon="calendar" style="solid" className="mr-1 w-3 h-3" />
                                  <span>수정: {formatDate(faq.updated_at)}</span>
                                </div>
                              </div>

                              {/* 액션 버튼 영역 */}
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1 xs:gap-2">
                                    <span className="text-xs text-muted-foreground">표시:</span>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={faq.is_active}
                                        onCheckedChange={(checked) => handleToggleActive(faq, checked)}
                                      />
                                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${faq.is_active
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800/70 dark:text-gray-300'
                                        }`}>
                                        {faq.is_active ? '표시' : '감춤'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDetail(faq);
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
                                      openDeleteConfirm(faq);
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
          <FAQPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 p-5">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">FAQ 관리 안내</h3>
          <div className="space-y-2 text-blue-700 dark:text-blue-200 text-sm">
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">카테고리 분류</span>: 사용자들이 쉽게 원하는 정보를 찾을 수 있도록 카테고리별로 구분합니다.</p>
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">표시 설정</span>: '표시' 상태로 설정된 FAQ만 사용자에게 노출됩니다.</p>
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">간결한 작성</span>: 질문은 명확하고 간결하게, 답변은 이해하기 쉽게 작성하세요.</p>
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">주기적 업데이트</span>: 사용자의 문의가 많은 내용을 FAQ에 추가해 고객서비스 효율을 높이세요.</p>
          </div>
        </div>
      </div>

      {/* FAQ 상세 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          <DialogHeader className="bg-background py-4 px-8">
            <DialogTitle className="text-lg font-medium text-foreground">FAQ 상세</DialogTitle>
          </DialogHeader>
          <div className="p-8 bg-background">
            <FAQDetail
              faq={selectedFAQ}
              onClose={() => setIsDetailOpen(false)}
              onUpdate={updateFAQ}
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
        question={faqToDelete?.question || ''}
        isLoading={isDeleting}
      />
    </CommonTemplate>
  );
};

export { FAQPageComponent };