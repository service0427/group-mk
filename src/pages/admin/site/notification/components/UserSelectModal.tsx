import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import { KeenIcon } from '@/components/keenicons';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface UserSelectModalProps {
  onClose: () => void;
  onSelectComplete: (users: { id: string, name: string }[]) => void;
}

const UserSelectModal: React.FC<UserSelectModalProps> = ({ onClose, onSelectComplete }) => {
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
    fetchUsers();
  }, [fetchUsers]);

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
    switch (role) {
      case 'developer':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
      case 'operator':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
      case 'distributor':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
      case 'agency':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300';
      case 'advertiser':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  // 역할 한글명
  const getRoleName = (role: string) => {
    switch (role) {
      case 'developer':
        return '개발자';
      case 'operator':
        return '운영자';
      case 'distributor':
        return '총판';
      case 'agency':
        return '대행사';
      case 'advertiser':
        return '광고주';
      default:
        return role;
    }
  };

  // 선택 완료
  const handleSelectComplete = () => {
    onSelectComplete(selectedUsers.map(user => ({
      id: user.id,
      name: user.full_name
    })));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl mx-auto border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-card-foreground">회원 선택</h3>
          <button
            className="text-muted-foreground hover:text-card-foreground p-1 rounded-full"
            onClick={onClose}
          >
            <KeenIcon icon="cross" className="text-lg" />
          </button>
        </div>

        <div className="p-4">
          {/* 검색 및 필터 */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1">
              <div className="position-relative">
                <span className="position-absolute top-50 translate-middle-y ms-4">
                  <KeenIcon icon="search" className="fs-4 text-muted" />
                </span>
                <input
                  type="text"
                  placeholder="이름 또는 이메일로 검색"
                  className="form-control border border-gray-300 focus:border-primary focus:shadow-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 ps-12"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <select
              className="form-select form-select-rounded border border-gray-300 focus:border-primary focus:shadow-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 rounded text-md px-3 py-2 min-w-[160px] w-auto"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">전체 회원 유형</option>
              <option value="developer">개발자</option>
              <option value="operator">운영자</option>
              <option value="distributor">총판</option>
              <option value="agency">대행사</option>
              <option value="advertiser">광고주</option>
            </select>

            <button
              className="btn btn-sm btn-light-primary"
              onClick={() => fetchUsers()}
            >
              <KeenIcon icon="filter" className="me-1" />
              검색
            </button>
          </div>

          {/* 선택된 사용자 표시 */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="flex items-center gap-3">
                <h4 className="fs-6 fw-semibold text-gray-900 dark:text-white">
                  선택된 회원 ({selectedUsers.length}명)
                </h4>
                {selectedUsers.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger py-1 px-2 h-8"
                    onClick={() => toggleSelectAll(false)}
                  >
                    <KeenIcon icon="trash" className="me-1 fs-6" />
                    모두 해제
                  </button>
                )}
              </div>
            </div>

            <div className="bg-light-primary dark:bg-dark p-3 rounded-lg max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700">
              {selectedUsers.length === 0 ? (
                <p className="text-gray-500 dark:text-white dark:opacity-60 fs-7 mb-0">선택된 회원이 없습니다</p>
              ) : (
                <div className="d-flex flex-wrap gap-3 p-1">
                  {selectedUsers.map(user => (
                    <span
                      key={user.id}
                      className="badge badge-primary d-inline-flex align-items-center py-2 px-3 m-1"
                    >
                      <span className="me-1">{user.full_name}</span>
                      <button
                        type="button"
                        className="btn btn-icon btn-sm btn-active-light-primary ms-2 p-0"
                        onClick={() => toggleUserSelection(user)}
                      >
                        <KeenIcon icon="cross" className="fs-8" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 사용자 목록 테이블 - 페이지네이션 적용 */}
          <div className="card card-bordered">
            <div className="table-responsive" style={{ height: '300px', overflow: 'auto', marginBottom: '15px' }}>
              <table className="table table-hover table-rounded table-striped border gy-5">
                <thead>
                  <tr className="fw-bold fs-6 text-gray-800 dark:text-gray-200 border-bottom border-gray-200 dark:border-gray-700">
                    <th style={{ width: '25px' }}>
                      <div className="form-check form-check-sm form-check-custom form-check-solid">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={users.length > 0 && selectedUsers.length === users.length}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                        />
                      </div>
                    </th>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>회원 유형</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center">
                        <div className="d-flex justify-content-center align-items-center column-gap-2">
                          <span className="spinner-border spinner-border-sm text-primary"></span>
                        </div>
                        <div className="mt-2 text-gray-600 dark:text-gray-400">사용자 목록을 불러오는 중...</div>
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
                          className={isSelected ? 'bg-light-primary dark:bg-primary/10' : ''}
                          onClick={() => toggleUserSelection(user)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <div className="form-check form-check-sm form-check-custom form-check-solid">
                              <input
                                className="form-check-input widget-9-check"
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleUserSelection(user)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="d-flex justify-content-start flex-column">
                                <span className="text-dark dark:text-white fw-bold text-hover-primary fs-6">{user.full_name}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="text-gray-600 dark:text-gray-400 fw-semibold d-block fs-7">{user.email}</span>
                          </td>
                          <td>
                            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${getRoleClasses(user.role)}`}>
                              {getRoleName(user.role)}
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
              <div className="card-footer pt-0">
                <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t gap-3">
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
                      <KeenIcon icon="double-left" className="fs-7" />
                    </button>

                    <button
                      className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                      onClick={() => page > 1 && setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      <KeenIcon icon="arrow-left" className="fs-6" />
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
                      <KeenIcon icon="arrow-right" className="fs-6" />
                    </button>

                    <button
                      className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                    >
                      <KeenIcon icon="double-right" className="fs-7" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
          <button
            className="btn btn-primary"
            onClick={handleSelectComplete}
            disabled={selectedUsers.length === 0}
          >
            <KeenIcon icon="check" className="me-1" />
            선택 완료 ({selectedUsers.length}명)
          </button>
          <button
            className="btn btn-light-secondary"
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSelectModal;