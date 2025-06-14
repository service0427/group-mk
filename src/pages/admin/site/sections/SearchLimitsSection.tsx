import React, { useState, useEffect } from 'react';
import { KeenIcon } from '@/components/keenicons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/supabase';
import searchLimitService from '@/services/searchLimitService';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks';

interface SearchLimitConfig {
  id: string;
  user_role: string;
  search_type: string;
  daily_limit: number;
  monthly_limit: number | null;
}

export const SearchLimitsSection: React.FC = () => {
  const [limitConfigs, setLimitConfigs] = useState<SearchLimitConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    shop_daily: number;
    shop_monthly: number | null;
    place_daily: number;
    place_monthly: number | null;
  }>({ shop_daily: 0, shop_monthly: null, place_daily: 0, place_monthly: null });

  // 모바일 화면 감지
  const isMobile = useMediaQuery('(max-width: 640px)');

  // 데이터 조회
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const configs = await searchLimitService.getSearchLimitsConfig();
      setLimitConfigs(configs);
    } catch (error) {
      toast.error('검색 제한 설정을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 역할 배지 색상
  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      developer: 'bg-purple-100 text-purple-800',
      operator: 'bg-red-100 text-red-800',
      distributor: 'bg-blue-100 text-blue-800',
      agency: 'bg-yellow-100 text-yellow-800',
      advertiser: 'bg-green-100 text-green-800',
      beginner: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // 역할 표시 이름
  const getRoleDisplayName = (role: string) => {
    const names: { [key: string]: string } = {
      developer: '개발자',
      operator: '운영자',
      distributor: '총판',
      agency: '대행사',
      advertiser: '광고주',
      beginner: '비기너'
    };
    return names[role] || role;
  };

  // 편집 시작
  const handleEdit = (role: string) => {
    const shopConfig = limitConfigs.find(c => c.user_role === role && c.search_type === 'shop');
    const placeConfig = limitConfigs.find(c => c.user_role === role && c.search_type === 'place');
    
    setEditValues({
      shop_daily: shopConfig?.daily_limit || 0,
      shop_monthly: shopConfig?.monthly_limit || null,
      place_daily: placeConfig?.daily_limit || 0,
      place_monthly: placeConfig?.monthly_limit || null
    });
    
    setEditingRole(role);
  };

  // 편집 취소
  const handleCancel = () => {
    setEditingRole(null);
    setEditValues({ shop_daily: 0, shop_monthly: null, place_daily: 0, place_monthly: null });
  };

  // 저장
  const handleSave = async (role: string) => {
    try {
      const shopConfig = limitConfigs.find(c => c.user_role === role && c.search_type === 'shop');
      const placeConfig = limitConfigs.find(c => c.user_role === role && c.search_type === 'place');
      const updates: Promise<any>[] = [];
      
      if (shopConfig) {
        updates.push(
          (async () => {
            const { data, error } = await supabase
              .from('search_limits_config')
              .update({
                daily_limit: editValues.shop_daily,
                monthly_limit: editValues.shop_monthly,
                updated_at: new Date().toISOString()
              })
              .eq('id', shopConfig.id);
            return { data, error };
          })()
        );
      }
      
      if (placeConfig) {
        updates.push(
          (async () => {
            const { data, error } = await supabase
              .from('search_limits_config')
              .update({
                daily_limit: editValues.place_daily,
                monthly_limit: editValues.place_monthly,
                updated_at: new Date().toISOString()
              })
              .eq('id', placeConfig.id);
            return { data, error };
          })()
        );
      }
      
      const results = await Promise.all(updates);
      const hasError = results.some(result => result.error);
      
      if (hasError) {
        throw new Error('저장 실패');
      }

      toast.success('검색 제한 설정이 저장되었습니다.');
      setEditingRole(null);
      fetchData(); // 데이터 다시 조회
    } catch (error) {
      toast.error('저장 중 오류가 발생했습니다.');
    }
  };

  // 값 변경 핸들러
  const handleValueChange = (field: string, value: string) => {
    const numValue = field.includes('monthly') && (value === '' || value === 'null') 
      ? null 
      : (value === '-1' ? -1 : parseInt(value) || 0);
    
    setEditValues(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  return (
    <div className="grid gap-6">
      {/* 섹션 타이틀 */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-success/10 p-2 rounded-lg">
          <KeenIcon icon="search-list" className="text-xl text-success" />
        </div>
        <h2 className="text-2xl font-bold">검색 제한 설정</h2>
      </div>

      {/* 검색 제한 설정 카드 */}
      <div className="card bg-card rounded-xl shadow-sm overflow-hidden border border-border min-h-[600px] flex flex-col">
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-info-light/50 dark:bg-info/20 p-2 rounded-lg">
                <KeenIcon icon="shield-search" className="text-lg text-info" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">회원 등급별 검색 제한</h3>
            </div>
            <Button onClick={fetchData} size="sm" variant="outline">
              <KeenIcon icon="arrows-circle" className="text-sm me-1" />
              <span className="hidden sm:inline">새로고침</span>
              <span className="sm:hidden">새로고침</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mr-2 sm:mr-3"></div>
              <p className="text-sm sm:text-base text-muted-foreground">데이터를 불러오는 중...</p>
            </div>
          ) : isMobile ? (
          // 모바일 카드 레이아웃
          <div className="space-y-3 p-4">
            {['beginner', 'advertiser', 'agency', 'distributor', 'operator', 'developer'].map((role) => {
              const shopConfig = limitConfigs.find(c => c.user_role === role && c.search_type === 'shop');
              const placeConfig = limitConfigs.find(c => c.user_role === role && c.search_type === 'place');
              const isEditingThis = editingRole === role;

              return (
                <div key={role} className={`card p-4 ${isEditingThis ? 'ring-2 ring-primary' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`${getRoleBadgeColor(role)} text-sm`}>
                      {getRoleDisplayName(role)}
                    </Badge>
                    {isEditingThis ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSave(role)}
                          className="btn btn-xs btn-icon btn-success"
                          title="저장"
                        >
                          <KeenIcon icon="check" className="text-sm" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="btn btn-xs btn-icon btn-light"
                          title="취소"
                        >
                          <KeenIcon icon="cross" className="text-sm" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(role)}
                        className="btn btn-xs btn-primary"
                      >
                        <KeenIcon icon="notepad-edit" className="text-xs me-1" />
                        수정
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* N 쇼핑 섹션 */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">N 쇼핑</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">일일 제한</label>
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editValues.shop_daily}
                              onChange={(e) => handleValueChange('shop_daily', e.target.value)}
                              className="input input-sm w-full text-center"
                              min="-1"
                            />
                          ) : (
                            <div className="text-sm font-medium">
                              {shopConfig?.daily_limit === -1 ? '무제한' : shopConfig?.daily_limit || '-'}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">월간 제한</label>
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editValues.shop_monthly === null ? '' : editValues.shop_monthly}
                              onChange={(e) => handleValueChange('shop_monthly', e.target.value)}
                              className="input input-sm w-full text-center"
                              placeholder="무제한"
                              min="-1"
                            />
                          ) : (
                            <div className="text-sm font-medium">
                              {shopConfig?.monthly_limit === null ? '무제한' : shopConfig?.monthly_limit || '-'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* N 플레이스 섹션 */}
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">N 플레이스</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">일일 제한</label>
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editValues.place_daily}
                              onChange={(e) => handleValueChange('place_daily', e.target.value)}
                              className="input input-sm w-full text-center"
                              min="-1"
                            />
                          ) : (
                            <div className="text-sm font-medium">
                              {placeConfig?.daily_limit === -1 ? '무제한' : placeConfig?.daily_limit || '-'}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">월간 제한</label>
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editValues.place_monthly === null ? '' : editValues.place_monthly}
                              onChange={(e) => handleValueChange('place_monthly', e.target.value)}
                              className="input input-sm w-full text-center"
                              placeholder="무제한"
                              min="-1"
                            />
                          ) : (
                            <div className="text-sm font-medium">
                              {placeConfig?.monthly_limit === null ? '무제한' : placeConfig?.monthly_limit || '-'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // 데스크탑 테이블 레이아웃
          <div className="overflow-x-auto">
            <table className="table align-middle text-xs sm:text-sm w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="py-3 px-3 sm:py-4 sm:px-5 text-start font-medium">회원 등급</th>
                  <th className="py-3 px-2 sm:py-4 sm:px-5 text-center font-medium">
                    <span className="hidden sm:inline">N 쇼핑 일일</span>
                    <span className="sm:hidden">쇼핑<br/>일일</span>
                  </th>
                  <th className="py-3 px-2 sm:py-4 sm:px-5 text-center font-medium">
                    <span className="hidden sm:inline">N 쇼핑 월간</span>
                    <span className="sm:hidden">쇼핑<br/>월간</span>
                  </th>
                  <th className="py-3 px-2 sm:py-4 sm:px-5 text-center font-medium">
                    <span className="hidden sm:inline">N 플레이스 일일</span>
                    <span className="sm:hidden">플레이스<br/>일일</span>
                  </th>
                  <th className="py-3 px-2 sm:py-4 sm:px-5 text-center font-medium">
                    <span className="hidden sm:inline">N 플레이스 월간</span>
                    <span className="sm:hidden">플레이스<br/>월간</span>
                  </th>
                  <th className="py-3 px-2 sm:py-4 sm:px-5 text-center font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {['beginner', 'advertiser', 'agency', 'distributor', 'operator', 'developer'].map((role) => {
                  const shopConfig = limitConfigs.find(c => c.user_role === role && c.search_type === 'shop');
                  const placeConfig = limitConfigs.find(c => c.user_role === role && c.search_type === 'place');
                  const isEditingThis = editingRole === role;

                  return (
                    <tr key={role} className={`border-b border-border ${isEditingThis ? 'bg-primary/5' : ''}`}>
                      <td className="py-3 px-3 sm:py-4 sm:px-5">
                        <Badge className={`${getRoleBadgeColor(role)} text-xs`}>
                          {getRoleDisplayName(role)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-5">
                        <div className="flex justify-center">
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editValues.shop_daily}
                              onChange={(e) => handleValueChange('shop_daily', e.target.value)}
                              className="input input-sm w-16 sm:w-20 text-center mx-auto text-xs sm:text-sm"
                              min="-1"
                            />
                          ) : (
                            <span className="block text-center text-xs sm:text-sm">{shopConfig?.daily_limit === -1 ? '무제한' : shopConfig?.daily_limit || '-'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-5">
                        <div className="flex justify-center">
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editValues.shop_monthly === null ? '' : editValues.shop_monthly}
                              onChange={(e) => handleValueChange('shop_monthly', e.target.value)}
                              className="input input-sm w-16 sm:w-20 text-center mx-auto text-xs sm:text-sm"
                              placeholder="무제한"
                              min="-1"
                            />
                          ) : (
                            <span className="block text-center text-xs sm:text-sm">{shopConfig?.monthly_limit === null ? '무제한' : shopConfig?.monthly_limit || '-'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-5">
                        <div className="flex justify-center">
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editValues.place_daily}
                              onChange={(e) => handleValueChange('place_daily', e.target.value)}
                              className="input input-sm w-16 sm:w-20 text-center mx-auto text-xs sm:text-sm"
                              min="-1"
                            />
                          ) : (
                            <span className="block text-center text-xs sm:text-sm">{placeConfig?.daily_limit === -1 ? '무제한' : placeConfig?.daily_limit || '-'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-5">
                        <div className="flex justify-center">
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editValues.place_monthly === null ? '' : editValues.place_monthly}
                              onChange={(e) => handleValueChange('place_monthly', e.target.value)}
                              className="input input-sm w-16 sm:w-20 text-center mx-auto text-xs sm:text-sm"
                              placeholder="무제한"
                              min="-1"
                            />
                          ) : (
                            <span className="block text-center text-xs sm:text-sm">{placeConfig?.monthly_limit === null ? '무제한' : placeConfig?.monthly_limit || '-'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:py-4 sm:px-5 text-center">
                        {isEditingThis ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSave(role)}
                              className="btn btn-xs btn-icon btn-success p-1 sm:p-1.5"
                              title="저장"
                            >
                              <KeenIcon icon="check" className="text-xs sm:text-sm" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="btn btn-xs btn-icon btn-light p-1 sm:p-1.5"
                              title="취소"
                            >
                              <KeenIcon icon="cross" className="text-xs sm:text-sm" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(role)}
                            className="btn btn-xs btn-primary"
                          >
                            <KeenIcon icon="notepad-edit" className="text-xs sm:text-sm me-0.5 sm:me-1" />
                            <span className="hidden sm:inline">수정</span>
                            <span className="sm:hidden">수정</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {/* 설명 영역 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 p-4 sm:p-5">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">검색 제한 설정 안내</h3>
        <div className="space-y-2 text-blue-700 dark:text-blue-200 text-sm">
          <p>• <span className="font-medium text-blue-900 dark:text-blue-100">회원 등급별 제한</span>: 각 회원 등급에 따라 검색 횟수를 제한할 수 있습니다.</p>
          <p>• <span className="font-medium text-blue-900 dark:text-blue-100">일일/월간 제한</span>: -1을 입력하면 무제한으로 설정됩니다.</p>
          <p>• <span className="font-medium text-blue-900 dark:text-blue-100">N 쇼핑/N 플레이스</span>: 각 검색 유형별로 별도의 제한을 설정할 수 있습니다.</p>
          <p>• <span className="font-medium text-blue-900 dark:text-blue-100">즉시 적용</span>: 변경사항은 즉시 적용되며, 현재 로그인한 사용자는 재로그인 후 적용됩니다.</p>
        </div>
      </div>
    </div>
  );
};