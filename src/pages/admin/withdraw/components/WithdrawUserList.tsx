import React, { useState, useEffect } from "react";
import { getUserWithdrawSettings, deleteUserWithdrawSetting } from "../services/withdrawService";

// 천 단위 콤마 포맷팅 함수
const formatNumber = (num: number): string => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
};

interface UserWithdrawSetting {
    id: string;
    mat_id: string;
    min_request_amount: number;
    min_request_percentage: number;
    created_at: string;
    updated_at: string;
    users: {
        id: string;
        email: string;
        full_name: string;
    };
}

interface WithdrawUserListProps {
    onRefresh?: () => void;
    showNotification: (message: string, type: 'success' | 'error') => void;
    onEditSetting: (setting: UserWithdrawSetting) => void;
}

const WithdrawUserList: React.FC<WithdrawUserListProps> = ({ onRefresh, showNotification, onEditSetting }) => {
    const [userSettings, setUserSettings] = useState<UserWithdrawSetting[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<{[key: string]: boolean}>({});

    // 사용자별 출금 설정 목록 가져오기
    const fetchUserSettings = async () => {
        setLoading(true);
        try {
            const data = await getUserWithdrawSettings();
            setUserSettings(data);
        } catch (error) {
            console.error("Error fetching user withdraw settings:", error);
            showNotification("사용자별 출금 설정 목록을 불러오는데 실패했습니다.", "error");
        } finally {
            setLoading(false);
        }
    };

    // 초기 로딩 시 데이터 가져오기
    useEffect(() => {
        fetchUserSettings();
    }, []);

    // 설정 삭제 핸들러
    const handleDelete = async (id: string) => {
        // 삭제 확인
        if (!window.confirm("정말로 이 설정을 삭제하시겠습니까?")) {
            return;
        }

        setDeleting(prev => ({ ...prev, [id]: true }));
        try {
            await deleteUserWithdrawSetting(id);
            showNotification("설정이 성공적으로 삭제되었습니다.", "success");
            fetchUserSettings(); // 목록 새로고침
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Error deleting user withdraw setting:", error);
            showNotification("설정 삭제에 실패했습니다.", "error");
        } finally {
            setDeleting(prev => ({ ...prev, [id]: false }));
        }
    };

    // 설정 수정 핸들러
    const handleEdit = (setting: UserWithdrawSetting) => {
        // 상위 컴포넌트로 선택한 설정 전달
        onEditSetting(setting);
        // 화면 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 날짜 포맷 함수
    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // 마지막 수정일 가져오기 - updated_at이 없으면 created_at 사용
    const getLastModifiedDate = (setting: UserWithdrawSetting) => {
        return setting.updated_at ? formatDate(setting.updated_at) : formatDate(setting.created_at);
    };

    // 모바일 카드 아이템 렌더링
    const renderMobileCard = (setting: UserWithdrawSetting) => (
        <div key={setting.id} className="bg-white rounded-lg shadow-sm border p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-medium text-gray-900">{setting.users?.full_name || "-"}</h3>
                    <p className="text-sm text-gray-500">{setting.users?.email || "-"}</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleEdit(setting)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                        </svg>
                    </button>
                    <button
                        onClick={() => handleDelete(setting.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        disabled={deleting[setting.id]}
                    >
                        {deleting[setting.id] ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        )}
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-gray-500">최소 출금 금액</p>
                    <p className="font-medium">{formatNumber(setting.min_request_amount)}</p>
                </div>
                <div>
                    <p className="text-gray-500">출금 수수료율 (%)</p>
                    <p className="font-medium">{setting.min_request_percentage || "0"}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-gray-500">마지막 수정일</p>
                    <p className="font-medium">{getLastModifiedDate(setting)}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">개별 설정된 사용자 목록</h3>
            
            {/* 새로고침 버튼 */}
            <div className="flex justify-end mb-4">
                <button 
                    onClick={fetchUserSettings}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            새로고침 중...
                        </>
                    ) : (
                        <>
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                            새로고침
                        </>
                    )}
                </button>
            </div>
            
            {userSettings.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
                    {loading ? "로딩 중..." : "개별 설정된 사용자가 없습니다."}
                </div>
            ) : (
                <>
                    {/* 모바일 뷰 */}
                    <div className="md:hidden">
                        {userSettings.map(setting => renderMobileCard(setting))}
                    </div>
                    
                    {/* 데스크탑 테이블 뷰 */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full bg-white border">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        사용자 이름
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        이메일
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        최소 출금 금액
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        출금 수수료율 (%)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        마지막 수정일
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        액션
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {userSettings.map((setting) => (
                                    <tr key={setting.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {setting.users?.full_name || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {setting.users?.email || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatNumber(setting.min_request_amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {setting.min_request_percentage || "0"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getLastModifiedDate(setting)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    onClick={() => handleEdit(setting)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(setting.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    disabled={deleting[setting.id]}
                                                >
                                                    {deleting[setting.id] ? (
                                                        <span className="flex items-center">
                                                            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            삭제 중...
                                                        </span>
                                                    ) : (
                                                        "삭제"
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default WithdrawUserList;