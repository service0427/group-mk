import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem } from '@/components';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { AdminUserModal } from './block/AdminUserModal';
import { AdminUserInsertModal } from './block/AdminUserInsertModal';

import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const UsersPage = () => {
    const { pathname } = useLocation();
    const { getMenuConfig } = useMenus();
    const menuConfig = getMenuConfig('primary');
    const menuItem = useMenuCurrentItem(pathname, menuConfig);
    const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);

    const [users, setUsers] = useState<any[]>([]);
    const [limit, setLimit] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchRole, setSearchRole] = useState<string>('');
    const [searchStatus, setSearchStatus] = useState<string>('');
    const [searchEmail, setSearchEmail] = useState<string>('');
    const [searchName, setSearchName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [insertModalOpen, setInsertModalOpen] = useState<boolean>(false);
    const [userModalOpen, setUserModalOpen] = useState<boolean>(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [masterChecked, setMasterChecked] = useState<boolean>(false);
    const [checkedUsers, setCheckedUsers] = useState<Record<string, boolean>>({});

    // 회원 추가 모달 열기
    const openInsertModal = () => setInsertModalOpen(true);
    // 회원 추가 모달 닫기
    const closeInsertModal = () => setInsertModalOpen(false);
    // 회원 정보 모달 열기
    const openUserModal = (user: any) => {
        setSelectedUser(user);
        setUserModalOpen(true);
    };
    // 회원 정보 모달 닫기
    const closeUserModal = () => {
        setUserModalOpen(false);
        setSelectedUser(null);
    };

    // 전체 체크박스 핸들러
    const handleMasterCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setMasterChecked(isChecked);

        // 모든 유저의 체크 상태 설정
        const newCheckedState: Record<string, boolean> = {};
        users.forEach(user => {
            newCheckedState[user.id] = isChecked;
        });
        setCheckedUsers(newCheckedState);
    };

    // 개별 체크박스 핸들러
    const handleUserCheckboxChange = (userId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;

        setCheckedUsers(prev => ({
            ...prev,
            [userId]: isChecked
        }));

        // 모든 체크박스가 체크되었는지 확인하여 마스터 체크박스 상태 업데이트
        const allChecked = users.every(user =>
            (checkedUsers[user.id] === true) || (user.id === userId && isChecked)
        );
        setMasterChecked(allChecked);
    };

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

            const { count, error: countError } = await countQuery;

            if (countError) {
                throw new Error(countError.message);
            }

            setTotalItems(count || 0);

            // 데이터 가져오기
            const offset = (page - 1) * limit;
            const end = offset + parseInt(limit.toString()) - 1;

            const dataQuery = supabase
                .from('users')
                .select('*');

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

            const response = await dataQuery.range(offset, end);

            if (response.error) {
                throw new Error(response.error.message);
            }

            setUsers(response.data || []);

            // 새 데이터에 대한 체크박스 상태 초기화
            const newCheckedState: Record<string, boolean> = {};
            response.data?.forEach(user => {
                newCheckedState[user.id] = false;
            });
            setCheckedUsers(newCheckedState);
            setMasterChecked(false);

        } catch (error: any) {
            console.error("데이터 로딩 오류:", error.message);
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

    useEffect(() => {
        getUserList(currentPage);
    }, [limit, currentPage]);

    // 검색 조건이 변경되면 페이지를 1로 리셋
    useEffect(() => {
        setCurrentPage(1);
    }, [searchRole, searchStatus, searchEmail, searchName]);

    const roles_array = [
        { "code": "", "name": "전체" },
        { "code": "operator", "name": "관리자" },
        { "code": "developer", "name": "개발자" },
        { "code": "distributor", "name": "총판" },
        { "code": "agency", "name": "대행사" },
        { "code": "advertiser", "name": "광고주" },
    ];

    const status_array = [
        { "code": "", "name": "전체" },
        { "code": "active", "name": "활성" },
        { "code": "inactive", "name": "비활성" },
        { "code": "pending", "name": "대기중" },
    ];

    // 권한 배지 렌더링 함수 - 색상 대비 개선
    const getRoleBadge = (role: string) => {
        const roleMap: Record<string, { name: string, bgClass: string, textClass: string }> = {
            'operator': { name: '관리자', bgClass: 'bg-blue-100 dark:bg-blue-900/40', textClass: 'text-blue-800 dark:text-blue-300' },
            'developer': { name: '개발자', bgClass: 'bg-yellow-100 dark:bg-yellow-900/40', textClass: 'text-yellow-800 dark:text-yellow-300' },
            'distributor': { name: '총판', bgClass: 'bg-green-100 dark:bg-green-900/40', textClass: 'text-green-800 dark:text-green-300' },
            'agency': { name: '대행사', bgClass: 'bg-purple-100 dark:bg-purple-900/40', textClass: 'text-purple-800 dark:text-purple-300' },
            'advertiser': { name: '광고주', bgClass: 'bg-gray-100 dark:bg-gray-800', textClass: 'text-gray-800 dark:text-gray-300' }
        };

        const badgeInfo = roleMap[role] || { name: role, bgClass: 'bg-gray-100 dark:bg-gray-800', textClass: 'text-gray-800 dark:text-gray-300' };
        
        return (
            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${badgeInfo.bgClass} ${badgeInfo.textClass}`}>
                {badgeInfo.name}
            </span>
        );
    };

    // 상태 배지 렌더링 함수 - 색상 대비 개선
    const renderStatusBadge = (status: string) => {
        let badgeClasses = '';
        let statusText = '';

        switch (status) {
            case 'active':
                badgeClasses = 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
                statusText = '활성';
                break;
            case 'inactive':
                badgeClasses = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
                statusText = '비활성';
                break;
            case 'pending':
                badgeClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
                statusText = '대기중';
                break;
            default:
                badgeClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
                statusText = status;
        }

        return (
            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${badgeClasses}`}>
                {statusText}
            </span>
        );
    }

    // 페이지 번호 리스트 생성
    const getPageNumbers = () => {
        const totalPages = getTotalPages();
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = startPage + maxPagesToShow - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
    };

    return (
        <>
            <Container>
                <Toolbar>
                    <ToolbarHeading>
                        <ToolbarPageTitle customTitle="회원 관리" />
                        <ToolbarDescription>관리자 메뉴 &gt; 회원 관리</ToolbarDescription>
                    </ToolbarHeading>
                </Toolbar>
            </Container>

            <Container>
                <div className="grid gap-5 lg:gap-7.5">
                    {/* 검색 영역 */}
                    <div className="bg-card rounded-lg shadow-sm overflow-hidden">
                        <div className="p-5 border-b">
                            <h3 className="text-lg font-medium text-card-foreground">회원 검색</h3>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                {/* 권한(role) - select box */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">권한</label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={searchRole}
                                        onChange={(e) => setSearchRole(e.target.value)}>
                                        {roles_array.map((option) => (
                                            <option key={option.code} value={option.code}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 상태(status) - select box */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">상태</label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={searchStatus}
                                        onChange={(e) => setSearchStatus(e.target.value)}>
                                        {status_array.map((option) => (
                                            <option key={option.code} value={option.code}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 이메일(email) - input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">이메일</label>
                                    <Input
                                        placeholder="이메일을 입력하세요"
                                        value={searchEmail}
                                        onChange={(e) => setSearchEmail(e.target.value)}
                                    />
                                </div>

                                {/* 이름(full_name) - input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">이름</label>
                                    <Input
                                        placeholder="이름을 입력하세요"
                                        value={searchName}
                                        onChange={(e) => setSearchName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="mt-5 flex justify-end">
                                <Button
                                    onClick={() => getUserList(1)}
                                    className="px-6"
                                >
                                    검색
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* 회원 리스트 */}
                    <div className="bg-card rounded-lg shadow-sm overflow-hidden">
                        <div className="p-5 flex justify-between items-center border-b">
                            <h3 className="text-lg font-medium text-card-foreground">회원 리스트</h3>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    내보내기
                                </Button>
                                <Dialog open={insertModalOpen} onOpenChange={setInsertModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                            회원 추가
                                        </Button>
                                    </DialogTrigger>
                                </Dialog>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="flex justify-center items-center py-10">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40px]">
                                                <div className="flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-sm"
                                                        checked={masterChecked}
                                                        onChange={handleMasterCheckboxChange}
                                                    />
                                                </div>
                                            </TableHead>
                                            <TableHead>이메일</TableHead>
                                            <TableHead>이름</TableHead>
                                            <TableHead className="hidden md:table-cell">권한</TableHead>
                                            <TableHead className="hidden md:table-cell">서비스 이용현황</TableHead>
                                            <TableHead className="hidden lg:table-cell">보유캐시</TableHead>
                                            <TableHead className="w-[100px] text-center">작업</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.length > 0 ? (
                                            users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                className="checkbox checkbox-sm"
                                                                checked={!!checkedUsers[user.id]}
                                                                onChange={(e) => handleUserCheckboxChange(user.id, e)}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-medium">{user.email}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-2">
                                                                {user.full_name ? user.full_name.charAt(0) : '?'}
                                                            </div>
                                                            <span>{user.full_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {getRoleBadge(user.role)}
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {renderStatusBadge(user.status)}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <span className="font-medium">₩{user.cash || 0}{user?.bonus_cash > 0 ? `(+${user?.bonus_cash})` : ''}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-center space-x-2">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => openUserModal(user)}
                                                                className="h-8 w-8"
                                                                title="수정"
                                                            >
                                                                <KeenIcon icon="setting-2" style="outline" className="fs-6" />
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                className="h-8 w-8 hidden sm:inline-flex"
                                                                title="삭제"
                                                            >
                                                                <KeenIcon icon="trash" style="outline" className="fs-6" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center">
                                                    데이터가 없습니다.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        <div className="p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">페이지당 표시:</span>
                                <select
                                    className="w-24 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                                    value={limit}
                                    onChange={handleChangeLimit}
                                >
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>

                            <div className="flex items-center">
                                <span className="text-sm text-muted-foreground mr-4">{getDisplayRange()}</span>
                                <div className="flex space-x-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage <= 1}
                                        className="h-8 w-8"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m15 18-6-6 6-6"></path>
                                        </svg>
                                    </Button>

                                    {getPageNumbers().map((page) => (
                                        <button
                                            key={page}
                                            className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${page === currentPage
                                                    ? 'bg-primary text-white'
                                                    : 'hover:bg-gray-100'
                                                }`}
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage >= getTotalPages()}
                                        className="h-8 w-8"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m9 18 6-6-6-6"></path>
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-lg shadow-sm p-5">
                        <h3 className="text-lg font-medium text-card-foreground mb-4">회원 관리 안내</h3>
                        <div className="space-y-2 text-muted-foreground">
                            <p>• 회원 권한은 관리자, 개발자, 총판, 대행사, 광고주로 구분됩니다.</p>
                            <p>• 활성 상태의 회원만 서비스를 이용할 수 있습니다.</p>
                            <p>• 회원 정보 수정은 권한과 상태만 변경 가능하며, 필요시 비밀번호 초기화가 가능합니다.</p>
                            <p>• 회원 삭제는 관리자 권한을 가진 계정만 수행할 수 있습니다.</p>
                        </div>
                    </div>
                </div>
            </Container>

            {/* 회원 추가 모달 */}
            <AdminUserInsertModal
                open={insertModalOpen}
                onClose={closeInsertModal}
                onUserAdded={() => getUserList(currentPage)}
            />

            {/* 회원 정보 모달 */}
            {selectedUser && (
                <AdminUserModal
                    open={userModalOpen}
                    user_id={selectedUser.id}
                    onClose={closeUserModal}
                />
            )}
        </>
    );
};

export { UsersPage };