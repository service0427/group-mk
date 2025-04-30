import React, { useState, useEffect } from "react"
import { DefaultTooltip } from '@/components/tooltip';

interface WithdrawUserFormProps {
    users: User[];
    globalSettings: any;
    onSave: (userSetting: UserSetting) => Promise<boolean>;
    selectedSetting?: any; // 수정 시 선택된 설정
    onCancelEdit?: () => void; // 수정 취소 함수
}

interface User {
    id: string;
    email: string;
    full_name: string;
}

interface UserSetting {
    user_id: string;
    min_request_amount: number;
    min_request_percentage: number;
    id?: string; // 기존 설정 수정 시 사용
}

// 천 단위 콤마 포맷팅 함수
const formatNumber = (num: number): string => {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
};

// 콤마 제거 함수
const removeCommas = (str: string): string => {
    return str.replace(/,/g, "");
};

const WithdrawUserForm: React.FC<WithdrawUserFormProps> = ({ users, globalSettings, onSave, selectedSetting, onCancelEdit }) => {

    // 기본 폼 데이터 상태 관리
    const [formData, setFormData] = useState<UserSetting>({
        user_id: "",
        min_request_amount: 0,
        min_request_percentage: 0
    });

    // 포맷된 값 상태 관리
    const [formattedValues, setFormattedValues] = useState({
        min_request_amount: '',
        min_request_percentage: ''
    });

    // 저장 로딩 상태 관리
    const [isSaving, setIsSaving] = useState(false);

    // 검색어 상태 관리
    const [searchTerm, setSearchTerm] = useState("");

    // 드롭다운 열림/닫힘 상태 관리
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // 수정 모드 상태
    const [isEditMode, setIsEditMode] = useState(false);

    // 선택된 설정이 변경될 때 폼 데이터 업데이트
    useEffect(() => {
        if (selectedSetting) {
            setFormData({
                id: selectedSetting.id,
                user_id: selectedSetting.mat_id || selectedSetting.users?.id,
                min_request_amount: selectedSetting.min_request_amount || 0,
                min_request_percentage: selectedSetting.min_request_percentage || 0
            });
            setIsEditMode(true);
        } else {
            setFormData({
                user_id: "",
                min_request_amount: 0,
                min_request_percentage: 0
            });
            setIsEditMode(false);
        }
    }, [selectedSetting]);

    // 초기 렌더링 시 값 포맷팅
    useEffect(() => {
        setFormattedValues({
            min_request_amount: formatNumber(formData.min_request_amount),
            min_request_percentage: formData.min_request_percentage?.toString() || "0"
        });
    }, [formData.min_request_amount, formData.min_request_percentage]);

    // 폼 데이터 변경 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'user_id') {
            setFormData(prev => ({ ...prev, user_id: value }));
            return;
        }

        // 콤마 제거 후 숫자값만 추출
        const numericValue = removeCommas(value);

        // 빈 문자열이거나 숫자가 아닌 경우 처리
        if (numericValue === '' || isNaN(Number(numericValue))) {
            setFormattedValues({
                ...formattedValues,
                [name]: numericValue === '' ? '' : formattedValues[name as keyof typeof formattedValues]
            });
            return;
        }

        // 숫자 값 업데이트
        const numberValue = Number(numericValue);
        setFormData({
            ...formData,
            [name]: numberValue
        });

        // 포맷팅 업데이트
        setFormattedValues({
            ...formattedValues,
            [name]: name === 'min_request_amount' ? formatNumber(numberValue) : numericValue
        });
    };

    // 검색어 변경 핸들러
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // 사용자 선택 핸들러
    const handleUserSelect = (userId: string) => {
        setFormData(prev => ({ ...prev, user_id: userId }));
        setIsDropdownOpen(false);
    };

    // 저장 핸들러
    const handleSubmit = async () => {
        if (!formData.user_id) {
            alert("사용자를 선택해주세요.");
            return;
        }

        setIsSaving(true);
        try {
            const success = await onSave(formData);
            if (success) {
                // 성공적으로 저장됨
                // 폼 초기화
                if (!isEditMode) {
                    // 신규 추가 모드에서는 폼 초기화
                    setFormData({
                        user_id: "",
                        min_request_amount: 0,
                        min_request_percentage: 0
                    });
                } else if (onCancelEdit) {
                    // 수정 모드에서는 수정 모드 종료
                    onCancelEdit();
                }
            }
        } catch (error) {
            console.error('Error saving user settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // 수정 취소 핸들러
    const handleCancelEdit = () => {
        if (onCancelEdit) {
            onCancelEdit();
        }
    };

    // 필터링된 사용자 목록
    const filteredUsers = users.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 선택된 사용자 정보 가져오기
    const selectedUser = users.find(user => user.id === formData.user_id);

    return (
        <div>
            {/* 수정 모드 표시 */}
            {isEditMode && (
                <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mb-4">
                    <div className="flex items-center text-primary">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="font-medium">
                            사용자 설정 수정 모드: {selectedUser?.full_name} ({selectedUser?.email})
                        </span>
                    </div>
                </div>
            )}

            {/* 세로 정렬로 변경 - 모든 입력 필드를 하나의 열에 배치 */}
            <div className="grid grid-cols-1 gap-4">
                {/* 사용자 선택 */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1">
                        <label className="text-sm font-medium text-card-foreground mb-1">
                            사용자 선택
                        </label>
                        <DefaultTooltip title="개별 설정할 사용자를 선택하세요. 선택된 사용자에게 전역 설정과 다른 값을 적용할 수 있습니다." arrow placement="top">
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
                        <div
                            className={`px-3 h-10 border border-border dark:border-gray-600 w-full flex items-center justify-between cursor-pointer rounded-md bg-background ${isEditMode ? 'opacity-70' : ''}`}
                            onClick={() => !isSaving && !isEditMode && setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <span className={`${selectedUser ? "text-foreground" : "text-muted-foreground"} truncate max-w-full`}>
                                {selectedUser
                                    ? `${selectedUser.full_name} (${selectedUser.email})`
                                    : "사용자 선택"}
                            </span>
                            {!isEditMode && (
                                <svg className="w-4 h-4 ml-2 flex-shrink-0 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>

                        {isDropdownOpen && !isEditMode && (
                            <div className="absolute left-0 right-0 mt-1 border rounded-md shadow-lg bg-card z-20 max-h-60 overflow-y-auto">
                                <div className="p-2 border-b border-border">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            placeholder="이름 또는 이메일 검색..."
                                            className="pl-10 block w-full p-2 border border-border bg-card rounded-md"
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {filteredUsers.length > 0 ? (
                                    <div className="py-1">
                                        {filteredUsers.map(user => (
                                            <div
                                                key={user.id}
                                                className="px-3 py-2 hover:bg-muted/40 cursor-pointer truncate"
                                                onClick={() => handleUserSelect(user.id)}
                                                title={`${user.full_name} (${user.email})`}
                                            >
                                                <div className="font-medium">{user.full_name}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-3 py-2 text-muted-foreground">검색 결과가 없습니다</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 최소 출금 금액 설정 */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1">
                        <label className="text-sm font-medium text-card-foreground mb-1">
                            최소 출금 금액
                        </label>
                        <DefaultTooltip title="사용자에게 적용될 최소 출금 금액입니다. 이 금액 이상부터 출금이 가능합니다." arrow placement="top">
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
                            name="min_request_amount"
                            placeholder="예: 10,000"
                            className="pl-8 block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary h-10"
                            value={formattedValues.min_request_amount}
                            onChange={handleChange}
                            disabled={isSaving}
                        />
                    </div>
                </div>

                {/* 출금 수수료 비율 */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1">
                        <label className="text-sm font-medium text-card-foreground mb-1">
                            출금 수수료 비율
                        </label>
                        <DefaultTooltip title="사용자에게 적용될 출금 수수료 비율(%)입니다. 출금 시 이 비율만큼 수수료가 차감됩니다." arrow placement="top">
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
                            name="min_request_percentage"
                            placeholder="예: 5"
                            className="block w-full p-2 border border-border dark:border-gray-600 bg-background text-foreground rounded-md focus:ring-primary focus:border-primary pr-12 h-10"
                            value={formattedValues.min_request_percentage}
                            onChange={handleChange}
                            disabled={isSaving}
                            min="0"
                            max="100"
                            step="1"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-muted-foreground sm:text-sm">%</span>
                        </div>
                    </div>
                </div>

                {/* 버튼 그룹 */}
                <div className="flex justify-end space-x-2 mt-4">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-6 py-2.5 inline-flex items-center justify-center border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                        disabled={isSaving || !formData.user_id}
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                저장 중...
                            </>
                        ) : isEditMode ? (
                            <>
                                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                수정
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                저장
                            </>
                        )}
                    </button>
                    
                    {/* 수정 취소 버튼 - 수정 모드일 때만 표시 */}
                    {isEditMode && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-6 py-2.5 inline-flex items-center justify-center border border-border bg-card text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                            disabled={isSaving}
                        >
                            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12"></path>
                            </svg>
                            취소
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default WithdrawUserForm;