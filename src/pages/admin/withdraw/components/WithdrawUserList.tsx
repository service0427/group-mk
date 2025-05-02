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
    
    // 검색 관련 상태
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSettings, setFilteredSettings] = useState<UserWithdrawSetting[]>([]);

    // 사용자별 출금 설정 목록 가져오기
    const fetchUserSettings = async () => {
        setLoading(true);
        try {
            const data = await getUserWithdrawSettings();
            // 데이터 변환: users 필드에 배열이 올 경우 첫 번째 항목을 사용하여 객체로 변환
            const transformedData = data.map((item: any) => {
                // users가 배열인 경우 처리
                if (Array.isArray(item.users) && item.users.length > 0) {
                    const firstUser = item.users[0];
                    return {
                        ...item,
                        users: {
                            id: firstUser.id || '',
                            email: firstUser.email || '',
                            full_name: firstUser.full_name || ''
                        }
                    };
                }
                return item;
            });
            
            setUserSettings(transformedData as UserWithdrawSetting[]);
            setFilteredSettings(transformedData as UserWithdrawSetting[]); // 초기 필터링된 결과는 전체 데이터
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

    // 검색어가 변경될 때마다 필터링
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredSettings(userSettings);
        } else {
            const filtered = userSettings.filter(setting => {
                const fullName = setting.users?.full_name || '';
                const email = setting.users?.email || '';
                const lowercaseSearchTerm = searchTerm.toLowerCase();
                
                return (
                    fullName.toLowerCase().includes(lowercaseSearchTerm) ||
                    email.toLowerCase().includes(lowercaseSearchTerm)
                );
            });
            setFilteredSettings(filtered);
        }
    }, [searchTerm, userSettings]);

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
        <div key={setting.id} className="px-4 py-4 hover:bg-muted/40 border-b border-border last:border-b-0">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="font-medium text-foreground">{setting.users?.full_name || "-"}</h3>
                    <p className="text-sm text-muted-foreground">{setting.users?.email || "-"}</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleEdit(setting)}
                        className="btn btn-sm btn-icon btn-primary"
                        title="수정"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button
                        onClick={() => handleDelete(setting.id)}
                        className="btn btn-sm btn-icon btn-danger"
                        disabled={deleting[setting.id]}
                        title="삭제"
                    >
                        {deleting[setting.id] ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        )}
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-muted-foreground">최소 출금 금액</p>
                    <p className="font-medium">₩{formatNumber(setting.min_request_amount)}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">출금 수수료율</p>
                    <p className="font-medium">{setting.min_request_percentage || "0"}%</p>
                </div>
                <div className="col-span-2">
                    <p className="text-muted-foreground">마지막 수정일</p>
                    <p className="font-medium">{getLastModifiedDate(setting)}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {/* 검색 및 새로고침 버튼 */}
            <div className="flex flex-col sm:flex-row justify-between mb-4 gap-3">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                        </svg>
                    </div>
                    <input 
                        type="search" 
                        placeholder="사용자 이름 또는 이메일 검색..." 
                        className="pl-10 p-2 border border-border rounded-md w-full sm:w-64 bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
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
            
            {filteredSettings.length === 0 ? (
                <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col items-center justify-center py-12">
                    <div className="p-4 rounded-full bg-info-light/50 dark:bg-info/20 mb-4">
                        <svg className="h-12 w-12 text-info" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-medium text-card-foreground">
                        {loading ? "로딩 중..." : "설정이 없습니다"}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
                        사용자별 출금 설정 정보가 아직 없습니다.<br />
                        상단 폼을 통해 설정을 추가하세요.
                    </p>
                </div>
            ) : (
                <div className="w-full overflow-hidden border border-border rounded-lg shadow-sm">
                    {/* 모바일 뷰 */}
                    <div className="block md:hidden bg-card">
                        {filteredSettings.map(setting => renderMobileCard(setting))}
                    </div>
                    
                    {/* 데스크탑 테이블 뷰 */}
                    <div className="hidden md:block overflow-x-auto bg-card">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted dark:bg-gray-800/60 text-xs">
                                <tr>
                                    <th scope="col" className="py-3 px-4 font-medium text-start">사용자 이름</th>
                                    <th scope="col" className="py-3 px-4 font-medium text-start">이메일</th>
                                    <th scope="col" className="py-3 px-4 font-medium text-start">최소 출금 금액</th>
                                    <th scope="col" className="py-3 px-4 font-medium text-start">출금 수수료율</th>
                                    <th scope="col" className="py-3 px-4 font-medium text-start">마지막 수정일</th>
                                    <th scope="col" className="py-3 px-4 font-medium text-end">액션</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredSettings.map((setting) => (
                                    <tr key={setting.id} className="hover:bg-muted/40">
                                        <td className="py-3 px-4 font-medium text-foreground">
                                            {setting.users?.full_name || "-"}
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground">
                                            {setting.users?.email || "-"}
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
                                            ₩{formatNumber(setting.min_request_amount)}
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
                                            {setting.min_request_percentage || "0"}%
                                        </td>
                                        <td className="py-3 px-4 text-foreground">
                                            {getLastModifiedDate(setting)}
                                        </td>
                                        <td className="py-3 px-4 text-end">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(setting)}
                                                    className="btn btn-icon btn-sm btn-ghost hover:bg-primary/10 hover:text-primary"
                                                    title="수정"
                                                >
                                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(setting.id)}
                                                    className="btn btn-icon btn-sm btn-ghost hover:bg-danger/10 hover:text-danger"
                                                    disabled={deleting[setting.id]}
                                                    title="삭제"
                                                >
                                                    {deleting[setting.id] ? (
                                                        <span className="loading loading-spinner loading-xs"></span>
                                                    ) : (
                                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {loading && (
                            <div className="flex justify-center items-center h-24">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawUserList;