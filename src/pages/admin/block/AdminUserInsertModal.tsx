import { Modal, ModalBody, ModalContent, ModalHeader } from "@/components";
import { supabase } from "@/supabase";
import { useState } from "react";

interface AdminUserInsertModalProps {
    open: boolean;
    onClose: () => void;
    onUserAdded?: () => void;
}

interface NewUserData {
    full_name: string;
    email: string;
    password: string;
    role: string;
    status: string;
}

const AdminUserInsertModal = ({ open, onClose, onUserAdded }: AdminUserInsertModalProps) => {
    const initialUserData: NewUserData = {
        full_name: '',
        email: '',
        password: '',
        role: 'advertiser', // 기본값으로 '광고주' 설정
        status: 'active', // 기본값으로 '활성' 설정
    };

    const [newUserData, setNewUserData] = useState<NewUserData>(initialUserData);
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<Partial<Record<keyof NewUserData, string>>>({});

    // 사용 가능한 역할과 상태 옵션
    const roles_array = [
        {"code":"operator", "name": "관리자"},
        {"code":"developer", "name": "개발자"},
        {"code":"distributor", "name": "총판"},
        {"code":"agency", "name": "대행사"},
        {"code":"advertiser", "name": "광고주"},
    ];

    const status_array = [
        {"code":"active", "name": "활성"},
        {"code":"inactive", "name": "비활성"},
        {"code":"pending", "name": "대기중"},
    ];

    // 입력값 변경 핸들러
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // 에러 상태 초기화
        if (errors[name as keyof NewUserData]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof NewUserData];
                return newErrors;
            });
        }
        
        setNewUserData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 필드 유효성 검사
    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof NewUserData, string>> = {};
        
        if (!newUserData.full_name.trim()) {
            newErrors.full_name = '이름을 입력해주세요';
        }
        
        if (!newUserData.email.trim()) {
            newErrors.email = '이메일을 입력해주세요';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserData.email)) {
            newErrors.email = '유효한 이메일 주소를 입력해주세요';
        }
        
        if (!newUserData.password.trim()) {
            newErrors.password = '비밀번호를 입력해주세요';
        } else if (newUserData.password.length < 6) {
            newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 회원 추가 핸들러
    const handleAddUser = async () => {
        // 폼 유효성 검사
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        try {
            // 1. 인증을 통해 사용자 생성 (Supabase Auth)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: newUserData.email,
                password: newUserData.password,
                options: {
                    data: {
                        full_name: newUserData.full_name,
                        role: newUserData.role,
                        status: newUserData.status
                    }
                }
            });
            
            if (authError) {
                throw new Error(authError.message);
            }
            
            // 2. users 테이블에 사용자 정보 저장 (이미 Auth 테이블에 추가됐을 경우 필요 없을 수 있음)
            // Supabase 설정에 따라 이 부분은 필요할 수도 있고 필요 없을 수도 있음
            // 필요한 경우 아래 주석을 해제하고 사용
            
            const { error: dbError } = await supabase
                .from('users')
                .insert({
                    id: authData.user?.id,
                    full_name: newUserData.full_name,
                    email: newUserData.email,
                    role: newUserData.role,
                    status: newUserData.status
                });
                
            if (dbError) {
                throw new Error(dbError.message);
            }
            
            
            // 성공 메시지 및 모달 닫기
            alert('사용자가 성공적으로 추가되었습니다.');
            if (onUserAdded) {
                onUserAdded(); // 부모 컴포넌트에 사용자 추가 완료 알림
            }
            onClose();
            // 폼 초기화
            setNewUserData(initialUserData);
            
        } catch (error: any) {
            console.error("사용자 추가 오류:", error.message);
            alert(`사용자 추가 중 오류가 발생했습니다: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 모달 닫기 핸들러 (폼 초기화 포함)
    const handleClose = () => {
        setNewUserData(initialUserData);
        setErrors({});
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <ModalContent className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <ModalHeader className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center w-full">
                        <h2 className="text-xl font-bold text-gray-800">신규 회원 추가</h2>
                        <button 
                            onClick={handleClose} 
                            className="text-gray-500 hover:text-gray-700 ml-auto"
                            aria-label="닫기"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </ModalHeader>
                <ModalBody className="p-6">
                    <div className="space-y-6">
                        {/* 이름 입력 */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium text-gray-700">이름</span>
                            </label>
                            <input 
                                type="text" 
                                name="full_name"
                                value={newUserData.full_name}
                                onChange={handleInputChange}
                                placeholder="사용자 이름을 입력하세요" 
                                className={`input input-bordered w-full ${errors.full_name ? 'input-error' : ''}`}
                            />
                            {errors.full_name && (
                                <label className="label">
                                    <span className="label-text-alt text-error">{errors.full_name}</span>
                                </label>
                            )}
                        </div>

                        {/* 이메일 입력 */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium text-gray-700">이메일</span>
                            </label>
                            <input 
                                type="email" 
                                name="email"
                                value={newUserData.email}
                                onChange={handleInputChange}
                                placeholder="이메일 주소를 입력하세요" 
                                className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                            />
                            {errors.email && (
                                <label className="label">
                                    <span className="label-text-alt text-error">{errors.email}</span>
                                </label>
                            )}
                        </div>

                        {/* 비밀번호 입력 */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium text-gray-700">비밀번호</span>
                            </label>
                            <input 
                                type="password" 
                                name="password"
                                value={newUserData.password}
                                onChange={handleInputChange}
                                placeholder="비밀번호를 입력하세요" 
                                className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                            />
                            {errors.password && (
                                <label className="label">
                                    <span className="label-text-alt text-error">{errors.password}</span>
                                </label>
                            )}
                            <label className="label">
                                <span className="label-text-alt text-gray-500">비밀번호는 최소 6자 이상이어야 합니다</span>
                            </label>
                        </div>

                        {/* 역할 선택 */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium text-gray-700">권한</span>
                            </label>
                            <select 
                                name="role"
                                value={newUserData.role}
                                onChange={handleInputChange}
                                className="select select-bordered w-full focus:ring-2 focus:ring-primary"
                            >
                                {roles_array.map((option) => (
                                    <option key={option.code} value={option.code}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 상태 선택 */}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-medium text-gray-700">상태</span>
                            </label>
                            <select 
                                name="status"
                                value={newUserData.status}
                                onChange={handleInputChange}
                                className="select select-bordered w-full focus:ring-2 focus:ring-primary"
                            >
                                {status_array.map((option) => (
                                    <option key={option.code} value={option.code}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end space-x-3">
                        <button 
                            className="btn btn-light" 
                            onClick={handleClose}
                            disabled={loading}
                        >
                            취소
                        </button>
                        <button 
                            className="btn btn-primary" 
                            onClick={handleAddUser}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    처리 중...
                                </>
                            ) : '회원 추가'}
                        </button>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export { AdminUserInsertModal };