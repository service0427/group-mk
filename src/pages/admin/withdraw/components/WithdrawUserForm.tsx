import React, { useState, useEffect } from "react"

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
            {/* 반응형 폼 레이아웃 - 모바일에서는 세로 정렬, 데스크탑에서는 가로 정렬 */}
            <div className="flex flex-col md:flex-row md:items-end gap-5 mb-5">
                <div className="md:flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        {/* 사용자 선택 - 커스텀 드롭다운으로 변경 */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text text-sm font-medium text-foreground">사용자 선택</span>
                            </label>
                            <div className="relative">
                                <div
                                    className={`input input-bordered w-full flex items-center justify-between cursor-pointer h-10 ${isEditMode ? 'bg-muted' : ''}`}
                                    onClick={() => !isSaving && !isEditMode && setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <span className={`${selectedUser ? "text-foreground" : "text-muted-foreground"} truncate max-w-[200px]`}>
                                        {selectedUser
                                            ? `${selectedUser.full_name} (${selectedUser.email})`
                                            : "사용자 선택"}
                                    </span>
                                    {!isEditMode && (
                                        <svg className="w-4 h-4 ml-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>

                                {isDropdownOpen && !isEditMode && (
                                    <div className="absolute left-0 right-0 mt-1 border rounded-md shadow-lg bg-card z-10 max-h-60 overflow-y-auto">
                                        <div className="p-2 border-b">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                                placeholder="이름 또는 이메일 검색..."
                                                className="input input-bordered w-full focus:ring-2 focus:ring-primary bg-card"
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                            />
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
                                                        {user.full_name} ({user.email})
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-3 py-2 text-muted-foreground">검색 결과가 없습니다</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <label className="label">
                                <span className="label-text-alt text-muted-foreground">개별 설정할 사용자를 선택하세요.</span>
                            </label>
                        </div>

                        {/* 최소 출금 금액 - 천 단위 콤마 형식 적용 */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text text-sm font-medium text-foreground">최소 출금 금액</span>
                            </label>
                            <input
                                type="text"
                                name="min_request_amount"
                                value={formattedValues.min_request_amount}
                                onChange={handleChange}
                                className="input input-bordered w-full focus:ring-2 focus:ring-primary bg-card h-10"
                                disabled={isSaving}
                                placeholder="0"
                            />
                            <label className="label">
                                <span className="label-text-alt text-muted-foreground">최소 출금액 이상부터 출금 가능합니다.</span>
                            </label>
                        </div>

                        {/* 출금 수수료율 */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text text-sm font-medium text-foreground">출금 수수료율 (%)</span>
                            </label>
                            <input
                                type="text"
                                name="min_request_percentage"
                                value={formattedValues.min_request_percentage}
                                onChange={handleChange}
                                className="input input-bordered w-full focus:ring-2 focus:ring-primary bg-card h-10"
                                disabled={isSaving}
                                placeholder="0"
                            />
                            <label className="label">
                                <span className="label-text-alt text-muted-foreground">출금 시 적용되는 수수료 비율입니다.</span>
                            </label>
                        </div>

                        {/* 버튼 그룹 */}
                        <div className="md:w-auto flex-shrink-0">
                            <div className="flex space-x-2">
                                {/* 저장 버튼 */}
                                <button
                                    onClick={handleSubmit}
                                    className="btn btn-primary h-20 px-6"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs mr-2"></span>
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
                                        onClick={handleCancelEdit}
                                        className="btn btn-secondary h-20 px-6"
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
                </div>
            </div>

            {/* 수정 모드 표시 */}
            {isEditMode && (
                <div className="text-primary flex items-center mb-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-sm">선택한 사용자 설정을 수정하는 중입니다.</span>
                </div>
            )}
        </div>
    )
}

export default WithdrawUserForm;