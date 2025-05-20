import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabase";
import { useEffect, useState } from "react";
import { KeenIcon } from "@/components";
import { USER_ROLES, getRoleDisplayName } from "@/config/roles.config";
import { createRoleChangeNotification } from "@/utils/notificationActions";

interface ChargeHistoryModalProps {
    open: boolean;
    user_id: string;
    onClose: () => void;
}

interface UserData {
    id: string;
    full_name: string;
    email: string;
    password?: string;
    role: string;
    status: string;
    created_at?: string;
}

const AdminUserModal = ({ open, user_id, onClose }: ChargeHistoryModalProps) => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    // 사용 가능한 역할과 상태 옵션
    const roles_array = [
        {"code": USER_ROLES.OPERATOR, "name": getRoleDisplayName(USER_ROLES.OPERATOR)},
        {"code": USER_ROLES.DEVELOPER, "name": getRoleDisplayName(USER_ROLES.DEVELOPER)},
        {"code": USER_ROLES.DISTRIBUTOR, "name": getRoleDisplayName(USER_ROLES.DISTRIBUTOR)},
        {"code": USER_ROLES.AGENCY, "name": getRoleDisplayName(USER_ROLES.AGENCY)},
        {"code": USER_ROLES.ADVERTISER, "name": getRoleDisplayName(USER_ROLES.ADVERTISER)},
    ];

    const status_array = [
        {"code":"active", "name": "활성"},
        {"code":"inactive", "name": "비활성"},
        {"code":"pending", "name": "대기중"},
    ];

    useEffect(() => {
        if (open && user_id) {
            getUserData(user_id);
        }
    }, [user_id, open]);

    const getUserData = async(user_id: string) => {
        setLoading(true);
        try {
            const response = await supabase
                .from('users')
                .select('*')
                .eq('id', user_id)
                .single();
            
            if (response.error) {
                throw new Error(response.error.message);
            }
            
            setUserData(response.data);
            setSelectedRole(response.data.role);
            setSelectedStatus(response.data.status);
        } catch (error: any) {
            
        } finally {
            setLoading(false);
        }
    }

    // 기존 getRoleDisplayName 함수는 roles.config.ts에서 불러오는 버전으로 대체

    // 상태 배지 렌더링 함수
    const renderStatusBadge = (status: string) => {
        let badgeClass = '';
        let statusText = '';

        switch(status) {
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

    // 회원정보 수정 핸들러
    const handleUpdateUser = async() => {
        try {
            // 역할이 변경되었는지 확인
            const isRoleChanged = userData && userData.role !== selectedRole;
            const oldRole = userData?.role || '';
            
            // 회원 정보 업데이트
            const { error: updateDBError } = await supabase
                .from('users')
                .update({
                    'status': selectedStatus,
                    'role': selectedRole
                })
                .eq('id', user_id);
                
            if (updateDBError) {
                throw new Error(updateDBError.message);
            }

            // 역할이 변경되었다면 알림 전송
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

            setUserData(prev => prev ? {...prev, status: selectedStatus, role: selectedRole} : null);
            alert('회원 정보 수정 되었습니다');
        } catch (error: any) {
            console.error('회원 정보 수정 중 오류 발생:', error.message);
            alert('회원 정보 수정 중 오류가 발생했습니다: ' + error.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
                <DialogHeader className="bg-background py-4 px-6">
                    <DialogTitle className="text-xl font-bold text-foreground">회원 정보</DialogTitle>
                </DialogHeader>
                <div className="p-6 bg-background">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        </div>
                    ) : userData ? (
                        <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-border">
                                <tbody className="divide-y divide-border">
                                    {/* 이름 */}
                                    <tr>
                                        <td className="px-6 py-4 w-1/3">
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-foreground">이름</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 w-2/3">
                                            <div className="flex items-center">
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-2">
                                                    {userData.full_name ? userData.full_name.charAt(0) : '?'}
                                                </div>
                                                <span className="text-foreground font-medium">{userData.full_name}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {/* 상태 - 현재 상태와 셀렉트 박스 함께 표시 */}
                                    <tr>
                                        <td className="px-6 py-4 w-1/3">
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-foreground">상태</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 w-2/3">
                                            <div className="flex items-center gap-4">
                                                <div className="min-w-24">
                                                    {renderStatusBadge(userData.status)}
                                                </div>
                                                <select 
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
                                        </td>
                                    </tr>
                                    
                                    {/* 이메일 */}
                                    <tr>
                                        <td className="px-6 py-4 w-1/3">
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-foreground">이메일</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 w-2/3">
                                            <span className="text-foreground font-medium">{userData.email}</span>
                                        </td>
                                    </tr>
                                    
                                    {/* 비밀번호 */}
                                    <tr>
                                        <td className="px-6 py-4 w-1/3">
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-foreground">비밀번호</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 w-2/3">
                                            <div className="flex items-center">
                                                <Button variant="destructive" size="sm">
                                                    비밀번호 초기화
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {/* 권한 - 현재 권한과 셀렉트 박스 함께 표시 */}
                                    <tr>
                                        <td className="px-6 py-4 w-1/3">
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-foreground">권한</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 w-2/3">
                                            <div className="flex items-center gap-4">
                                                <div className="min-w-24">
                                                    <span className="text-foreground font-medium">
                                                        {getRoleDisplayName(userData.role)}
                                                    </span>
                                                </div>
                                                <select 
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            <div className="mt-6 flex justify-end space-x-3 pt-2 border-t">
                                <Button 
                                    onClick={handleUpdateUser}
                                >
                                    회원정보 수정
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={onClose}
                                >
                                    닫기
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            회원 정보를 불러올 수 없습니다.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export { AdminUserModal };