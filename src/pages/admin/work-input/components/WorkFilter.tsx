import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterOptions } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { getTodayDateString, getServiceTypeName } from '../services/workInputService';

interface WorkFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  isLoading: boolean;
}

export const WorkFilter: React.FC<WorkFilterProps> = ({ onFilterChange, isLoading }) => {
  // 현재 날짜 가져오기
  const today = getTodayDateString();
  
  // 한 달 전 날짜 계산
  const getOneMonthAgo = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  };

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: 'approved',
    date_from: '',
    date_to: '',
    search: '',
    service_type: 'naver-traffic',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilterOptions(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFilterOptions(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    const resetFilters = {
      status: 'approved',
      date_from: '',
      date_to: '',
      search: '',
      service_type: 'naver-traffic',
    };
    setFilterOptions(resetFilters);
    onFilterChange(resetFilters);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filterOptions);
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <div className="text-sm font-medium mb-1.5">서비스 타입</div>
            <Select
              name="service_type"
              value={filterOptions.service_type || 'naver-traffic'}
              onValueChange={(value) => handleSelectChange('service_type', value)}
              disabled={isLoading}
            >
              <SelectTrigger id="service_type">
                <SelectValue placeholder="서비스 타입 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="naver-traffic">네이버 트래픽</SelectItem>
                <SelectItem value="naver-auto">네이버 자동완성</SelectItem>
                <SelectItem value="naver-shopping-traffic">네이버 쇼핑 트래픽</SelectItem>
                <SelectItem value="naver-place-traffic">네이버 플레이스 트래픽</SelectItem>
                <SelectItem value="naver-place-save">네이버 플레이스 저장</SelectItem>
                <SelectItem value="naver-place-share">네이버 플레이스 공유</SelectItem>
                <SelectItem value="coupang-traffic">쿠팡 트래픽</SelectItem>
                <SelectItem value="ohouse-traffic">오늘의집 트래픽</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium mb-1.5">상태</div>
            <Select
              name="status"
              value={filterOptions.status || 'approved'}
              onValueChange={(value) => handleSelectChange('status', value)}
              disabled={isLoading}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">승인됨</SelectItem>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="all">전체</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-1">
            <div className="text-sm font-medium mb-1.5">검색</div>
            <div className="flex space-x-2">
              <Input
                type="text"
                id="search"
                name="search"
                value={filterOptions.search || ''}
                onChange={handleChange}
                placeholder="캠페인명 검색"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                검색
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                초기화
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default WorkFilter;