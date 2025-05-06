import React, { useEffect, useState } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { KeenIcon } from '@/components';
import { LevelupApply } from '@/types/business';
import { supabase } from '@/supabase';
import { RejectReasonModal, StatusModal } from './components';

type RequestWithUser = LevelupApply & {
  users: {
    id: string;
    email: string;
    full_name: string;
    business: any;
  }
};

const LevelUpRequestsPage = () => {
  const [requests, setRequests] = useState<RequestWithUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [statusModalProps, setStatusModalProps] = useState({
    title: '',
    message: '',
    status: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [selectedRequest, setSelectedRequest] = useState<RequestWithUser | null>(null);
  
  // 등업 신청 목록 조회
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('levelup_apply')
        .select(`
          *,
          users:user_id (
            id,
            email,
            full_name,
            business
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setRequests(data as RequestWithUser[] || []);
    } catch (err: any) {
      console.error('등업 신청 조회 에러:', err);
      setError('등업 신청 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 상태 모달 표시
  const showStatusModal = (title: string, message: string, status: 'success' | 'error' | 'info' | 'warning') => {
    setStatusModalProps({ title, message, status });
    setIsStatusModalOpen(true);
  };
  
  // 등업 신청 승인/거부 처리
  const handleApprove = async (request: RequestWithUser) => {
    try {
      setLoading(true);
      
      // 1. 사용자 정보 업데이트 - business 필드 verified 속성과 role을 distributor로 변경
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          business: {
            ...request.users.business,
            verified: true,
            verification_date: new Date().toISOString()
          },
          role: 'distributor' // 역할을 distributor로 변경
        })
        .eq('id', request.user_id);
        
      if (userUpdateError) throw userUpdateError;
      
      // 2. Auth 사용자 메타데이터도 함께 업데이트 (기본 API 사용)
      try {
        // 현재 로그인된 사용자는 운영자이므로 다른 사용자의 메타데이터를 직접 업데이트할 수 없음
        // 대신, 해당 사용자가 다음에 로그인할 때 users 테이블의 역할이 적용되도록 함
        console.log('사용자 역할이 users 테이블에서 distributor로 업데이트되었습니다.');
        console.log('auth.users 메타데이터는 사용자의 다음 로그인 시 업데이트될 것입니다.');
      } catch (error) {
        console.error('사용자 역할 업데이트 알림 오류:', error);
      }
      
      // 2. 등업 신청 상태 업데이트
      const { error: requestUpdateError } = await supabase
        .from('levelup_apply')
        .update({
          status: 'approved',
          approval_id: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);
        
      if (requestUpdateError) throw requestUpdateError;
      
      // 성공 모달 표시
      showStatusModal(
        "승인 완료", 
        `${request.users.full_name}님의 등업 신청이 승인되었습니다.\n사용자 등급이 총판(distributor)으로 변경되었습니다.`, 
        "success"
      );
      
      // 목록 다시 불러오기
      fetchRequests();
      
    } catch (err: any) {
      console.error('등업 신청 승인 에러:', err);
      showStatusModal(
        "승인 실패", 
        `처리 중 오류가 발생했습니다: ${err.message}`, 
        "error"
      );
    } finally {
      setLoading(false);
    }
  };
  
  // 거부 모달 열기
  const openRejectModal = (request: RequestWithUser) => {
    setSelectedRequest(request);
    setIsRejectModalOpen(true);
  };
  
  // 거부 처리 완료
  const handleRejectComplete = async (reason: string) => {
    if (!selectedRequest) return;
    
    try {
      setLoading(true);
      
      // 등업 신청 상태 업데이트
      const { error: requestUpdateError } = await supabase
        .from('levelup_apply')
        .update({
          status: 'rejected',
          approval_id: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString(),
          rejection_reason: reason // 거부 사유 저장
        })
        .eq('id', selectedRequest.id);
        
      if (requestUpdateError) throw requestUpdateError;
      
      // 성공 모달 표시
      showStatusModal(
        "거부 완료", 
        `${selectedRequest.users.full_name}님의 등업 신청이 거부되었습니다.`,
        "info"
      );
      
      // 목록 다시 불러오기
      fetchRequests();
      
    } catch (err: any) {
      console.error('등업 신청 거부 에러:', err);
      showStatusModal(
        "거부 실패", 
        `처리 중 오류가 발생했습니다: ${err.message}`, 
        "error"
      );
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRequests();
  }, []);
  
  return (
    <CommonTemplate 
      title="등업 신청 관리"
      description="사용자 등업 신청 관리"
      showPageMenu={false}
    >
      <div className="card shadow-sm bg-white">
        <div className="card-header p-6 pb-5 flex justify-between items-center">
          <h3 className="card-title text-lg font-semibold">등업 신청 목록</h3>
          <button 
            className="btn btn-sm btn-light" 
            onClick={() => fetchRequests()}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M8 16H3v5"></path>
            </svg>
            새로고침
          </button>
        </div>
        
        <div className="card-body p-0">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="spinner-border text-primary"></div>
            </div>
          )}
          
          {error && (
            <div className="alert alert-error m-6">
              <p>{error}</p>
            </div>
          )}
          
          {!loading && !error && requests.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
              <p>등업 신청 내역이 없습니다.</p>
            </div>
          )}
          
          {!loading && !error && requests.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table align-middle text-gray-700 text-sm w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-4 px-5 text-start font-medium text-gray-700">신청자</th>
                    <th className="py-4 px-5 text-start font-medium text-gray-700">사업자 등록번호</th>
                    <th className="py-4 px-5 text-start font-medium text-gray-700">상호명</th>
                    <th className="py-4 px-5 text-start font-medium text-gray-700">대표자명</th>
                    <th className="py-4 px-5 text-start font-medium text-gray-700">신청일시</th>
                    <th className="py-4 px-5 text-end font-medium text-gray-700">처리</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-5">
                        <div className="flex items-center">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-2">
                            {request.users.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="text-gray-800 font-medium">{request.users.full_name}</div>
                            <div className="text-xs text-gray-500">{request.users.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-gray-800">{request.users.business?.business_number || '-'}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-gray-800">{request.users.business?.business_name || '-'}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-gray-800">{request.users.business?.representative_name || '-'}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-gray-800">
                          {new Date(request.created_at).toLocaleString('ko-KR')}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-end">
                        <div className="flex justify-end gap-2">
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => handleApprove(request)}
                            disabled={loading}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            승인
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => openRejectModal(request)}
                            disabled={loading}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            거부
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* 거부 사유 입력 모달 */}
      <RejectReasonModal
        open={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onReject={handleRejectComplete}
      />
      
      {/* 상태 알림 모달 */}
      <StatusModal
        open={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={statusModalProps.title}
        message={statusModalProps.message}
        status={statusModalProps.status}
      />
    </CommonTemplate>
  );
};

export default LevelUpRequestsPage;