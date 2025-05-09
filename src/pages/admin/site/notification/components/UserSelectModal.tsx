import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import { KeenIcon } from '@/components/keenicons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { USER_ROLES, getRoleDisplayName, getRoleBadgeColor } from '@/config/roles.config';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface UserSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComplete: (users: { id: string, name: string }[]) => void;
}

const UserSelectModal: React.FC<UserSelectModalProps> = ({ isOpen, onClose, onSelectComplete }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // 페이지네이션 상태 추가
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 30; // 한 페이지당 표시할 항목 수

  // 사용자 데이터 가져오기 - 페이지네이션 적용
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      // 총 레코드 수 먼저 조회
      let countQuery = supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      // 역할 필터링
      if (roleFilter !== 'all') {
        countQuery = countQuery.eq('role', roleFilter);
      }

      // 검색어 필터링
      if (search) {
        countQuery = countQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error('사용자 수를 가져오는 중 오류 발생:', countError.message);
      } else if (count !== null) {
        setTotalRecords(count);
        setTotalPages(Math.ceil(count / itemsPerPage));

        // 조회된 레코드가 없거나 현재 페이지가 전체 페이지보다 크면 페이지 1로 설정
        if (count === 0 || page > Math.ceil(count / itemsPerPage)) {
          setPage(1);
        }
      }

      // 페이지네이션 데이터 조회
      let query = supabase
        .from('users')
        .select('id, full_name, email, role')
        .order('full_name');

      // 역할 필터링
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      // 검색어 필터링
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // 페이지네이션 설정
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) {
        console.error('사용자 목록을 가져오는 중 오류 발생:', error.message);
        return;
      }

      setUsers(data || []);
    } catch (error: any) {
      console.error('사용자 목록을 가져오는 중 오류 발생:', error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page, itemsPerPage]);

  // 컴포넌트 마운트 시 사용자 목록 가져오기
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [fetchUsers, isOpen]);

  // 검색 조건 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  // 사용자 선택 토글
  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);

      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // 모든 사용자 선택/해제
  const toggleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedUsers(users);
    } else {
      setSelectedUsers([]);
    }
  };

  // 역할에 따른 아이콘 및 배경색 클래스
  const getRoleClasses = (role: string) => {
    const color = getRoleBadgeColor(role);
    return `bg-${color}-100 dark:bg-${color}-900/40 text-${color}-800 dark:text-${color}-300`;
  };

  // 선택 완료
  const handleSelectComplete = () => {
    onSelectComplete(selectedUsers.map(user => ({
      id: user.id,
      name: user.full_name
    })));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden">
        <DialogHeader className="bg-background py-3 px-6 border-b">
          <DialogTitle className="text-lg font-medium text-foreground">회원 선택</DialogTitle>
        </DialogHeader>

        <div className="p-4 bg-background">
          {/* 검색 및 필터 */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute top-1/2 transform -translate-y-1/2 left-3">
                  <KeenIcon icon="search" className="text-muted-foreground" />
                </span>
                <Input
                  type="text"
                  placeholder="이름 또는 이메일로 검색"
                  className="pl-10 input input-bordered w-full h-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <select
              className="select select-sm select-bordered min-w-[160px] w-auto"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">전체 회원 유형</option>
              <option value={USER_ROLES.DEVELOPER}>{getRoleDisplayName(USER_ROLES.DEVELOPER)}</option>
              <option value={USER_ROLES.OPERATOR}>{getRoleDisplayName(USER_ROLES.OPERATOR)}</option>
              <option value={USER_ROLES.DISTRIBUTOR}>{getRoleDisplayName(USER_ROLES.DISTRIBUTOR)}</option>
              <option value={USER_ROLES.AGENCY}>{getRoleDisplayName(USER_ROLES.AGENCY)}</option>
              <option value={USER_ROLES.ADVERTISER}>{getRoleDisplayName(USER_ROLES.ADVERTISER)}</option>
            </select>

            <Button
              variant="outline"
              onClick={() => fetchUsers()}
              size="sm"
              className="flex items-center gap-1"
            >
              <KeenIcon icon="filter" />
              검색
            </Button>
          </div>

          {/* 선택된 사용자 표시 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-medium text-foreground">
                  선택된 회원 ({selectedUsers.length}명)
                </h4>
                {selectedUsers.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => toggleSelectAll(false)}
                    className="h-8 py-1 px-2"
                  >
                    <KeenIcon icon="trash" className="mr-1 text-sm" />
                    모두 해제
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-light-primary dark:bg-dark p-3 rounded-lg max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700">
              {selectedUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm">선택된 회원이 없습니다</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(user => (
                    <span
                      key={user.id}
                      className="inline-flex items-center py-1 px-3 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      <span className="mr-1">{user.full_name}</span>
                      <button
                        type="button"
                        className="text-primary hover:text-primary/80 focus:outline-none"
                        onClick={() => toggleUserSelection(user)}
                      >
                        <KeenIcon icon="cross" className="text-xs" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 사용자 목록 테이블 - 페이지네이션 적용 */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="relative overflow-x-auto" style={{ height: '300px' }}>
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                  <tr>
                    <th scope="col" className="p-4 w-[25px]">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          checked={users.length > 0 && selectedUsers.length === users.length}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3">이름</th>
                    <th scope="col" className="px-6 py-3">이메일</th>
                    <th scope="col" className="px-6 py-3">회원 유형</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-gray-600 dark:text-gray-400">사용자 목록을 불러오는 중...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500 dark:text-gray-400">
                        {search || roleFilter !== 'all'
                          ? '검색 결과가 없습니다'
                          : '사용자가 없습니다'}
                      </td>
                    </tr>
                  ) : (
                    users.map(user => {
                      const isSelected = selectedUsers.some(u => u.id === user.id);

                      return (
                        <tr
                          key={user.id}
                          className={`${isSelected ? 'bg-primary/5' : ''} border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer`}
                          onClick={() => toggleUserSelection(user)}
                        >
                          <td className="p-4 w-4">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                checked={isSelected}
                                onChange={() => toggleUserSelection(user)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                            {user.full_name}
                          </td>
                          <td className="px-6 py-4">
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${getRoleClasses(user.role)}`}>
                              {getRoleDisplayName(user.role)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {totalRecords > 0 ? (
                      <>총 <span className="font-medium text-gray-900 dark:text-white">{totalRecords.toLocaleString('ko-KR')}</span>명 중 <span className="font-medium text-gray-900 dark:text-white">{((page - 1) * itemsPerPage + 1).toLocaleString('ko-KR')}</span>-<span className="font-medium text-gray-900 dark:text-white">{Math.min(page * itemsPerPage, totalRecords).toLocaleString('ko-KR')}</span></>
                    ) : (
                      '표시할 사용자가 없습니다'
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                    >
                      <KeenIcon icon="double-left" className="text-xs" />
                    </button>

                    <button
                      className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                      onClick={() => page > 1 && setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      <KeenIcon icon="arrow-left" className="text-sm" />
                    </button>

                    <div className="flex items-center">
                      {(() => {
                        // 페이지 번호 계산 로직
                        const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
                        const maxPagesToShow = 5;
                        let startPage: number;
                        let endPage: number;

                        if (totalPages <= maxPagesToShow) {
                          // 전체 페이지가 5개 이하면 모두 표시
                          startPage = 1;
                          endPage = totalPages;
                        } else if (page <= 3) {
                          // 현재 페이지가 앞쪽에 있을 경우
                          startPage = 1;
                          endPage = 5;
                        } else if (page >= totalPages - 2) {
                          // 현재 페이지가 뒷쪽에 있을 경우
                          startPage = totalPages - 4;
                          endPage = totalPages;
                        } else {
                          // 현재 페이지가 중간에 있을 경우
                          startPage = page - 2;
                          endPage = page + 2;
                        }

                        // 페이지 버튼 배열 생성
                        const pages = [];
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              className={`flex items-center justify-center w-8 h-8 rounded-md ${i === page
                                  ? 'bg-primary text-white'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
                                }`}
                              onClick={() => setPage(i)}
                            >
                              {i}
                            </button>
                          );
                        }

                        return pages;
                      })()}
                    </div>

                    <button
                      className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                      onClick={() => page < totalPages && setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      <KeenIcon icon="arrow-right" className="text-sm" />
                    </button>

                    <button
                      className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                    >
                      <KeenIcon icon="double-right" className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={handleSelectComplete}
            disabled={selectedUsers.length === 0}
          >
            <KeenIcon icon="check" className="mr-1" />
            선택 완료 ({selectedUsers.length}명)
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
          >
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSelectModal;