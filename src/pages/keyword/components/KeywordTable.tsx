import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Keyword, KeywordGroup, KeywordInput, PaginationParams } from '../types';
import { useKeywordFieldConfig } from '../hooks/useKeywordFieldConfig';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';

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
  const [editingKeywordId, setEditingKeywordId] = useState<number | null>(null);
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
      { field: 'main_keyword', defaultLabel: '메인 키워드', sortable: true, align: 'left' },
      { field: 'service', defaultLabel: '사용중', sortable: false, align: 'center', alwaysShow: true },
      { field: 'mid', defaultLabel: 'MID', sortable: true, align: 'left' },
      { field: 'url', defaultLabel: 'URL', sortable: false, align: 'left' },
      { field: 'keywords', defaultLabel: '키워드', sortable: false, align: 'left' },
      { field: 'status', defaultLabel: '상태', sortable: true, align: 'center' },
      { field: 'description', defaultLabel: '설명', sortable: false, align: 'left' },
      { field: 'created_at', defaultLabel: '등록일', sortable: true, align: 'center' },
      { field: 'actions', defaultLabel: '작업', sortable: false, align: 'right', alwaysShow: true } // 작업 열만은 항상 표시
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


      return (
        <th
          key={header.field}
          scope="col"
          className={`px-2 py-2 text-${header.align} text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b ${header.field !== 'actions' ? 'border-r' : ''} border-gray-300 dark:border-gray-600 ${header.sortable ? 'cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700' : ''}`}
          onClick={header.sortable ? () => handleSort(header.field) : undefined}
        >
          {label} {header.sortable && renderSortArrow(header.field)}
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

  // 키워드 삭제 핸들러
  const handleDeleteKeyword = async (keywordId: number) => {
    if (window.confirm('이 키워드를 삭제하시겠습니까?')) {
      await onDeleteKeyword(keywordId);
    }
  };

  // 새 키워드 추가 핸들러
  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newKeywordData.mainKeyword.trim()) return;

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
        className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
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
        className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
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
          className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          1
        </button>
      );
      
      // 생략 표시
      if (startPage > 2) {
        buttons.push(
          <span key="dots1" className="px-3 py-1 dark:text-white">
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
          className={`px-3 py-1 rounded-md ${
            pagination.page === i
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
          <span key="dots2" className="px-3 py-1 dark:text-white">
            ...
          </span>
        );
      }
      
      buttons.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
        className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
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
        className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
      >
        &raquo;
      </button>
    );
    
    return buttons;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-base font-bold text-blue-800 dark:text-blue-300">
            {selectedGroup ? `${selectedGroup.name} 키워드` : '키워드 관리'}
            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
              총 {totalKeywords}개
            </span>
          </h2>

          {/* 검색 폼 */}
          <div className="flex w-full sm:w-auto gap-2">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="키워드 검색"
                className="flex-1 px-2 py-1 text-xs border border-blue-300 dark:border-blue-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                ref={searchInputRef}
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-r-md"
              >
                검색
              </button>
            </form>
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
                className="flex items-center bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded-md"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                엑셀 업로드
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 새 키워드 추가 폼 */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/30">
        <form onSubmit={handleAddKeyword} className="flex flex-wrap items-end gap-2 w-full">
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
                type="number"
                value={newKeywordData.mid || ''}
                onChange={(e) => handleNewKeywordChange(e, 'mid')}
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
            <div className="w-full sm:w-auto sm:flex-grow-0 sm:min-w-[350px] sm:max-w-[400px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {getFieldLabel('url', 'URL')} {isRequired('url') && '*'}
              </label>
              <input
                type="text"
                value={newKeywordData.url}
                onChange={(e) => handleNewKeywordChange(e, 'url')}
                placeholder={getFieldPlaceholder('url', 'URL')}
                className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
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
            <div className="w-full sm:w-auto sm:flex-grow-0 sm:min-w-[50px] sm:max-w-[80px]">
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
            <div className="w-full sm:w-auto sm:flex-grow-0 sm:min-w-[50px] sm:max-w-[80px]">
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
            <div className="w-full sm:w-auto sm:flex-grow-0 sm:min-w-[50px] sm:max-w-[80px]">
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-300 dark:border-gray-600">
          <thead className="bg-blue-100 dark:bg-blue-800">
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
                  className={`h-8 cursor-pointer transition-colors ${
                    selectedKeywordIds.includes(keyword.id) 
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
                    <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600">
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {keyword.mainKeyword}
                      </div>
                    </td>
                  )}
                  
                  {/* 사용중 (서비스) */}
                  <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600">
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
                    <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-600">
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        {keyword.mid || '-'}
                      </div>
                    </td>
                  )}
                  
                  {/* URL */}
                  {!isHidden('url') && (
                    <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-600">
                      <div className="text-xs text-gray-700 dark:text-gray-300 max-w-xs truncate">
                        {keyword.url ? (
                          <a
                            href={keyword.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
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
                    <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-600">
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
                    <td className="px-2 py-1 text-center border-r border-gray-300 dark:border-gray-600 status-cell">
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
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
                        className="block overflow-hidden h-6 rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer 
                          peer-checked:bg-green-500 peer-disabled:cursor-not-allowed"
                      >
                        <span 
                          className={`block h-6 w-6 rounded-full shadow transform transition-transform 
                          ${keyword.isActive ? 'translate-x-4 bg-white' : 'translate-x-0 bg-white'} 
                          peer-disabled:bg-gray-300 dark:peer-disabled:bg-gray-600`}
                        />
                      </label>
                    </div>
                    </td>
                  )}
                  
                  {/* 설명 */}
                  {!isHidden('description') && (
                    <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-600">
                      {editingKeywordId === keyword.id ? (
                        <input
                          type="text"
                          value={editingKeywordData.description}
                          onChange={(e) => handleEditingKeywordChange(e, 'description')}
                          className="w-full px-3 py-1 border border-blue-300 dark:border-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          placeholder="설명 (선택사항)"
                        />
                      ) : (
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          {keyword.description || '-'}
                        </div>
                      )}
                    </td>
                  )}

                  {/* 등록일 */}
                  {!isHidden('created_at') && (
                    <td className="px-2 py-1 text-center border-r border-gray-300 dark:border-gray-600">
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        {keyword.createdAt ? new Date(keyword.createdAt).toLocaleDateString() : '-'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {keyword.createdAt ? new Date(keyword.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </div>
                    </td>
                  )}

                  {/* 작업 버튼 */}
                  <td className="px-2 py-1 text-right text-xs font-medium whitespace-nowrap actions-cell">
                    {editingKeywordId === keyword.id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleSaveEditing(keyword.id)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEditing}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleStartEditing(keyword)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          disabled={isLoading}
                        >
                          편집
                        </button>
                        <button
                          onClick={() => handleDeleteKeyword(keyword.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
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
      <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center border-t border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center mb-4 sm:mb-0">
          <span className="mr-2 text-xs text-gray-700 dark:text-gray-300">페이지당 항목:</span>
          <select
            value={pagination.limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 rounded-md py-1 pl-2 pr-6 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
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
          <div className="flex space-x-1">
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
    </div>
  );
};

export default KeywordTable;