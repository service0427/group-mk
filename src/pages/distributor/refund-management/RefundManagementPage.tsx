import React, { useState, useEffect } from 'react';
import { DashboardTemplate } from '@/components/pageTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';
import { useCustomToast } from '@/hooks/useCustomToast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RefundSettings } from '@/types/refund.types';
import { calculateRefund } from '@/utils/refundUtils';
import { useDialog } from '@/providers';

interface RefundRequest {
  id: string;
  slot_id: string;
  requester_id: string;
  approver_id?: string;
  refund_amount: number;
  approved_amount?: number;
  refund_reason: string;
  status: 'pending' | 'approved' | 'rejected';
  request_date: string;
  approval_date?: string;
  approval_notes?: string;
  slot?: {
    id: string;
    product_id: number;
    start_date?: string;
    end_date?: string;
    status: string;
    input_data?: any;
    mat_id: string;
    campaign?: {
      campaign_name: string;
      refund_settings?: RefundSettings;
    };
  };
  user?: {
    full_name: string;
    email: string;
  };
}

const RefundManagementPage: React.FC = () => {
  const { currentUser } = useAuthContext();
  const { showSuccess, showError } = useCustomToast();
  const [isLoading, setIsLoading] = useState(false);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalAmount, setApprovalAmount] = useState<string>('');
  const [approvalReason, setApprovalReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [isImmediateRefund, setIsImmediateRefund] = useState(false);
  const { showDialog } = useDialog();

  // 환불 요청 목록 가져오기
  const fetchRefundRequests = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('slot_refund_approvals')
        .select(`
          *,
          refund_amount,
          approved_amount,
          refund_reason,
          slot:slots!slot_refund_approvals_slot_id_fkey(
            id,
            product_id,
            start_date,
            end_date,
            status,
            input_data,
            mat_id,
            campaign:campaigns!slots_product_id_fkey(
              campaign_name,
              refund_settings
            )
          ),
          user:users!slot_refund_approvals_requester_id_fkey(
            full_name,
            email
          )
        `)
        .order('request_date', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') {
          // 테이블이 존재하지 않는 경우
          showError('환불 요청 테이블이 아직 생성되지 않았습니다. 관리자에게 문의해주세요.');
        } else {
          throw error;
        }
        return;
      }
      // 현재 총판이 관리하는 슬롯의 환불 요청만 필터링
      const filteredData = (data || []).filter(request => 
        request.slot?.mat_id === currentUser.id
      );
      setRefundRequests(filteredData);
    } catch (error) {
      showError('환불 요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefundRequests();
  }, [filter, currentUser]);

  // 환불 승인
  const handleApprove = async () => {
    if (!selectedRequest || !currentUser) return;
    
    // 환불 금액 유효성 검사
    const finalAmount = parseFloat(approvalAmount) || selectedRequest.refund_amount;
    const originalAmount = selectedRequest.refund_amount;
    
    if (finalAmount <= 0) {
      showError('환불 금액은 0보다 커야 합니다.');
      return;
    }
    
    // 원본 금액보다 많은 금액으로 환불할 수 없음
    if (finalAmount > originalAmount) {
      showError(`환불 금액은 신청 금액(${originalAmount.toLocaleString()}원)을 초과할 수 없습니다.`);
      return;
    }

    setIsLoading(true);
    try {
      // 캐페인 설정이 즉시 환불이거나 체크박스를 체크한 경우 즉시 처리
      const refundSettings = selectedRequest.slot?.campaign?.refund_settings;
      const shouldProcessImmediately = isImmediateRefund || 
                                      refundSettings?.type === 'immediate';
      
      if (shouldProcessImmediately) {
        // delayed 타입인데 강제로 즉시 처리하는 경우 경고
        if (refundSettings?.type === 'delayed' && refundSettings.delay_days && isImmediateRefund) {
          // 모달로 확인
          const shouldProceed = await new Promise<boolean>((resolve) => {
            showDialog({
              title: '즉시 환불 경고',
              message: `이 캠페인은 ${refundSettings.delay_days}일 후 환불 정책입니다.\n정말로 즉시 환불 처리하시겠습니까?`,
              confirmText: '즉시 환불 처리',
              cancelText: '취소',
              variant: 'warning',
              onConfirm: () => resolve(true),
              onCancel: () => resolve(false)
            });
          });
          
          if (!shouldProceed) {
            setIsLoading(false);
            return;
          }
        }
        
        // 즉시 환불 처리 로직
        // 1. 환불 승인 상태 업데이트
        const { error: approvalError } = await supabase
          .from('slot_refund_approvals')
          .update({
            status: 'approved',
            approval_date: new Date().toISOString(),
            approver_id: currentUser.id,
            approved_amount: finalAmount,
            approval_notes: approvalReason || null
          })
          .eq('id', selectedRequest.id);
          
        if (approvalError) throw approvalError;
        
        // 2. 즉시 환불 처리 (process_single_refund 함수 호출)
        const { data, error: refundError } = await supabase.rpc('process_single_refund', {
          p_refund_request_id: selectedRequest.id
        });
        
        if (refundError) throw refundError;
        
        if (data?.success) {
          showSuccess('환불이 즉시 처리되었습니다.');
        } else {
          showError(data?.message || '환불 처리에 실패했습니다.');
        }
        
        setSelectedRequest(null);
        setActionType(null);
        setApprovalAmount('');
        setApprovalReason('');
        setIsImmediateRefund(false);
        fetchRefundRequests();
        return;
      }
      // 환불 차액 계산 (총판에게 지급할 금액)
      const refundDifference = originalAmount - finalAmount;
      
      // 환불 요청 상태 업데이트
      const { error: updateError } = await supabase
        .from('slot_refund_approvals')
        .update({
          status: 'approved',
          approval_date: new Date().toISOString(),
          approver_id: currentUser.id,
          approved_amount: finalAmount,
          approval_notes: approvalReason || null
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // 슬롯 상태 업데이트
      const { error: slotError } = await supabase
        .from('slots')
        .update({ status: 'refund_approved' })
        .eq('id', selectedRequest.slot_id);

      if (slotError) throw slotError;

      // 환불 스케줄 생성 (환불 정책에 따라)
      // refundSettings는 이미 위에서 선언됨
      if (refundSettings) {
        let scheduledDate = new Date();
        
        if (refundSettings.type === 'delayed' && refundSettings.delay_days) {
          scheduledDate.setDate(scheduledDate.getDate() + refundSettings.delay_days);
        }

        const { error: scheduleError } = await supabase
          .from('refund_schedules')
          .insert({
            refund_request_id: selectedRequest.id,
            scheduled_date: scheduledDate.toISOString(),
            amount: finalAmount, // 수정된 금액 사용
            status: 'pending'
          });

        if (scheduleError) {
          // 스케줄 생성 실패는 조용히 처리 (메인 프로세스에는 영향 없음)
        }
      }
      
      // 환불 차액이 있으면 총판에게 캐시 지급
      if (refundDifference > 0) {
        try {
          // 현재 잔액 가져오기
          const { data: balanceData, error: balanceError } = await supabase
            .from('user_balances')
            .select('total_balance')
            .eq('user_id', currentUser.id)
            .single();
          
          if (balanceError) throw balanceError;
          
          const currentBalance = balanceData?.total_balance || 0;
          const newBalance = currentBalance + refundDifference;
          
          // 잔액 업데이트
          const { error: updateBalanceError } = await supabase
            .from('user_balances')
            .update({ 
              total_balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', currentUser.id);
          
          if (updateBalanceError) throw updateBalanceError;
          
          // 캐시 히스토리 추가
          const { error: historyError } = await supabase
            .from('user_cash_history')
            .insert({
              user_id: currentUser.id,
              transaction_type: 'refund',
              amount: refundDifference,
              description: `환불 차액 지급 - ${selectedRequest.slot?.campaign?.campaign_name || '캠페인 정보 없음'}`,
              reference_id: selectedRequest.id,
              balance_after: newBalance
            });
          
          if (historyError) {
            // 캐시 히스토리 생성 실패는 조용히 처리
          }
          
          showSuccess(`환불 요청이 승인되었습니다.\n환불 차액 ${refundDifference.toLocaleString()}원이 총판에게 지급되었습니다.`);
        } catch (error) {
          showSuccess('환불 요청이 승인되었습니다.\n(차액 지급 중 오류가 발생했습니다)');
        }
      } else {
        showSuccess('환불 요청이 승인되었습니다.');
      }
      
      setSelectedRequest(null);
      setActionType(null);
      setApprovalAmount('');
      setApprovalReason('');
      fetchRefundRequests();
    } catch (error) {
      showError('환불 승인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 환불 거절
  const handleReject = async () => {
    if (!selectedRequest || !currentUser || !rejectionReason.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('slot_refund_approvals')
        .update({
          status: 'rejected',
          approval_date: new Date().toISOString(),
          approver_id: currentUser.id,
          approval_notes: rejectionReason
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // 슬롯 상태를 승인됨으로 복구 (환불 요청 전 상태)
      const { error: slotError } = await supabase
        .from('slots')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.slot_id);

      if (slotError) throw slotError;

      showSuccess('환불 요청이 거절되었습니다.');
      setSelectedRequest(null);
      setActionType(null);
      setRejectionReason('');
      fetchRefundRequests();
    } catch (error) {
      showError('환불 거절 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardTemplate
      title="환불 요청 관리"
      description="사용자들의 환불 요청을 검토하고 승인/거절할 수 있습니다."
    >
      <Card className="shadow-md">
        <CardContent className="p-6">
          {/* 필터 탭 */}
          <div className="flex gap-2 mb-6 border-b">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 font-medium transition-all ${
                  filter === status
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {status === 'all' && '전체'}
                {status === 'pending' && '대기중'}
                {status === 'approved' && '승인됨'}
                {status === 'rejected' && '거절됨'}
                {status === 'pending' && refundRequests.filter(r => r.status === 'pending').length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">
                    {refundRequests.filter(r => r.status === 'pending').length}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* 환불 요청 목록 */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : refundRequests.length === 0 ? (
            <div className="text-center py-12">
              <KeenIcon icon="information-2" className="size-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">환불 요청이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {refundRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {request.slot?.campaign?.campaign_name || '캠페인 정보 없음'}
                        </h3>
                        {request.status === 'pending' && (
                          <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>
                        )}
                        {request.status === 'approved' && (
                          <Badge className="bg-green-100 text-green-800">승인됨</Badge>
                        )}
                        {request.status === 'rejected' && (
                          <Badge className="bg-red-100 text-red-800">거절됨</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="flex items-center gap-2">
                            <KeenIcon icon="user" className="size-4" />
                            {request.user?.full_name || '사용자 정보 없음'}
                          </p>
                          <p className="flex items-center gap-2 mt-1">
                            <KeenIcon icon="calendar" className="size-4" />
                            신청일: {format(new Date(request.request_date), 'yyyy-MM-dd HH:mm', { locale: ko })}
                          </p>
                        </div>
                        <div>
                          <p className="flex items-center gap-2">
                            <KeenIcon icon="wallet" className="size-4" />
                            신청 금액: {request.refund_amount.toLocaleString()}원
                          </p>
                          {request.approved_amount && request.approved_amount !== request.refund_amount && (
                            <p className="flex items-center gap-2 mt-1">
                              <KeenIcon icon="check-circle" className="size-4" />
                              승인 금액: <span className="font-semibold text-green-600">{request.approved_amount.toLocaleString()}원</span>
                            </p>
                          )}
                          {request.slot?.start_date && request.slot?.end_date && (
                            <p className="flex items-center gap-2 mt-1">
                              <KeenIcon icon="time" className="size-4" />
                              작업 기간: {format(new Date(request.slot.start_date), 'MM/dd')} - {format(new Date(request.slot.end_date), 'MM/dd')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-700 mb-1">환불 사유:</p>
                        <p className="text-sm text-gray-600">{request.refund_reason}</p>
                      </div>

                      {request.status === 'rejected' && request.approval_notes && (
                        <div className="mt-3 p-3 bg-red-50 rounded-md">
                          <p className="text-sm font-medium text-red-700 mb-1 flex items-center gap-2">
                            <KeenIcon icon="cross-circle" className="size-4" />
                            거절 사유:
                          </p>
                          <p className="text-sm text-red-600">{request.approval_notes}</p>
                          {request.approval_date && (
                            <p className="text-xs text-red-500 mt-2">
                              거절일: {format(new Date(request.approval_date), 'yyyy-MM-dd HH:mm', { locale: ko })}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {request.status === 'approved' && request.approval_date && (
                        <div className="mt-3 p-3 bg-green-50 rounded-md">
                          <p className="text-sm font-medium text-green-700 mb-1 flex items-center gap-2">
                            <KeenIcon icon="check-circle" className="size-4" />
                            승인 정보
                          </p>
                          <p className="text-xs text-green-600">
                            승인일: {format(new Date(request.approval_date), 'yyyy-MM-dd HH:mm', { locale: ko })}
                          </p>
                          {request.approved_amount && request.approved_amount !== request.refund_amount && (
                            <p className="text-xs text-green-600 mt-1">
                              차액 지급: {(request.refund_amount - request.approved_amount).toLocaleString()}원
                            </p>
                          )}
                          {request.approval_notes && (
                            <p className="text-xs text-green-600 mt-1">
                              승인 사유: {request.approval_notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('approve');
                            setApprovalAmount(request.refund_amount.toString());
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <KeenIcon icon="check-circle" className="size-4 mr-1" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('reject');
                          }}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <KeenIcon icon="cross-circle" className="size-4 mr-1" />
                          거절
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 승인 확인 모달 */}
      <Dialog open={actionType === 'approve'} onOpenChange={() => {
        setActionType(null);
        setApprovalAmount('');
        setApprovalReason('');
        setIsImmediateRefund(false);
      }}>
        <DialogContent className="max-w-md p-6" aria-describedby={undefined}>
          <DialogHeader className="pb-4 border-b mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg flex items-center justify-center">
                <KeenIcon icon="check-circle" className="text-white size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">환불 승인</h3>
                <p className="text-sm text-gray-500 font-normal mt-0.5">환불 요청을 승인합니다</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-3">환불 요청 정보</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <KeenIcon icon="user" className="size-4" />
                  신청자: <span className="font-semibold">{selectedRequest?.user?.full_name || '정보 없음'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <KeenIcon icon="wallet" className="size-4" />
                  요청 금액: <span className="font-semibold">{selectedRequest?.refund_amount.toLocaleString()}원</span>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="approval-amount" className="text-sm font-medium mb-2 block">
                환불 금액 <span className="text-red-500">*</span>
              </Label>
              <input
                id="approval-amount"
                type="number"
                value={approvalAmount}
                onChange={(e) => setApprovalAmount(e.target.value)}
                placeholder="환불 금액을 입력해주세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                min="0"
                step="1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                요청 금액: {selectedRequest?.refund_amount.toLocaleString()}원
              </p>
            </div>
            
            <div>
              <Label htmlFor="approval-reason" className="text-sm font-medium mb-2 block">
                승인 사유 <span className="text-gray-400">(선택사항)</span>
              </Label>
              <Textarea
                id="approval-reason"
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder="승인 사유를 입력해주세요"
                className="w-full resize-none"
                rows={3}
              />
            </div>
            
            {/* 즉시 환불 옵션 */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <input
                type="checkbox"
                id="immediate-refund"
                checked={isImmediateRefund}
                onChange={(e) => setIsImmediateRefund(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="immediate-refund" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <KeenIcon icon="flash" className="size-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">즉시 환불 처리</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  체크 시 3일 대기 없이 즉시 환불이 처리됩니다
                </p>
              </label>
            </div>
            {selectedRequest?.slot?.campaign?.refund_settings && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-700 mb-1 flex items-center gap-2">
                  <KeenIcon icon="information-3" className="size-4" />
                  환불 정책
                </p>
                <p className="text-sm text-blue-600">
                  {selectedRequest.slot.campaign.refund_settings.type === 'immediate' && '즉시 환불 처리됩니다.'}
                  {selectedRequest.slot.campaign.refund_settings.type === 'delayed' && 
                    `승인 후 ${selectedRequest.slot.campaign.refund_settings.delay_days}일 뒤에 환불됩니다.`}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => {
              setActionType(null);
              setApprovalAmount('');
              setApprovalReason('');
              setIsImmediateRefund(false);
            }}>
              취소
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? '처리중...' : '승인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 거절 모달 */}
      <Dialog open={actionType === 'reject'} onOpenChange={() => setActionType(null)}>
        <DialogContent className="max-w-md p-6" aria-describedby={undefined}>
          <DialogHeader className="pb-4 border-b mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-red-400 to-pink-500 shadow-lg flex items-center justify-center">
                <KeenIcon icon="cross-circle" className="text-white size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">환불 거절</h3>
                <p className="text-sm text-gray-500 font-normal mt-0.5">환불 요청을 거절합니다</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <KeenIcon icon="wallet" className="size-4" />
                환불 금액: <span className="font-semibold">{selectedRequest?.refund_amount.toLocaleString()}원</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <KeenIcon icon="user" className="size-4" />
                신청자: <span className="font-semibold">{selectedRequest?.user?.full_name || '정보 없음'}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="rejection-reason" className="text-sm font-medium mb-2 block">
                거절 사유 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="거절 사유를 상세히 입력해주세요..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">거절 사유는 신청자에게 전달됩니다.</p>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => {
              setActionType(null);
              setRejectionReason('');
            }}>
              취소
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={isLoading || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? '처리중...' : '거절'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardTemplate>
  );
};

export default RefundManagementPage;