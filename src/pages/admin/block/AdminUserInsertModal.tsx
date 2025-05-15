import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
            
            // 2. users 테이블에 사용자 정보 저장
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
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
                <DialogHeader className="bg-background py-4 px-6">
                    <DialogTitle className="text-xl font-bold text-foreground">신규 회원 추가</DialogTitle>
                </DialogHeader>
                <div className="p-6 bg-background">
                    <div className="space-y-6">
                        {/* 이름 입력 */}
                        <div className="space-y-2">
                            <label htmlFor="full_name" className="text-sm font-medium text-foreground">이름</label>
                            <Input
                                id="full_name"
                                name="full_name"
                                value={newUserData.full_name}
                                onChange={handleInputChange}
                                placeholder="사용자 이름을 입력하세요"
                                className={errors.full_name ? "border-destructive" : ""}
                            />
                            {errors.full_name && (
                                <p className="text-xs text-destructive mt-1">{errors.full_name}</p>
                            )}
                        </div>

                        {/* 이메일 입력 */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">이메일</label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={newUserData.email}
                                onChange={handleInputChange}
                                placeholder="이메일 주소를 입력하세요"
                                className={errors.email ? "border-destructive" : ""}
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* 비밀번호 입력 */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-foreground">비밀번호</label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={newUserData.password}
                                onChange={handleInputChange}
                                placeholder="비밀번호를 입력하세요"
                                className={errors.password ? "border-destructive" : ""}
                            />
                            {errors.password && (
                                <p className="text-xs text-destructive mt-1">{errors.password}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">비밀번호는 최소 6자 이상이어야 합니다</p>
                        </div>

                        {/* 역할 선택 */}
                        <div className="space-y-2">
                            <label htmlFor="role" className="text-sm font-medium text-foreground">권한</label>
                            <select 
                                id="role"
                                name="role"
                                value={newUserData.role}
                                onChange={handleInputChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                                {roles_array.map((option) => (
                                    <option key={option.code} value={option.code}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 상태 선택 */}
                        <div className="space-y-2">
                            <label htmlFor="status" className="text-sm font-medium text-foreground">상태</label>
                            <select 
                                id="status"
                                name="status"
                                value={newUserData.status}
                                onChange={handleInputChange}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                                {status_array.map((option) => (
                                    <option key={option.code} value={option.code}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end space-x-3 pt-2 border-t">
                        <Button 
                            onClick={handleAddUser}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin mr-2 size-4 border-2 border-background border-t-transparent rounded-full" />
                                    처리 중...
                                </>
                            ) : '회원 추가'}
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={handleClose}
                            disabled={loading}
                        >
                            취소
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export { AdminUserInsertModal };