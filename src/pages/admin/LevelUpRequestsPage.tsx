import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { CommonTemplate } from '@/components/pageTemplate';
import { KeenIcon } from '@/components';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { LevelupApply } from '@/types/business';
import { supabase } from '@/supabase';
import { RejectReasonModal, StatusModal } from './components';
import { createRoleChangeNotification } from '@/utils/notificationActions';
import { useDialog } from '@/providers';

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
          {imageUrl && (imageUrl.toLowerCase().endsWith('.pdf') || imageUrl.includes('application/pdf')) ? (
            <iframe
              src={imageUrl}
              className="w-full h-[70vh]"
              title="사업자등록증 PDF"
            />
          ) : (
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
          )}
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
  const { showDialog } = useDialog();
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

  // 계좌정보 툴팁 상태
  const [openBankTooltipId, setOpenBankTooltipId] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // 각 요청에 대한 선택된 역할을 저장하는 상태
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  // 역할별 배지 색상 반환 함수
  const getRoleBadgeClass = (role: string): string => {
    switch (role) {
      case 'beginner': return 'badge-secondary';
      case 'advertiser': return 'badge-success';
      case 'distributor': return 'badge-primary';
      case 'agency': return 'badge-info';
      case 'operator': return 'badge-warning';
      case 'developer': return 'badge-error';
      default: return 'badge-secondary';
    }
  };

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

      const requestData = data as RequestWithUser[] || [];
      setRequests(requestData);

      // 초기 역할 설정 (target_role을 기본값으로)
      const initialRoles: Record<string, string> = {};
      requestData.forEach(request => {
        initialRoles[request.id] = request.target_role || 'distributor';
      });
      setSelectedRoles(initialRoles);
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

  // 승인 확인 후 처리
  const confirmAndApprove = (request: RequestWithUser) => {
    const selectedRole = selectedRoles[request.id] || request.target_role || 'distributor';
    const requestedRole = request.target_role || 'distributor';
    const isDifferentRole = selectedRole !== requestedRole;

    const roleDisplayNames: Record<string, string> = {
      'beginner': '일반 회원',
      'advertiser': '광고주',
      'distributor': '총판',
      'agency': '대행사',
      'operator': '운영자',
      'developer': '개발자'
    };

    const selectedRoleName = roleDisplayNames[selectedRole] || selectedRole;
    const requestedRoleName = roleDisplayNames[requestedRole] || requestedRole;

    const confirmMessage = (
      <>
        <span>{request.users?.full_name || '사용자'}님의 등업 신청을 승인하시겠습니까?</span>
        <br />
        <br />
        {isDifferentRole ? (
          <span className="text-warning font-medium">
            ⚠️ 주의: 신청한 역할({requestedRoleName})과 다른 역할({selectedRoleName})로 승인됩니다.
          </span>
        ) : (
          <span className="text-muted-foreground">
            승인 역할: {selectedRoleName}
          </span>
        )}
      </>
    );

    showDialog({
      title: '등업 승인 확인',
      message: confirmMessage as any,
      variant: isDifferentRole ? 'warning' : 'default',
      confirmText: '승인',
      cancelText: '취소',
      onConfirm: () => handleApprove(request)
    });
  };

  // 등업 신청 승인/거부 처리
  const handleApprove = async (request: RequestWithUser) => {
    try {
      setLoading(true);

      // 선택된 역할 가져오기
      const selectedRole = selectedRoles[request.id] || request.target_role || 'distributor';

      // 1. 사용자 정보 업데이트 - business 필드 verified 속성과 role을 선택된 역할로 변경
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          business: {
            ...(request.users?.business || {}),
            verified: true,
            verification_date: new Date().toISOString()
          },
          role: selectedRole // 선택된 역할로 업데이트
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
          request.current_role || request.users?.role || 'beginner', // 현재 역할 (levelup_apply 테이블의 current_role 사용)
          selectedRole, // 선택된 역할로 알림
          {
            'beginner': '비기너',
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
      const roleDisplayNames: Record<string, string> = {
        'beginner': '비기너',
        'advertiser': '광고주',
        'distributor': '총판',
        'agency': '대행사',
        'operator': '운영자',
        'developer': '개발자'
      };
      const roleDisplayName = roleDisplayNames[selectedRole] || selectedRole;
      showStatusModal(
        "승인 완료",
        `${request.users?.full_name || '사용자'}님의 등업 신청이 승인되었습니다.\n사용자 등급이 ${roleDisplayName}(${selectedRole})으로 변경되었습니다.`,
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
      description="전체 사용자의 등업 신청을 관리합니다."
      showPageMenu={false}
    >
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-5 flex flex-row justify-between items-center border-b">
          <h3 className="text-lg font-semibold">등업 신청 목록</h3>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => fetchRequests()}
            disabled={loading}
          >
            <KeenIcon icon="arrows-circle" className="me-1" />
            새로고침
          </button>
        </CardHeader>

        <CardContent className="p-0">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="alert alert-error m-6">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && requests.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <KeenIcon icon="document" className="mx-auto mb-3 opacity-50 size-12" />
              <p>등업 신청 내역이 없습니다.</p>
            </div>
          )}

          {!loading && !error && requests.length > 0 && (
            <>
              {/* 데스크톱용 테이블 (md 이상 화면에서만 표시) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-muted dark:bg-gray-800/60">
                      <th className="py-3 px-3 text-start font-medium min-w-[200px]">신청자 정보</th>
                      <th className="py-3 px-3 text-start font-medium min-w-[250px]">사업자 정보</th>
                      <th className="py-3 px-3 text-center font-medium">신청 역할</th>
                      <th className="py-3 px-3 text-center font-medium">승인 역할</th>
                      <th className="py-3 px-3 text-center font-medium">사업자등록증</th>
                      <th className="py-3 px-3 text-center font-medium">계좌정보</th>
                      <th className="py-3 px-3 text-center font-medium">신청일시</th>
                      <th className="py-3 px-3 text-center font-medium min-w-[140px]">승인/반려</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id} className="border-b border-border hover:bg-muted/40">
                        <td className="py-3 px-3">
                          <div className="flex items-center">
                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-2">
                              {request.users?.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="text-gray-900 dark:text-white font-medium">{request.users?.full_name || '사용자 정보 없음'}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{request.users?.email || '이메일 정보 없음'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 dark:text-white">{request.users?.business?.business_name || '-'}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <span>사업자번호: {request.users?.business?.business_number || '-'}</span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <span>대표자: {request.users?.business?.representative_name || '-'}</span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <span>전화번호: {request.users?.business?.business_phone || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${request.target_role === 'distributor'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                            : request.target_role === 'agency'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800/70 dark:text-gray-300'
                            }`}>
                            {request.target_role === 'distributor' ? '총판' :
                              request.target_role === 'agency' ? '대행사' :
                                request.target_role === 'advertiser' ? '광고주' :
                                  request.target_role === 'operator' ? '운영자' :
                                    request.target_role === 'developer' ? '개발자' :
                                      request.target_role === 'beginner' ? '일반 회원' : '미지정'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div>
                            <select
                              className="select select-sm w-full max-w-[130px] border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                              value={selectedRoles[request.id] || request.target_role || 'distributor'}
                              onChange={(e) => {
                                setSelectedRoles(prev => ({
                                  ...prev,
                                  [request.id]: e.target.value
                                }));
                              }}
                              style={{
                                backgroundColor: selectedRoles[request.id] !== request.target_role ? '#fff3cd' : 'white'
                              }}
                            >
                              <option value="distributor">총판</option>
                              <option value="agency">대행사</option>
                            </select>
                            {selectedRoles[request.id] !== request.target_role && (
                              <p className="text-xs text-warning mt-1">
                                ⚠️ 신청과 다른 역할
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {request.users?.business?.business_image_url ? (
                            <button
                              className="btn btn-icon btn-xs btn-primary"
                              onClick={() => openImageModal(request.users?.business?.business_image_url || '')}
                              title="사업자등록증 보기"
                            >
                              <KeenIcon icon="picture" className="text-sm" />
                            </button>
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {request.users?.business?.bank_account ? (
                            <>
                              <button
                                className="btn btn-icon btn-xs btn-info"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setTooltipPosition({
                                    top: rect.top - 10,
                                    left: rect.left + rect.width / 2
                                  });
                                  setOpenBankTooltipId(openBankTooltipId === request.id ? null : request.id);
                                }}
                              >
                                <KeenIcon icon="dollar" className="text-sm" />
                              </button>

                              {/* 계좌정보 툴팁 */}
                              {openBankTooltipId === request.id && ReactDOM.createPortal(
                                <>
                                  {/* 배경 클릭 시 닫기 */}
                                  <div
                                    className="fixed inset-0"
                                    style={{ zIndex: 9998 }}
                                    onClick={() => setOpenBankTooltipId(null)}
                                  />
                                  <div
                                    className="fixed bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 shadow-xl border border-gray-700 dark:border-gray-600"
                                    style={{
                                      zIndex: 99999,
                                      left: `${tooltipPosition.left}px`,
                                      top: `${tooltipPosition.top}px`,
                                      transform: 'translate(-50%, -100%)'
                                    }}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-medium text-gray-100">계좌정보</div>
                                      <button
                                        className="text-gray-400 hover:text-gray-200 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenBankTooltipId(null);
                                        }}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex">
                                        <span className="text-gray-400 mr-2">은행명:</span>
                                        <span className="font-medium">{request.users?.business?.bank_account.bank_name || '-'}</span>
                                      </div>
                                      <div className="flex">
                                        <span className="text-gray-400 mr-2">계좌번호:</span>
                                        <span className="font-medium">{request.users?.business?.bank_account.account_number || '-'}</span>
                                      </div>
                                      <div className="flex">
                                        <span className="text-gray-400 mr-2">예금주:</span>
                                        <span className="font-medium">{request.users?.business?.bank_account.account_holder || '-'}</span>
                                      </div>
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-full">
                                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 dark:border-t-gray-800"></div>
                                    </div>
                                  </div>
                                </>,
                                document.body
                              )}
                            </>
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-gray-700 dark:text-gray-300 text-xs">
                            {new Date(request.created_at).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              className="btn btn-xs btn-success relative flex items-center justify-center"
                              onClick={() => confirmAndApprove(request)}
                              disabled={loading}
                              title={`${selectedRoles[request.id] === request.target_role ? '신청한 역할로 승인' : '다른 역할로 승인'}`}
                            >
                              <KeenIcon icon="check" className="text-sm me-1" />
                              승인
                              {selectedRoles[request.id] !== request.target_role && (
                                <span className="absolute -top-1 -right-1 bg-warning text-white rounded-full w-3 h-3 text-[10px] flex items-center justify-center">!</span>
                              )}
                            </button>
                            <button
                              className="btn btn-xs btn-danger flex items-center justify-center"
                              onClick={() => openRejectModal(request)}
                              disabled={loading}
                              title="반려"
                            >
                              <KeenIcon icon="cross" className="text-sm me-1" />
                              반려
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 모바일용 카드 리스트 (md 미만 화면에서만 표시) */}
              <div className="block md:hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {requests.map((request, index) => (
                    <div key={request.id} className="p-4 hover:bg-muted/40">
                      {/* 신청자 정보 및 상태 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {request.users?.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">
                              {request.users?.full_name || '사용자 정보 없음'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {request.users?.email || '이메일 정보 없음'}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${request.target_role === 'distributor'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                          : request.target_role === 'agency'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800/70 dark:text-gray-300'
                          }`}>
                          {request.target_role === 'distributor' ? '총판' :
                            request.target_role === 'agency' ? '대행사' :
                              request.target_role === 'advertiser' ? '광고주' :
                                request.target_role === 'operator' ? '운영자' :
                                  request.target_role === 'developer' ? '개발자' :
                                    request.target_role === 'beginner' ? '일반 회원' : '미지정'}
                        </span>
                      </div>

                      {/* 사업자 정보 */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">상호명</span>
                          <span className="text-sm font-medium">{request.users?.business?.business_name || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">사업자번호</span>
                          <span className="text-sm font-medium">{request.users?.business?.business_number || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">대표자</span>
                          <span className="text-sm font-medium">{request.users?.business?.representative_name || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">전화번호</span>
                          <span className="text-sm font-medium">{request.users?.business?.business_phone || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">신청일시</span>
                          <span className="text-sm font-medium">
                            {new Date(request.created_at).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* 사업자등록증 이미지 */}
                      {request.users?.business?.business_image_url && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-1">사업자등록증</p>
                          <div
                            className="inline-block cursor-pointer relative"
                            onClick={() => openImageModal(request.users?.business?.business_image_url || '')}
                          >
                            <img
                              src={request.users?.business?.business_image_url || ''}
                              alt="사업자등록증"
                              className="object-cover w-20 h-20 border rounded hover:opacity-80 transition-opacity"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFQkVCRUIiLz48dGV4dCB4PSI0MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjY2NjYiPuyVhOuvuOyekOujjOymnSDsnbTrr7jsp4A8L3RleHQ+PC9zdmc+";
                              }}
                            />
                            <div className="absolute top-0 right-0 bg-primary/80 text-white rounded-full w-4 h-4 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 승인 역할 선택 및 액션 버튼 */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">승인 역할</label>
                          <select
                            className="select select-sm w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                            value={selectedRoles[request.id] || request.target_role || 'distributor'}
                            onChange={(e) => {
                              setSelectedRoles(prev => ({
                                ...prev,
                                [request.id]: e.target.value
                              }));
                            }}
                            style={{
                              backgroundColor: selectedRoles[request.id] !== request.target_role ? '#fff3cd' : 'white'
                            }}
                          >
                            <option value="distributor">총판</option>
                            <option value="agency">대행사</option>
                          </select>
                          {selectedRoles[request.id] !== request.target_role && (
                            <p className="text-xs text-warning mt-1">
                              ⚠️ 신청한 역할과 다른 역할로 승인됩니다
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            className="btn btn-sm btn-success flex-1 relative flex items-center justify-center"
                            onClick={() => confirmAndApprove(request)}
                            disabled={loading}
                          >
                            <KeenIcon icon="check" className="text-sm me-1" />
                            승인하기
                            {selectedRoles[request.id] !== request.target_role && (
                              <span className="absolute -top-1 -right-1 bg-warning text-white rounded-full w-3 h-3 text-[10px] flex items-center justify-center">!</span>
                            )}
                          </button>
                          <button
                            className="btn btn-sm btn-danger flex-1 flex items-center justify-center"
                            onClick={() => openRejectModal(request)}
                            disabled={loading}
                          >
                            <KeenIcon icon="cross" className="text-sm me-1" />
                            반려하기
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 설명 영역 */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30 mt-4">
        <CardContent className="p-5">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">등업 신청 관리 안내</h3>
          <div className="space-y-2 text-blue-700 dark:text-blue-200 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p>• <span className="font-medium text-blue-900 dark:text-blue-100">승인 역할 변경</span>: 신청한 역할과 다른 역할로 승인 가능</p>
              <p>• <span className="font-medium text-blue-900 dark:text-blue-100">등업 심사</span>: 사업자 정보를 검토 후 승인/거부 결정</p>
              <p>• <span className="font-medium text-blue-900 dark:text-blue-100">역할 종류</span>: 일반 회원, 광고주, 총판, 대행사, 운영자, 개발자</p>
              <p>• <span className="font-medium text-blue-900 dark:text-blue-100">사업자 검증</span>: 사업자등록증 이미지 클릭으로 확대 가능</p>
            </div>
          </div>
        </CardContent>
      </Card>

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