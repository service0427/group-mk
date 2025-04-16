import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { set } from 'date-fns';
import React, { useEffect, useState } from 'react';

const MakeUserRow = (user:any) => {
    return(
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
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-2">홍</div>
                    <span className="text-gray-800">{user.user.full_name}</span>
                </div>
            </td>
            <td className="py-4 px-5">
                <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-success/10 text-success">활성</span>
            </td>
            <td className="py-4 px-5">
                <span className="text-gray-800 font-medium">₩{user.user.cash}{ user?.bonus_cash > 0 ? `(+${user?.user?.bonus_cash})` : '' }</span>
            </td>
            <td className="py-4 px-5 text-end">
                <div className="flex justify-end gap-2">
                    <button className="btn btn-icon btn-sm btn-light">
                        <KeenIcon icon="setting-2" className='text-gray-900'/>
                    </button>
                    <button className="btn btn-icon btn-sm btn-light">
                        <KeenIcon icon="trash"/>
                    </button>
                </div>
            </td>
        </tr>
    )
}

// search bar
const ManageUsersContent = () => {

    const [users, setUsers] = useState<any[]>([]);

    const getUserList = async() => {
        try {
            const response = await supabase.from('users').select('*');
            if (response.error) {
                throw new Error(response.error.message);
                return;
            }
            const users = response.data;
            setUsers(users);
            
        } catch (error:any) {
            throw new Error(error.message);
        }
    }

    useEffect(() => {
        getUserList();
    }, []);   

    const roles_array = [
        {"code":"all", "name": "All"},
        {"code":"operator", "name": "관리자"},
        {"code":"developer", "name": "개발자"},
        {"code":"distributor", "name": "총판"},
        {"code":"agency", "name": "대행사"},
        {"code":"advertiser", "name": "광고주"},
    ];

    const status_array = [
        {"code":"all", "name": "전체"},
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* 권한(role) - select box */}
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text text-sm font-medium text-gray-700">권한</span>
                        </label>
                        {/* 
                        select : select box 스타일,
                        select-bordered : select box 테두리 스타일
                        w-full : 가로 100% 설정
                        focus:ring-2 : 포커스 되었을때 ring 효과
                        focus:ring-primary : 포커스 되었을때 primary 색상으로 ring 효과
                         */}
                        <select className="select select-bordered w-full focus:ring-2 focus:ring-primary">
                            {roles_array.map((option) => (
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
                        />
                    </div>

                    {/* 상태(status) - select box */}
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text text-sm font-medium text-gray-700">상태</span>
                        </label>
                        <select className="select select-bordered w-full focus:ring-2 focus:ring-primary">
                            {status_array.map((option) => (
                                <option key={option.code} value={option.code}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            
            <div className="card-footer pt-5 flex justify-end">
                <button className="btn btn-primary px-6">
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
                    <button className="btn btn-primary btn-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        회원 추가
                    </button>
                </div>
            </div>
            
            <div className="card-body p-0">
                <div className="overflow-x-auto">
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

                            <tr className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-4 px-5">
                                    <div className="flex items-center">
                                        <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" />
                                    </div>
                                </td>
                                <td className="py-4 px-5">
                                    <span className="text-gray-800 font-medium">user1</span>
                                </td>
                                <td className="py-4 px-5">
                                    <div className="flex items-center">
                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-2">홍</div>
                                        <span className="text-gray-800">홍길동</span>
                                    </div>
                                </td>
                                <td className="py-4 px-5">
                                    <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-success/10 text-success">활성</span>
                                </td>
                                <td className="py-4 px-5">
                                    <span className="text-gray-800 font-medium">₩1,000</span>
                                </td>
                                <td className="py-4 px-5 text-end">
                                    <div className="flex justify-end gap-2">
                                        <button className="btn btn-icon btn-sm btn-light">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button className="btn btn-icon btn-sm btn-light">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-4 px-5">
                                    <div className="flex items-center">
                                        <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" />
                                    </div>
                                </td>
                                <td className="py-4 px-5">
                                    <span className="text-gray-800 font-medium">user2</span>
                                </td>
                                <td className="py-4 px-5">
                                    <div className="flex items-center">
                                        <div className="size-8 rounded-full bg-warning/10 flex items-center justify-center text-warning font-semibold mr-2">김</div>
                                        <span className="text-gray-800">김철수</span>
                                    </div>
                                </td>
                                <td className="py-4 px-5">
                                    <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-danger/10 text-danger">비활성</span>
                                </td>
                                <td className="py-4 px-5">
                                    <span className="text-gray-800 font-medium">₩2,000</span>
                                </td>
                                <td className="py-4 px-5 text-end">
                                    <div className="flex justify-end gap-2">
                                        <button className="btn btn-icon btn-sm btn-light">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button className="btn btn-icon btn-sm btn-light">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="card-footer p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 order-2 md:order-1">
                    <span className="text-sm text-gray-600">페이지당 표시:</span>
                    <select className="select select-sm select-bordered" name="perpage">
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>
                
                <div className="flex items-center gap-2 order-1 md:order-2">
                    <span className="text-sm text-gray-600">1-2 / 2 항목</span>
                    <div className="flex">
                        <button disabled className="btn btn-icon btn-sm btn-light rounded-r-none border-r-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m15 18-6-6 6-6"></path>
                            </svg>
                        </button>
                        <button disabled className="btn btn-icon btn-sm btn-light rounded-l-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m9 18 6-6-6-6"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}

export default ManageUsersContent;