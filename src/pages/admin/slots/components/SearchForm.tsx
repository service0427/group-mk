import React from 'react';
import { Campaign } from './types';
import { STATUS_OPTIONS } from './constants';
import { SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';

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
  return (
    <div className="card shadow-sm mb-5">
      <div className="card-header px-6 py-4">
        <h3 className="card-title">슬롯 검색</h3>
      </div>
      <div className="card-body px-6 py-4">
        {/* 데스크톱 검색 폼 */}
        <div className="hidden md:block space-y-4">
          {/* 첫 번째 줄 */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <div className="flex items-center h-9">
                <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[80px]">서비스</label>
                <select
                  className="select select-bordered select-sm w-full"
                  value={selectedServiceType}
                  onChange={onServiceTypeChange}
                  disabled={loading || Object.keys(SERVICE_TYPE_LABELS).length === 0}
                >
                  {Object.keys(SERVICE_TYPE_LABELS).map((serviceType) => (
                    <option key={serviceType} value={serviceType}>
                      {SERVICE_TYPE_LABELS[serviceType] || serviceType}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-span-4">
              <div className="flex items-center h-9">
                <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[80px]">캠페인</label>
                <select
                  className="select select-bordered select-sm w-full"
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
            </div>

            <div className="col-span-2">
              <div className="flex items-center h-9">
                <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[50px]">상태</label>
                <select
                  className="select select-bordered select-sm w-full"
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

            <div className="col-span-3">
              <div className="flex items-center h-9">
                <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[60px]">검색어</label>
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="이름, 상품명, URL, 키워드"
                    className="input input-bordered input-sm w-full pr-8"
                    value={searchTerm}
                    onChange={onSearchChange}
                  />
                  {searchTerm && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => onSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 두 번째 줄 */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <div className="flex items-center h-9">
                <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[80px]">시작일</label>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={searchDateFrom}
                  onChange={onSearchDateFromChange}
                />
              </div>
            </div>
            
            <div className="col-span-3">
              <div className="flex items-center h-9">
                <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[80px]">종료일</label>
                <input
                  type="date"
                  className="input input-bordered input-sm w-full"
                  value={searchDateTo}
                  onChange={onSearchDateToChange}
                />
              </div>
            </div>

            <div className="col-span-6 flex items-center justify-end">
              <button
                className="btn btn-primary btn-sm px-6"
                onClick={onSearch}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-xs"></span>
                    검색 중
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    검색
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 검색 폼 */}
        <div className="block md:hidden space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">서비스 타입</label>
              <select
                className="select select-bordered select-sm w-full"
                value={selectedServiceType}
                onChange={onServiceTypeChange}
                disabled={loading || Object.keys(SERVICE_TYPE_LABELS).length === 0}
              >
                {Object.keys(SERVICE_TYPE_LABELS).map((serviceType) => (
                  <option key={serviceType} value={serviceType}>
                    {SERVICE_TYPE_LABELS[serviceType] || serviceType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">상태</label>
              <select
                className="select select-bordered select-sm w-full"
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

          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">캠페인</label>
            <select
              className="select select-bordered select-sm w-full"
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

          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">검색어</label>
            <input
              type="text"
              placeholder="이름, 상품명, URL, 키워드"
              className="input input-bordered input-sm w-full"
              value={searchTerm}
              onChange={onSearchChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">시작일</label>
              <input
                type="date"
                className="input input-bordered input-sm w-full"
                value={searchDateFrom}
                onChange={onSearchDateFromChange}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">종료일</label>
              <input
                type="date"
                className="input input-bordered input-sm w-full"
                value={searchDateTo}
                onChange={onSearchDateToChange}
              />
            </div>
          </div>

          <button
            className="btn btn-primary btn-sm w-full"
            onClick={onSearch}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-xs"></span>
                검색 중...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                검색하기
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchForm;