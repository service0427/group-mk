import React, { useEffect, useState } from 'react';
import { BasicTemplate } from '../components';
import WithdrawGlobalForm from './components/WithdrawGlobalForm';
import { useWithdrawSetting } from './hooks/useWithdrawSetting';
import { getDistributor, getWithdrawGlobalSettings, updateWithdrawGlobalSettings } from './services/withdrawService';
import WithdrawUserForm from './components/WithdrawUserForm';


const WithdrawSettingPage: React.FC = () => {
    // 출금 설정 페이지 제목
    const title = '출금 설정 관리';

    // 기본 설정 상태값
    const [globalSettings, setGlobalSettings] = useState({
        min_request_amount: 10000, // 출금 최소 신청 금액 기본 금액 만원
        min_request_percentage: 5, // 출금 수수료 비율(%)
    });

    // 출금 설정 페이지에 필요한 상태 변수 (로딩 등등)
    const {
        loading,
        setLoading,
        savingGlobal,
        setSavingGlobal,
        savingUser,
        setSavingUser,
        notification,
        setNotification,
        userList,
        setUserList,
    }  = useWithdrawSetting();

    // 출금 전역 설정 정보 가져오기
    useEffect(() => {
        const fetchGlobalSettings = async () => {
            try {
                setLoading(true);
                // Fetch global settings from the server

                const data = await getWithdrawGlobalSettings();
                setGlobalSettings(data);
            } catch (error) {
                console.error('Error fetching global settings:', error);
                setNotification({ show: true, message: 'Failed to fetch global settings.', type: 'error' });
            } finally {
                setLoading(false);
            }
        }
        fetchGlobalSettings();
    }, []);

    // 총판 아이디 가져오기
    useEffect(() => {
        const fetchDistributor = async () => {
            try {
                setLoading(true);
                const data = await getDistributor();
                setUserList(data);
                console.log(data);
            } catch (error) {
                console.error('Error fetching distributor IDs:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchDistributor();
        
    },[])

    // 알림 자동 사라짐 처리
    useEffect(() => {
        if (notification.show) {
            const timer = setTimeout(() => {
                setNotification({ ...notification, show: false });
            }, 5000); // 5초 후 자동으로 닫힘

            return () => clearTimeout(timer);
        }
    }, [notification.show, notification.message]);

    return (
    <BasicTemplate 
      title={title} 
      description={`관리자 메뉴 > 출금 관리 > ${title}`}
    >

        {/* 알림 메시지 */}
        {notification.show && (
            <div className={`flex items-center p-4 mb-5 border rounded-lg ${
                notification.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
            }`}>
                {notification.type === 'success' ? (
                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                ) : (
                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd"></path>
                    </svg>
                )}
                <span className="font-medium">{notification.message}</span>
                <button
                    type="button"
                    className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:bg-gray-100"
                    onClick={() => setNotification({ ...notification, show: false })}
                >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                </button>
            </div>
        )}

        
        {/* 출금 전역 설정 관리 카드와 폼 */}
        <div className='card shadow-sm bg-white'>
            <div className='card-header px-6 py-5'>
                <h3 className='card-title text-lg font-semibold'>
                    전역 출금 설정
                </h3>
                <p className='text-sm text-gray-500 mt-1'>
                    모든 사용자에게 적용되는 기본 설정입니다. 개별 사용자 설정이 없는 경우 이 설정이 적용됩니다.
                </p>
            </div>
            
            <div className='card-body px-6 py-4'>
                <WithdrawGlobalForm
                    settings={globalSettings}
                    onSave={async (settings) => {
                        setSavingGlobal(true);
                        try {
                            // Save global settings logic here
                            updateWithdrawGlobalSettings(settings);
                            setGlobalSettings(settings);
                            setNotification({ show: true, message: '전역 출금 설정이 저장 되었습니다!', type: 'success' });
                            return true;
                        } catch (error) {
                            console.error('Error saving global settings:', error);
                            setNotification({ show: true, message: '전역 출금 설정에 실패하였습니다!', type: 'error' });
                            return false;
                        } finally {
                            setSavingGlobal(false);
                        }
                    }} 
                />
            </div>
        </div>

        {/* 사용자별 출금 설정 관리 카드와 폼 */}
        <div className='card shadow-sm bg-white mt-8'>
            <div className='card-header px-6 py-5'>
                <h3 className='card-title text-lg font-semibold'>
                    사용자별 출금 설정
                </h3>
                <p className='text-sm text-gray-500 mt-1'>
                    개별 사용자에 대한 출금 설정입니다. 여기서 설정된 값은 전역 설정보다 우선 적용됩니다.
                </p>
            </div>
            
            <div className='card-body px-6 py-4'>
                <WithdrawUserForm
                    users={userList}
                    globalSettings={globalSettings}
                    onSave={async (userSetting) => {
                        setSavingUser(true);
                        try {
                            // Save user settings logic here
                            console.log(userSetting);
                            setNotification({ show: true, message: '유저 출금 설정이 저장 되었습니다!', type: 'success' });
                            return true;
                        } catch (error) {
                            console.error('Error saving user settings:', error);
                            setNotification({ show: true, message: '유저 출금 설정에 실패하였습니다!', type: 'error' });
                            return false;
                        } finally {
                            setSavingUser(false);
                        }
                    }}
                />
            </div>
        </div>
      
    </BasicTemplate>
    );
};

export default WithdrawSettingPage;