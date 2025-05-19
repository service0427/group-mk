import React, { useState } from 'react';
import { CampaignListItem } from './types';
import { STATUS_OPTIONS } from './constants';

interface SearchFormProps {
  loading: boolean;
  campaignList: CampaignListItem[];
  selectedCampaignId: number | 'all';
  statusFilter: string;
  searchInput: string;
  searchDateFrom: string;
  searchDateTo: string;
  onCampaignChange: (id: number | 'all') => void;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onSearch: () => void;
}

const SearchForm: React.FC<SearchFormProps> = ({
  loading,
  campaignList,
  selectedCampaignId,
  statusFilter,
  searchInput,
  searchDateFrom,
  searchDateTo,
  onCampaignChange,
  onStatusChange,
  onSearchChange,
  onDateFromChange,
  onDateToChange,
  onSearch
}) => {
  const [isAdvancedSearchVisible, setIsAdvancedSearchVisible] = useState<boolean>(false);

  return (
    <div className="card shadow-sm bg-card">
      <div className="card-header p-6 pb-5 flex justify-between items-center">
        <h3 className="card-title text-lg font-semibold">슬롯 검색</h3>
        <button 
          className="btn btn-sm btn-light hidden md:flex"
          onClick={() => setIsAdvancedSearchVisible(!isAdvancedSearchVisible)}
        >
          {isAdvancedSearchVisible ? (
            <span className="flex items-center">
              <span className="mr-2">간편 검색</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </span>
          ) : (
            <span className="flex items-center">
              <span className="mr-2">상세 검색</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          )}
        </button>
      </div>
      
      <div className="card-body p-0 px-6">
        {/* 데스크톱 검색 폼 (md 이상) */}
        <div className="hidden md:block">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            {/* 캠페인 선택 */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-sm font-medium text-foreground">캠페인</span>
              </label>
              <select 
                className="select select-bordered w-full focus:ring-2 focus:ring-primary"
                value={selectedCampaignId.toString()}
                onChange={(e) => onCampaignChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              >
                <option value="all">전체 캠페인</option>
                {campaignList.map(campaign => (
                  <option key={campaign.id} value={campaign.id.toString()}>
                    {campaign.campaignName}
                  </option>
                ))}
              </select>
              <label className="label">
                <span className="label-text-alt text-muted-foreground">등록된 캠페인 목록입니다.</span>
              </label>
            </div>

            {/* 검색어 입력 */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-sm font-medium text-foreground">검색어</span>
              </label>
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="상품명, MID, URL, 키워드 등 검색" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary bg-card"
                  value={searchInput}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchInput && (
                  <button 
                    className="btn btn-light"
                    onClick={() => onSearchChange('')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
              <label className="label">
                <span className="label-text-alt text-muted-foreground">상품명, MID, URL 등으로 검색합니다.</span>
              </label>
            </div>

            {/* 상태 선택 */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-sm font-medium text-foreground">상태</span>
              </label>
              <select 
                className="select select-bordered w-full focus:ring-2 focus:ring-primary"
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <label className="label">
                <span className="label-text-alt text-muted-foreground">슬롯의 현재 상태입니다.</span>
              </label>
            </div>

            {/* 검색 버튼 - 상세 검색 모드가 아닐 때만 표시 */}
            {!isAdvancedSearchVisible && (
              <div className="form-control w-full flex items-end">
                <button 
                  className="btn btn-primary w-full" 
                  onClick={onSearch}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-xs mr-2"></span>
                      검색 중...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      검색
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 상세 검색 옵션 - 접었다 펼 수 있음 */}
          {isAdvancedSearchVisible && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              {/* 등록일 시작 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-foreground">등록일 (시작)</span>
                </label>
                <input 
                  type="date" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary bg-card"
                  value={searchDateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                />
                <label className="label">
                  <span className="label-text-alt text-muted-foreground">검색 시작일을 선택하세요.</span>
                </label>
              </div>

              {/* 등록일 종료 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-foreground">등록일 (종료)</span>
                </label>
                <input 
                  type="date" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary bg-card"
                  value={searchDateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                />
                <label className="label">
                  <span className="label-text-alt text-muted-foreground">검색 종료일을 선택하세요.</span>
                </label>
              </div>
              
              {/* 검색 버튼 */}
              <div className="form-control w-full flex items-end">
                <button 
                  className="btn btn-primary w-full" 
                  onClick={onSearch}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-xs mr-2"></span>
                      검색 중...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      검색
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 모바일 검색 폼 (md 미만) */}
        <div className="block md:hidden">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-base font-medium">기본 검색</h4>
            <button 
              className="btn btn-sm btn-light"
              onClick={() => setIsAdvancedSearchVisible(!isAdvancedSearchVisible)}
            >
              {isAdvancedSearchVisible ? '간편 검색' : '상세 검색'} 
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                {isAdvancedSearchVisible ? 
                  <polyline points="18 15 12 9 6 15"></polyline> : 
                  <polyline points="6 9 12 15 18 9"></polyline>
                }
              </svg>
            </button>
          </div>
          
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text text-sm font-medium text-foreground">캠페인</span>
            </label>
            <select 
              className="select select-bordered w-full focus:ring-2 focus:ring-primary bg-card"
              value={selectedCampaignId.toString()}
              onChange={(e) => onCampaignChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            >
              <option value="all">전체 캠페인</option>
              {campaignList.map(campaign => (
                <option key={campaign.id} value={campaign.id.toString()}>
                  {campaign.campaignName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text text-sm font-medium text-foreground">검색어</span>
            </label>
            <div className="input-group">
              <input 
                type="text" 
                className="input input-bordered w-full focus:ring-2 focus:ring-primary bg-card" 
                placeholder="상품명, MID, URL, 키워드 등" 
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchInput && (
                <button 
                  className="btn btn-light" 
                  onClick={() => onSearchChange('')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text text-sm font-medium text-foreground">상태</span>
            </label>
            <select 
              className="select select-bordered w-full focus:ring-2 focus:ring-primary bg-card"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* 상세 검색 옵션 - 접었다 펼 수 있음 */}
          {isAdvancedSearchVisible && (
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-foreground">시작일</span>
                </label>
                <input 
                  type="date" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary bg-card"
                  value={searchDateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-foreground">종료일</span>
                </label>
                <input 
                  type="date" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary bg-card"
                  value={searchDateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className={`card-footer p-6 ${isAdvancedSearchVisible ? 'pt-2' : 'pt-3'}`}>
        {/* 모바일 검색 버튼 */}
        <div className="block md:hidden">
          <button 
            className="btn btn-primary w-full"
            onClick={onSearch}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-xs mr-2"></span>
                검색 중...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                검색하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchForm;
