import React, { useEffect, useState } from 'react';
import BasicTemplate from '../components/BasicTemplate';
import { supabase } from '@/supabase';

const ManageSettingPage = () => {
  // 기본 설정 상태값
  const [globalSettings, setGlobalSettings] = useState({
    min_request_amount: 1000000, // 무료캐시 받을 수 있는 최소 요청 금액
    free_cash_percentage: 10, // 무료캐시 퍼센트
    expiry_months: 1, // 만료기간 개월 수
    min_usage_amount: 10000, // 무료캐시 최소 사용 금액
    min_usage_percentage: 5, // 무료캐시 최소 사용 비율(%)
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

  // 알림 상태
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // 전역 설정 불러오기
  const fetchGlobalSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cash_global_settings')
        .select('*')
        .single();

      if (error) {
        console.error("전역 설정 로딩 오류:", error);
        // 오류가 날 경우 기본값 유지
      } else if (data) {
        setGlobalSettings({
          min_request_amount: data.min_request_amount,
          free_cash_percentage: data.free_cash_percentage,
          expiry_months: data.expiry_months,
          min_usage_amount: data.min_usage_amount || 10000,
          min_usage_percentage: data.min_usage_percentage || 5
        });
      }
    } catch (error: any) {
      console.error("전역 설정 로딩 오류:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 사용자별 설정 불러오기
  const fetchUserSettings = async () => {
    setLoading(true);
    try {
      // 사용자별 설정 조회
      const { data: settingsData, error: settingsError } = await supabase
        .from('cash_user_settings')
        .select('*, users(email, full_name)')
        .order('created_at', { ascending: false });

      if (settingsError) {
        console.error("사용자별 설정 로딩 오류:", settingsError);
      } else if (settingsData) {
        setUserSettings(settingsData);
      }
    } catch (error: any) {
      console.error("사용자별 설정 로딩 오류:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 전역 설정 저장
  const saveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGlobal(true);
    
    try {
      // 기존 설정 확인
      const { data: existingData, error: checkError } = await supabase
        .from('cash_global_settings')
        .select('id');

      if (checkError) throw new Error(checkError.message);

      let result;
      
      if (existingData && existingData.length > 0) {
        // 기존 설정 업데이트
        result = await supabase
          .from('cash_global_settings')
          .update({
            min_request_amount: globalSettings.min_request_amount,
            free_cash_percentage: globalSettings.free_cash_percentage,
            expiry_months: globalSettings.expiry_months,
            min_usage_amount: globalSettings.min_usage_amount,
            min_usage_percentage: globalSettings.min_usage_percentage,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData[0].id);
      } else {
        // 신규 설정 추가
        result = await supabase
          .from('cash_global_settings')
          .insert({
            min_request_amount: globalSettings.min_request_amount,
            free_cash_percentage: globalSettings.free_cash_percentage,
            expiry_months: globalSettings.expiry_months,
            min_usage_amount: globalSettings.min_usage_amount,
            min_usage_percentage: globalSettings.min_usage_percentage
          });
      }

      if (result.error) throw new Error(result.error.message);

      showNotification('전역 설정이 저장되었습니다.', 'success');
    } catch (error: any) {
      console.error("전역 설정 저장 오류:", error.message);
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
      // 기존 사용자 설정 확인
      const { data: existingUserSetting, error: checkError } = await supabase
        .from('cash_user_settings')
        .select('id')
        .eq('user_id', userSetting.user_id);

      if (checkError) throw new Error(checkError.message);

      let result;
      
      if (existingUserSetting && existingUserSetting.length > 0) {
        // 기존 설정 업데이트
        result = await supabase
          .from('cash_user_settings')
          .update({
            min_request_amount: userSetting.min_request_amount,
            free_cash_percentage: userSetting.free_cash_percentage,
            expiry_months: userSetting.expiry_months,
            min_usage_amount: userSetting.min_usage_amount,
            min_usage_percentage: userSetting.min_usage_percentage,
            is_active: userSetting.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUserSetting[0].id);
      } else {
        // 신규 설정 추가
        result = await supabase
          .from('cash_user_settings')
          .insert({
            user_id: userSetting.user_id,
            min_request_amount: userSetting.min_request_amount,
            free_cash_percentage: userSetting.free_cash_percentage,
            expiry_months: userSetting.expiry_months,
            min_usage_amount: userSetting.min_usage_amount,
            min_usage_percentage: userSetting.min_usage_percentage,
            is_active: userSetting.is_active
          });
      }

      if (result.error) throw new Error(result.error.message);

      showNotification('사용자별 설정이 저장되었습니다.', 'success');
      resetUserSettingForm();
      fetchUserSettings(); // 목록 새로고침
      
    } catch (error: any) {
      console.error("사용자별 설정 저장 오류:", error.message);
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
        
      if (error) throw new Error(error.message);
      
      setSearchedUsers(data || []);
      setShowUserSearch(true);
    } catch (error: any) {
      console.error("사용자 검색 오류:", error.message);
    }
  };
  
  // 사용자 선택 시
  const selectUser = (user: any) => {
    setSelectedUserId(user.id);
    setSearchUserEmail(user.email);
    setShowUserSearch(false);
    
    // 기존 설정 확인
    const existingSetting = userSettings.find(setting => setting.user_id === user.id);
    
    if (existingSetting) {
      // 기존 설정이 있으면 폼에 표시
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
      // 기본값으로 폼 초기화
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
        
      if (error) throw new Error(error.message);
      
      showNotification('설정이 삭제되었습니다.', 'success');
      fetchUserSettings(); // 목록 새로고침
    } catch (error: any) {
      console.error("설정 삭제 오류:", error.message);
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
    setShowUserSearch(false);
  };
  
  // 알림 표시
  const showNotification = (message: string, type: string) => {
    setNotification({ show: true, message, type });
    
    // 3초 후 알림 숨기기
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchGlobalSettings();
    fetchUserSettings();
  }, []);
  
  // 이메일 검색 시 자동 검색
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchUserEmail) searchUser();
    }, 500);
    
    return () => clearTimeout(handler);
  }, [searchUserEmail]);

  return (
    <BasicTemplate 
      title="캐시 설정" 
      description="무료 캐시 지급 조건 및 만료 기간 설정을 관리합니다">
      
      {/* 알림 메시지 */}
      {notification.show && (
        <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'} mb-5`}>
          <span>{notification.message}</span>
        </div>
      )}
      
      {/* 전역 설정 카드 */}
      <div className="card p-6 mb-5 shadow-sm bg-white">
        <div className="card-header pb-5">
          <h3 className="card-title text-lg font-semibold">전역 캐시 설정</h3>
          <p className="text-sm text-gray-500 mt-1">
            모든 사용자에게 적용되는 기본 설정입니다. 개별 사용자 설정이 없는 경우 이 설정이 적용됩니다.
          </p>
        </div>
        
        <div className="card-body p-0">
          <form onSubmit={saveGlobalSettings}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              {/* 최소 요청 금액 설정 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-gray-700">무료캐시 최소 충전 금액 (원)</span>
                </label>
                <input 
                  type="number" 
                  placeholder="예: 10000" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                  value={globalSettings.min_request_amount}
                  onChange={(e) => setGlobalSettings({...globalSettings, min_request_amount: parseInt(e.target.value) || 0})} 
                  min="0"
                  step="1000"
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">최소 충전 금액 이상 충전 시 무료 캐시가 지급됩니다.</span>
                </label>
              </div>

              {/* 무료캐시 퍼센트 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-gray-700">무료캐시 지급 비율 (%)</span>
                </label>
                <input 
                  type="number" 
                  placeholder="예: 10" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                  value={globalSettings.free_cash_percentage}
                  onChange={(e) => setGlobalSettings({...globalSettings, free_cash_percentage: parseInt(e.target.value) || 0})} 
                  min="0"
                  max="100"
                  step="1"
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">충전 금액의 몇 % 를 무료 캐시로 지급할지 설정합니다.</span>
                </label>
              </div>

              {/* 만료 기간 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-gray-700">무료캐시 만료 기간 (개월)</span>
                </label>
                <input 
                  type="number" 
                  placeholder="예: 3" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                  value={globalSettings.expiry_months}
                  onChange={(e) => setGlobalSettings({...globalSettings, expiry_months: parseInt(e.target.value) || 0})} 
                  min="0"
                  max="36"
                  step="1"
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">무료 캐시가 만료되는 기간을 개월 단위로 설정합니다. 0은 만료되지 않음.</span>
                </label>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* 무료캐시 최소 사용 금액 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-gray-700">무료캐시 최소 사용 금액 (원)</span>
                </label>
                <input 
                  type="number" 
                  placeholder="예: 10000" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                  value={globalSettings.min_usage_amount}
                  onChange={(e) => setGlobalSettings({...globalSettings, min_usage_amount: parseInt(e.target.value) || 0})} 
                  min="0"
                  step="1000"
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">무료캐시를 사용할 수 있는 최소 결제 금액입니다.</span>
                </label>
              </div>

              {/* 무료캐시 최소 사용 비율 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text text-sm font-medium text-gray-700">무료캐시 최소 사용 비율 (%)</span>
                </label>
                <input 
                  type="number" 
                  placeholder="예: 5" 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                  value={globalSettings.min_usage_percentage}
                  onChange={(e) => setGlobalSettings({...globalSettings, min_usage_percentage: parseInt(e.target.value) || 0})} 
                  min="0"
                  max="100"
                  step="1"
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">결제 금액 중 최소 몇 %를 무료캐시로 사용해야 하는지 설정합니다.</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary px-6" disabled={savingGlobal}>
                {savingGlobal ? (
                  <>
                    <span className="loading loading-spinner loading-xs mr-2"></span>
                    저장 중...
                  </>
                ) : "저장"}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* 사용자별 설정 카드 - 개별 설정 생성/편집 */}
      <div className="card p-6 mb-5 shadow-sm bg-white">
        <div className="card-header pb-5">
          <h3 className="card-title text-lg font-semibold">개별 사용자 설정</h3>
          <p className="text-sm text-gray-500 mt-1">
            특정 사용자에게 다른 설정을 적용하려면 여기서 추가하세요. 개별 설정이 전역 설정보다 우선합니다.
          </p>
        </div>
        
        <div className="card-body p-0">
          <form onSubmit={saveUserSetting}>
            {/* 사용자 검색 */}
            <div className="form-control w-full mb-5">
              <label className="label">
                <span className="label-text text-sm font-medium text-gray-700">사용자 이메일</span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="사용자 이메일 검색..." 
                  className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                  value={searchUserEmail}
                  onChange={(e) => setSearchUserEmail(e.target.value)} 
                  onFocus={() => setShowUserSearch(true)}
                />
                
                {/* 검색 결과 드롭다운 */}
                {showUserSearch && searchedUsers.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {searchedUsers.map((user) => (
                      <div 
                        key={user.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                        onClick={() => selectUser(user)}
                      >
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <label className="label">
                <span className="label-text-alt text-gray-500">사용자 이메일을 검색하여 선택하세요.</span>
              </label>
            </div>
            
            {/* 선택된 사용자가 있으면 설정 입력 폼 표시 */}
            {selectedUserId && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  {/* 최소 요청 금액 설정 */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-sm font-medium text-gray-700">무료캐시 최소 충전 금액 (원)</span>
                    </label>
                    <input 
                      type="number" 
                      placeholder="예: 10000" 
                      className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                      value={userSetting.min_request_amount}
                      onChange={(e) => setUserSetting({...userSetting, min_request_amount: parseInt(e.target.value) || 0})} 
                      min="0"
                      step="1000"
                    />
                  </div>

                  {/* 무료캐시 퍼센트 */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-sm font-medium text-gray-700">무료캐시 지급 비율 (%)</span>
                    </label>
                    <input 
                      type="number" 
                      placeholder="예: 10" 
                      className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                      value={userSetting.free_cash_percentage}
                      onChange={(e) => setUserSetting({...userSetting, free_cash_percentage: parseInt(e.target.value) || 0})} 
                      min="0"
                      max="100"
                      step="1"
                    />
                  </div>

                  {/* 만료 기간 */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-sm font-medium text-gray-700">무료캐시 만료 기간 (개월)</span>
                    </label>
                    <input 
                      type="number" 
                      placeholder="예: 3" 
                      className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                      value={userSetting.expiry_months}
                      onChange={(e) => setUserSetting({...userSetting, expiry_months: parseInt(e.target.value) || 0})} 
                      min="0"
                      max="36"
                      step="1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  {/* 무료캐시 최소 사용 금액 */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-sm font-medium text-gray-700">무료캐시 최소 사용 금액 (원)</span>
                    </label>
                    <input 
                      type="number" 
                      placeholder="예: 10000" 
                      className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                      value={userSetting.min_usage_amount}
                      onChange={(e) => setUserSetting({...userSetting, min_usage_amount: parseInt(e.target.value) || 0})} 
                      min="0"
                      step="1000"
                    />
                    <label className="label">
                      <span className="label-text-alt text-gray-500">무료캐시를 사용할 수 있는 최소 결제 금액입니다.</span>
                    </label>
                  </div>

                  {/* 무료캐시 최소 사용 비율 */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-sm font-medium text-gray-700">무료캐시 최소 사용 비율 (%)</span>
                    </label>
                    <input 
                      type="number" 
                      placeholder="예: 5" 
                      className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                      value={userSetting.min_usage_percentage}
                      onChange={(e) => setUserSetting({...userSetting, min_usage_percentage: parseInt(e.target.value) || 0})} 
                      min="0"
                      max="100"
                      step="1"
                    />
                    <label className="label">
                      <span className="label-text-alt text-gray-500">결제 금액 중 최소 몇 %를 무료캐시로 사용해야 하는지 설정합니다.</span>
                    </label>
                  </div>
                </div>
              </>
            )}
            
            {/* 활성화 상태 */}
            {selectedUserId && (
              <div className="form-control mb-5">
                <label className="cursor-pointer flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-primary" 
                    checked={userSetting.is_active} 
                    onChange={(e) => setUserSetting({...userSetting, is_active: e.target.checked})}
                  />
                  <span className="label-text text-sm font-medium text-gray-700">이 설정 활성화</span>
                </label>
                <label className="label pl-8">
                  <span className="label-text-alt text-gray-500">비활성화하면 전역 설정이 사용됩니다.</span>
                </label>
              </div>
            )}
            
            {/* 버튼 */}
            <div className="flex justify-end gap-3">
              {selectedUserId && (
                <button type="button" className="btn btn-light" onClick={resetUserSettingForm}>
                  취소
                </button>
              )}
              
              <button 
                type="submit" 
                className="btn btn-primary px-6" 
                disabled={!selectedUserId || savingUser}
              >
                {savingUser ? (
                  <>
                    <span className="loading loading-spinner loading-xs mr-2"></span>
                    저장 중...
                  </>
                ) : "설정 저장"}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* 사용자별 설정 목록 */}
      <div className="card mb-5 shadow-sm bg-white">
        <div className="card-header p-6 pb-5">
          <h3 className="card-title text-lg font-semibold">개별 사용자 설정 목록</h3>
        </div>
        
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {userSettings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table align-middle text-gray-700 text-sm w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="py-4 px-5 text-start min-w-[180px]">
                          <span className="font-medium text-gray-700">사용자</span>
                        </th>
                        <th className="py-4 px-5 text-start min-w-[140px]">
                          <span className="font-medium text-gray-700">최소 충전 금액</span>
                        </th>
                        <th className="py-4 px-5 text-start min-w-[120px]">
                          <span className="font-medium text-gray-700">무료캐시 %</span>
                        </th>
                        <th className="py-4 px-5 text-start min-w-[120px]">
                          <span className="font-medium text-gray-700">만료 기간(월)</span>
                        </th>
                        <th className="py-4 px-5 text-start min-w-[120px]">
                          <span className="font-medium text-gray-700">최소 사용액</span>
                        </th>
                        <th className="py-4 px-5 text-start min-w-[120px]">
                          <span className="font-medium text-gray-700">최소 사용 %</span>
                        </th>
                        <th className="py-4 px-5 text-start min-w-[100px]">
                          <span className="font-medium text-gray-700">상태</span>
                        </th>
                        <th className="py-4 px-5 text-end min-w-[120px]">
                          <span className="font-medium text-gray-700">작업</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {userSettings.map((setting) => (
                        <tr key={setting.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-4 px-5">
                            <div className="flex flex-col">
                              <span className="text-gray-800 font-medium">{setting.users?.full_name || '알 수 없음'}</span>
                              <span className="text-gray-500 text-xs">{setting.users?.email || '알 수 없음'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <span className="text-gray-800">₩{setting.min_request_amount.toLocaleString()}</span>
                          </td>
                          <td className="py-4 px-5">
                            <span className="text-gray-800">{setting.free_cash_percentage}%</span>
                          </td>
                          <td className="py-4 px-5">
                            <span className="text-gray-800">{setting.expiry_months}개월</span>
                          </td>
                          <td className="py-4 px-5">
                            <span className="text-gray-800">₩{(setting.min_usage_amount || 0).toLocaleString()}</span>
                          </td>
                          <td className="py-4 px-5">
                            <span className="text-gray-800">{setting.min_usage_percentage || 0}%</span>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${setting.is_active ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-700'}`}>
                              {setting.is_active ? '활성' : '비활성'}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-end">
                            <div className="flex justify-end gap-2">
                              <button 
                                className="btn btn-sm btn-light"
                                onClick={() => selectUser({id: setting.user_id, email: setting.users?.email, full_name: setting.users?.full_name})}
                              >
                                편집
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => deleteUserSetting(setting.id)}
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  등록된 개별 사용자 설정이 없습니다.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </BasicTemplate>
  );
};

export { ManageSettingPage };
