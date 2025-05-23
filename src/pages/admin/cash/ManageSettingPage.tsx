import React, { useEffect, useState } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { supabase } from '@/supabase';
import { DefaultTooltip } from '@/components/tooltip';

const ManageSettingPage = () => {
  // 기본 설정 상태값
  const [globalSettings, setGlobalSettings] = useState({
    min_request_amount: 1000000, // 무료캐시 받을 수 있는 최소 요청 금액
    free_cash_percentage: 10, // 무료캐시 퍼센트
    expiry_months: 1, // 만료기간 개월 수
    min_usage_amount: 10000, // 무료캐시 최소 사용 금액
    min_usage_percentage: 5, // 무료캐시 최소 사용 비율(%)
    bank_name: '', // 입금 계좌 은행명
    account_number: '', // 입금 계좌번호
    account_holder: '', // 입금 계좌 예금주
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
        
        // 오류가 날 경우 기본값 유지
      } else if (data) {
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
    } catch (error: any) {
      
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
        
      } else if (settingsData) {
        setUserSettings(settingsData);
      }
    } catch (error: any) {
      
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
            bank_name: globalSettings.bank_name,
            account_number: globalSettings.account_number,
            account_holder: globalSettings.account_holder,
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
            min_usage_percentage: globalSettings.min_usage_percentage,
            bank_name: globalSettings.bank_name,
            account_number: globalSettings.account_number,
            account_holder: globalSettings.account_holder
          });
      }

      if (result.error) throw new Error(result.error.message);

      showNotification('전역 설정이 저장되었습니다.', 'success');
    } catch (error: any) {
      
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
    <CommonTemplate
      title="캐시 설정"
      description="무료 캐시 지급 조건 및 만료 기간 설정을 관리합니다"
      showPageMenu={false}>

      {/* 알림 메시지 - 토스트 형태로 개선 */}
      {notification.show && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform ${notification.type === 'success' ? 'bg-green-50 text-green-700 border-l-4 border-green-500' :
              'bg-red-50 text-red-700 border-l-4 border-red-500'
            }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* 전역 설정 카드 */}
        <div className="card bg-card rounded-xl shadow-sm overflow-hidden border border-border">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="bg-info-light/50 dark:bg-info/20 p-2 rounded-lg">
                <svg className="w-5 h-5 text-info" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">전역 캐시 설정</h3>
              <DefaultTooltip title="모든 사용자에게 적용되는 기본 설정입니다. 개별 사용자 설정이 없는 경우 이 설정이 적용됩니다." arrow placement="top">
                <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary cursor-help">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </div>
              </DefaultTooltip>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={saveGlobalSettings}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* 최소 요청 금액 설정 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium text-card-foreground mb-1">
                      무료캐시 최소 충전 금액
                    </label>
                    <DefaultTooltip title="최소 충전 금액 이상 충전 시 무료 캐시가 지급됩니다." arrow placement="top">
                      <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary cursor-help">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 16v-4"></path>
                          <path d="M12 8h.01"></path>
                        </svg>
                      </div>
                    </DefaultTooltip>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-muted-foreground sm:text-sm">₩</span>
                    </div>
                    <input
                      type="text"
                      placeholder="예: 1,000,000"
                      className="input pl-8 block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
                      value={globalSettings.min_request_amount.toLocaleString()}
                      onChange={(e) => {
                        // 입력에서 콤마를 제거하고 숫자만 파싱
                        const value = e.target.value.replace(/,/g, '');
                        const numValue = parseInt(value) || 0;
                        setGlobalSettings({ ...globalSettings, min_request_amount: numValue });
                      }}
                    />
                  </div>
                  {/* 설명은 툴팁으로 이동했습니다 */}
                </div>

                {/* 무료캐시 퍼센트 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium text-card-foreground mb-1">
                      무료캐시 지급 비율
                    </label>
                    <DefaultTooltip title="충전 금액의 몇 % 를 무료 캐시로 지급할지 설정합니다." arrow placement="top">
                      <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary cursor-help">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 16v-4"></path>
                          <path d="M12 8h.01"></path>
                        </svg>
                      </div>
                    </DefaultTooltip>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="예: 10"
                      className="input block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary pr-12"
                      value={globalSettings.free_cash_percentage}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, free_cash_percentage: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="100"
                      step="1"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-muted-foreground sm:text-sm">%</span>
                    </div>
                  </div>
                  {/* 설명은 툴팁으로 이동했습니다 */}
                </div>

                {/* 만료 기간 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium text-card-foreground mb-1">
                      무료캐시 만료 기간
                    </label>
                    <DefaultTooltip title="무료 캐시가 만료되는 기간을 개월 단위로 설정합니다. 0은 만료되지 않음." arrow placement="top">
                      <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-info/10 text-primary cursor-help">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 16v-4"></path>
                          <path d="M12 8h.01"></path>
                        </svg>
                      </div>
                    </DefaultTooltip>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="예: 1"
                      className="input block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary pr-16"
                      value={globalSettings.expiry_months}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, expiry_months: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="36"
                      step="1"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-muted-foreground sm:text-sm">개월</span>
                    </div>
                  </div>
                  {/* 설명은 툴팁으로 이동했습니다 */}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* 무료캐시 최소 사용 금액 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium text-card-foreground mb-1">
                      무료캐시 최소 사용 금액
                    </label>
                    <DefaultTooltip title="무료캐시를 사용할 수 있는 최소 결제 금액입니다." arrow placement="top">
                      <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-info/10 text-primary cursor-help">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 16v-4"></path>
                          <path d="M12 8h.01"></path>
                        </svg>
                      </div>
                    </DefaultTooltip>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-muted-foreground sm:text-sm">₩</span>
                    </div>
                    <input
                      type="text"
                      placeholder="예: 10,000"
                      className="input pl-8 block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
                      value={globalSettings.min_usage_amount.toLocaleString()}
                      onChange={(e) => {
                        // 입력에서 콤마를 제거하고 숫자만 파싱
                        const value = e.target.value.replace(/,/g, '');
                        const numValue = parseInt(value) || 0;
                        setGlobalSettings({ ...globalSettings, min_usage_amount: numValue });
                      }}
                    />
                  </div>
                  {/* 설명은 툴팁으로 이동했습니다 */}
                </div>

                {/* 무료캐시 최소 사용 비율 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium text-card-foreground mb-1">
                      무료캐시 최소 사용 비율
                    </label>
                    <DefaultTooltip title="결제 금액 중 최소 몇 %를 무료캐시로 사용해야 하는지 설정합니다." arrow placement="top">
                      <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-info/10 text-primary cursor-help">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 16v-4"></path>
                          <path d="M12 8h.01"></path>
                        </svg>
                      </div>
                    </DefaultTooltip>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="예: 5"
                      className="input block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary pr-12"
                      value={globalSettings.min_usage_percentage}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, min_usage_percentage: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="100"
                      step="1"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-muted-foreground sm:text-sm">%</span>
                    </div>
                  </div>
                  {/* 설명은 툴팁으로 이동했습니다 */}
                </div>
              </div>
              
              {/* 입금 계좌 정보 섹션 */}
              <div className="border-t border-border pt-6 mt-6">
                <h4 className="text-base font-medium text-card-foreground mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 8.5H22M6 16.5H8M10.5 16.5H16.5M2 11.5V19.5C2 20.05 2.45 20.5 3 20.5H21C21.55 20.5 22 20.05 22 19.5V11.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 8.5V7.7C22 7.2 21.8 6.8 21.4 6.4L19.1 4.1C18.7 3.7 18.2 3.5 17.7 3.5H6.3C5.8 3.5 5.3 3.7 4.9 4.1L2.6 6.4C2.2 6.8 2 7.2 2 7.7V8.5H22Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  입금 계좌 정보
                  <DefaultTooltip title="캐시 신청 시 표시될 입금 계좌 정보를 설정합니다." arrow placement="top">
                    <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/10 text-primary cursor-help">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                      </svg>
                    </div>
                  </DefaultTooltip>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* 은행명 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-card-foreground mb-1">
                      은행명
                    </label>
                    <input
                      type="text"
                      placeholder="예: 국민은행"
                      className="input block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
                      value={globalSettings.bank_name}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, bank_name: e.target.value })}
                    />
                  </div>

                  {/* 계좌번호 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-card-foreground mb-1">
                      계좌번호
                    </label>
                    <input
                      type="text"
                      placeholder="예: 000-00-000000"
                      className="input block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
                      value={globalSettings.account_number}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, account_number: e.target.value })}
                    />
                  </div>

                  {/* 예금주 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-card-foreground mb-1">
                      예금주
                    </label>
                    <input
                      type="text"
                      placeholder="예: (주)회사명"
                      className="input block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
                      value={globalSettings.account_holder}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, account_holder: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t pt-4 mt-4">
                <button
                  type="submit"
                  className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  disabled={savingGlobal}
                >
                  {savingGlobal ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      저장 중...
                    </>
                  ) : "전역 설정 저장"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 개별 사용자 설정 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 사용자 검색 및 편집 폼 */}
          <div className="lg:col-span-2">
            <div className="card bg-card rounded-xl shadow-sm overflow-hidden border border-border h-full flex flex-col">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="bg-info-light/50 dark:bg-info/20 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-info" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="7" r="4" stroke="currentColor" />
                      <path d="M5 21v-2a7 7 0 0 1 14 0v2" stroke="currentColor" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground">개별 사용자 설정</h3>
                  <DefaultTooltip title="특정 사용자에게 다른 설정을 적용할 수 있습니다. 여기서 추가한 설정은 전역 설정보다 우선 적용됩니다." arrow placement="top">
                    <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary cursor-help">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                      </svg>
                    </div>
                  </DefaultTooltip>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={saveUserSetting}>
                  {/* 사용자 검색 */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-1">
                      <label className="text-sm font-medium text-card-foreground mb-1">
                        사용자 검색
                      </label>
                      <DefaultTooltip title="사용자 이메일을 검색하여 설정할 사용자를 선택하세요." arrow placement="top">
                        <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-info/10 text-primary cursor-help">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                          </svg>
                        </div>
                      </DefaultTooltip>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="이메일로 사용자 검색..."
                        className="input pl-10 block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
                        value={searchUserEmail}
                        onChange={(e) => setSearchUserEmail(e.target.value)}
                        onFocus={() => setShowUserSearch(true)}
                      />

                      {/* 검색 결과 드롭다운 */}
                      {showUserSearch && searchedUsers.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-card shadow-lg rounded-md border border-border overflow-hidden">
                          {searchedUsers.map((user) => (
                            <div
                              key={user.id}
                              className="p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border last:border-b-0"
                              onClick={() => selectUser(user)}
                            >
                              <div className="font-medium text-card-foreground">{user.full_name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* 설명은 툴팁으로 이동했습니다 */}
                  </div>

                  {/* 선택된 사용자가 있을 때만 표시 */}
                  {selectedUserId ? (
                    <>
                      <div className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-md">
                        <div className="text-sm text-primary">
                          <span className="font-medium">선택된 사용자:</span> {searchUserEmail}
                        </div>
                      </div>

                      {/* 사용자 설정 폼 필드들 */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* 최소 요청 금액 설정 */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <label className="text-sm font-medium text-card-foreground mb-1">
                                최소 충전 금액 (원)
                              </label>
                              <DefaultTooltip title="사용자에게 적용될 무료캐시 최소 충전 금액입니다." arrow placement="top">
                                <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-info/10 text-primary cursor-help">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 16v-4"></path>
                                    <path d="M12 8h.01"></path>
                                  </svg>
                                </div>
                              </DefaultTooltip>
                            </div>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-muted-foreground sm:text-sm">₩</span>
                              </div>
                              <input
                                type="text"
                                className="input pl-8 block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
                                value={userSetting.min_request_amount.toLocaleString()}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/,/g, '');
                                  const numValue = parseInt(value) || 0;
                                  setUserSetting({ ...userSetting, min_request_amount: numValue });
                                }}
                              />
                            </div>
                          </div>

                          {/* 무료캐시 퍼센트 */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <label className="text-sm font-medium text-card-foreground mb-1">
                                지급 비율 (%)
                              </label>
                              <DefaultTooltip title="사용자에게 적용될 무료캐시 지급 비율입니다." arrow placement="top">
                                <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-info/10 text-primary cursor-help">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 16v-4"></path>
                                    <path d="M12 8h.01"></path>
                                  </svg>
                                </div>
                              </DefaultTooltip>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                className="input block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary pr-8"
                                value={userSetting.free_cash_percentage}
                                onChange={(e) => setUserSetting({ ...userSetting, free_cash_percentage: parseInt(e.target.value) || 0 })}
                                min="0"
                                max="100"
                                step="1"
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-muted-foreground sm:text-sm">%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* 만료 기간 */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <label className="text-sm font-medium text-card-foreground mb-1">
                                만료 기간 (개월)
                              </label>
                              <DefaultTooltip title="사용자에게 적용될 무료캐시 만료 기간입니다. 0은 만료되지 않음을 의미합니다." arrow placement="top">
                                <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-info/10 text-primary cursor-help">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 16v-4"></path>
                                    <path d="M12 8h.01"></path>
                                  </svg>
                                </div>
                              </DefaultTooltip>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                className="input block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary pr-12"
                                value={userSetting.expiry_months}
                                onChange={(e) => setUserSetting({ ...userSetting, expiry_months: parseInt(e.target.value) || 0 })}
                                min="0"
                                max="36"
                                step="1"
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-muted-foreground sm:text-sm">개월</span>
                              </div>
                            </div>
                          </div>

                          {/* 최소 사용 비율 */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <label className="text-sm font-medium text-card-foreground mb-1">
                                최소 사용 비율 (%)
                              </label>
                              <DefaultTooltip title="사용자에게 적용될 무료캐시 최소 사용 비율입니다." arrow placement="top">
                                <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-info/10 text-primary cursor-help">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 16v-4"></path>
                                    <path d="M12 8h.01"></path>
                                  </svg>
                                </div>
                              </DefaultTooltip>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                className="input block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary pr-8"
                                value={userSetting.min_usage_percentage}
                                onChange={(e) => setUserSetting({ ...userSetting, min_usage_percentage: parseInt(e.target.value) || 0 })}
                                min="0"
                                max="100"
                                step="1"
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-muted-foreground sm:text-sm">%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 최소 사용액 */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <label className="text-sm font-medium text-card-foreground mb-1">
                              최소 사용액 (원)
                            </label>
                            <DefaultTooltip title="사용자에게 적용될 무료캐시 최소 사용 금액입니다." arrow placement="top">
                              <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-info/10 text-primary cursor-help">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <path d="M12 16v-4"></path>
                                  <path d="M12 8h.01"></path>
                                </svg>
                              </div>
                            </DefaultTooltip>
                          </div>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-muted-foreground sm:text-sm">₩</span>
                            </div>
                            <input
                              type="text"
                              className="input pl-8 block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
                              value={userSetting.min_usage_amount.toLocaleString()}
                              onChange={(e) => {
                                const value = e.target.value.replace(/,/g, '');
                                const numValue = parseInt(value) || 0;
                                setUserSetting({ ...userSetting, min_usage_amount: numValue });
                              }}
                            />
                          </div>
                        </div>

                        {/* 활성화 상태 */}
                        <div className="pt-3">
                          <div className="relative flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                type="checkbox"
                                className="input h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                checked={userSetting.is_active}
                                onChange={(e) => setUserSetting({ ...userSetting, is_active: e.target.checked })}
                              />
                            </div>
                            <div className="ml-3 text-sm flex items-center gap-1">
                              <label className="font-medium text-card-foreground">설정 활성화</label>
                              <DefaultTooltip title="비활성화하면 전역 설정이 사용됩니다." arrow placement="top">
                                <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-info/10 text-primary cursor-help">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 16v-4"></path>
                                    <path d="M12 8h.01"></path>
                                  </svg>
                                </div>
                              </DefaultTooltip>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 border-t pt-4 mt-6">
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-border shadow-sm text-sm font-medium rounded-md text-card-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                          onClick={resetUserSettingForm}
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                          disabled={savingUser}
                        >
                          {savingUser ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              저장 중...
                            </>
                          ) : "사용자 설정 저장"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64">
                      <div className="p-4 rounded-full bg-info-light/50 dark:bg-info/20">
                        <svg className="h-12 w-12 text-info" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="7" r="4" stroke="currentColor" />
                          <path d="M5 21v-2a7 7 0 0 1 14 0v2" stroke="currentColor" />
                        </svg>
                      </div>
                      <h3 className="mt-4 text-sm font-medium text-card-foreground">설정할 사용자가 없습니다</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        사용자를 검색하여 개별 설정을 추가하세요.
                      </p>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* 사용자별 설정 목록 */}
          <div className="lg:col-span-3">
            <div className="card bg-card rounded-xl shadow-sm overflow-hidden border border-border h-full">
              <div className="p-6 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-info-light/50 dark:bg-info/20 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-info" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground">개별 사용자 설정 목록</h3>
                </div>
              </div>

              <div className="overflow-hidden flex-grow flex flex-col">
                {loading ? (
                  <div className="flex justify-center items-center p-8 flex-grow">
                    <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                  <>
                    {userSettings.length > 0 ? (
                      <div className="overflow-x-auto flex-grow">
                        <table className="min-w-full divide-y divide-border">
                          <thead className="bg-muted">
                            <tr>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                사용자
                              </th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                최소 충전 금액
                              </th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                무료 캐시 %
                              </th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                만료 기간
                              </th>
                              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                상태
                              </th>
                              <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                작업
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-card divide-y divide-border">
                            {userSettings.map((setting) => (
                              <tr key={setting.id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <div className="text-sm font-medium text-card-foreground">{setting.users?.full_name || '알 수 없음'}</div>
                                    <div className="text-xs text-muted-foreground">{setting.users?.email || '알 수 없음'}</div>
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-card-foreground">
                                  ₩{setting.min_request_amount.toLocaleString()}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-card-foreground">
                                  {setting.free_cash_percentage}%
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-card-foreground">
                                  {setting.expiry_months}개월
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-center">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${setting.is_active
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {setting.is_active ? '활성' : '비활성'}
                                  </span>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() => selectUser({ id: setting.user_id, email: setting.users?.email, full_name: setting.users?.full_name })}
                                    className="text-primary hover:text-primary-dark mr-3 transition-colors"
                                  >
                                    편집
                                  </button>
                                  <button
                                    onClick={() => deleteUserSetting(setting.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                  >
                                    삭제
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center flex-grow py-12">
                        <div className="p-4 rounded-full bg-info-light/50 dark:bg-info/20">
                          <svg className="h-12 w-12 text-info" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" />
                          </svg>
                        </div>
                        <h3 className="mt-4 text-sm font-medium text-card-foreground">설정이 없습니다</h3>
                        <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
                          사용자별 설정 정보가 아직 없습니다.<br />좌측 폼을 통해 설정을 추가하세요.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CommonTemplate>
  );
};

export { ManageSettingPage };