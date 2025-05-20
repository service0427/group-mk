import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { CommonTemplate } from '@/components/pageTemplate';
import { KeenIcon } from '@/components';
import { LevelupApply } from '@/types/business';
import { supabase } from '@/supabase';
import { RejectReasonModal, StatusModal } from './components';
import { createRoleChangeNotification } from '@/utils/notificationExamples';

type RequestWithUser = LevelupApply & {
  users: {
    id: string;
    email: string;
    full_name: string;
    business: any;
    role?: string;
  }
};

// 이미지 모달 컴포넌트 분리
const ImageModal = ({ 
  isOpen, 
  imageUrl, 
  onClose 
}: { 
  isOpen: boolean; 
  imageUrl: string; 
  onClose: () => void;
}) => {
  // 모달이 닫혀 있으면 렌더링하지 않음
  if (!isOpen) return null;

  // document.body에 포털로 렌더링
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80"
      onClick={onClose} // 배경 클릭 시 모달 닫기
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        zIndex: 9999,
        width: '100vw',
        height: '100vh'
      }}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] overflow-auto bg-white rounded-lg p-1 m-4"
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 이벤트 전파 방지
        style={{
          position: 'relative',
          zIndex: 10000
        }}
      >
        {/* 우측 상단 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all"
          aria-label="닫기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* 상단 닫기 텍스트 배너 */}
        <div className="bg-gray-800/90 text-white py-2 px-4 text-center mb-2">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-full"
          >
            <span>사업자등록증 이미지 (클릭하여 닫기)</span>
            <div className="ml-2 inline-flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </button>
        </div>

        <div className="flex justify-center">
          <img
            src={imageUrl}
            alt="사업자등록증"
            className="max-h-[70vh] object-contain"
            style={{
              maxWidth: '100%'
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiNFQkVCRUIiLz48dGV4dCB4PSIxNTAiIHk9IjI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNjY2NjY2Ij7snbTrr7jsp4Drk6TsnZgg67Cc7IOd7J2EIOyeheugpe2VqeyzkuycvOuhnDwvdGV4dD48L3N2Zz4=";
            }}
          />
        </div>

        <div className="flex justify-center items-center gap-4 mt-4 pb-2">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>새 탭에서 열기</span>
          </a>

          <button
            onClick={onClose}
            className="btn btn-danger flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>닫기</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
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
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  
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
            ...(request.users?.business || {}),
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
        
        // 사용자에게 역할 변경 알림 전송
        await createRoleChangeNotification(
          request.user_id,
          request.users?.role || 'beginner', // 이전 역할(일반적으로 beginner에서 업그레이드)
          'distributor', // 새 역할 (distributor로 고정)
          {
            'beginner': '일반 회원',
            'advertiser': '광고주',
            'distributor': '총판',
            'agency': '대행사',
            'operator': '운영자',
            'developer': '개발자'
          }
        );
      } catch (error) {
        console.error('알림 전송 실패:', error);
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
        `${request.users?.full_name || '사용자'}님의 등업 신청이 승인되었습니다.\n사용자 등급이 총판(distributor)으로 변경되었습니다.`, 
        "success"
      );
      
      // 목록 다시 불러오기
      fetchRequests();
      
    } catch (err: any) {
      
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
  
  // 이미지 확대 모달 열기
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
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
        `${selectedRequest.users?.full_name || '사용자'}님의 등업 신청이 거부되었습니다.`,
        "info"
      );
      
      // 목록 다시 불러오기
      fetchRequests();
      
    } catch (err: any) {
      
      showStatusModal(
        "거부 실패", 
        `처리 중 오류가 발생했습니다: ${err.message}`, 
        "error"
      );
    } finally {
      setLoading(false);
    }
  };
  
  // 초기 데이터 로드
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
                    <th className="py-4 px-5 text-start font-medium text-gray-700">사업자 이메일</th>
                    <th className="py-4 px-5 text-start font-medium text-gray-700">은행 정보</th>
                    <th className="py-4 px-5 text-start font-medium text-gray-700">사업자등록증</th>
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
                            {request.users?.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="text-gray-800 font-medium">{request.users?.full_name || '사용자 정보 없음'}</div>
                            <div className="text-xs text-gray-500">{request.users?.email || '이메일 정보 없음'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-gray-800">{request.users?.business?.business_number || '-'}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-gray-800">{request.users?.business?.business_name || '-'}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-gray-800">{request.users?.business?.representative_name || '-'}</span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-gray-800">{request.users?.business?.business_email || '-'}</span>
                      </td>
                      <td className="py-4 px-5">
                        {request.users?.business?.bank_account ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-800">{request.users?.business?.bank_account.bank_name || '-'}</div>
                            <div className="text-gray-600">{request.users?.business?.bank_account.account_number || '-'}</div>
                            <div className="text-gray-600 text-xs">예금주: {request.users?.business?.bank_account.account_holder || '-'}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs italic">정보 없음</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {request.users?.business?.business_image_url ? (
                          <div className="relative">
                            <div 
                              className="cursor-pointer"
                              onClick={() => openImageModal(request.users?.business?.business_image_url || '')}
                            >
                              <img 
                                src={request.users?.business?.business_image_url || ''} 
                                alt="사업자등록증" 
                                className="object-cover w-16 h-16 border rounded hover:opacity-80 transition-opacity"
                                onError={(e) => {
                                  
                                  (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFQkVCRUIiLz48dGV4dCB4PSI0MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjY2NjYiPuyVhOuvuOyekOujjOymnSDsnbTrr7jsp4A8L3RleHQ+PC9zdmc+";
                                }}
                              />
                              <div className="absolute top-0 right-0 bg-primary/80 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs italic">이미지 없음</span>
                        )}
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
      
      {/* 이미지 모달은 분리된 컴포넌트로 사용 */}
      <ImageModal 
        isOpen={imageModalOpen}
        imageUrl={selectedImage}
        onClose={() => setImageModalOpen(false)}
      />
      
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