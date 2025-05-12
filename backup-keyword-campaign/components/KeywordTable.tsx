import React, { useState, useRef } from 'react';
import { Keyword, KeywordGroup, KeywordInput, PaginationParams } from '../types';

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
}) => {
  // 상태 관리
  const [searchText, setSearchText] = useState('');
  const [editingKeywordId, setEditingKeywordId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
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
      onSort(field, newDirection);
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
    if (!editingKeywordData.mainKeyword.trim()) return;
    
    const success = await onUpdateKeyword(keywordId, {
      mainKeyword: editingKeywordData.mainKeyword.trim(),
      mid: editingKeywordData.mid,
      url: editingKeywordData.url ? editingKeywordData.url.trim() : undefined,
      keyword1: editingKeywordData.keyword1 ? editingKeywordData.keyword1.trim() : undefined,
      keyword2: editingKeywordData.keyword2 ? editingKeywordData.keyword2.trim() : undefined,
      keyword3: editingKeywordData.keyword3 ? editingKeywordData.keyword3.trim() : undefined,
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
    let startPage = Math.max(1, pagination.page - paginationRange);
    let endPage = Math.min(totalPages, pagination.page + paginationRange);
    
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
          <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
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
        </div>
      </div>

      {/* 새 키워드 추가 폼 */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/30">
        <form onSubmit={handleAddKeyword} className="flex flex-wrap items-end gap-2 w-full">
          <div className="w-full sm:w-auto sm:flex-grow-0 sm:min-w-[100px] sm:max-w-[130px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">메인 키워드 *</label>
            <input
              type="text"
              value={newKeywordData.mainKeyword}
              onChange={(e) => handleNewKeywordChange(e, 'mainKeyword')}
              placeholder="메인 키워드"
              className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              disabled={isLoading}
              required
              ref={mainKeywordRef}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  midRef.current?.focus();
                }
              }}
            />
          </div>
          <div className="w-full sm:w-auto sm:flex-grow-0 sm:min-w-[50px] sm:max-w-[80px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">MID</label>
            <input
              type="number"
              value={newKeywordData.mid || ''}
              onChange={(e) => handleNewKeywordChange(e, 'mid')}
              placeholder="MID"
              className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              disabled={isLoading}
              ref={midRef}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  urlRef.current?.focus();
                }
              }}
            />
          </div>
          <div className="w-full md:w-[300px] sm:w-auto sm:flex-grow sm:min-w-[250px] sm:max-w-none">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
            <input
              type="text"
              value={newKeywordData.url}
              onChange={(e) => handleNewKeywordChange(e, 'url')}
              placeholder="URL"
              className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              disabled={isLoading}
              ref={urlRef}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  keyword1Ref.current?.focus();
                }
              }}
            />
          </div>
          <div className="w-full sm:w-auto sm:flex-grow-0 sm:min-w-[50px] sm:max-w-[80px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">키워드1</label>
            <input
              type="text"
              value={newKeywordData.keyword1}
              onChange={(e) => handleNewKeywordChange(e, 'keyword1')}
              placeholder="키워드1"
              className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              disabled={isLoading}
              ref={keyword1Ref}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  keyword2Ref.current?.focus();
                }
              }}
            />
          </div>
          <div className="w-full sm:w-auto sm:flex-grow-0 sm:min-w-[50px] sm:max-w-[80px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">키워드2</label>
            <input
              type="text"
              value={newKeywordData.keyword2}
              onChange={(e) => handleNewKeywordChange(e, 'keyword2')}
              placeholder="키워드2"
              className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              disabled={isLoading}
              ref={keyword2Ref}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  keyword3Ref.current?.focus();
                }
              }}
            />
          </div>
          <div className="w-full sm:w-auto sm:flex-grow-0 sm:min-w-[50px] sm:max-w-[80px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">키워드3</label>
            <input
              type="text"
              value={newKeywordData.keyword3}
              onChange={(e) => handleNewKeywordChange(e, 'keyword3')}
              placeholder="키워드3"
              className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              disabled={isLoading}
              ref={keyword3Ref}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  descriptionRef.current?.focus();
                }
              }}
            />
          </div>
          
          <div className="w-full sm:w-auto sm:flex-grow-0 flex-shrink-0 sm:flex-shrink-0 mt-1 sm:mt-0">
            <div className="flex items-end gap-2 w-full">
              <div className="flex-grow sm:max-w-[180px] sm:min-w-[100px]">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">설명 (선택사항)</label>
                <input
                  type="text"
                  value={newKeywordData.description}
                  onChange={(e) => handleNewKeywordChange(e, 'description')}
                  placeholder="설명 (선택사항)"
                  className="w-full px-2 py-1 text-xs border border-green-300 dark:border-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  disabled={isLoading}
                  ref={descriptionRef}
                />
              </div>
              <button
                type="submit"
                className="h-[24px] bg-green-600 hover:bg-green-700 text-white text-xs px-3 rounded-md disabled:opacity-50 disabled:bg-gray-400 whitespace-nowrap"
                disabled={isLoading || !newKeywordData.mainKeyword.trim()}
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
              <th
                scope="col"
                className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700"
                onClick={() => handleSort('main_keyword')}
              >
                메인 키워드 {renderSortArrow('main_keyword')}
              </th>
              <th
                scope="col"
                className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700"
                onClick={() => handleSort('mid')}
              >
                MID {renderSortArrow('mid')}
              </th>
              <th
                scope="col"
                className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600"
              >
                URL
              </th>
              <th
                scope="col"
                className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600"
              >
                키워드
              </th>
              <th
                scope="col"
                className="px-2 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700"
                onClick={() => handleSort('is_active')}
              >
                상태 {renderSortArrow('is_active')}
              </th>
              <th
                scope="col"
                className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600"
              >
                설명
              </th>
              <th
                scope="col"
                className="px-2 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-r border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-700"
                onClick={() => handleSort('created_at')}
              >
                등록일 {renderSortArrow('created_at')}
              </th>
              <th
                scope="col"
                className="px-2 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-300 dark:border-gray-600"
              >
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 border-b border-gray-300 dark:border-gray-600">
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
                <td colSpan={8} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 border-b border-gray-300 dark:border-gray-600">
                  {searchText ? '검색 결과가 없습니다.' : '등록된 키워드가 없습니다.'}
                </td>
              </tr>
            ) : (
              keywords.map((keyword) => (
                <tr key={keyword.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 h-8">
                  {/* 메인 키워드 */}
                  <td className="px-2 py-2 border-r border-gray-300 dark:border-gray-600">
                    {editingKeywordId === keyword.id ? (
                      <input
                        type="text"
                        value={editingKeywordData.mainKeyword}
                        onChange={(e) => handleEditingKeywordChange(e, 'mainKeyword')}
                        className="w-full px-2 py-1 border border-blue-300 dark:border-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        autoFocus
                      />
                    ) : (
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {keyword.mainKeyword}
                      </div>
                    )}
                  </td>
                  
                  {/* MID */}
                  <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-600">
                    {editingKeywordId === keyword.id ? (
                      <input
                        type="number"
                        value={editingKeywordData.mid || ''}
                        onChange={(e) => handleEditingKeywordChange(e, 'mid')}
                        className="w-full px-3 py-1 border border-blue-300 dark:border-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        {keyword.mid || '-'}
                      </div>
                    )}
                  </td>
                  
                  {/* URL */}
                  <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-600">
                    {editingKeywordId === keyword.id ? (
                      <input
                        type="text"
                        value={editingKeywordData.url}
                        onChange={(e) => handleEditingKeywordChange(e, 'url')}
                        className="w-full px-3 py-1 border border-blue-300 dark:border-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
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
                    )}
                  </td>
                  
                  {/* 키워드 */}
                  <td className="px-2 py-1 border-r border-gray-300 dark:border-gray-600">
                    {editingKeywordId === keyword.id ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={editingKeywordData.keyword1}
                          onChange={(e) => handleEditingKeywordChange(e, 'keyword1')}
                          placeholder="키워드1"
                          className="w-full px-3 py-1 border border-blue-300 dark:border-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <input
                          type="text"
                          value={editingKeywordData.keyword2}
                          onChange={(e) => handleEditingKeywordChange(e, 'keyword2')}
                          placeholder="키워드2"
                          className="w-full px-3 py-1 border border-blue-300 dark:border-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <input
                          type="text"
                          value={editingKeywordData.keyword3}
                          onChange={(e) => handleEditingKeywordChange(e, 'keyword3')}
                          placeholder="키워드3"
                          className="w-full px-3 py-1 border border-blue-300 dark:border-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        <ul className="list-disc list-inside text-xs">
                          {keyword.keyword1 && <li>{keyword.keyword1}</li>}
                          {keyword.keyword2 && <li>{keyword.keyword2}</li>}
                          {keyword.keyword3 && <li>{keyword.keyword3}</li>}
                          {!keyword.keyword1 && !keyword.keyword2 && !keyword.keyword3 && '-'}
                        </ul>
                      </div>
                    )}
                  </td>
                  
                  {/* 상태 (스위치 버튼으로 변경) */}
                  <td className="px-2 py-1 text-center border-r border-gray-300 dark:border-gray-600">
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        id={`status-${keyword.id}`}
                        checked={keyword.isActive}
                        onChange={() => handleToggleActive(keyword.id, keyword.isActive)}
                        className="sr-only peer"
                        disabled={isLoading || editingKeywordId === keyword.id}
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
                  
                  {/* 설명 */}
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

                  {/* 등록일 */}
                  <td className="px-2 py-1 text-center border-r border-gray-300 dark:border-gray-600">
                    <div className="text-xs text-gray-700 dark:text-gray-300">
                      {keyword.createdAt ? new Date(keyword.createdAt).toLocaleDateString() : '-'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {keyword.createdAt ? new Date(keyword.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </div>
                  </td>

                  {/* 작업 버튼 */}
                  <td className="px-2 py-1 text-right text-xs font-medium whitespace-nowrap">
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
    </div>
  );
};

export default KeywordTable;