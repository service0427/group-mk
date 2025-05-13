import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommonTemplate } from '@/components/pageTemplate';
import { TiptapViewer, TipTapEditor, TiptapEditorHandle } from '@/components/rich-text-editor';
import { supabase } from '@/supabase';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components/keenicons';

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
}

const NoticeDetail: React.FC<NoticeDetailProps> = ({ notice, onClose }) => {
  // 조회수 증가 처리
  useEffect(() => {
    const updateViewCount = async () => {
      if (notice) {
        try {
          // 비로그인 상태에서도 조회수 증가를 허용하기 위해 RLS 정책이 적절히 설정되어 있어야 함
          await supabase
            .from('notice')
            .update({ view_count: (notice.view_count || 0) + 1 })
            .eq('id', notice.id);
        } catch (error) {
          
        }
      }
    };

    updateViewCount();
  }, [notice]);

  if (!notice) return null;

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

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* 공지사항 제목 */}
      <div className="border-b pb-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          {notice.is_important && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/50 dark:text-red-300">
              중요
            </span>
          )}
          <h1 className="text-2xl font-bold">{notice.title}</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          <span>등록일: {formatDate(notice.created_at)}</span>
          <span className="mx-2">·</span>
          <span>조회수: {notice.view_count || 0}</span>
        </div>
      </div>

      {/* 공지사항 내용 - 스크롤 가능 영역 */}
      <div className="flex-grow overflow-y-auto py-4" style={{ minHeight: '200px', maxHeight: 'calc(80vh - 150px)' }}>
        <TiptapViewer content={notice.content} />
      </div>

      {/* 닫기 버튼 - 고정 푸터 */}
      <div className="flex justify-end pt-4 border-t mt-auto flex-shrink-0">
        <Button onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
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
    <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-border bg-card gap-3">
      {/* 모바일 페이지네이션 - 더 간단하게 */}
      <div className="flex w-full justify-between items-center md:hidden">
        <button
          className="btn btn-sm btn-outline flex items-center gap-1 h-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
          <span>이전</span>
        </button>
        
        <div className="text-sm">
          <span className="font-medium">{currentPage}</span>
          <span className="text-gray-500 mx-1">/</span>
          <span className="text-gray-500">{totalPages}</span>
        </div>
        
        <button
          className="btn btn-sm btn-outline flex items-center gap-1 h-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <span>다음</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </button>
      </div>
      
      {/* 데스크탑 페이지네이션 - 기존 형태 유지 */}
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

      <div className="hidden md:flex items-center gap-3 order-1 md:order-2">
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
      
      {/* 모바일에서는 페이지당 표시 제거 */}
    </div>
  );
};

const NoticePageComponent = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [importantNotices, setImportantNotices] = useState<Notice[]>([]);
  const [normalNotices, setNormalNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // 페이지네이션 관련 상수
  const MAX_IMPORTANT_NOTICES = 5; // 최대 표시할 중요 공지사항 개수

  // 공지사항 목록 가져오기 - 활성화된 공지사항만 표시
  const fetchNotices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. 모든 공지사항 가져오기
      const { data: allNotices, error } = await supabase
        .from('notice')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2. 중요 공지사항과 일반 공지사항 분리
      // 중요 공지사항은 최대 MAX_IMPORTANT_NOTICES개까지만 표시
      const allImportant = allNotices?.filter(notice => notice.is_important) || [];
      const important = allImportant.slice(0, MAX_IMPORTANT_NOTICES);
      const normal = allNotices?.filter(notice => !notice.is_important) || [];

      setImportantNotices(important);

      // 3. 페이지네이션 계산
      setTotalCount(normal.length);
      setTotalPages(Math.max(1, Math.ceil(normal.length / itemsPerPage)));

      // 4. 현재 페이지에 표시할 일반 공지사항 계산
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedNormal = normal.slice(startIndex, startIndex + itemsPerPage);

      setNormalNotices(paginatedNormal);
      setNotices([...important, ...paginatedNormal]);
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

  // 공지사항 상세 열기 - 모달 또는 페이지로 이동
  const openDetail = (notice: Notice, useModal: boolean = false) => {
    if (useModal) {
      // 모달로 열기
      setSelectedNotice(notice);
      setIsDetailOpen(true);
    } else {
      // 상세 페이지로 이동
      navigate(`/notice/${notice.id}`);
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

  return (
    <CommonTemplate
      title="공지사항"
      description="마케팅의 정석 공지사항"
      showPageMenu={false}
    >
      <div className="flex flex-col space-y-4">
        <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          <div className="p-5 border-b">
            <h3 className="text-lg font-medium text-card-foreground">공지사항 목록</h3>
          </div>

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
            <>
              {/* 중요 공지사항 (상단 고정) */}
              {importantNotices.length > 0 && (
                <div className="p-4">
                  {importantNotices.map((notice) => (
                    <div
                      key={notice.id}
                      className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg mb-4 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
                      onClick={() => openDetail(notice)}
                    >
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        {/* 모바일 레이아웃 */}
                        <div className="flex flex-col mb-1 md:hidden">
                          <div className="flex items-center mb-1">
                            <span className="mr-2 inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/50 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-300">
                              중요
                            </span>
                            <h3 className="text-sm font-medium text-red-900 dark:text-red-300 truncate">{notice.title}</h3>
                          </div>
                          <div className="flex justify-end">
                            <span className="text-xs text-red-700 dark:text-red-400 whitespace-nowrap">
                              {formatDate(notice.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        {/* 데스크탑 레이아웃 */}
                        <div className="hidden md:flex items-center md:mb-0">
                          <span className="mr-2 inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/50 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-300">
                            중요
                          </span>
                          <h3 className="text-sm font-medium text-red-900 dark:text-red-300 truncate">{notice.title}</h3>
                        </div>
                        <div className="hidden md:flex items-center justify-end w-auto">
                          <span className="text-sm text-red-700 dark:text-red-400 mr-2 whitespace-nowrap">
                            {formatDate(notice.created_at)}
                          </span>
                          <KeenIcon icon="arrow-right" className="h-4 w-4 text-red-700 dark:text-red-400 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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

              {/* 일반 공지사항 테이블 */}
              <div className="bg-card">
                {/* 데스크톱용 테이블 (md 이상 화면에서만 표시) */}
                <div className="hidden md:block overflow-x-auto">
                  {normalNotices.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      {importantNotices.length > 0
                        ? '일반 공지사항이 없습니다.'
                        : '공지사항이 없습니다.'}
                    </div>
                  ) : (
                    <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-muted dark:bg-gray-800/60">
                          <th className="py-3 px-3 text-center font-medium w-[60px]">No</th>
                          <th className="py-3 px-3 text-start font-medium">제목</th>
                          <th className="py-3 px-3 text-center font-medium w-[100px] hidden md:table-cell">조회수</th>
                          <th className="py-3 px-3 text-center font-medium w-[120px]">등록일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {normalNotices.map((notice, index) => (
                          <tr key={notice.id} className="border-b border-border hover:bg-muted/40 cursor-pointer" onClick={() => openDetail(notice)}>
                            <td className="py-3 px-3 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center">
                                <span className="hover:text-blue-600 font-medium">
                                  {notice.title}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center hidden md:table-cell">{notice.view_count || 0}</td>
                            <td className="py-3 px-3 text-center">{formatDate(notice.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 모바일용 카드 리스트 (md 미만 화면에서만 표시) */}
                <div className="block md:hidden">
                  {normalNotices.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      {importantNotices.length > 0
                        ? '일반 공지사항이 없습니다.'
                        : '공지사항이 없습니다.'}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {normalNotices.map((notice, index) => (
                        <div key={notice.id} className="p-4 hover:bg-muted/40 cursor-pointer border-b" onClick={() => openDetail(notice)}>
                          <div className="flex items-start">
                            <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full min-w-5 h-5 flex items-center justify-center mr-2 mt-0.5">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </span>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                                {notice.title}
                              </h3>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  조회 {notice.view_count || 0}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {formatDate(notice.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
            </>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 p-5">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">공지사항 안내</h3>
          <div className="space-y-2 text-blue-700 dark:text-blue-200 text-sm">
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">중요 공지</span>: 상단 표시된 중요 공지사항을 확인해 주세요.</p>
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">업데이트 사항</span>: 시스템 업데이트, 이용약관 변경 등의 내용이 공지됩니다.</p>
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">이벤트 안내</span>: 마케팅의 정석에서 진행하는 다양한 이벤트를 확인할 수 있습니다.</p>
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">서비스 변경</span>: 서비스 정책이나 기능 변경 사항을 안내해 드립니다.</p>
          </div>
        </div>
      </div>

      {/* 공지사항 상세 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden flex flex-col h-[80vh]">
          <div className="bg-background py-4 px-8 border-b flex-shrink-0">
            <DialogTitle className="text-lg font-medium text-foreground">공지사항</DialogTitle>
          </div>
          <div className="p-8 bg-background flex-grow overflow-hidden">
            <NoticeDetail
              notice={selectedNotice}
              onClose={() => setIsDetailOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </CommonTemplate>
  );
};

export { NoticePageComponent };