import React, { useEffect, useState } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { KeenIcon } from '@/components';
import { Button } from '@/components/ui/button';
import { supabase } from '@/supabase';
import { AdminUserModal } from './block/AdminUserModal';
import { USER_ROLES, USER_ROLE_BADGE_COLORS, USER_ROLE_THEME_COLORS, getRoleBadgeColor, getRoleDisplayName, getRoleThemeColors, RoleThemeColors } from '@/config/roles.config';
import { useAuthContext } from '@/auth';

const MakeUserRow = ({ user, getUserList, currentPage, isSelected, onSelect }: { user: any, getUserList: (page: number) => Promise<void>, currentPage: number, isSelected: boolean, onSelect: () => void }) => {
    const [userModalOpen, setUserModalOpen] = useState<boolean>(false);
    const [insertModalOpen, setInsertModalOpen] = useState<boolean>(false);

    // 회원 정보 모달 열기
    const openUserModalOpen = () => setUserModalOpen(true);
    // 회원 정보 모달 닫기
    const closeUserModalOpen = () => setUserModalOpen(false);

    const renderRoleBadge = (role: string): { name: string, class: string, style?: React.CSSProperties } => {
        // 기본 스타일 설정
        const baseStyle: React.CSSProperties = {
            backgroundColor: '#e5e7eb15', // 기본 배경색 (회색 10%)
            color: '#6b7280' // 기본 텍스트 색상 (회색)
        };

        try {
            // USER_ROLE_THEME_COLORS에서 직접 가져오기
            const roleTheme = USER_ROLE_THEME_COLORS[role];
            if (roleTheme && roleTheme.baseHex) {
                return {
                    name: getRoleDisplayName(role),
                    class: `bg-${getRoleBadgeColor(role)}/10 text-${getRoleBadgeColor(role)}`,
                    style: {
                        backgroundColor: `${roleTheme.baseHex}15`, /* 10% 투명도 */
                        color: roleTheme.baseHex
                    }
                };
            }
        } catch (error) {
            // 에러 처리 - 기본값 사용
        }

        // 기본값 반환
        return {
            name: getRoleDisplayName(role),
            class: `bg-${getRoleBadgeColor(role)}/10 text-${getRoleBadgeColor(role)}`,
            style: baseStyle
        };
    }

    const renderStatusBadge = (status: string) => {
        let badgeClass = '';
        let statusText = '';

        switch (status) {
            case 'active':
                badgeClass = 'bg-success/10 text-success';
                statusText = '활성';
                break;
            case 'inactive':
                badgeClass = 'bg-danger/10 text-danger';
                statusText = '비활성';
                break;
            case 'pending':
                badgeClass = 'bg-warning/10 text-warning';
                statusText = '대기중';
                break;
            default:
                badgeClass = 'bg-gray-100 text-gray-700';
                statusText = status;
        }

        return (
            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${badgeClass}`}>{statusText}</span>
        );
    }

    return (
        <>
            {/* 데스크톱 버전에서만 표시 (md 이상 화면) */}
            <tr className="border-b border-border hover:bg-muted/40 hidden md:table-row">
                <td className="py-4 px-5">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={isSelected}
                            onChange={onSelect}
                        />
                    </div>
                </td>
                <td className="py-4 px-5">
                    <span className="text-gray-800 font-medium">{user.email}</span>
                </td>
                <td className="py-4 px-5">
                    <div className="flex items-center">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-2">
                            {user.full_name ? user.full_name.charAt(0) : '?'}
                        </div>
                        <span className="text-gray-800">{user.full_name}</span>
                    </div>
                </td>
                <td className="py-4 px-5">
                    <span
                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${renderRoleBadge(user.role)?.class}`}
                        style={renderRoleBadge(user.role)?.style}
                    >
                        {renderRoleBadge(user.role)?.name}
                    </span>
                </td>
                <td className="py-4 px-5">
                    {renderStatusBadge(user.status)}
                </td>
                <td className="py-4 px-5">
                    <span className="text-gray-800 font-medium">
                        ₩{user.paid_balance ? user.paid_balance.toLocaleString() : '0'}
                        {user.free_balance > 0 ? ` (+${user.free_balance.toLocaleString()})` : ''}
                    </span>
                </td>
                <td className="py-4 px-5 text-end">
                    <div className="flex justify-end gap-2">
                        <button className="btn btn-icon btn-sm btn-light" onClick={openUserModalOpen} data-user-id={user.id}>
                            <KeenIcon icon="setting-2" className='text-gray-900' />
                        </button>
                        <button className="btn btn-icon btn-sm btn-light">
                            <KeenIcon icon="trash" />
                        </button>
                    </div>
                </td>
            </tr>

            <AdminUserModal
                open={userModalOpen}
                user_id={user.id}
                onClose={closeUserModalOpen}
                onUpdate={() => getUserList(currentPage)}
            />
        </>
    )
}

const UsersPage = () => {
    const { userRole } = useAuthContext();

    const [users, setUsers] = useState<any[]>([]);
    const [limit, setLimit] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchRole, setSearchRole] = useState<string>('');
    const [searchStatus, setSearchStatus] = useState<string>('');
    const [searchEmail, setSearchEmail] = useState<string>('');
    const [searchName, setSearchName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

    const getUserList = async (page: number) => {
        setLoading(true);
        try {
            // 먼저 전체 개수를 가져오기
            const countQuery = supabase
                .from('users')
                .select('id', { count: 'exact' });

            // 검색 필터 적용
            if (searchRole) {
                countQuery.eq('role', searchRole);
            }
            if (searchStatus) {
                countQuery.eq('status', searchStatus);
            }
            if (searchEmail) {
                countQuery.ilike('email', `%${searchEmail}%`);
            }
            if (searchName) {
                countQuery.ilike('full_name', `%${searchName}%`);
            }

            // 개발자가 아닌 경우에만 개발자 역할 제외
            if (!isDeveloper) {
                countQuery.neq('role', USER_ROLES.DEVELOPER);
            }

            const { count, error: countError } = await countQuery;

            if (countError) {
                throw new Error(countError.message);
            }

            setTotalItems(count || 0);

            // 데이터 가져오기
            const offset = (page - 1) * limit;
            const end = offset + parseInt(limit.toString()) - 1;

            // users 테이블과 user_balances 테이블 조인하여 캐시 정보 가져오기
            const dataQuery = supabase
                .from('users')
                .select(`
                    *,
                    user_balances!left(
                        paid_balance,
                        free_balance
                    )
                `);

            // 검색 필터 적용
            if (searchRole) {
                dataQuery.eq('role', searchRole);
            }
            if (searchStatus) {
                dataQuery.eq('status', searchStatus);
            }
            if (searchEmail) {
                dataQuery.ilike('email', `%${searchEmail}%`);
            }
            if (searchName) {
                dataQuery.ilike('full_name', `%${searchName}%`);
            }

            // 개발자가 아닌 경우에만 개발자 역할 제외
            if (!isDeveloper) {
                dataQuery.neq('role', USER_ROLES.DEVELOPER);
            }

            const response = await dataQuery.range(offset, end);

            if (response.error) {
                throw new Error(response.error.message);
            }

            // 캐시 정보 포함하여 사용자 데이터 가공
            const processedUsers = response.data.map(user => {
                const userWithCash = {
                    ...user,
                    paid_balance: user.user_balances ? user.user_balances.paid_balance || 0 : 0,
                    free_balance: user.user_balances ? user.user_balances.free_balance || 0 : 0
                };
                return userWithCash;
            });

            setUsers(processedUsers || []);

        } catch (error: any) {

        } finally {
            setLoading(false);
        }
    }

    // 페이지당 표시 개수 변경 처리
    const handleChangeLimit = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLimit = parseInt(e.target.value);
        setLimit(newLimit);
        // 페이지도 1로 초기화
        setCurrentPage(1);
        // useEffect에서 처리하므로 여기서는 getUserList 호출하지 않음
    }

    // 페이지 이동 처리
    const handlePageChange = (page: number) => {
        if (page < 1 || page > getTotalPages()) return;
        setCurrentPage(page);
    }

    // 총 페이지 수 계산
    const getTotalPages = () => {
        return Math.max(1, Math.ceil(totalItems / limit));
    }

    // 현재 표시 중인 항목 범위 계산
    const getDisplayRange = () => {
        if (totalItems === 0) return "0-0 / 0";
        const start = (currentPage - 1) * limit + 1;
        const end = Math.min(currentPage * limit, totalItems);
        return `${start}-${end} / ${totalItems}`;
    }

    // 전체 선택/해제 핸들러
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allUserIds = new Set(users.map(user => user.id));
            setSelectedUsers(allUserIds);
        } else {
            setSelectedUsers(new Set());
        }
    }

    // 개별 선택/해제 핸들러
    const handleSelectUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    }

    useEffect(() => {
        getUserList(currentPage);
        // 페이지 변경 시 선택 초기화
        setSelectedUsers(new Set());
    }, [limit, currentPage]);

    // 검색 조건이 변경되면 페이지를 1로 리셋
    useEffect(() => {
        setCurrentPage(1);
    }, [searchRole, searchStatus, searchEmail, searchName]);

    // 현재 사용자가 개발자인지 확인
    const isDeveloper = userRole === USER_ROLES.DEVELOPER;

    const roles_array = [
        { "code": "", "name": "All" },
        { "code": USER_ROLES.OPERATOR, "name": getRoleDisplayName(USER_ROLES.OPERATOR) },
        ...(isDeveloper ? [{ "code": USER_ROLES.DEVELOPER, "name": getRoleDisplayName(USER_ROLES.DEVELOPER) }] : []),
        { "code": USER_ROLES.DISTRIBUTOR, "name": getRoleDisplayName(USER_ROLES.DISTRIBUTOR) },
        { "code": USER_ROLES.AGENCY, "name": getRoleDisplayName(USER_ROLES.AGENCY) },
        { "code": USER_ROLES.ADVERTISER, "name": getRoleDisplayName(USER_ROLES.ADVERTISER) },
        { "code": USER_ROLES.BEGINNER, "name": getRoleDisplayName(USER_ROLES.BEGINNER) },
    ];

    const status_array = [
        { "code": "", "name": "전체" },
        { "code": "active", "name": "활성" },
        { "code": "inactive", "name": "비활성" },
        { "code": "pending", "name": "대기중" },
    ];

    // 툴바 액션 버튼
    const toolbarActions = (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-primary-600 text-white hover:bg-primary-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:me-2 flex-none">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span className="hidden md:inline">내보내기</span>
            </Button>
            <Button variant="outline" size="sm" className="bg-primary-600 text-white hover:bg-primary-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:me-2 flex-none">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span className="hidden md:inline">회원 추가</span>
            </Button>
        </div>
    );

    return (
        <CommonTemplate
            title="사용자 관리"
            description="시스템을 이용하는 사용자를 관리합니다"
            toolbarActions={toolbarActions}
            showPageMenu={false}
        >
            <div className="grid gap-5 lg:gap-7.5">
                {/* 검색 영역 */}
                <div className="card shadow-sm">
                    <div className="card-header border-b border-gray-200 dark:border-gray-700">
                        <h3 className="card-title">회원 검색</h3>
                    </div>
                    <div className="card-body">

                        <div className="flex flex-wrap md:flex-nowrap items-end gap-3">
                            <div className="w-full md:w-auto">
                                <label className="block text-sm font-medium text-foreground mb-1">권한</label>
                                <select className="select select-bordered w-full h-10"
                                    value={searchRole}
                                    onChange={(e) => setSearchRole(e.target.value)}>
                                    {roles_array.map((option) => (
                                        <option key={option.code} value={option.code}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-full md:w-auto">
                                <label className="block text-sm font-medium text-foreground mb-1">상태</label>
                                <select className="select select-bordered w-full h-10"
                                    value={searchStatus}
                                    onChange={(e) => setSearchStatus(e.target.value)}>
                                    {status_array.map((option) => (
                                        <option key={option.code} value={option.code}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-full md:w-auto flex-grow">
                                <label className="block text-sm font-medium text-foreground mb-1">이메일</label>
                                <input
                                    type="text"
                                    placeholder="이메일을 입력하세요"
                                    className="input input-bordered w-full h-10"
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                />
                            </div>

                            <div className="w-full md:w-auto flex-grow">
                                <label className="block text-sm font-medium text-foreground mb-1">이름</label>
                                <input
                                    type="text"
                                    placeholder="이름을 입력하세요"
                                    className="input input-bordered w-full h-10"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                />
                            </div>

                            <button className="btn btn-primary h-10 px-6 md:mt-0 w-full md:w-auto" onClick={() => getUserList(1)}>
                                <KeenIcon icon="magnifier" className="md:me-2 flex-none" />
                                <span className="hidden md:inline">검색</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 회원 리스트 영역 */}
                <div className="card shadow-sm">
                    <div className="card-header p-6 pb-5 flex justify-between items-center">
                        <h3 className="card-title text-lg font-semibold">회원 리스트</h3>
                    </div>

                    <div className="card-body p-0">
                        {loading ? (
                            <div className="flex justify-center items-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <>
                                {/* 데스크톱용 테이블 (md 이상 화면에서만 표시) */}
                                <div className="hidden md:block overflow-x-auto">
                                    {users.length > 0 ? (
                                        <table className="table align-middle text-gray-700 text-sm w-full">
                                            <thead>
                                                <tr className="border-b border-border bg-muted">
                                                    <th className="py-4 px-5 text-start">
                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                className="checkbox checkbox-sm checkbox-primary"
                                                                checked={users.length > 0 && selectedUsers.size === users.length}
                                                                onChange={handleSelectAll}
                                                            />
                                                        </div>
                                                    </th>
                                                    <th className="py-4 px-5 text-start min-w-[120px]">
                                                        <div className="flex items-center">
                                                            <span className="font-medium text-foreground">이메일</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-gray-500">
                                                                <path d="m7 15 5 5 5-5"></path>
                                                                <path d="m7 9 5-5 5 5"></path>
                                                            </svg>
                                                        </div>
                                                    </th>
                                                    <th className="py-4 px-5 text-start min-w-[120px]">
                                                        <div className="flex items-center">
                                                            <span className="font-medium text-foreground">이름</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-gray-500">
                                                                <path d="m7 15 5 5 5-5"></path>
                                                                <path d="m7 9 5-5 5 5"></path>
                                                            </svg>
                                                        </div>
                                                    </th>
                                                    <th className="py-4 px-5 text-start min-w-[150px]">
                                                        <div className="flex items-center">
                                                            <span className="font-medium text-foreground">권한</span>
                                                        </div>
                                                    </th>
                                                    <th className="py-4 px-5 text-start min-w-[150px]">
                                                        <div className="flex items-center">
                                                            <span className="font-medium text-gray-700">서비스 이용현황</span>
                                                        </div>
                                                    </th>
                                                    <th className="py-4 px-5 text-start min-w-[150px]">
                                                        <div className="flex items-center">
                                                            <span className="font-medium text-gray-700">보유캐시</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-gray-500">
                                                                <path d="m7 15 5 5 5-5"></path>
                                                                <path d="m7 9 5-5 5 5"></path>
                                                            </svg>
                                                        </div>
                                                    </th>
                                                    <th className="py-4 px-5 text-end min-w-[100px]">
                                                        <span className="font-medium text-gray-700">작업</span>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    users.map((user, index) => (
                                                        <MakeUserRow
                                                            key={index}
                                                            user={user}
                                                            getUserList={getUserList}
                                                            currentPage={currentPage}
                                                            isSelected={selectedUsers.has(user.id)}
                                                            onSelect={() => handleSelectUser(user.id)}
                                                        />
                                                    ))
                                                }
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-center py-10 text-gray-500">
                                            데이터가 없습니다.
                                        </div>
                                    )}
                                </div>

                                {/* 모바일용 카드 리스트 (md 미만 화면에서만 표시) */}
                                <div className="block md:hidden">
                                    {users.length > 0 ? (
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {users.map((user, index) => (
                                                <div key={index} className="p-4 hover:bg-muted/40">
                                                    <div className="flex gap-3">
                                                        {/* 왼쪽 번호와 체크박스 */}
                                                        <div className="flex flex-col items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                className="checkbox checkbox-sm checkbox-primary"
                                                                checked={selectedUsers.has(user.id)}
                                                                onChange={() => handleSelectUser(user.id)}
                                                            />
                                                            <div className="flex-none w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground/60 font-medium text-sm">
                                                                {index + 1}
                                                            </div>
                                                        </div>
                                                        {/* 오른쪽 내용 영역 */}
                                                        <div className="flex-1 min-w-0">
                                                            {/* 헤더: 이름, 아바타와 상태 */}
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center mr-2">
                                                                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-2">
                                                                        {user.full_name ? user.full_name.charAt(0) : '?'}
                                                                    </div>
                                                                    <h3 className="font-medium text-foreground truncate">
                                                                        {user.full_name}
                                                                    </h3>
                                                                </div>
                                                                {(() => {
                                                                    let badgeClass = '';
                                                                    let statusText = '';

                                                                    switch (user.status) {
                                                                        case 'active':
                                                                            badgeClass = 'bg-success/10 text-success';
                                                                            statusText = '활성';
                                                                            break;
                                                                        case 'inactive':
                                                                            badgeClass = 'bg-danger/10 text-danger';
                                                                            statusText = '비활성';
                                                                            break;
                                                                        case 'pending':
                                                                            badgeClass = 'bg-warning/10 text-warning';
                                                                            statusText = '대기중';
                                                                            break;
                                                                        default:
                                                                            badgeClass = 'bg-gray-100 text-gray-700';
                                                                            statusText = user.status;
                                                                    }
                                                                    return (
                                                                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${badgeClass}`}>{statusText}</span>
                                                                    );
                                                                })()}
                                                            </div>

                                                            {/* 이메일 */}
                                                            <div className="text-sm mb-3">
                                                                <div className="flex items-center text-xs text-muted-foreground mb-1">
                                                                    <KeenIcon icon="sms" className="h-3 w-3 mr-1" />
                                                                    <span>이메일:</span>
                                                                </div>
                                                                <p className="font-medium text-foreground truncate">{user.email}</p>
                                                            </div>

                                                            {/* 권한과 캐시 정보 */}
                                                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs mb-3">
                                                                <div>
                                                                    <div className="flex items-center text-muted-foreground mb-1">
                                                                        <KeenIcon icon="shield" className="h-3 w-3 mr-1" />
                                                                        <span>권한:</span>
                                                                    </div>
                                                                    {(() => {
                                                                        return (
                                                                            <p className="font-medium" style={{
                                                                                color: USER_ROLE_THEME_COLORS[user.role]?.baseHex || '#6b7280'
                                                                            }}>{getRoleDisplayName(user.role)}</p>
                                                                        );
                                                                    })()}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center text-muted-foreground mb-1">
                                                                        <KeenIcon icon="dollar" className="h-3 w-3 mr-1" />
                                                                        <span>보유캐시:</span>
                                                                    </div>
                                                                    <p className="font-medium">
                                                                        ₩{user.paid_balance ? user.paid_balance.toLocaleString() : '0'}
                                                                        {user.free_balance > 0 ? ` (+${user.free_balance.toLocaleString()})` : ''}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* 액션 버튼 */}
                                                            <div className="flex justify-end gap-2 mt-3">
                                                                <button
                                                                    className="btn btn-sm btn-outline flex items-center gap-1 px-3 py-1 h-9"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // 모달 열기 위한 함수 호출
                                                                        const userData = users.find(u => u.id === user.id);
                                                                        if (userData) {
                                                                            const modalOpener = document.querySelector(`button[data-user-id="${user.id}"]`);
                                                                            if (modalOpener) {
                                                                                (modalOpener as HTMLElement).click();
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    <KeenIcon icon="setting-2" className="h-5 w-5" />
                                                                    <span>설정</span>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-soft-danger flex items-center gap-1 px-3 py-1 h-9"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <KeenIcon icon="trash" className="h-5 w-5" />
                                                                    <span>삭제</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-gray-500">
                                            데이터가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="card-footer p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 order-2 md:order-1 min-w-[200px]">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">페이지당 표시:</span>
                            <select
                                className="select select-sm select-bordered flex-grow min-w-[100px]"
                                name="perpage"
                                value={limit}
                                onChange={handleChangeLimit}
                            >
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 order-1 md:order-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{getDisplayRange()}</span>
                            <div className="flex">
                                <button
                                    className="btn btn-icon btn-sm btn-light rounded-r-none border-r-0"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m15 18-6-6 6-6"></path>
                                    </svg>
                                </button>
                                <button
                                    className="btn btn-icon btn-sm btn-light rounded-l-none"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= getTotalPages()}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m9 18 6-6-6-6"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CommonTemplate>
    );
};

export { UsersPage };