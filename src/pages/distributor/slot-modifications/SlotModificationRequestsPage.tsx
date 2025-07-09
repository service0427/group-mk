import React, { useState, useEffect } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { useCustomToast } from '@/hooks/useCustomToast';
import {
  getModificationRequests,
  approveModificationRequest,
  rejectModificationRequest,
  SlotModificationRequestWithDetails
} from '@/services/slotModificationService';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTimeKorean } from '@/utils/Date';
import { SERVICE_TYPE_TO_CATEGORY } from '@/pages/advertise/campaigns/components/campaign-components/constants';

const SlotModificationRequestsPage: React.FC = () => {
  const { currentUser } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();
  
  const [requests, setRequests] = useState<SlotModificationRequestWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] = useState<SlotModificationRequestWithDetails | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchRequests();
  }, [currentUser, statusFilter, currentPage]);

  const fetchRequests = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const result = await getModificationRequests(
        {
          status: statusFilter,
          mat_id: currentUser.id
        },
        {
          page: currentPage,
          limit: itemsPerPage
        }
      );

      if (result.success) {
        setRequests(result.data || []);
        setTotalCount(result.count || 0);
      }
    } catch (error) {
      console.error('수정 요청 목록 조회 실패:', error);
      showError('수정 요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const result = await approveModificationRequest(
        selectedRequest.id!,
        actionNotes || undefined
      );

      if (result.success) {
        showSuccess('수정 요청이 승인되었습니다.');
        setSelectedRequest(null);
        setActionType(null);
        setActionNotes('');
        fetchRequests();
      } else {
        throw new Error(result.error?.message || '승인 처리 실패');
      }
    } catch (error: any) {
      console.error('수정 요청 승인 실패:', error);
      showError(error.message || '수정 요청 승인 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !actionNotes.trim() || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const result = await rejectModificationRequest(
        selectedRequest.id!,
        actionNotes
      );

      if (result.success) {
        showSuccess('수정 요청이 반려되었습니다.');
        setSelectedRequest(null);
        setActionType(null);
        setActionNotes('');
        fetchRequests();
      } else {
        throw new Error(result.error?.message || '반려 처리 실패');
      }
    } catch (error: any) {
      console.error('수정 요청 반려 실패:', error);
      showError(error.message || '수정 요청 반려 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'keyword':
        return '키워드';
      case 'mid':
        return 'MID';
      case 'url':
        return 'URL';
      case 'both':
        return '키워드 및 MID';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="badge-warning">대기중</Badge>;
      case 'approved':
        return <Badge className="badge-success">승인됨</Badge>;
      case 'rejected':
        return <Badge className="badge-danger">반려됨</Badge>;
      case 'cancelled':
        return <Badge className="badge-secondary">취소됨</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFieldValue = (data: any, field: string) => {
    if (!data) return '-';
    
    if (field === 'keywords' && Array.isArray(data.keywords)) {
      return data.keywords.join(', ');
    }
    
    return data[field] || '-';
  };

  // 이메일 마스킹 함수
  const maskEmail = (email: string | undefined) => {
    if (!email) return '-';
    const [localPart] = email.split('@');
    if (!localPart || localPart.length <= 3) {
      return '***';
    }
    return localPart.substring(0, 3) + '***';
  };

  // 서비스 타입을 한글 이름으로 변환
  const getServiceTypeName = (serviceType: string | undefined) => {
    if (!serviceType) return '-';
    return SERVICE_TYPE_TO_CATEGORY[serviceType] || serviceType;
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <CommonTemplate>
      <div className="grid gap-5 lg:gap-7.5">
        {/* Header Section - 카드로 감싸기 */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-semibold">슬롯 수정 요청 관리</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  광고주의 슬롯 수정 요청을 검토하고 승인/반려할 수 있습니다.
                </p>
              </div>
              
              {/* Status Filter */}
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'light'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter('pending');
                    setCurrentPage(1);
                  }}
                >
                  대기중
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'light'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter('approved');
                    setCurrentPage(1);
                  }}
                >
                  승인됨
                </Button>
                <Button
                  variant={statusFilter === 'rejected' ? 'default' : 'light'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter('rejected');
                    setCurrentPage(1);
                  }}
                >
                  반려됨
                </Button>
                <Button
                  variant={statusFilter === '' ? 'default' : 'light'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter('');
                    setCurrentPage(1);
                  }}
                >
                  전체
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Request List - 기존 Card 대신 card 클래스 사용 */}
        <div className="card">
          <div className="card-body p-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">데이터를 불러오는 중입니다...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <KeenIcon icon="shield-slash" className="text-5xl text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {statusFilter === 'pending' ? '대기 중인 수정 요청이 없습니다.' : '수정 요청이 없습니다.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="min-w-[120px]">요청일시</th>
                        <th className="min-w-[120px]">캠페인</th>
                        <th className="min-w-[100px]">요청자</th>
                        <th className="min-w-[100px]">수정 항목</th>
                        <th className="min-w-[200px]">변경 내용</th>
                        <th className="min-w-[250px]">수정 사유</th>
                        <th className="min-w-[80px]">상태</th>
                        <th className="min-w-[100px]">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request.id}>
                          <td>{formatDateTimeKorean(request.request_date || '')}</td>
                          <td>
                            <div className="text-sm">
                              <div className="font-medium">{request.slots?.campaigns?.campaign_name || '-'}</div>
                              <div className="text-gray-500">{getServiceTypeName(request.slots?.campaigns?.service_type)}</div>
                            </div>
                          </td>
                          <td>
                            <div className="text-sm">
                              <div>{request.requester?.full_name || '-'}</div>
                              <div className="text-gray-500 text-xs">{maskEmail(request.requester?.email)}</div>
                            </div>
                          </td>
                          <td>{getRequestTypeLabel(request.request_type)}</td>
                          <td>
                            <div className="text-sm space-y-1">
                              {Object.keys(request.new_data).map((field) => (
                                <div key={field}>
                                  <div className="text-gray-500">{field}:</div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-700 dark:text-gray-300 line-through">
                                      {getFieldValue(request.old_data, field)}
                                    </span>
                                    <KeenIcon icon="arrow-right" className="text-gray-400" />
                                    <span className="text-primary font-medium">
                                      {getFieldValue(request.new_data, field)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div className="text-sm text-gray-600 dark:text-gray-400" title={request.request_reason}>
                              {request.request_reason || '-'}
                            </div>
                          </td>
                          <td>{getStatusBadge(request.status)}</td>
                          <td>
                            {request.status === 'pending' && (
                              <div className="flex gap-1">
                                <button
                                  className="btn btn-xs btn-success"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setActionType('approve');
                                    setActionNotes('');
                                  }}
                                >
                                  승인
                                </button>
                                <button
                                  className="btn btn-xs btn-danger"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setActionType('reject');
                                    setActionNotes('');
                                  }}
                                >
                                  반려
                                </button>
                              </div>
                            )}
                            {request.status === 'approved' && (
                              <div className="text-xs text-gray-500">
                                <div>{request.approver?.full_name || '-'}</div>
                                {request.approval_notes && (
                                  <div className="truncate" title={request.approval_notes}>
                                    메모: {request.approval_notes}
                                  </div>
                                )}
                              </div>
                            )}
                            {request.status === 'rejected' && request.approval_notes && (
                              <div className="text-xs text-gray-500 max-w-[100px] truncate" title={request.approval_notes}>
                                {request.approval_notes}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
              <Button
                size="sm"
                variant="light"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                이전
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                  }
                  if (currentPage > totalPages - 3) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                return pageNum;
              }).map((pageNum) => (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={currentPage === pageNum ? 'default' : 'light'}
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={pageNum > totalPages}
                >
                  {pageNum}
                </Button>
              ))}
              
              <Button
                size="sm"
                variant="light"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                다음
              </Button>
            </div>
          )}
      </div>

      {/* Action Modal */}
      <Dialog 
        open={!!selectedRequest && !!actionType} 
        onOpenChange={() => {
          setSelectedRequest(null);
          setActionType(null);
          setActionNotes('');
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? '수정 요청 승인' : '수정 요청 반려'}
            </DialogTitle>
          </DialogHeader>
          
          <DialogBody>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  슬롯 정보
                </label>
                <div className="mt-1 text-sm">
                  <div>슬롯 번호: #{selectedRequest?.slots?.user_slot_number || '-'}</div>
                  <div>캠페인: {selectedRequest?.slots?.campaigns?.campaign_name || '-'}</div>
                  <div>요청자: {selectedRequest?.requester?.full_name || '-'}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  변경 내용
                </label>
                <div className="mt-1 text-sm space-y-1">
                  {selectedRequest && Object.keys(selectedRequest.new_data).map((field) => (
                    <div key={field}>
                      <span className="text-gray-500">{field}:</span>{' '}
                      <span className="line-through">{getFieldValue(selectedRequest.old_data, field)}</span>
                      {' → '}
                      <span className="text-primary font-medium">{getFieldValue(selectedRequest.new_data, field)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRequest?.request_reason && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    수정 사유
                  </label>
                  <div className="mt-1 text-sm">
                    {selectedRequest.request_reason}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {actionType === 'approve' ? '승인 메모 (선택사항)' : '반려 사유'} 
                  {actionType === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={actionType === 'approve' ? '승인 관련 메모를 입력하세요.' : '반려 사유를 입력해주세요.'}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
                setActionNotes('');
              }}
              disabled={isProcessing}
            >
              취소
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={actionType === 'approve' ? handleApprove : handleReject}
              disabled={isProcessing || (actionType === 'reject' && !actionNotes.trim())}
            >
              {isProcessing ? '처리 중...' : actionType === 'approve' ? '승인' : '반려'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CommonTemplate>
  );
};

export default SlotModificationRequestsPage;