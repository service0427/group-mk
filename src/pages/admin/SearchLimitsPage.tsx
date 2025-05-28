import React, { useState, useEffect } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { KeenIcon } from '@/components';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/supabase';
import searchLimitService from '@/services/searchLimitService';
import { toast } from 'sonner';

interface SearchLimitConfig {
  id: string;
  user_role: string;
  search_type: string;
  daily_limit: number;
  monthly_limit: number | null;
}

const SearchLimitsPage: React.FC = () => {
  const [limitConfigs, setLimitConfigs] = useState<SearchLimitConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    shop_daily: number;
    shop_monthly: number | null;
    place_daily: number;
    place_monthly: number | null;
  }>({ shop_daily: 0, shop_monthly: null, place_daily: 0, place_monthly: null });

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
    <CommonTemplate
      title="검색 제한 설정"
      description="회원 등급별 검색 제한을 관리합니다"
      showPageMenu={false}
    >
      <Card>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">회원 등급별 검색 제한</h3>
            <Button onClick={fetchData} className="btn btn-sm btn-light">
              새로고침
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table align-middle text-sm w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="py-4 px-5 text-start font-medium w-[150px]">회원 등급</th>
                  <th className="py-4 px-5 text-center font-medium w-[120px]">N 쇼핑 일일</th>
                  <th className="py-4 px-5 text-center font-medium w-[120px]">N 쇼핑 월간</th>
                  <th className="py-4 px-5 text-center font-medium w-[120px]">N 플레이스 일일</th>
                  <th className="py-4 px-5 text-center font-medium w-[120px]">N 플레이스 월간</th>
                  <th className="py-4 px-5 text-center font-medium w-[100px]">작업</th>
                </tr>
              </thead>
              <tbody>
                {['beginner', 'advertiser', 'agency', 'distributor', 'operator', 'developer'].map((role) => {
                  const shopConfig = limitConfigs.find(c => c.user_role === role && c.search_type === 'shop');
                  const placeConfig = limitConfigs.find(c => c.user_role === role && c.search_type === 'place');
                  const isEditingThis = editingRole === role;

                  return (
                    <tr key={role} className={`border-b border-border ${isEditingThis ? 'bg-primary/5' : ''}`}>
                      <td className="py-4 px-5">
                        <Badge className={getRoleBadgeColor(role)}>
                          {getRoleDisplayName(role)}
                        </Badge>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex justify-center">
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editValues.shop_daily}
                              onChange={(e) => handleValueChange('shop_daily', e.target.value)}
                              className="input input-sm w-20 text-center mx-auto"
                              min="-1"
                            />
                          ) : (
                            <span className="block text-center">{shopConfig?.daily_limit === -1 ? '무제한' : shopConfig?.daily_limit || '-'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex justify-center">
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editValues.shop_monthly === null ? '' : editValues.shop_monthly}
                              onChange={(e) => handleValueChange('shop_monthly', e.target.value)}
                              className="input input-sm w-20 text-center mx-auto"
                              placeholder="무제한"
                              min="-1"
                            />
                          ) : (
                            <span className="block text-center">{shopConfig?.monthly_limit === null ? '무제한' : shopConfig?.monthly_limit || '-'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex justify-center">
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editValues.place_daily}
                              onChange={(e) => handleValueChange('place_daily', e.target.value)}
                              className="input input-sm w-20 text-center mx-auto"
                              min="-1"
                            />
                          ) : (
                            <span className="block text-center">{placeConfig?.daily_limit === -1 ? '무제한' : placeConfig?.daily_limit || '-'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex justify-center">
                          {isEditingThis ? (
                            <input
                              type="number"
                              value={editValues.place_monthly === null ? '' : editValues.place_monthly}
                              onChange={(e) => handleValueChange('place_monthly', e.target.value)}
                              className="input input-sm w-20 text-center mx-auto"
                              placeholder="무제한"
                              min="-1"
                            />
                          ) : (
                            <span className="block text-center">{placeConfig?.monthly_limit === null ? '무제한' : placeConfig?.monthly_limit || '-'}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        {isEditingThis ? (
                          <div className="flex items-center justify-center gap-1">
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
                            <KeenIcon icon="notepad-edit" className="text-sm me-1" />
                            수정
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

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 p-5 mt-6">
          <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">사용 안내</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
            <li>• 일일/월간 제한에 <strong className="text-blue-900 dark:text-blue-100">-1</strong>을 입력하면 <strong className="text-blue-900 dark:text-blue-100">무제한</strong>으로 설정됩니다.</li>
            <li>• 월간 제한을 비워두면 <strong className="text-blue-900 dark:text-blue-100">무제한</strong>으로 설정됩니다.</li>
            <li>• 변경사항은 즉시 적용되며, 현재 로그인한 사용자는 다시 로그인해야 적용됩니다.</li>
          </ul>
        </div>
      </Card>
    </CommonTemplate>
  );
};

export { SearchLimitsPage };