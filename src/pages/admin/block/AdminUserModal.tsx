import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabase";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { KeenIcon } from "@/components";
import { USER_ROLES, getRoleDisplayName, getRoleThemeColors } from "@/config/roles.config";
import { createRoleChangeNotification } from "@/utils/notificationActions";
import { useDialog, useToast } from "@/providers";
import { useAuthContext } from "@/auth";

interface ChargeHistoryModalProps {
    open: boolean;
    user_id: string;
    onClose: () => void;
    onUpdate?: () => void; // 업데이트 후 콜백 추가
}

interface UserData {
    id: string;
    full_name: string;
    email: string;
    password?: string;
    role: string;
    status: string;
    created_at?: string;
    business?: {
        business_number: string;
        business_name: string;
        representative_name: string;
        business_email: string;
        business_image_url?: string;
    };
}

interface BankAccountData {
    bank_name: string;
    account_number: string;
    account_holder: string;
    is_editable?: boolean;
}

const AdminUserModal = ({ open, user_id, onClose, onUpdate }: ChargeHistoryModalProps) => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [bankAccountData, setBankAccountData] = useState<BankAccountData>({
        bank_name: '',
        account_number: '',
        account_holder: '',
        is_editable: true
    });
    const [businessData, setBusinessData] = useState({
        business_number: '',
        business_name: '',
        representative_name: '',
        business_email: '',
        business_image_url: ''
    });
    const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const { showDialog } = useDialog();
    const { success, error: showError } = useToast();
    const { userRole } = useAuthContext();

    // ESC 키 핸들러 - 이미지 모달에만 적용
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && imageModalOpen) {
                event.stopPropagation();
                event.preventDefault();
                setImageModalOpen(false);
                setSelectedImage('');
            }
        };

        if (imageModalOpen) {
            document.addEventListener('keydown', handleEsc, true); // capture phase에서 처리
        }

        return () => {
            document.removeEventListener('keydown', handleEsc, true);
        };
    }, [imageModalOpen]);

    // 현재 사용자가 개발자인지 확인
    const isDeveloper = userRole === USER_ROLES.DEVELOPER;

    // 사용 가능한 역할과 상태 옵션
    const roles_array = [
        { "code": USER_ROLES.OPERATOR, "name": getRoleDisplayName(USER_ROLES.OPERATOR) },
        ...(isDeveloper ? [{ "code": USER_ROLES.DEVELOPER, "name": getRoleDisplayName(USER_ROLES.DEVELOPER) }] : []),
        { "code": USER_ROLES.DISTRIBUTOR, "name": getRoleDisplayName(USER_ROLES.DISTRIBUTOR) },
        { "code": USER_ROLES.AGENCY, "name": getRoleDisplayName(USER_ROLES.AGENCY) },
        { "code": USER_ROLES.ADVERTISER, "name": getRoleDisplayName(USER_ROLES.ADVERTISER) },
        { "code": USER_ROLES.BEGINNER, "name": getRoleDisplayName(USER_ROLES.BEGINNER) },
    ];

    const status_array = [
        { "code": "active", "name": "활성" },
        { "code": "inactive", "name": "비활성" },
        { "code": "pending", "name": "대기중" },
    ];

    useEffect(() => {
        if (open && user_id) {
            getUserData(user_id);
        }
    }, [user_id, open]);

    const getUserData = async (user_id: string) => {
        setLoading(true);
        try {
            // 사용자 정보와 사업자 정보 가져오기
            const response = await supabase
                .from('users')
                .select('*, business')
                .eq('id', user_id)
                .single();

            if (response.error) {
                throw new Error(response.error.message);
            }

            setUserData(response.data);
            setSelectedRole(response.data.role);
            setSelectedStatus(response.data.status);

            // 사업자 정보 설정
            if (response.data.business) {
                setBusinessData({
                    business_number: response.data.business.business_number || '',
                    business_name: response.data.business.business_name || '',
                    representative_name: response.data.business.representative_name || '',
                    business_email: response.data.business.business_email || '',
                    business_image_url: response.data.business.business_image_url || ''
                });

                // 은행 계좌 정보는 business 객체 안에 있음
                if (response.data.business.bank_account) {
                    setBankAccountData({
                        bank_name: response.data.business.bank_account.bank_name || '',
                        account_number: response.data.business.bank_account.account_number || '',
                        account_holder: response.data.business.bank_account.account_holder || '',
                        is_editable: response.data.business.bank_account.is_editable !== false
                    });
                }
            }
        } catch (error: any) {
            console.error('회원 정보 조회 오류:', error);
        } finally {
            setLoading(false);
        }
    }

    // 기존 getRoleDisplayName 함수는 roles.config.ts에서 불러오는 버전으로 대체

    // 은행 목록
    const bankList = [
        '신한은행', '국민은행', '우리은행', '하나은행', 'NH농협은행',
        '기업은행', 'SC제일은행', '카카오뱅크', '토스뱅크', '케이뱅크',
        '부산은행', '대구은행', '광주은행', '경남은행', '전북은행',
        '제주은행', '산업은행', '수협은행', '새마을금고', '신협', '우체국'
    ];

    // 상태 배지 렌더링 함수
    const renderStatusBadge = (status: string) => {
        let badgeClass = '';
        let statusText = '';

        switch (status) {
            case 'active':
                badgeClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                statusText = '활성';
                break;
            case 'inactive':
                badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
                statusText = '비활성';
                break;
            case 'pending':
                badgeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
                statusText = '대기중';
                break;
            default:
                badgeClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                statusText = status;
        }

        return (
            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${badgeClass}`}>
                {statusText}
            </span>
        );
    }

    // 역할 변경 핸들러
    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedRole(e.target.value);
    };

    // 상태 변경 핸들러
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedStatus(e.target.value);
    };

    // 비밀번호 초기화 핸들러
    const handleResetPassword = async () => {
        const confirmReset = await showDialog({
            title: '비밀번호 초기화',
            message: `${userData?.email}로 비밀번호 재설정 이메일을 발송하시겠습니까?`,
            confirmText: '발송',
            cancelText: '취소',
            variant: 'warning'
        });

        if (!confirmReset) return;

        try {
            setSaving(true);

            // Supabase의 비밀번호 재설정 이메일 발송
            const { error } = await supabase.auth.resetPasswordForEmail(userData?.email || '', {
                redirectTo: `${window.location.origin}/#/auth/reset-password/change`,
            });

            if (error) {
                throw error;
            }

            success('비밀번호 재설정 이메일이 발송되었습니다.');
        } catch (error: any) {
            console.error('비밀번호 재설정 이메일 발송 오류:', error);
            showError('비밀번호 재설정 이메일 발송에 실패했습니다: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // 회원정보 수정 핸들러
    const handleUpdateUser = async () => {
        setSaving(true);
        try {
            // 역할이 변경되었는지 확인
            const isRoleChanged = userData && userData.role !== selectedRole;
            const oldRole = userData?.role || '';

            // 회원 정보 업데이트 (사업자 정보 포함)
            const updateData: any = {
                'status': selectedStatus,
                'role': selectedRole
            };

            // 사업자 정보와 은행 계좌 정보를 함께 업데이트
            const businessUpdateData = { ...businessData };

            // 은행 계좌 정보를 business 객체 안에 포함
            if (bankAccountData.bank_name || bankAccountData.account_number || bankAccountData.account_holder) {
                businessUpdateData.bank_account = {
                    bank_name: bankAccountData.bank_name,
                    account_number: bankAccountData.account_number,
                    account_holder: bankAccountData.account_holder,
                    is_editable: bankAccountData.is_editable
                };
            }

            // 기존 business 정보 유지
            if (userData?.business) {
                businessUpdateData.verified = userData.business.verified;
                businessUpdateData.verification_date = userData.business.verification_date;
            }

            updateData.business = businessUpdateData;

            const { error: updateDBError } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user_id);

            if (updateDBError) {
                throw new Error(updateDBError.message);
            }

            // business 정보와 함께 업데이트되므로 별도 처리 불필요

            // 역할이 변경되었다면 알림 전송
            // auth.users 테이블은 데이터베이스 트리거가 자동으로 업데이트함
            if (isRoleChanged) {
                // 역할 표시 이름 객체 생성
                const roleDisplayNames: Record<string, string> = {};
                roles_array.forEach(role => {
                    roleDisplayNames[role.code] = role.name;
                });

                // 사용자에게 역할 변경 알림 전송
                await createRoleChangeNotification(
                    user_id,
                    oldRole,
                    selectedRole,
                    roleDisplayNames
                );
            }

            setUserData(prev => prev ? { ...prev, status: selectedStatus, role: selectedRole } : null);
            success('회원 정보가 수정되었습니다.');

            // 리스트 새로고침 콜백 호출
            onUpdate?.();
        } catch (error: any) {
            console.error('회원 정보 수정 중 오류 발생:', error.message);
            showError('회원 정보 수정 중 오류가 발생했습니다: ' + error.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(newOpen) => {
                // 이미지 모달이 열려있을 때는 Dialog 닫기 방지
                if (!imageModalOpen && !newOpen) {
                    onClose();
                }
            }}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeenIcon icon="user-square" className="size-5 text-primary" />
                            회원 정보 관리
                        </DialogTitle>
                    </DialogHeader>
                    <DialogBody className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : userData ? (
                            <div className="space-y-6">
                                {/* 기본 정보 카드 */}
                                <div className="card rounded-xl shadow-sm">
                                    <div className="card-header border-b border-gray-200 p-6">
                                        <div className="flex items-center gap-2">
                                            <KeenIcon icon="profile-circle" className="size-5 text-primary" />
                                            <h4 className="text-base font-semibold text-gray-900">기본 정보</h4>
                                        </div>
                                    </div>
                                    <div className="card-body p-6">
                                        {/* 프로필 헤더 */}
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                                                <span className="text-xl font-semibold text-primary">
                                                    {userData.full_name?.charAt(0) || '?'}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {userData.full_name || '사용자'}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="badge px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                        style={{
                                                            backgroundColor: `${getRoleThemeColors(userData.role)?.baseHex || '#6b7280'}15`,
                                                            color: getRoleThemeColors(userData.role)?.baseHex || '#6b7280'
                                                        }}>
                                                        {getRoleDisplayName(userData.role)}
                                                    </span>
                                                    {renderStatusBadge(userData.status)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 입력 필드들 */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="form-label text-sm font-medium text-gray-700">이메일</label>
                                                <input
                                                    type="email"
                                                    className="input bg-gray-50"
                                                    value={userData.email}
                                                    disabled
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="form-label text-sm font-medium text-gray-700">상태</label>
                                                    <select
                                                        className="select"
                                                        value={selectedStatus}
                                                        onChange={handleStatusChange}
                                                    >
                                                        {status_array.map((option) => (
                                                            <option key={option.code} value={option.code}>
                                                                {option.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="form-label text-sm font-medium text-gray-700">권한</label>
                                                    <select
                                                        className="select"
                                                        value={selectedRole}
                                                        onChange={handleRoleChange}
                                                    >
                                                        {roles_array.map((option) => (
                                                            <option key={option.code} value={option.code}>
                                                                {option.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="form-label text-sm font-medium text-gray-700">비밀번호 관리</label>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleResetPassword}
                                                        disabled={saving}
                                                    >
                                                        <KeenIcon icon="sms" className="mr-2" />
                                                        비밀번호 재설정 이메일 발송
                                                    </Button>
                                                    <span className="text-xs text-gray-500">
                                                        사용자에게 비밀번호 재설정 링크가 발송됩니다
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 사업자 정보 카드 */}
                                <div className="card rounded-xl shadow-sm">
                                    <div className="card-header border-b border-gray-200 p-6">
                                        <div className="flex items-center gap-2">
                                            <KeenIcon icon="shop" className="size-5 text-primary" />
                                            <h4 className="text-base font-semibold text-gray-900">사업자 정보</h4>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">캐시 충전 및 등급 신청을 위한 사업자 정보를 관리합니다</p>
                                    </div>
                                    <div className="card-body p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="form-label text-sm font-medium text-gray-700">사업자 등록번호</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={businessData.business_number}
                                                    onChange={(e) => setBusinessData({ ...businessData, business_number: e.target.value })}
                                                    placeholder="000-00-00000"
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label text-sm font-medium text-gray-700">상호명</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={businessData.business_name}
                                                    onChange={(e) => setBusinessData({ ...businessData, business_name: e.target.value })}
                                                    placeholder="상호명을 입력하세요"
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label text-sm font-medium text-gray-700">대표자명</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={businessData.representative_name}
                                                    onChange={(e) => setBusinessData({ ...businessData, representative_name: e.target.value })}
                                                    placeholder="대표자명을 입력하세요"
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label text-sm font-medium text-gray-700">사업자용 이메일</label>
                                                <input
                                                    type="email"
                                                    className="input"
                                                    value={businessData.business_email}
                                                    onChange={(e) => setBusinessData({ ...businessData, business_email: e.target.value })}
                                                    placeholder="business@example.com"
                                                />
                                            </div>
                                        </div>

                                        {/* 사업자등록증 이미지 */}
                                        {businessData.business_image_url && (
                                            <div className="mt-6">
                                                <label className="form-label text-sm font-medium text-gray-700 mb-3">사업자등록증</label>
                                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-shrink-0">
                                                            <div className="relative group cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedImage(businessData.business_image_url);
                                                                    setImageModalOpen(true);
                                                                }}>
                                                                <img
                                                                    src={businessData.business_image_url}
                                                                    alt="사업자등록증"
                                                                    className="w-24 h-24 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiNFQkVCRUIiLz48dGV4dCB4PVwiMTUwXCIgeT1cIjI1MFwiIGZvbnQtZmFtaWx5PVwiQXJpYWxcIiBmb250LXNpemU9XCIyNFwiIGZpbGw9XCIjNjY2NjY2XCI+7J2066+47KeA66W8IOu2iOufrOyYpCDsiJgg7JeG7Iq164uI64ukPC90ZXh0Pjwvc3ZnPg==";
                                                                    }}
                                                                />
                                                                <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <KeenIcon icon="eye" className="text-white size-6" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-600 mb-2">
                                                                클릭하여 크게 볼 수 있습니다
                                                            </p>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedImage(businessData.business_image_url);
                                                                    setImageModalOpen(true);
                                                                }}
                                                            >
                                                                <KeenIcon icon="eye" className="mr-2" />
                                                                이미지 확대보기
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 출금 계좌 정보 카드 */}
                                <div className="card rounded-xl shadow-sm">
                                    <div className="card-header border-b border-gray-200 p-6">
                                        <div className="flex items-center gap-2">
                                            <KeenIcon icon="dollar" className="size-5 text-primary" />
                                            <h4 className="text-base font-semibold text-gray-900">출금 계좌 정보</h4>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">출금을 위한 계좌 정보를 관리합니다</p>
                                    </div>
                                    <div className="card-body p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="form-label text-sm font-medium text-gray-700">은행명</label>
                                                <select
                                                    className="select"
                                                    value={bankAccountData.bank_name}
                                                    onChange={(e) => setBankAccountData({ ...bankAccountData, bank_name: e.target.value })}
                                                >
                                                    <option value="">은행을 선택하세요</option>
                                                    {bankList.map((bank) => (
                                                        <option key={bank} value={bank}>{bank}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="form-label text-sm font-medium text-gray-700">계좌번호</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={bankAccountData.account_number}
                                                    onChange={(e) => setBankAccountData({ ...bankAccountData, account_number: e.target.value })}
                                                    placeholder="계좌번호를 입력하세요 ('-' 없이)"
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label text-sm font-medium text-gray-700">예금주</label>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={bankAccountData.account_holder}
                                                    onChange={(e) => setBankAccountData({ ...bankAccountData, account_holder: e.target.value })}
                                                    placeholder="예금주명을 입력하세요"
                                                />
                                            </div>
                                        </div>
                                        {!bankAccountData.is_editable && (
                                            <div className="mt-4 bg-warning/10 p-3 rounded-lg">
                                                <p className="text-sm text-warning">
                                                    <KeenIcon icon="information-2" className="inline mr-1" />
                                                    출금 계좌 정보는 한 번 저장 후 본인만 수정할 수 있습니다.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                                <KeenIcon icon="information-2" className="size-12 text-gray-300 mb-4" />
                                <p className="text-gray-500 text-lg">회원 정보를 불러올 수 없습니다.</p>
                                <p className="text-gray-400 text-sm mt-2">잠시 후 다시 시도해주세요.</p>
                            </div>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            onClick={handleUpdateUser}
                            disabled={saving}
                        >
                            {saving ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    수정 중...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <KeenIcon icon="check" className="mr-2" />
                                    회원정보 수정
                                </span>
                            )}
                        </Button>
                        <Button
                            variant="light"
                            onClick={onClose}
                        >
                            닫기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 이미지 확대 모달 - Portal로 body에 직접 렌더링 */}
            {imageModalOpen && selectedImage && createPortal(
                <>
                    {/* 오버레이 */}
                    <div
                        className="fixed inset-0 bg-black/80"
                        style={{ zIndex: 99999 }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setImageModalOpen(false);
                            setSelectedImage('');
                        }}
                    />
                    {/* 모달 내용 */}
                    <div
                        className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
                        style={{ zIndex: 100000 }}
                    >
                        <div className="relative max-w-4xl max-h-[90vh] pointer-events-auto">
                            <img
                                src={selectedImage}
                                alt="사업자등록증"
                                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiNFQkVCRUIiLz48dGV4dCB4PVwiMTUwXCIgeT1cIjI1MFwiIGZvbnQtZmFtaWx5PVwiQXJpYWxcIiBmb250LXNpemU9XCIyNFwiIGZpbGw9XCIjNjY2NjY2XCI+7J2066+47KeA66W8IOu2iOufrOyYpCDsiJgg7JeG7Iq164uI64ukPC90ZXh0Pjwvc3ZnPg==";
                                }}
                            />
                            <button
                                className="absolute top-2 right-2 btn btn-sm btn-light shadow-lg"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setImageModalOpen(false);
                                    setSelectedImage('');
                                }}
                                type="button"
                            >
                                <KeenIcon icon="cross" className="text-lg" />
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
}

export { AdminUserModal };