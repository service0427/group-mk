import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabase';
import { DefaultTooltip } from '@/components/tooltip';
import { toast } from 'sonner';
import { KeenIcon } from '@/components/keenicons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';

export const CashSettingsSection: React.FC = () => {
  // 기본 설정 상태값
  const [globalSettings, setGlobalSettings] = useState({
    min_request_amount: 1000000,
    free_cash_percentage: 10,
    expiry_months: 1,
    min_usage_amount: 10000,
    min_usage_percentage: 5,
    bank_name: '',
    account_number: '',
    account_holder: '',
  });

  // 개별 사용자 설정 상태값
  const [userSettings, setUserSettings] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchUserEmail, setSearchUserEmail] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);

  // 개별 사용자 설정 폼
  const [userSetting, setUserSetting] = useState({
    user_id: '',
    min_request_amount: 0,
    free_cash_percentage: 0,
    expiry_months: 0,
    min_usage_amount: 0,
    min_usage_percentage: 0,
    is_active: true
  });

  // 로딩 상태
  const [loading, setLoading] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // 알림 표시 함수
  const showNotification = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  // 전역 설정 불러오기
  const fetchGlobalSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cash_global_settings')
        .select('*')
        .single();

      if (data) {
        setGlobalSettings({
          min_request_amount: data.min_request_amount,
          free_cash_percentage: data.free_cash_percentage,
          expiry_months: data.expiry_months,
          min_usage_amount: data.min_usage_amount || 10000,
          min_usage_percentage: data.min_usage_percentage || 5,
          bank_name: data.bank_name || '',
          account_number: data.account_number || '',
          account_holder: data.account_holder || ''
        });
      }
    } catch (error) {
      console.error('Error fetching global settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // 사용자별 설정 불러오기
  const fetchUserSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cash_user_settings')
        .select('*, users(email, full_name)')
        .order('created_at', { ascending: false });

      if (data) {
        setUserSettings(data);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // 전역 설정 저장
  const saveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGlobal(true);

    try {
      const { data: existingData } = await supabase
        .from('cash_global_settings')
        .select('id');

      let result;

      if (existingData && existingData.length > 0) {
        result = await supabase
          .from('cash_global_settings')
          .update({
            ...globalSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData[0].id);
      } else {
        result = await supabase
          .from('cash_global_settings')
          .insert(globalSettings);
      }

      if (result.error) throw result.error;

      showNotification('전역 설정이 저장되었습니다.', 'success');
    } catch (error) {
      showNotification('설정 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setSavingGlobal(false);
    }
  };

  // 사용자별 설정 저장
  const saveUserSetting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userSetting.user_id) {
      showNotification('사용자를 선택해주세요.', 'error');
      return;
    }

    setSavingUser(true);

    try {
      const { data: existingUserSetting } = await supabase
        .from('cash_user_settings')
        .select('id')
        .eq('user_id', userSetting.user_id);

      let result;

      if (existingUserSetting && existingUserSetting.length > 0) {
        result = await supabase
          .from('cash_user_settings')
          .update({
            ...userSetting,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUserSetting[0].id);
      } else {
        result = await supabase
          .from('cash_user_settings')
          .insert(userSetting);
      }

      if (result.error) throw result.error;

      showNotification('사용자별 설정이 저장되었습니다.', 'success');
      resetUserSettingForm();
      fetchUserSettings();
    } catch (error) {
      showNotification('설정 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setSavingUser(false);
    }
  };

  // 사용자 검색
  const searchUser = async () => {
    if (!searchUserEmail.trim()) {
      setSearchedUsers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .ilike('email', `%${searchUserEmail}%`)
        .limit(5);

      if (error) throw error;

      setSearchedUsers(data || []);
      setShowUserSearch(true);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // 사용자 선택
  const selectUser = (user: any) => {
    setSelectedUserId(user.id);
    setSearchUserEmail(user.email);
    setShowUserSearch(false);

    const existingSetting = userSettings.find(setting => setting.user_id === user.id);

    if (existingSetting) {
      setUserSetting({
        user_id: user.id,
        min_request_amount: existingSetting.min_request_amount,
        free_cash_percentage: existingSetting.free_cash_percentage,
        expiry_months: existingSetting.expiry_months,
        min_usage_amount: existingSetting.min_usage_amount || globalSettings.min_usage_amount,
        min_usage_percentage: existingSetting.min_usage_percentage || globalSettings.min_usage_percentage,
        is_active: existingSetting.is_active
      });
    } else {
      setUserSetting({
        user_id: user.id,
        min_request_amount: globalSettings.min_request_amount,
        free_cash_percentage: globalSettings.free_cash_percentage,
        expiry_months: globalSettings.expiry_months,
        min_usage_amount: globalSettings.min_usage_amount,
        min_usage_percentage: globalSettings.min_usage_percentage,
        is_active: true
      });
    }
  };

  // 사용자 설정 삭제
  const deleteUserSetting = async (settingId: string) => {
    if (!window.confirm('이 설정을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('cash_user_settings')
        .delete()
        .eq('id', settingId);

      if (error) throw error;

      showNotification('설정이 삭제되었습니다.', 'success');
      fetchUserSettings();
    } catch (error) {
      showNotification('설정 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  // 사용자 설정 폼 초기화
  const resetUserSettingForm = () => {
    setUserSetting({
      user_id: '',
      min_request_amount: 0,
      free_cash_percentage: 0,
      expiry_months: 0,
      min_usage_amount: 0,
      min_usage_percentage: 0,
      is_active: true
    });
    setSelectedUserId('');
    setSearchUserEmail('');
    setSearchedUsers([]);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchGlobalSettings();
    fetchUserSettings();
  }, []);

  return (
    <div className="grid gap-6">
      {/* 섹션 타이틀 */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-warning/10 p-2 rounded-lg">
          <KeenIcon icon="dollar" className="text-xl text-warning" />
        </div>
        <h2 className="text-2xl font-bold">캐시 설정</h2>
      </div>

      {/* 전역 캐시 설정 카드 */}
      <Card>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-info-light/50 dark:bg-info/20 p-2 rounded-lg">
              <KeenIcon icon="setting" className="text-lg text-info" />
            </div>
            <h3 className="text-xl font-semibold">전역 캐시 설정</h3>
            <DefaultTooltip title="모든 사용자에게 적용되는 기본 캐시 설정입니다.">
              <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary cursor-help">
                <KeenIcon icon="information" className="text-xs" />
              </div>
            </DefaultTooltip>
          </div>
        </div>

        <form onSubmit={saveGlobalSettings} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="min_request_amount">무료캐시 최소 요청 금액</Label>
              <Input
                id="min_request_amount"
                type="number"
                value={globalSettings.min_request_amount}
                onChange={(e) => setGlobalSettings({ ...globalSettings, min_request_amount: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="free_cash_percentage">무료캐시 비율 (%)</Label>
              <Input
                id="free_cash_percentage"
                type="number"
                value={globalSettings.free_cash_percentage}
                onChange={(e) => setGlobalSettings({ ...globalSettings, free_cash_percentage: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_months">만료 기간 (개월)</Label>
              <Input
                id="expiry_months"
                type="number"
                value={globalSettings.expiry_months}
                onChange={(e) => setGlobalSettings({ ...globalSettings, expiry_months: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_usage_amount">최소 사용 금액</Label>
              <Input
                id="min_usage_amount"
                type="number"
                value={globalSettings.min_usage_amount}
                onChange={(e) => setGlobalSettings({ ...globalSettings, min_usage_amount: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_usage_percentage">최소 사용 비율 (%)</Label>
              <Input
                id="min_usage_percentage"
                type="number"
                value={globalSettings.min_usage_percentage}
                onChange={(e) => setGlobalSettings({ ...globalSettings, min_usage_percentage: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          {/* 입금 계좌 정보 */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-lg font-medium mb-4">입금 계좌 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">은행명</Label>
                <Input
                  id="bank_name"
                  type="text"
                  value={globalSettings.bank_name}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, bank_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number">계좌번호</Label>
                <Input
                  id="account_number"
                  type="text"
                  value={globalSettings.account_number}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, account_number: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_holder">예금주</Label>
                <Input
                  id="account_holder"
                  type="text"
                  value={globalSettings.account_holder}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, account_holder: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button type="submit" disabled={savingGlobal}>
              {savingGlobal ? '저장 중...' : '설정 저장'}
            </Button>
          </div>
        </form>
      </Card>

      {/* 사용자별 캐시 설정 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 사용자별 설정 폼 */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="bg-info-light/50 dark:bg-info/20 p-2 rounded-lg">
                  <KeenIcon icon="user-edit" className="text-lg text-info" />
                </div>
                <h3 className="text-xl font-semibold">사용자별 캐시 설정</h3>
              </div>
            </div>

            <form onSubmit={saveUserSetting} className="p-6">
              {/* 사용자 검색 */}
              <div className="mb-4 space-y-2">
                <Label htmlFor="search_user">사용자 검색</Label>
                <div className="relative">
                  <Input
                    id="search_user"
                    type="text"
                    value={searchUserEmail}
                    onChange={(e) => setSearchUserEmail(e.target.value)}
                    onKeyUp={(e) => e.key === 'Enter' && searchUser()}
                    placeholder="이메일로 검색"
                  />
                  {showUserSearch && searchedUsers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                      {searchedUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectUser(user)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="text-sm font-medium">{user.email}</div>
                          {user.full_name && (
                            <div className="text-xs text-gray-500">{user.full_name}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 설정 필드들 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user_min_request">최소 요청 금액</Label>
                  <Input
                    id="user_min_request"
                    type="number"
                    value={userSetting.min_request_amount}
                    onChange={(e) => setUserSetting({ ...userSetting, min_request_amount: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_free_percentage">무료캐시 비율 (%)</Label>
                  <Input
                    id="user_free_percentage"
                    type="number"
                    value={userSetting.free_cash_percentage}
                    onChange={(e) => setUserSetting({ ...userSetting, free_cash_percentage: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_expiry">만료 기간 (개월)</Label>
                  <Input
                    id="user_expiry"
                    type="number"
                    value={userSetting.expiry_months}
                    onChange={(e) => setUserSetting({ ...userSetting, expiry_months: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="user-active"
                    checked={userSetting.is_active}
                    onCheckedChange={(checked) => setUserSetting({ ...userSetting, is_active: checked })}
                  />
                  <Label htmlFor="user-active">활성화</Label>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  type="submit"
                  disabled={savingUser || !userSetting.user_id}
                >
                  {savingUser ? '저장 중...' : '설정 저장'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetUserSettingForm}
                >
                  초기화
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* 사용자별 설정 목록 */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-semibold">사용자별 설정 목록</h3>
            </div>

            <div className="p-6">
              {userSettings.length === 0 ? (
                <p className="text-gray-500 text-center py-4">설정된 사용자가 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-2 text-left">사용자</th>
                        <th className="px-4 py-2 text-center">최소 요청</th>
                        <th className="px-4 py-2 text-center">무료캐시 %</th>
                        <th className="px-4 py-2 text-center">만료기간</th>
                        <th className="px-4 py-2 text-center">상태</th>
                        <th className="px-4 py-2 text-center">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userSettings.map((setting) => (
                        <tr key={setting.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="px-4 py-2">
                            <div>
                              <div className="text-sm font-medium">{setting.users?.email}</div>
                              {setting.users?.full_name && (
                                <div className="text-xs text-gray-500">{setting.users.full_name}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {setting.min_request_amount.toLocaleString()}원
                          </td>
                          <td className="px-4 py-2 text-center">
                            {setting.free_cash_percentage}%
                          </td>
                          <td className="px-4 py-2 text-center">
                            {setting.expiry_months}개월
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`badge ${setting.is_active ? 'badge-success' : 'badge-secondary'}`}>
                              {setting.is_active ? '활성' : '비활성'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => selectUser({ id: setting.user_id, email: setting.users?.email })}
                              className="mr-2"
                            >
                              수정
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteUserSetting(setting.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              삭제
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 설명 영역 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 p-5">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">캐시 설정 관리 안내</h3>
        <div className="space-y-2 text-blue-700 dark:text-blue-200 text-sm">
          <p>• <span className="font-medium text-blue-900 dark:text-blue-100">전역 캐시 설정</span>: 모든 사용자에게 적용되는 기본 캐시 정책입니다.</p>
          <p>• <span className="font-medium text-blue-900 dark:text-blue-100">무료캐시 비율</span>: 충전 금액 대비 제공되는 무료 캐시의 비율입니다.</p>
          <p>• <span className="font-medium text-blue-900 dark:text-blue-100">만료 기간</span>: 무료 캐시의 유효 기간을 설정합니다.</p>
          <p>• <span className="font-medium text-blue-900 dark:text-blue-100">입금 계좌 정보</span>: 캐시 충전 시 안내될 입금 계좌 정보입니다.</p>
        </div>
      </div>
    </div>
  );
};