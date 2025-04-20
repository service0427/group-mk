import React, { useEffect, useState } from 'react';
import BasicTemplate from './components/BasicTemplate';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { AdminUserModal } from './block/AdminUserModal';
import { AdminUserInsertModal } from './block/AdminUserInsertModal';

const MakeUserRow = (user:any) => {
    const [userModalOpen, setUserModalOpen] = useState<boolean>(false);
    const [insertModalOpen, setInsertModalOpen] = useState<boolean>(false);

    // 회원 정보 모달 열기
    const openUserModalOpen = () => setUserModalOpen(true);
    // 회원 정보 모달 닫기
    const closeUserModalOpen = () => setUserModalOpen(false);

    // 회원 추가 모달 열기
    const openInsertModalOpen = () => setInsertModalOpen(true);
    // 회원 추가 모달 닫기
    const closeInsertModalOpen = () => setInsertModalOpen(false);


    const renderRoleBadge = (role: string): object => {
        const roleMap: Record<string, object> = {
            'operator': {name:'관리자', class:'text-primary'},
            'developer': {name:'개발자', class:'text-warning'},
            'distributor': {name:'총판', class:'text-success'},
            'agency': {name:'대행사', class:'text-info'},
            'advertiser': {name:'광고주', class:'text-secodary'}
        };
        return roleMap[role] || role;
    }

    const renderStatusBadge = (status: string) => {
        let badgeClass = '';
        let statusText = '';

        switch(status) {
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

    return(
      <>
        <tr className="border-b border-gray-200 hover:bg-gray-50">
            <td className="py-4 px-5">
                <div className="flex items-center">
                    <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" />
                </div>
            </td>
            <td className="py-4 px-5">
                <span className="text-gray-800 font-medium">{user.user.email}</span>
            </td>
            <td className="py-4 px-5">
                <div className="flex items-center">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-2">
                        {user.user.full_name ? user.user.full_name.charAt(0) : '?'}
                    </div>
                    <span className="text-gray-800">{user.user.full_name}</span>
                </div>
            </td>
            <td className="py-4 px-5">
                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${renderRoleBadge(user.user.role).class}`}>{renderRoleBadge(user.user.role).name}</span>
                
            </td>
            <td className="py-4 px-5">
                {renderStatusBadge(user.user.status)}
            </td>
            <td className="py-4 px-5">
                <span className="text-gray-800 font-medium">₩{user.user.cash}{ user?.bonus_cash > 0 ? `(+${user?.user?.bonus_cash})` : '' }</span>
            </td>
            <td className="py-4 px-5 text-end">
                <div className="flex justify-end gap-2">
                    <button className="btn btn-icon btn-sm btn-light" onClick={openUserModalOpen}>
                        <KeenIcon icon="setting-2" className='text-gray-900'/>
                    </button>
                    <button className="btn btn-icon btn-sm btn-light">
                        <KeenIcon icon="trash"/>
                    </button>
                </div>
            </td>
        </tr>

        <AdminUserModal
          open = {userModalOpen}
          user_id= {user.user.id}
          onClose={closeUserModalOpen}
          />
      </>
    )
}

const UsersPage = () => {
  
    const [users, setUsers] = useState<any[]>([]);
    const [limit, setLimit] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [searchRole, setSearchRole] = useState<string>('');
    const [searchStatus, setSearchStatus] = useState<string>('');
    const [searchEmail, setSearchEmail] = useState<string>('');
    const [searchName, setSearchName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const getUserList = async(page:number) => {
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
            
        } catch (error:any) {
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
        {"code":"", "name": "All"},
        {"code":"operator", "name": "관리자"},
        {"code":"developer", "name": "개발자"},
        {"code":"distributor", "name": "총판"},
        {"code":"agency", "name": "대행사"},
        {"code":"advertiser", "name": "광고주"},
    ];

    const status_array = [
        {"code":"", "name": "전체"},
        {"code":"active", "name": "활성"},
        {"code":"inactive", "name": "비활성"},
        {"code":"pending", "name": "대기중"},
    ];

    return (
    <div>
        <div className="card p-6 mb-5 shadow-sm bg-white">
            <div className="card-header pb-5">
                <h3 className="card-title text-lg font-semibold">회원 검색</h3>
            </div>
            
            <div className="card-body p-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {/* 권한(role) - select box */}
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text text-sm font-medium text-gray-700">권한</span>
                        </label>
                        <select className="select select-bordered w-full focus:ring-2 focus:ring-primary" 
                                value={searchRole}
                                onChange={(e)=>setSearchRole(e.target.value)}>
                            {roles_array.map((option) => (
                                <option key={option.code} value={option.code}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 상태(status) - select box */}
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text text-sm font-medium text-gray-700">상태</span>
                        </label>
                        <select className="select select-bordered w-full focus:ring-2 focus:ring-primary"
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
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text text-sm font-medium text-gray-700">이메일</span>
                        </label>
                        <input 
                            type="text" 
                            placeholder="이메일을 입력하세요" 
                            className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)} 
                        />
                    </div>

                    {/* 이름(full_name) - input */}
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text text-sm font-medium text-gray-700">이름</span>
                        </label>
                        <input 
                            type="text" 
                            placeholder="이름을 입력하세요" 
                            className="input input-bordered w-full focus:ring-2 focus:ring-primary"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            
            <div className="card-footer pt-5 flex justify-end">
                <button className="btn btn-primary px-6" onClick={() => getUserList(1)}>
                    검색
                </button>
            </div>
        </div>

        <div className="card mb-5 shadow-sm bg-white">
            <div className="card-header p-6 pb-5 flex justify-between items-center">
                <h3 className="card-title text-lg font-semibold">회원 리스트</h3>
                <div className="flex gap-2">
                    <button className="btn btn-light btn-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        내보내기
                    </button>
                    <button className="btn btn-primary btn-sm"
                        onClick={() => {}}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        회원 추가
                    </button>
                </div>
            </div>
            
            <div className="card-body p-0">
                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {users.length > 0 ? (
                            <table className="table align-middle text-gray-700 text-sm w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="py-4 px-5 text-start">
                                            <div className="flex items-center">
                                                <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" />
                                            </div>
                                        </th>
                                        <th className="py-4 px-5 text-start min-w-[120px]">
                                            <div className="flex items-center">
                                                <span className="font-medium text-gray-700">이메일</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-gray-500">
                                                    <path d="m7 15 5 5 5-5"></path>
                                                    <path d="m7 9 5-5 5 5"></path>
                                                </svg>
                                            </div>
                                        </th>
                                        <th className="py-4 px-5 text-start min-w-[120px]">
                                            <div className="flex items-center">
                                                <span className="font-medium text-gray-700">이름</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 text-gray-500">
                                                    <path d="m7 15 5 5 5-5"></path>
                                                    <path d="m7 9 5-5 5 5"></path>
                                                </svg>
                                            </div>
                                        </th>
                                        <th className="py-4 px-5 text-start min-w-[150px]">
                                            <div className="flex items-center">
                                                <span className="font-medium text-gray-700">권한</span>
                                            </div>
                                        </th>
                                        <th className="py-4 px-5 text-start min-w-[150px]">
                                            <div className="flex items-center">
                                                <span className="font-medium text-gray-700">서비스 이용현황</span>
                                            </div>
                                        </th>
                                        <th className="py-4 px-5 text-start min-w-[120px]">
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
                                            <MakeUserRow key={index} user={user} />
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
                )}
            </div>
            
            <div className="card-footer p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 order-2 md:order-1 min-w-[200px]">
                    <span className="text-sm text-gray-600 whitespace-nowrap">페이지당 표시:</span>
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
                    <span className="text-sm text-gray-600 whitespace-nowrap">{getDisplayRange()}</span>
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

        <AdminUserInsertModal
          open = {userModalOpen}

          onClose={closeUserModalOpen}
          />
    </div>
    );
};

export { UsersPage };
