import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Keyword, KeywordGroup, KeywordInput, PaginationParams } from '../types';
import { useKeywordFieldConfig } from '../hooks/useKeywordFieldConfig';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CampaignSlotWithKeywordModal } from '@/components/campaign-modals';

interface KeywordTableProps {
  keywords: Keyword[];
  totalKeywords: number;
  selectedGroup: KeywordGroup | null;
  pagination: PaginationParams;
  isLoading: boolean;
  onUpdateKeyword: (keywordId: number, data: Partial<Keyword>) => Promise<boolean>;
  onDeleteKeyword: (keywordId: number) => Promise<boolean>;
  onCreateKeyword: (keywordData: KeywordInput) => Promise<boolean>;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSearch: (search: string) => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onOpenUploadModal?: () => void; // 엑셀 업로드 모달 열기
  selectedKeywordIds?: number[]; // 선택된 키워드 ID 목록
  onSelectionChange?: (ids: number[]) => void; // 선택 변경 핸들러
  onMoveKeywords?: () => void; // 키워드 이동/복사 모달 열기
}

const KeywordTable: React.FC<KeywordTableProps> = ({
  keywords,
  totalKeywords,
  selectedGroup,
  pagination,
  isLoading,
  onUpdateKeyword,
  onDeleteKeyword,
  onCreateKeyword,
  onPageChange,
  onLimitChange,
  onSearch,
  onSort,
  onOpenUploadModal,
  selectedKeywordIds = [],
  onSelectionChange,
  onMoveKeywords,
}) => {
  // 키워드 필드 설정 훅 사용
  const { getFieldConfig, isRequired, isHidden } = useKeywordFieldConfig(selectedGroup?.campaignType);

  // 상태 관리
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const [editingKeywordId, setEditingKeywordId] = useState<number | null>(null);

  // 알림 모달 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  const [dialogType, setDialogType] = useState<'error' | 'success'>('error');

  // 삭제 확인 모달 상태
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // 입력 상태 관리
  const [newKeywordData, setNewKeywordData] = useState<KeywordInput>({
    mainKeyword: '',
    mid: undefined,
    url: '',
    keyword1: '',
    keyword2: '',
    keyword3: '',
    description: '',
    isActive: true, // 기본값을 활성 상태로 설정
  });

  // 편집 상태 관리
  const [editingKeywordData, setEditingKeywordData] = useState<KeywordInput>({
    mainKeyword: '',
    mid: undefined,
    url: '',
    keyword1: '',
    keyword2: '',
    keyword3: '',
    description: '',
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mainKeywordRef = useRef<HTMLInputElement>(null);
  const midRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const keyword1Ref = useRef<HTMLInputElement>(null);
  const keyword2Ref = useRef<HTMLInputElement>(null);
  const keyword3Ref = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  // 캠페인 빠른 구매 모달 상태
  const [quickBuyModalOpen, setQuickBuyModalOpen] = useState(false);
  const [quickBuyKeyword, setQuickBuyKeyword] = useState<Keyword | null>(null);

  // 필드별 라벨과 플레이스홀더 가져오기
  const getFieldLabel = (fieldName: string, defaultLabel: string) => {
    const config = getFieldConfig(fieldName);
    return config?.label || defaultLabel;
  };

  const getFieldPlaceholder = (fieldName: string, defaultPlaceholder: string) => {
    const config = getFieldConfig(fieldName);
    return config?.placeholder || defaultPlaceholder;
  };

  // 테이블 헤더 렌더링
  const renderTableHeaders = () => {
    const headers = [
      { field: 'main_keyword', defaultLabel: '메인 키워드', sortable: true, align: 'left', mobileWidth: 'flex-1' },
      { field: 'service', defaultLabel: '사용중', sortable: false, align: 'center', alwaysShow: true, mobileWidth: 'w-[50px]' },
      { field: 'mid', defaultLabel: 'MID', sortable: true, align: 'center', mobileWidth: 'w-[60px]' },
      { field: 'url', defaultLabel: 'URL', sortable: false, align: 'left', mobileHidden: true },
      { field: 'keywords', defaultLabel: '키워드', sortable: false, align: 'left', mobileHidden: true },
      { field: 'status', defaultLabel: '상태', sortable: true, align: 'center', mobileWidth: 'w-[50px]' },
      { field: 'description', defaultLabel: '설명', sortable: false, align: 'left', mobileHidden: true },
      { field: 'created_at', defaultLabel: '등록일', sortable: true, align: 'center', mobileHidden: true },
      { field: 'actions', defaultLabel: '작업', sortable: false, align: 'center', alwaysShow: true, mobileWidth: 'w-[60px]' }
    ];

    return headers.map((header) => {
      // alwaysShow가 true가 아닌 필드만 숨김 체크
      if (!header.alwaysShow && header.field !== 'keywords' && isHidden(header.field)) {
        return null;
      }

      let label = header.defaultLabel;

      if (header.field === 'keywords') {
        // keywords 필드는 keyword1, keyword2, keyword3의 라벨을 조합해서 표시
        const keyword1Label = getFieldLabel('keyword1', '키워드1');
        const keyword2Label = getFieldLabel('keyword2', '키워드2');
        const keyword3Label = getFieldLabel('keyword3', '키워드3');

        // 보이는 키워드 필드들의 라벨을 조합
        const visibleKeywordLabels = [];
        if (!isHidden('keyword1')) visibleKeywordLabels.push(keyword1Label);
        if (!isHidden('keyword2')) visibleKeywordLabels.push(keyword2Label);
        if (!isHidden('keyword3')) visibleKeywordLabels.push(keyword3Label);

        // keyword1, keyword2, keyword3이 모두 숨김이면 keywords 헤더도 숨김
        if (visibleKeywordLabels.length === 0) {
          return null;
        }

        label = visibleKeywordLabels.join('/');
      } else if (!header.alwaysShow) {
        // 동적 필드는 설정된 라벨 사용
        label = getFieldLabel(header.field, header.defaultLabel);
      }


      // 모바일에서 숨길 컬럼 체크
      const mobileHiddenClass = header.mobileHidden ? 'hidden sm:table-cell' : '';
      
      // 모바일 너비 클래스
      const mobileWidthClass = header.mobileWidth || '';
      
      // 작업 컬럼 특별 처리
      const actionWidthClass = header.field === 'actions' ? 'w-[60px] sm:w-[110px]' : '';

      return (
        <th
          key={header.field}
          scope="col"
          className={`${mobileHiddenClass} ${mobileWidthClass} ${actionWidthClass} px-1 sm:px-2 py-2 text-${header.align} text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider ${header.sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
          onClick={header.sortable ? () => handleSort(header.field) : undefined}
        >
          <span className="block truncate">{label}</span>
          {header.sortable && renderSortArrow(header.field)}
        </th>
      );
    }).filter(Boolean);
  };

  // 보이는 열의 개수 계산
  const getVisibleColumnCount = () => {
    let count = 2; // 기본: service(사용중) + actions (사용중과 작업 열은 항상 표시)
    if (!isHidden('main_keyword')) count++;
    if (!isHidden('mid')) count++;
    if (!isHidden('url')) count++;
    if (!isHidden('description')) count++;
    if (!isHidden('status')) count++;
    if (!isHidden('created_at')) count++;

    // keywords 열은 keyword1, keyword2, keyword3 중 하나라도 보이면 표시
    if (!isHidden('keyword1') || !isHidden('keyword2') || !isHidden('keyword3')) count++;
    return count;
  };

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchText);
  };

  // 정렬 핸들러
  const handleSort = (field: string) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);

    if (onSort) {
      // status 필드로 정렬 요청 시 is_active로 변환
      const actualField = field === 'status' ? 'is_active' : field;
      onSort(actualField, newDirection);
    }
  };

  // 정렬 화살표 렌더링 함수
  const renderSortArrow = (field: string) => {
    if (field !== sortField) return null;

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
      </svg>
    ) : (
      <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    );
  };

  // 편집 시작 핸들러
  const handleStartEditing = (keyword: Keyword) => {
    setEditingKeywordId(keyword.id);
    setEditingKeywordData({
      mainKeyword: keyword.mainKeyword,
      mid: keyword.mid,
      url: keyword.url || '',
      keyword1: keyword.keyword1 || '',
      keyword2: keyword.keyword2 || '',
      keyword3: keyword.keyword3 || '',
      description: keyword.description || '',
    });
  };

  // 편집 취소 핸들러
  const handleCancelEditing = () => {
    setEditingKeywordId(null);
  };

  // 편집 저장 핸들러
  const handleSaveEditing = async (keywordId: number) => {
    const success = await onUpdateKeyword(keywordId, {
      /*
      mainKeyword: editingKeywordData.mainKeyword.trim(),
      mid: editingKeywordData.mid,
      url: editingKeywordData.url ? editingKeywordData.url.trim() : undefined,
      keyword1: editingKeywordData.keyword1 ? editingKeywordData.keyword1.trim() : undefined,
      keyword2: editingKeywordData.keyword2 ? editingKeywordData.keyword2.trim() : undefined,
      keyword3: editingKeywordData.keyword3 ? editingKeywordData.keyword3.trim() : undefined,
      */
      description: editingKeywordData.description ? editingKeywordData.description.trim() : undefined
    });

    if (success) {
      setEditingKeywordId(null);
    }
  };

  // 키워드 활성/비활성 토글 핸들러
  const handleToggleActive = async (keywordId: number, currentStatus: boolean) => {
    await onUpdateKeyword(keywordId, { isActive: !currentStatus });
  };

  // 알림 다이얼로그 표시 함수
  const showDialog = (title: string, description: string, type: 'error' | 'success' = 'error') => {
    setDialogTitle(title);
    setDialogDescription(description);
    setDialogType(type);
    setDialogOpen(true);
  };

  // 키워드 삭제 핸들러
  const handleDeleteKeyword = (keywordId: number) => {
    setDeleteTargetId(keywordId);
    setDeleteConfirmOpen(true);
  };

  // 삭제 확인 핸들러
  const confirmDelete = async () => {
    if (deleteTargetId) {
      await onDeleteKeyword(deleteTargetId);
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  // URL 유효성 검사 함수
  const isValidUrl = (urlString: string): boolean => {
    if (!urlString) return true; // 빈 문자열은 허용 (선택 필드)

    try {
      const url = new URL(urlString);
      // http 또는 https 프로토콜만 허용
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
      // URL 구조가 잘못된 경우
      return false;
    }
  };

  // 새 키워드 추가 핸들러
  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newKeywordData.mainKeyword.trim()) return;

    // URL 유효성 검사
    if (newKeywordData.url && !isValidUrl(newKeywordData.url)) {
      showDialog('URL 형식 오류', '올바른 URL 형식이 아닙니다.\n예: https://example.com', 'error');
      return;
    }

    // isActive 속성이 있는지 확인하고, 없으면 true로 설정
    const keywordToAdd = {
      ...newKeywordData,
      isActive: newKeywordData.isActive !== undefined ? newKeywordData.isActive : true
    };

    const success = await onCreateKeyword(keywordToAdd);

    if (success) {
      setNewKeywordData({
        mainKeyword: '',
        mid: undefined,
        url: '',
        keyword1: '',
        keyword2: '',
        keyword3: '',
        description: '',
        isActive: true, // 기본값 유지
      });
      // 첫 입력 필드로 포커스 이동
      if (mainKeywordRef.current) {
        mainKeywordRef.current.focus();
      }
    }
  };

  // 새 키워드 입력 핸들러
  const handleNewKeywordChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof KeywordInput
  ) => {
    const value = e.target.value;
    setNewKeywordData(prev => ({
      ...prev,
      [field]: field === 'mid' ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  // 편집 중인 키워드 입력 핸들러
  const handleEditingKeywordChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof KeywordInput
  ) => {
    const value = e.target.value;
    setEditingKeywordData(prev => ({
      ...prev,
      [field]: field === 'mid' ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(totalKeywords / pagination.limit);
  const paginationRange = 2; // 현재 페이지 양쪽에 보여줄 페이지 수

  const renderPaginationButtons = () => {
    const buttons = [];

    // 첫 페이지로 이동 버튼
    buttons.push(
      <button
        key="first"
        onClick={() => onPageChange(1)}
        disabled={pagination.page === 1 || isLoading}
        className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
      >
        &laquo;
      </button>
    );

    // 이전 페이지로 이동 버튼
    buttons.push(
      <button
        key="prev"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={pagination.page === 1 || isLoading}
        className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
      >
        &lt;
      </button>
    );

    // 페이지 번호 버튼들
    const startPage = Math.max(1, pagination.page - paginationRange);
    const endPage = Math.min(totalPages, pagination.page + paginationRange);

    // 시작 페이지가 1보다 크면 첫 페이지 표시
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          1
        </button>
      );

      // 생략 표시
      if (startPage > 2) {
        buttons.push(
          <span key="dots1" className="px-1 sm:px-3 py-1 text-xs sm:text-sm dark:text-white">
            ...
          </span>
        );
      }
    }

    // 페이지 번호들
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md ${pagination.page === i
            ? 'bg-primary-500 text-white'
            : 'border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
            }`}
        >
          {i}
        </button>
      );
    }

    // 마지막 페이지가 totalPages보다 작으면 마지막 페이지 표시
    if (endPage < totalPages) {
      // 생략 표시
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="dots2" className="px-1 sm:px-3 py-1 text-xs sm:text-sm dark:text-white">
            ...
          </span>
        );
      }

      buttons.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          {totalPages}
        </button>
      );
    }

    // 다음 페이지로 이동 버튼
    buttons.push(
      <button
        key="next"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page === totalPages || isLoading}
        className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
      >
        &gt;
      </button>
    );

    // 마지막 페이지로 이동 버튼
    buttons.push(
      <button
        key="last"
        onClick={() => onPageChange(totalPages)}
        disabled={pagination.page === totalPages || isLoading}
        className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
      >
        &raquo;
      </button>
    );

    return buttons;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
          <h2 className="text-sm sm:text-base font-bold text-blue-800 dark:text-blue-300">
            {selectedGroup ? `${selectedGroup.name} 키워드` : '키워드 관리'}
            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
              총 {totalKeywords}개
            </span>
          </h2>

          {/* 검색 폼 */}
          <div className="flex flex-wrap w-full sm:w-auto gap-2">
            <form onSubmit={handleSearch} className="flex flex-1 sm:flex-initial">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="키워드 검색"
                className="flex-1 px-2 py-1 text-xs border border-blue-300 dark:border-blue-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-0"
                ref={searchInputRef}
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 sm:px-3 py-1 rounded-r-md"
              >
                검색
              </button>
            </form>
            {selectedGroup && (() => {
              const serviceType = selectedGroup.campaignType;
              const upperServiceType = serviceType?.toUpperCase() || '';

              // NS 또는 NP 서비스인지 확인
              const isNaverService = upperServiceType.includes('PLACE') ||
                upperServiceType.includes('NP') ||
                serviceType?.includes('NaverPlace') ||
                upperServiceType.includes('SHOPPING') ||
                upperServiceType.includes('NS') ||
                serviceType?.includes('NaverShopping');

              // 네이버 서비스인 경우에만 버튼 표시
              if (isNaverService) {
                return (
                  <Button
                    onClick={() => {
                      // 서비스 타입에 따라 적절한 검색 페이지로 이동
                      if (upperServiceType.includes('PLACE') ||
                        upperServiceType.includes('NP') ||
                        serviceType?.includes('NaverPlace')) {
                        navigate('/search-place');
                      } else {
                        navigate('/search-shop');
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-purple-500 hover:bg-purple-600 text-white border-purple-500 hover:border-purple-600"
                  >
                    검색으로 등록하기
                  </Button>
                );
              }
              return null;
            })()}
            {selectedKeywordIds.length > 0 && (
              <>
                <Button
                  onClick={() => {
                    if (selectedKeywordIds.length === keywords.length) {
                      onSelectionChange?.([]);
                    } else {
                      onSelectionChange?.(keywords.map(k => k.id));
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <KeenIcon icon={selectedKeywordIds.length === keywords.length ? "cross-circle" : "check-circle"} className="size-3 mr-1" />
                  {selectedKeywordIds.length === keywords.length ? '전체 해제' : '전체 선택'}
                </Button>
                {onMoveKeywords && (
                  <Button
                    onClick={() => onMoveKeywords()}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <KeenIcon icon="arrow-right-left" className="size-3 mr-1" />
                    이동/복사 ({selectedKeywordIds.length})
                  </Button>
                )}
              </>
            )}
            {onOpenUploadModal && (
              <button
                onClick={onOpenUploadModal}
                className="flex items-center bg-green-500 hover:bg-green-600 text-white text-xs px-2 sm:px-3 py-1 rounded-md"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span className="hidden sm:inline">엑셀 업로드</span>
                <span className="sm:hidden">업로드</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 새 키워드 추가 폼 */}
      <div className="p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/30 overflow-x-auto">
        <form onSubmit={handleAddKeyword} className="flex flex-wrap items-end gap-1 sm:gap-2 w-full">
          {!isHidden('main_keyword') && (
            <div className="w-full sm:w-auto sm:flex-grow-0 sm:min-w-[120px] sm:max-w-[180px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getFieldLabel('main_keyword', '메인 키워드')} {(isRequired('main_keyword') || !selectedGroup?.campaignType) && '*'}
              </label>
              <input
                type="text"
                value={newKeywordData.mainKeyword}
                onChange={(e) => handleNewKeywordChange(e, 'mainKeyword')}
                placeholder={getFieldPlaceholder('main_keyword', '메인 키워드')}
                className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                disabled={isLoading}
                required={!isHidden('main_keyword')}
                ref={mainKeywordRef}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    midRef.current?.focus();
                  }
                }}
              />
            </div>
          )}
          {!isHidden('mid') && (
            <div className="w-full sm:w-auto sm:flex-grow-0 sm:min-w-[80px] sm:max-w-[120px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getFieldLabel('mid', 'MID')} {isRequired('mid') && '*'}
              </label>
              <input
                type="text"
                value={newKeywordData.mid || ''}
                onChange={(e) => {
                  // 숫자만 입력 가능하도록 필터링
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  handleNewKeywordChange({ ...e, target: { ...e.target, value } }, 'mid');
                }}
                placeholder={getFieldPlaceholder('mid', 'MID')}
                className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                disabled={isLoading}
                required={isRequired('mid')}
                ref={midRef}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    urlRef.current?.focus();
                  }
                }}
              />
            </div>
          )}
          {!isHidden('url') && (
            <div className="hidden sm:block sm:w-auto sm:flex-grow-0 sm:min-w-[200px] sm:max-w-[250px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                <span>{getFieldLabel('url', 'URL')} {isRequired('url') && '*'}</span>
                {newKeywordData.url && !isValidUrl(newKeywordData.url) && (
                  <span className="text-red-500 text-xs font-normal ml-auto">
                    올바른 URL 형식이 아닙니다
                  </span>
                )}
              </label>
              <input
                type="text"
                value={newKeywordData.url}
                onChange={(e) => handleNewKeywordChange(e, 'url')}
                placeholder={getFieldPlaceholder('url', 'URL')}
                className={`w-full px-2 py-1 text-xs border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800 ${newKeywordData.url && !isValidUrl(newKeywordData.url)
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                  : 'border-green-300 dark:border-green-700 focus:ring-green-500'
                  }`}
                disabled={isLoading}
                required={isRequired('url')}
                ref={urlRef}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    keyword1Ref.current?.focus();
                  }
                }}
              />
            </div>
          )}
          {!isHidden('keyword1') && (
            <div className="hidden sm:block sm:w-auto sm:flex-grow-0 sm:min-w-[50px] sm:max-w-[80px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getFieldLabel('keyword1', '키워드1')} {isRequired('keyword1') && '*'}
              </label>
              <input
                type="text"
                value={newKeywordData.keyword1}
                onChange={(e) => handleNewKeywordChange(e, 'keyword1')}
                placeholder={getFieldPlaceholder('keyword1', '키워드1')}
                className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                disabled={isLoading}
                required={isRequired('keyword1')}
                ref={keyword1Ref}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    keyword2Ref.current?.focus();
                  }
                }}
              />
            </div>
          )}
          {!isHidden('keyword2') && (
            <div className="hidden sm:block sm:w-auto sm:flex-grow-0 sm:min-w-[50px] sm:max-w-[80px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getFieldLabel('keyword2', '키워드2')} {isRequired('keyword2') && '*'}
              </label>
              <input
                type="text"
                value={newKeywordData.keyword2}
                onChange={(e) => handleNewKeywordChange(e, 'keyword2')}
                placeholder={getFieldPlaceholder('keyword2', '키워드2')}
                className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                disabled={isLoading}
                required={isRequired('keyword2')}
                ref={keyword2Ref}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    keyword3Ref.current?.focus();
                  }
                }}
              />
            </div>
          )}
          {!isHidden('keyword3') && (
            <div className="hidden sm:block sm:w-auto sm:flex-grow-0 sm:min-w-[50px] sm:max-w-[80px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getFieldLabel('keyword3', '키워드3')} {isRequired('keyword3') && '*'}
              </label>
              <input
                type="text"
                value={newKeywordData.keyword3}
                onChange={(e) => handleNewKeywordChange(e, 'keyword3')}
                placeholder={getFieldPlaceholder('keyword3', '키워드3')}
                className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                disabled={isLoading}
                required={isRequired('keyword3')}
                ref={keyword3Ref}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    descriptionRef.current?.focus();
                  }
                }}
              />
            </div>
          )}

          <div className="w-full sm:w-auto sm:flex-grow flex-shrink-0 sm:flex-shrink-0 mt-1 sm:mt-0">
            <div className="flex items-end gap-2 w-full">
              {!isHidden('description') && (
                <div className="flex-grow sm:min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{getFieldLabel('description', '설명')} (선택사항)</label>
                  <input
                    type="text"
                    value={newKeywordData.description}
                    onChange={(e) => handleNewKeywordChange(e, 'description')}
                    placeholder={getFieldPlaceholder('description', '설명 (선택사항)')}
                    className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    disabled={isLoading}
                    ref={descriptionRef}
                  />
                </div>
              )}
              <button
                type="submit"
                className="h-[24px] bg-green-600 hover:bg-green-700 text-white text-xs px-3 rounded-md disabled:opacity-50 disabled:bg-gray-400 whitespace-nowrap"
                disabled={isLoading || (!isHidden('main_keyword') && !newKeywordData.mainKeyword.trim())}
              >
                추가
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 키워드 테이블 */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <table className="w-full sm:min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-300 dark:border-gray-600">
          <thead className="bg-blue-100 dark:bg-blue-800 sticky top-0 z-10">
            <tr>
              {renderTableHeaders()}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={getVisibleColumnCount()} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 border-b border-gray-300 dark:border-gray-600">
                  <div className="flex justify-center">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="ml-2">로딩 중...</span>
                  </div>
                </td>
              </tr>
            ) : keywords.length === 0 ? (
              <tr>
                <td colSpan={getVisibleColumnCount()} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 border-b border-gray-300 dark:border-gray-600">
                  {searchText ? '검색 결과가 없습니다.' : '등록된 키워드가 없습니다.'}
                </td>
              </tr>
            ) : (
              keywords.map((keyword) => (
                <tr
                  key={keyword.id}
                  className={`h-8 cursor-pointer transition-colors ${selectedKeywordIds.includes(keyword.id)
                    ? 'bg-purple-100 dark:bg-purple-800/40 hover:bg-purple-200 dark:hover:bg-purple-800/50 border-l-4 border-purple-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                    }`}
                  onClick={(e) => {
                    // 작업 버튼 영역 클릭은 제외
                    const target = e.target as HTMLElement;
                    if (target.closest('.actions-cell') || target.closest('.status-cell') || target.closest('button') || target.closest('input') || target.closest('label')) return;

                    if (selectedKeywordIds.includes(keyword.id)) {
                      onSelectionChange?.(selectedKeywordIds.filter(id => id !== keyword.id));
                    } else {
                      onSelectionChange?.([...selectedKeywordIds, keyword.id]);
                    }
                  }}
                >
                  {/* 메인 키워드 */}
                  {!isHidden('main_keyword') && (
                    <td className="px-1 sm:px-2 py-2">
                      <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {keyword.mainKeyword}
                      </div>
                    </td>
                  )}

                  {/* 사용중 (서비스) */}
                  <td className="px-1 sm:px-2 py-2 text-center">
                    {keyword.activeSlots && keyword.activeSlots.length > 0 ? (
                      <div className="flex items-center gap-1 justify-center">
                        {keyword.activeSlots.map((slot, index) => (
                          <div
                            key={slot.id}
                            className="relative"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltipPosition({
                                top: rect.top - 30,
                                left: rect.left + rect.width / 2
                              });
                              setHoveredSlotId(slot.id);
                            }}
                            onMouseLeave={() => setHoveredSlotId(null)}
                          >
                            {slot.campaignLogo ? (
                              <img
                                src={slot.campaignLogo}
                                alt={slot.campaignName}
                                className="w-5 h-5 object-contain rounded border border-gray-200 dark:border-gray-600"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (nextElement) {
                                    nextElement.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center"
                              style={{ display: slot.campaignLogo ? 'none' : 'flex' }}
                            >
                              <span className="text-[8px] font-bold text-gray-600 dark:text-gray-400">
                                {slot.campaignName?.charAt(0) || '?'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">-</div>
                    )}
                  </td>

                  {/* MID */}
                  {!isHidden('mid') && (
                    <td className="px-1 sm:px-2 py-2 text-center">
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        {keyword.mid || '-'}
                      </div>
                    </td>
                  )}

                  {/* URL */}
                  {!isHidden('url') && (
                    <td className="hidden sm:table-cell px-1 sm:px-2 py-2 max-w-[120px] sm:max-w-[200px]">
                      <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
                        {keyword.url ? (
                          <a
                            href={keyword.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            title={keyword.url}
                          >
                            {keyword.url}
                          </a>
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                  )}

                  {/* 키워드 */}
                  {(!isHidden('keyword1') || !isHidden('keyword2') || !isHidden('keyword3')) && (
                    <td className="hidden sm:table-cell px-2 py-2">
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        {(() => {
                          const keywords = [];
                          if (keyword.keyword1 && !isHidden('keyword1')) keywords.push(keyword.keyword1);
                          if (keyword.keyword2 && !isHidden('keyword2')) keywords.push(keyword.keyword2);
                          if (keyword.keyword3 && !isHidden('keyword3')) keywords.push(keyword.keyword3);
                          return keywords.length > 0 ? keywords.join(' / ') : '-';
                        })()}
                      </div>
                    </td>
                  )}

                  {/* 상태 (스위치 버튼으로 변경) */}
                  {!isHidden('status') && (
                    <td className="px-1 sm:px-2 py-2 text-center status-cell">
                      <div className="relative inline-block w-8 sm:w-10 mr-0 sm:mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          id={`status-${keyword.id}`}
                          checked={keyword.isActive}
                          onChange={() => handleToggleActive(keyword.id, keyword.isActive)}
                          className="sr-only peer"
                          disabled={isLoading}
                        />
                        <label
                          htmlFor={`status-${keyword.id}`}
                          className="block overflow-hidden h-5 sm:h-6 rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer 
                          peer-checked:bg-green-500 peer-disabled:cursor-not-allowed"
                        >
                          <span
                            className={`block h-5 w-5 sm:h-6 sm:w-6 rounded-full shadow transform transition-transform 
                          ${keyword.isActive ? 'translate-x-3 sm:translate-x-4 bg-white' : 'translate-x-0 bg-white'} 
                          peer-disabled:bg-gray-300 dark:peer-disabled:bg-gray-600`}
                          />
                        </label>
                      </div>
                    </td>
                  )}

                  {/* 설명 */}
                  {!isHidden('description') && (
                    <td className="hidden sm:table-cell px-1 sm:px-2 py-2 max-w-[100px] sm:max-w-[150px]">
                      {editingKeywordId === keyword.id ? (
                        <input
                          type="text"
                          value={editingKeywordData.description}
                          onChange={(e) => handleEditingKeywordChange(e, 'description')}
                          className="w-full px-3 py-1 border border-blue-300 dark:border-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="설명 (선택사항)"
                        />
                      ) : (
                        <div className="text-xs text-gray-700 dark:text-gray-300 truncate" title={keyword.description || ''}>
                          {keyword.description || '-'}
                        </div>
                      )}
                    </td>
                  )}

                  {/* 등록일 */}
                  {!isHidden('created_at') && (
                    <td className="hidden sm:table-cell px-2 py-2 text-center">
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        {keyword.createdAt ? new Date(keyword.createdAt).toLocaleDateString() : '-'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {keyword.createdAt ? new Date(keyword.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </td>
                  )}

                  {/* 작업 버튼 */}
                  <td className="px-1 sm:px-2 py-2 text-center text-xs font-medium whitespace-nowrap actions-cell">
                    {editingKeywordId === keyword.id ? (
                      <div className="flex flex-col sm:flex-row justify-center sm:space-x-1 space-y-1 sm:space-y-0">
                        <button
                          onClick={() => handleSaveEditing(keyword.id)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-xs"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEditing}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row justify-center sm:space-x-1 space-y-1 sm:space-y-0">
                        {selectedGroup?.campaignType && (
                          <button
                            onClick={() => {
                              setQuickBuyKeyword(keyword);
                              setQuickBuyModalOpen(true);
                            }}
                            className={`text-xs ${
                              keyword.activeSlots && keyword.activeSlots.length > 0
                                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                            }`}
                            disabled={isLoading || (keyword.activeSlots && keyword.activeSlots.length > 0)}
                            title={
                              keyword.activeSlots && keyword.activeSlots.length > 0
                                ? "이미 사용 중인 키워드입니다"
                                : "선택한 키워드로 캠페인 구매하기"
                            }
                          >
                            구매
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEditing(keyword)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs"
                          disabled={isLoading}
                        >
                          편집
                        </button>
                        <button
                          onClick={() => handleDeleteKeyword(keyword.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs"
                          disabled={isLoading}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 border-t border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center">
          <span className="mr-2 text-xs text-gray-700 dark:text-gray-300">페이지당:</span>
          <select
            value={pagination.limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="select border border-gray-300 dark:border-gray-600 rounded-md py-1 pl-2 pr-6 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          >
            {[10, 25, 50, 100].map((limit) => (
              <option key={limit} value={limit} className="text-xs">
                {limit}
              </option>
            ))}
          </select>
        </div>

        {totalPages > 0 && (
          <div className="flex flex-wrap justify-center gap-1">
            {renderPaginationButtons()}
          </div>
        )}
      </div>

      {/* 툴팁 Portal */}
      {hoveredSlotId && keywords.map(keyword =>
        keyword.activeSlots?.map(slot =>
          slot.id === hoveredSlotId ? ReactDOM.createPortal(
            <div
              className="fixed z-[99999] pointer-events-none"
              style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {slot.campaignName}
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>,
            document.body
          ) : null
        )
      )}

      {/* 알림 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden" aria-describedby={undefined}>
          {/* 헤더 영역 */}
          <div className={`px-6 py-4 ${dialogType === 'success'
            ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20'
            : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
            }`}>
            <DialogHeader className="flex flex-row items-center gap-3">
              {/* 아이콘 */}
              <div className={`flex-shrink-0 p-3 rounded-full ${dialogType === 'success'
                ? 'bg-green-100 dark:bg-green-800/30'
                : 'bg-red-100 dark:bg-red-800/30'
                }`}>
                {dialogType === 'success' ? (
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <DialogTitle className={`text-lg font-semibold ${dialogType === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                }`}>
                {dialogTitle}
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* 내용 영역 */}
          <div className="px-6 py-4">
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {dialogDescription}
            </DialogDescription>
          </div>

          {/* 버튼 영역 */}
          <DialogFooter className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3">
            <Button
              onClick={() => setDialogOpen(false)}
              className={`w-full sm:w-auto ${dialogType === 'success'
                ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                } text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md`}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 캠페인 빠른 구매 모달 */}
      {quickBuyKeyword && selectedGroup?.campaignType && (
        <CampaignSlotWithKeywordModal
          open={quickBuyModalOpen}
          onClose={() => {
            setQuickBuyModalOpen(false);
            setQuickBuyKeyword(null);
          }}
          category={selectedGroup.campaignName}
          serviceCode={selectedGroup.campaignType}
          onSave={async (data) => {
            // 슬롯 데이터 저장 로직
            console.log('캠페인 슬롯 데이터:', data);
            setQuickBuyModalOpen(false);
            setQuickBuyKeyword(null);
          }}
          sourcePageInfo={{
            page: 'keywordTable',
            buttonType: 'quickBuy'
          }}
          // 초기 캠페인 ID 설정 (서비스 타입에 맞는 첫 번째 캠페인 자동 선택)
          initialCampaignId={undefined}
          // 키워드 정보를 모달에 전달하기 위한 초기 데이터 설정
          campaign={{
            // 키워드 정보를 초기값으로 설정
            initialKeywordData: {
              productName: quickBuyKeyword.mainKeyword,
              mid: quickBuyKeyword.mid?.toString() || '',
              url: quickBuyKeyword.url || '',
              keyword1: quickBuyKeyword.keyword1 || '',
              keyword2: quickBuyKeyword.keyword2 || '',
              keyword3: quickBuyKeyword.keyword3 || '',
              selectedKeywords: [quickBuyKeyword.id],
              keywordDetails: [{
                id: quickBuyKeyword.id,
                mainKeyword: quickBuyKeyword.mainKeyword,
                workCount: 1,
                dueDays: 1
              }]
            },
            // 선택된 그룹 정보 전달
            selectedGroupId: selectedGroup.id
          }}
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden" aria-describedby={undefined}>
          {/* 헤더 영역 */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 px-6 py-4">
            <DialogHeader className="flex flex-row items-center gap-3">
              {/* 삭제 아이콘 */}
              <div className="flex-shrink-0 p-3 rounded-full bg-red-100 dark:bg-red-800/30">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <DialogTitle className="text-lg font-semibold text-red-800 dark:text-red-300">
                키워드 삭제 확인
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* 내용 영역 */}
          <div className="px-6 py-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
                  이 키워드를 삭제하시겠습니까?
                </DialogDescription>
                <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <DialogFooter className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteTargetId(null);
              }}
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KeywordTable;