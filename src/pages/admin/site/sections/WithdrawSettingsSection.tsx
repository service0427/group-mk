import React, { useEffect, useState } from 'react';
import WithdrawGlobalForm from '@/pages/admin/withdraw/components/WithdrawGlobalForm';
import WithdrawUserForm from '@/pages/admin/withdraw/components/WithdrawUserForm';
import WithdrawUserList from '@/pages/admin/withdraw/components/WithdrawUserList';
import { useWithdrawSetting, UserItem } from '@/pages/admin/withdraw/hooks/useWithdrawSetting';
import { 
  getDistributor, 
  getWithdrawGlobalSettings, 
  saveUserWithdrawSettings, 
  updateWithdrawGlobalSettings 
} from '@/pages/admin/withdraw/services/withdrawService';
import { DefaultTooltip } from '@/components/tooltip';
import { toast } from 'sonner';
import { KeenIcon } from '@/components/keenicons';

export const WithdrawSettingsSection: React.FC = () => {
  // 기본 설정 상태값
  const [globalSettings, setGlobalSettings] = useState({
    min_request_amount: 10000,
    min_request_percentage: 5,
  });

  // 선택된 사용자 설정 (수정 모드)
  const [selectedSetting, setSelectedSetting] = useState<UserItem | null>(null);

  // 출금 설정 페이지에 필요한 상태 변수
  const {
    loading,
    setLoading,
    savingGlobal,
    setSavingGlobal,
    savingUser,
    setSavingUser,
    userList,
    setUserList,
  } = useWithdrawSetting();

  // 목록 새로고침 트리거
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 목록 새로고침 함수
  const refreshUserList = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // 알림 표시 핸들러
  const showNotification = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  // 수정 모드 취소 핸들러
  const handleCancelEdit = () => {
    setSelectedSetting(null);
  };

  // 설정 수정 핸들러
  const handleEditSetting = (setting: any) => {
    setSelectedSetting(setting);
    // 섹션 상단으로 스크롤
    const element = document.getElementById('withdraw_settings');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 출금 전역 설정 정보 가져오기
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        setLoading(true);
        const data = await getWithdrawGlobalSettings();
        setGlobalSettings(data);
      } catch (error) {
        showNotification('전역 설정을 불러오는데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalSettings();
  }, []);

  // 총판 아이디 가져오기
  useEffect(() => {
    const fetchDistributor = async () => {
      try {
        setLoading(true);
        const data = await getDistributor();
        setUserList(data);
      } catch (error) {
        console.error('Failed to fetch distributor:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDistributor();
  }, []);

  return (
    <div className="grid gap-6">
      {/* 섹션 타이틀 */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary/10 p-2 rounded-lg">
          <KeenIcon icon="dollar" className="text-xl text-primary" />
        </div>
        <h2 className="text-2xl font-bold">관리자 출금 설정</h2>
      </div>

      {/* 전역 출금 설정 카드 */}
      <div className="card bg-card rounded-xl shadow-sm overflow-hidden border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-info-light/50 dark:bg-info/20 p-2 rounded-lg">
              <svg className="w-5 h-5 text-info" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground">전역 출금 설정</h3>
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
          <WithdrawGlobalForm
            settings={globalSettings}
            onSave={async (settings) => {
              setSavingGlobal(true);
              try {
                updateWithdrawGlobalSettings(settings);
                setGlobalSettings(settings);
                showNotification('전역 출금 설정이 저장 되었습니다!', 'success');
                return true;
              } catch (error) {
                showNotification('전역 출금 설정에 실패하였습니다!', 'error');
                return false;
              } finally {
                setSavingGlobal(false);
              }
            }}
          />
        </div>
      </div>

      {/* 사용자별 출금 설정 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 사용자별 출금 설정 관리 폼 */}
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
                <h3 className="text-xl font-semibold text-card-foreground">사용자별 출금 설정</h3>
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
              <WithdrawUserForm
                users={userList}
                globalSettings={globalSettings}
                selectedSetting={selectedSetting}
                onCancelEdit={handleCancelEdit}
                onSave={async (userSetting) => {
                  setSavingUser(true);
                  try {
                    await saveUserWithdrawSettings(userSetting);
                    const message = selectedSetting
                      ? '유저 출금 설정이 업데이트 되었습니다!'
                      : '유저 출금 설정이 저장 되었습니다!';
                    showNotification(message, 'success');
                    setSelectedSetting(null);
                    refreshUserList();
                    return true;
                  } catch (error) {
                    showNotification('유저 출금 설정에 실패하였습니다!', 'error');
                    return false;
                  } finally {
                    setSavingUser(false);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* 사용자별 출금 설정 목록 */}
        <div className="lg:col-span-3">
          <div className="card bg-card rounded-xl shadow-sm overflow-hidden border border-border h-full">
            <div className="p-6 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-info-light/50 dark:bg-info/20 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-info" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground">사용자별 출금 설정 목록</h3>
              </div>
            </div>

            <div className="p-6">
              <WithdrawUserList
                onRefresh={refreshUserList}
                showNotification={showNotification}
                onEditSetting={handleEditSetting}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 설명 영역 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 p-5">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">출금 설정 관리 안내</h3>
        <div className="space-y-2 text-blue-700 dark:text-blue-200 text-sm">
          <p>• <span className="font-medium text-blue-900 dark:text-blue-100">전역 출금 설정</span>: 모든 사용자에게 적용되는 기본 출금 설정입니다.</p>
          <p>• <span className="font-medium text-blue-900 dark:text-blue-100">사용자별 출금 설정</span>: 특정 사용자에게 적용되는 출금 설정입니다.</p>
          <p>• <span className="font-medium text-blue-900 dark:text-blue-100">최소 출금 금액</span>: 사용자가 출금 신청할 수 있는 최소 금액을 설정합니다.</p>
          <p>• <span className="font-medium text-blue-900 dark:text-blue-100">출금 수수료 비율</span>: 출금 시 적용되는 수수료 비율(%)을 설정합니다.</p>
        </div>
      </div>
    </div>
  );
};