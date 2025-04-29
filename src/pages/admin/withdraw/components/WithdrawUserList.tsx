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
        <div key={setting.id} className="bg-card rounded-lg shadow-sm border border-border p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-medium text-foreground">{setting.users?.full_name || "-"}</h3>
                    <p className="text-sm text-muted-foreground">{setting.users?.email || "-"}</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleEdit(setting)}
                        className="btn btn-primary h-10 px-4"
                    >
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        수정
                    </button>
                    <button
                        onClick={() => handleDelete(setting.id)}
                        className="btn btn-danger h-10 px-4"
                        disabled={deleting[setting.id]}
                    >
                        {deleting[setting.id] ? (
                            <>
                                <span className="loading loading-spinner loading-xs mr-2"></span>
                                삭제 중...
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                삭제
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-muted-foreground">최소 출금 금액</p>
                    <p className="font-medium">{formatNumber(setting.min_request_amount)}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">출금 수수료율 (%)</p>
                    <p className="font-medium">{setting.min_request_percentage || "0"}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-muted-foreground">마지막 수정일</p>
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
                    className="btn btn-light h-10 px-4"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="loading loading-spinner loading-xs mr-2"></span>
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
                <div className="bg-card rounded-lg shadow-sm border border-border p-8 text-center text-muted-foreground">
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
                        <table className="table align-middle text-gray-700 text-sm w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="py-4 px-5 text-start min-w-[180px]">
                                        <span className="font-medium text-gray-700">사용자 이름</span>
                                    </th>
                                    <th className="py-4 px-5 text-start min-w-[180px]">
                                        <span className="font-medium text-gray-700">이메일</span>
                                    </th>
                                    <th className="py-4 px-5 text-start min-w-[140px]">
                                        <span className="font-medium text-gray-700">최소 출금 금액</span>
                                    </th>
                                    <th className="py-4 px-5 text-start min-w-[140px]">
                                        <span className="font-medium text-gray-700">출금 수수료율 (%)</span>
                                    </th>
                                    <th className="py-4 px-5 text-start min-w-[180px]">
                                        <span className="font-medium text-gray-700">마지막 수정일</span>
                                    </th>
                                    <th className="py-4 px-5 text-end min-w-[120px]">
                                        <span className="font-medium text-gray-700">액션</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {userSettings.map((setting) => (
                                    <tr key={setting.id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-4 px-5 text-gray-800 font-medium">
                                            {setting.users?.full_name || "-"}
                                        </td>
                                        <td className="py-4 px-5 text-gray-500">
                                            {setting.users?.email || "-"}
                                        </td>
                                        <td className="py-4 px-5 text-gray-800">
                                            ₩{formatNumber(setting.min_request_amount)}
                                        </td>
                                        <td className="py-4 px-5 text-gray-800">
                                            {setting.min_request_percentage || "0"}%
                                        </td>
                                        <td className="py-4 px-5 text-gray-800">
                                            {getLastModifiedDate(setting)}
                                        </td>
                                        <td className="py-4 px-5 text-end">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(setting)}
                                                    className="btn btn-primary h-10 px-4"
                                                >
                                                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                    수정
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(setting.id)}
                                                    className="btn btn-danger h-10 px-4"
                                                    disabled={deleting[setting.id]}
                                                >
                                                    {deleting[setting.id] ? (
                                                        <>
                                                            <span className="loading loading-spinner loading-xs mr-2"></span>
                                                            삭제 중...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            </svg>
                                                            삭제
                                                        </>
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