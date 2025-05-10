import React, { useState } from 'react';
import { Campaign, SearchParams } from './types';
import { SERVICE_TYPE_TO_CATEGORY, STATUS_OPTIONS } from './constants';

interface SearchFormProps {
  loading: boolean;
  selectedServiceType: string;
  selectedCampaign: string;
  searchTerm: string;
  searchStatus: string;
  searchDateFrom: string;
  searchDateTo: string;
  filteredCampaigns: Campaign[];
  onServiceTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onCampaignChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSearchDateFromChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchDateToChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
}

const SearchForm: React.FC<SearchFormProps> = ({
  loading,
  selectedServiceType,
  selectedCampaign,
  searchTerm,
  searchStatus,
  searchDateFrom,
  searchDateTo,
  filteredCampaigns,
  onServiceTypeChange,
  onCampaignChange,
  onSearchChange,
  onSearchStatusChange,
  onSearchDateFromChange,
  onSearchDateToChange,
  onSearch
}) => {
  const [isAdvancedSearchVisible, setIsAdvancedSearchVisible] = useState<boolean>(false);

  return (
    <div className="card mb-5 shadow-sm bg-card">
      <div className="card-header p-6 pb-5 flex justify-between items-center">
        <h3 className="card-title text-lg font-semibold">슬롯 승인 검색</h3>
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
            {/* 서비스 타입 - select box */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-sm font-medium text-foreground">서비스 타입</span>
              </label>
              <select 
                className="select select-bordered w-full focus:ring-2 focus:ring-primary"
                value={selectedServiceType}
                onChange={onServiceTypeChange}
                disabled={loading || Object.keys(SERVICE_TYPE_TO_CATEGORY).length === 0}
              >
                {Object.keys(SERVICE_TYPE_TO_CATEGORY).map((serviceType) => (
                  <option key={serviceType} value={serviceType}>
                    {SERVICE_TYPE_TO_CATEGORY[serviceType] || serviceType}
                  </option>
                ))}
              </select>
            </div>

            {/* 캠페인 - select box */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-sm font-medium text-foreground">캠페인</span>
              </label>
              <select 
                className="select select-bordered w-full focus:ring-2 focus:ring-primary"
                value={selectedCampaign}
                onChange={onCampaignChange}
                disabled={loading || filteredCampaigns.length <= 1}
              >
                {filteredCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.campaign_name}
                  </option>
                ))}
              </select>
            </div>

            {/* 상태(status) - select box */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text text-sm font-medium text-foreground">상태</span>
              </label>
              <select 
                className="select select-bordered w-full focus:ring-2 focus:ring-primary"
                value={searchStatus}
                onChange={onSearchStatusChange}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 상세 검색 옵션 - 접었다 펼 수 있음 */}
          {isAdvancedSearchVisible && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              {/* 검색어 - input */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-foreground">검색어</span>
                </label>
                <div className="input-group">
                  <input 
                    type="text" 
                    placeholder="이름, 상품명, URL, 키워드 등 검색" 
                    className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={onSearchChange}
                  />
                  {searchTerm && (
                    <button 
                      className="btn btn-light"
                      onClick={() => onSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* 제출일 시작 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-foreground">제출일 (시작)</span>
                </label>
                <input 
                  type="date" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                  value={searchDateFrom}
                  onChange={onSearchDateFromChange}
                />
              </div>

              {/* 제출일 종료 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-foreground">제출일 (종료)</span>
                </label>
                <input 
                  type="date" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                  value={searchDateTo}
                  onChange={onSearchDateToChange}
                />
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

          <div className="mb-4">
            <label className="form-label text-sm font-weight-medium">서비스 타입</label>
            <select 
              className="form-select form-select-sm" 
              value={selectedServiceType}
              onChange={onServiceTypeChange}
              disabled={loading || Object.keys(SERVICE_TYPE_TO_CATEGORY).length === 0}
            >
              {Object.keys(SERVICE_TYPE_TO_CATEGORY).map((serviceType) => (
                <option key={serviceType} value={serviceType}>
                  {SERVICE_TYPE_TO_CATEGORY[serviceType] || serviceType}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label text-sm font-weight-medium">캠페인</label>
            <select 
              className="form-select form-select-sm"
              value={selectedCampaign}
              onChange={onCampaignChange}
              disabled={loading || filteredCampaigns.length <= 1}
            >
              {filteredCampaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.campaign_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label text-sm font-weight-medium">상태</label>
            <select 
              className="form-select form-select-sm"
              value={searchStatus}
              onChange={onSearchStatusChange}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* 상세 검색 옵션 - 접었다 펼 수 있음 */}
          {isAdvancedSearchVisible && (
            <>
              <div className="mb-4">
                <label className="form-label text-sm font-weight-medium">검색어</label>
                <div className="input-group input-group-sm">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="이름, 상품명, URL, 키워드 등" 
                    value={searchTerm}
                    onChange={onSearchChange}
                  />
                  {searchTerm && (
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => onSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label text-sm font-weight-medium">시작일</label>
                  <input 
                    type="date" 
                    className="form-control form-control-sm"
                    value={searchDateFrom}
                    onChange={onSearchDateFromChange}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-sm font-weight-medium">종료일</label>
                  <input 
                    type="date" 
                    className="form-control form-control-sm"
                    value={searchDateTo}
                    onChange={onSearchDateToChange}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className={`card-footer p-6 ${isAdvancedSearchVisible ? 'pt-2' : 'pt-3'}`}>
        {/* 데스크톱 검색 버튼 */}
        <div className="hidden md:flex justify-end">
          <button 
            className="btn btn-primary px-6" 
            onClick={onSearch}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                검색 중...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                검색
              </>
            )}
          </button>
        </div>

        {/* 모바일 검색 버튼 */}
        <div className="block md:hidden">
          <button 
            className={`btn btn-primary ${isAdvancedSearchVisible ? 'mt-4' : 'mt-0'} w-100`}
            onClick={onSearch}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                검색 중...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
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
