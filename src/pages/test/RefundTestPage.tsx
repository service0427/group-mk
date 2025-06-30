import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Slot {
  id: string;
  mat_id: string;
  product_id: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  keyword_id: number | null;
  input_data: any;
  processed_at: string | null;
  campaign?: {
    campaign_name: string;
  };
  campaigns?: Array<{
    campaign_name: string;
  }>;
  user?: {
    full_name: string;
  };
  refund_approval?: {
    id: string;
    approval_date: string;
    status: string;
    refund_amount?: number;
    approved_amount?: number;
  };
}

interface RefundApproval {
  id: string;
  slot_id: string;
  requester_id: string;
  refund_amount: number;
  approved_amount?: number;
  refund_reason: string;
  status: string;
  approval_date: string;
  request_date: string;
  approval_notes?: string;
  slot?: {
    campaign?: {
      campaign_name: string;
    };
  };
}

const RefundTestPage: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [selectedRefundApprovalId, setSelectedRefundApprovalId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refundApprovalDate, setRefundApprovalDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refundApprovals, setRefundApprovals] = useState<RefundApproval[]>([]);
  const [processResult, setProcessResult] = useState<any>(null);
  const [simulationResult, setSimulationResult] = useState<any[]>([]);
  const [showSimulation, setShowSimulation] = useState(false);
  const [singleSimulationResult, setSingleSimulationResult] = useState<any[]>([]);
  const [showSingleSimulation, setShowSingleSimulation] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('');

  // 최근 슬롯 목록 가져오기
  const fetchSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('slots')
        .select(`
          *,
          campaigns!inner(
            campaign_name
          )
        `)
        .in('status', ['refund_approved'])
        .order('created_at', { ascending: false })
        .limit(50);
      
      console.log('Slots data:', data); // 디버깅용 로그

      if (error) throw error;
      // campaigns 배열을 단일 객체로 변환하고 사용자 정보 추가
      const slotsWithCampaign = (data || []).map(slot => ({
        ...slot,
        campaign: Array.isArray(slot.campaigns) ? slot.campaigns[0] : slot.campaigns
      }));
      
      // mat_id로 사용자 정보 가져오기 (별도 쿼리)
      if (slotsWithCampaign.length > 0) {
        const matIds = [...new Set(slotsWithCampaign.map(s => s.mat_id))];
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', matIds);
        
        const userMap = new Map(users?.map(u => [u.id, u]) || []);
        
        // 각 슬롯에 대한 환불 승인 정보 가져오기
        const slotIds = slotsWithCampaign.map(s => s.id);
        const { data: refundApprovals } = await supabase
          .from('slot_refund_approvals')
          .select('id, slot_id, approval_date, status, refund_amount, approved_amount')
          .in('slot_id', slotIds)
          .eq('status', 'approved');
        
        const refundApprovalMap = new Map(refundApprovals?.map(ra => [ra.slot_id, ra]) || []);
        
        const slotsWithUsersAndApprovals = slotsWithCampaign.map(slot => ({
          ...slot,
          user: userMap.get(slot.mat_id),
          refund_approval: refundApprovalMap.get(slot.id)
        }));
        setSlots(slotsWithUsersAndApprovals);
      } else {
        setSlots(slotsWithCampaign);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      alert('슬롯 목록을 불러오는데 실패했습니다.');
    }
  };

  // 환불 승인 대기 목록 가져오기 (3일 경과 확인용)
  const fetchPendingRefunds = async () => {
    try {
      const { data, error } = await supabase
        .from('slot_refund_approvals')
        .select(`
          *,
          slot:slots!slot_refund_approvals_slot_id_fkey(
            id,
            status,
            campaign:campaigns!slots_product_id_fkey(
              campaign_name
            )
          )
        `)
        .eq('status', 'approved')
        .order('approval_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // 이미 환불 처리된 항목 필터링 (슬롯 상태가 refunded가 아닌 것만)
      const pendingRefunds = (data || []).filter(approval => 
        approval.slot?.status !== 'refunded'
      );
      
      setRefundApprovals(pendingRefunds);
    } catch (error) {
      console.error('Error fetching pending refunds:', error);
    }
  };

  useEffect(() => {
    fetchSlots();
    fetchPendingRefunds();
  }, []);

  // 슬롯 선택 시 날짜 정보 로드
  const handleSlotSelect = (slotId: string) => {
    setSelectedSlotId(slotId);
    const slot = slots.find(s => s.id === slotId);
    if (slot) {
      setStartDate(slot.start_date ? format(new Date(slot.start_date), 'yyyy-MM-dd') : '');
      setEndDate(slot.end_date ? format(new Date(slot.end_date), 'yyyy-MM-dd') : '');
      
      // 환불 승인 정보가 있으면 환불 승인일 설정
      if (slot.refund_approval) {
        setSelectedRefundApprovalId(slot.refund_approval.id);
        setRefundApprovalDate(format(new Date(slot.refund_approval.approval_date), 'yyyy-MM-dd'));
      } else {
        setSelectedRefundApprovalId('');
        setRefundApprovalDate('');
      }
    }
  };

  // 슬롯 날짜 업데이트
  const handleUpdateSlotDates = async () => {
    if (!selectedSlotId || !startDate || !endDate) {
      alert('슬롯과 날짜를 모두 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      // 슬롯 날짜 업데이트
      const { error: slotError } = await supabase
        .from('slots')
        .update({
          start_date: startDate,
          end_date: endDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSlotId);

      if (slotError) throw slotError;

      // 환불 승인일이 입력되어 있고 환불 승인 ID가 있으면 환불 승인일 업데이트
      if (refundApprovalDate && selectedRefundApprovalId) {
        const { error: refundError } = await supabase
          .from('slot_refund_approvals')
          .update({
            approval_date: new Date(refundApprovalDate).toISOString()
          })
          .eq('id', selectedRefundApprovalId);

        if (refundError) throw refundError;
      }

      alert('정보가 업데이트되었습니다.');
      fetchSlots();
      fetchPendingRefunds();
    } catch (error) {
      console.error('Error updating dates:', error);
      alert('정보 업데이트에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 환불 프로세스 즉시 실행
  const handleProcessRefunds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('process_scheduled_refunds');

      if (error) throw error;

      setProcessResult(data[0]);
      alert(`환불 처리 완료: 성공 ${data[0].success_count}건, 실패 ${data[0].failed_count}건`);
      fetchPendingRefunds();
    } catch (error) {
      console.error('Error processing refunds:', error);
      alert('환불 프로세스 실행에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 특정 환불 건 즉시 처리
  const handleProcessSingleRefund = async (refundRequestId: string, customAmount?: string, customReason?: string) => {
    if (!confirm('정말로 이 환불을 즉시 처리하시겠습니까?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      // 환불 승인 정보 가져오기
      const { data: approval } = await supabase
        .from('slot_refund_approvals')
        .select('refund_amount, approved_amount')
        .eq('id', refundRequestId)
        .single();
        
      if (approval && customAmount) {
        const requestedAmount = approval.approved_amount || approval.refund_amount;
        const inputAmount = parseFloat(customAmount);
        
        if (inputAmount > requestedAmount) {
          alert(`환불 금액은 신청 금액(${requestedAmount.toLocaleString()}원)을 초과할 수 없습니다.`);
          return;
        }
      }
      
      // 커스텀 금액이나 사유가 있으면 먼저 업데이트
      if (customAmount || customReason) {
        const updateData: any = {};
        if (customAmount) {
          updateData.approved_amount = parseFloat(customAmount);
        }
        if (customReason) {
          updateData.approval_notes = customReason;
        }
        
        const { error: updateError } = await supabase
          .from('slot_refund_approvals')
          .update(updateData)
          .eq('id', refundRequestId);
          
        if (updateError) {
          console.error('Error updating refund approval:', updateError);
        }
      }
      
      const { data, error } = await supabase.rpc('process_single_refund', {
        p_refund_request_id: refundRequestId
      });

      if (error) throw error;

      if (data.success) {
        alert(data.message);
      } else {
        alert(data.message);
      }
      fetchPendingRefunds();
      fetchSlots(); // 슬롯 목록도 새로고침
    } catch (error) {
      console.error('Error processing single refund:', error);
      alert('환불 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 개별 환불 시뮬레이션
  const handleSimulateSingleRefund = async (refundRequestId: string, customAmount?: string, _customReason?: string) => {
    setIsLoading(true);
    try {
      // 환불 승인 정보 가져오기
      const { data: approval } = await supabase
        .from('slot_refund_approvals')
        .select('refund_amount, approved_amount')
        .eq('id', refundRequestId)
        .single();
        
      if (approval && customAmount) {
        const requestedAmount = approval.approved_amount || approval.refund_amount;
        const inputAmount = parseFloat(customAmount);
        
        if (inputAmount > requestedAmount) {
          alert(`환불 금액은 신청 금액(${requestedAmount.toLocaleString()}원)을 초과할 수 없습니다.`);
          setIsLoading(false);
          return;
        }
      }
      
      // 시뮬레이션 전에 금액 정보를 반영한 가상의 결과를 보여주기 위해
      // 실제 DB는 수정하지 않고 시뮬레이션 결과에만 반영
      const { data, error } = await supabase.rpc('simulate_single_refund', {
        p_refund_request_id: refundRequestId
      });

      if (error) throw error;

      // 커스텀 금액이 있으면 시뮬레이션 결과에 반영
      let modifiedResult = data || [];
      if (customAmount && modifiedResult.length > 0 && approval) {
        const amount = parseFloat(customAmount);
        const originalAmount = approval.refund_amount; // 신청 금액 사용
        const refundDifference = originalAmount - amount;
        
        // 기존 결과 수정
        modifiedResult = modifiedResult.map((item: any) => {
          if (item.table_name === 'user_balances' && item.changes?.change_amount) {
            return {
              ...item,
              changes: {
                ...item.changes,
                change_amount: amount,
                paid_balance: `+${amount}`,
                total_balance: `+${amount}`
              }
            };
          }
          if (item.table_name === 'user_cash_history' && item.changes?.amount) {
            return {
              ...item,
              changes: {
                ...item.changes,
                amount: amount
              }
            };
          }
          return item;
        });
        
        // 차액이 있으면 총판 관련 시뮬레이션 결과 추가
        if (refundDifference > 0) {
          // refund_request_id로부터 슬롯 정보 가져오기
          const { data: refundData } = await supabase
            .from('slot_refund_approvals')
            .select('slot_id')
            .eq('id', refundRequestId)
            .single();
            
          const slotId = refundData?.slot_id;
          console.log('Refund difference:', refundDifference, 'Slot ID:', slotId); // 디버깅용
          
          if (slotId) {
            // 슬롯 정보 가져오기 (mat_id 확인용)
            const { data: slotData } = await supabase
              .from('slots')
              .select('mat_id')
              .eq('id', slotId)
              .single();
            
            if (slotData) {
              // 총판 현재 잔액 가져오기
              const { data: distributorBalance } = await supabase
                .from('user_balances')
                .select('total_balance')
                .eq('user_id', slotData.mat_id)
                .single();
                
              const currentDistributorBalance = distributorBalance?.total_balance || 0;
              const newDistributorBalance = currentDistributorBalance + refundDifference;
              
              // 총판 잔액 업데이트 시뮬레이션 추가
              modifiedResult.push({
                table_name: 'user_balances',
                action: 'UPDATE',
                record_id: slotData.mat_id,
                changes: {
                  user_id: slotData.mat_id,
                  current_balance: currentDistributorBalance,
                  new_balance: newDistributorBalance,
                  change_amount: refundDifference
                },
                description: `총판 잔액이 ${currentDistributorBalance.toLocaleString()}원에서 ${newDistributorBalance.toLocaleString()}원으로 증가 (+${refundDifference.toLocaleString()}원) - 환불 차액 지급`
              });
              
              // 총판 캐시 히스토리 추가 시뮬레이션
              modifiedResult.push({
                table_name: 'user_cash_history',
                action: 'INSERT',
                record_id: 'NEW',
                changes: {
                  user_id: slotData.mat_id,
                  amount: refundDifference,
                  transaction_type: 'refund',
                  description: '환불 차액 지급',
                  balance_type: 'paid'
                },
                description: `총판에게 환불 차액 ${refundDifference.toLocaleString()}원 지급 기록 추가`
              });
            }
          }
        }
      }

      setSingleSimulationResult(modifiedResult);
      setShowSingleSimulation(true);
    } catch (error) {
      console.error('Error simulating single refund:', error);
      alert('환불 시뮬레이션 실행에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };


  // 환불 프로세스 시뮬레이션
  const handleSimulateRefunds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('simulate_refund_process');

      if (error) throw error;

      let modifiedResult = data || [];
      
      // 슬롯 ID들 수집
      const slotIds = new Set<string>();
      modifiedResult.forEach((item: any) => {
        if (item.changes?.slot_id) {
          slotIds.add(item.changes.slot_id);
        } else if (item.record_id && (item.table_name === 'slots' || item.table_name === 'slot_pending_balances')) {
          slotIds.add(item.record_id);
        }
      });
      
      // 슬롯 정보 조회
      if (slotIds.size > 0) {
        const { data: slotData } = await supabase
          .from('slots')
          .select(`
            *,
            campaigns!inner(campaign_name)
          `)
          .in('id', Array.from(slotIds));
          
        if (slotData) {
          // 사용자 정보 추가
          const matIds = [...new Set(slotData.map(s => s.mat_id))];
          const { data: users } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', matIds);
          
          const userMap = new Map(users?.map(u => [u.id, u]) || []);
          
          const slotsWithInfo = slotData.map(slot => ({
            ...slot,
            campaign: Array.isArray(slot.campaigns) ? slot.campaigns[0] : slot.campaigns,
            user: userMap.get(slot.mat_id)
          }));
          
          // 임시로 slots 상태 업데이트
          setSlots(prevSlots => {
            const updatedSlots = [...prevSlots];
            slotsWithInfo.forEach(newSlot => {
              const index = updatedSlots.findIndex(s => s.id === newSlot.id);
              if (index === -1) {
                updatedSlots.push(newSlot);
              }
            });
            return updatedSlots;
          });
        }
      }
      
      // 환불금액이 입력되어 있으면 적용
      if (refundAmount && modifiedResult.length > 0) {
        const amount = parseFloat(refundAmount);
        
        // 각 환불 요청별로 그룹화하기 위해 slot_id 추출
        const slotIds = new Set<string>();
        modifiedResult.forEach((item: any) => {
          if (item.changes?.slot_id) {
            slotIds.add(item.changes.slot_id);
          } else if (item.record_id && item.table_name === 'slots') {
            slotIds.add(item.record_id);
          }
        });
        
        // 각 슬롯에 대한 환불 차액 계산을 위해 승인 정보 가져오기
        for (const slotId of slotIds) {
          const { data: approvalData } = await supabase
            .from('slot_refund_approvals')
            .select('refund_amount, approved_amount')
            .eq('slot_id', slotId)
            .eq('status', 'approved')
            .single();
            
          if (approvalData) {
            const originalAmount = approvalData.refund_amount; // 신청 금액 사용
            const refundDifference = originalAmount - amount;
            
            // 해당 슬롯의 결과 수정
            modifiedResult = modifiedResult.map((item: any) => {
              const itemSlotId = item.changes?.slot_id || (item.table_name === 'slots' ? item.record_id : null);
              
              if (itemSlotId === slotId) {
                if (item.table_name === 'user_balances' && item.changes?.change_amount) {
                  return {
                    ...item,
                    changes: {
                      ...item.changes,
                      change_amount: amount,
                      new_balance: (item.changes.current_balance || 0) + amount
                    },
                    description: item.description.replace(/\+[0-9,]+원/, `+${amount.toLocaleString()}원`)
                  };
                }
                if (item.table_name === 'cash_histories' && item.changes?.amount && item.changes?.type === 'refund') {
                  return {
                    ...item,
                    changes: {
                      ...item.changes,
                      amount: amount
                    }
                  };
                }
              }
              return item;
            });
            
            // 차액이 있으면 총판 관련 시뮬레이션 결과 추가
            if (refundDifference > 0) {
              const { data: slotData } = await supabase
                .from('slots')
                .select('mat_id')
                .eq('id', slotId)
                .single();
                
              if (slotData) {
                const { data: distributorBalance } = await supabase
                  .from('user_balances')
                  .select('total_balance')
                  .eq('user_id', slotData.mat_id)
                  .single();
                  
                const currentDistributorBalance = distributorBalance?.total_balance || 0;
                const newDistributorBalance = currentDistributorBalance + refundDifference;
                
                // 총판 잔액 업데이트 시뮬레이션 추가
                modifiedResult.push({
                  table_name: 'user_balances',
                  action: 'UPDATE',
                  record_id: slotData.mat_id,
                  changes: {
                    user_id: slotData.mat_id,
                    current_balance: currentDistributorBalance,
                    new_balance: newDistributorBalance,
                    change_amount: refundDifference,
                    slot_id: slotId
                  },
                  description: `[슬롯 ${slotId}] 총판 잔액이 ${currentDistributorBalance.toLocaleString()}원에서 ${newDistributorBalance.toLocaleString()}원으로 증가 (+${refundDifference.toLocaleString()}원) - 환불 차액 지급`
                });
                
                // 총판 캐시 히스토리 추가 시뮬레이션
                modifiedResult.push({
                  table_name: 'cash_histories',
                  action: 'INSERT',
                  record_id: 'NEW',
                  changes: {
                    user_id: slotData.mat_id,
                    amount: refundDifference,
                    type: 'refund_difference',
                    description: '환불 차액 지급',
                    balance_after: newDistributorBalance,
                    slot_id: slotId
                  },
                  description: `[슬롯 ${slotId}] 총판에게 환불 차액 ${refundDifference.toLocaleString()}원 지급 기록 추가`
                });
              }
            }
          }
        }
      }

      setSimulationResult(modifiedResult);
      setShowSimulation(true);
    } catch (error) {
      console.error('Error simulating refunds:', error);
      alert('환불 시뮬레이션 실행에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">환불 테스트 페이지</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">슬롯 날짜 변경 및 환불 프로세스 테스트</p>
      </div>

      <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start gap-3">
          <KeenIcon icon="information-2" className="size-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            이 페이지는 개발/테스트 목적으로만 사용됩니다. 실제 데이터에 영향을 줄 수 있으므로 주의해서 사용하세요. 테스트 완료 이후에는 접근 불가 및 삭제될 페이지 입니다.
            <br />[사용법]
            <br />1. 환불 대기중 또는 승인한 (+N일 전용) 슬롯을 선택
            <br />2. 날짜를 업데이트 (시작일, 종료일, 환불 승인일를 전부 과거로 만들어서 테스트 하는걸 추천합니다) 
            <br />3. 시뮬레이션 (데이터 변경X) or 실제환불 진행 (데이터 변경 O) 
          </p>
        </div>
      </div>

      {/* 슬롯 날짜 변경 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeenIcon icon="calendar-edit" className="size-5" />
            슬롯 날짜 변경
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="slot-select">슬롯 선택</Label>
            <Select value={selectedSlotId} onValueChange={handleSlotSelect}>
              <SelectTrigger className="h-auto min-h-[40px] py-2">
                <SelectValue placeholder="슬롯을 선택하세요" />
              </SelectTrigger>
              <SelectContent className="max-h-[600px] max-w-[800px] overflow-y-auto">
                {slots.map((slot) => {
                  // input_data가 JSON 문자열인 경우 파싱
                  let inputData = slot.input_data;
                  if (typeof inputData === 'string') {
                    try {
                      inputData = JSON.parse(inputData);
                    } catch (e) {
                      inputData = {};
                    }
                  }
                  
                  const mid = inputData?.mid || inputData?.placeId || inputData?.businessId || 'MID 없음';
                  const keyword = inputData?.keyword || inputData?.searchKeyword || inputData?.keywords  ||  inputData?.mainKeyword || '키워드 없음';
                  
                  console.log('Slot input_data:', slot.id, inputData); // 디버깅용
                  
                  return (
                    <SelectItem key={slot.id} value={slot.id} className="py-4 px-4">
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-base">{slot.campaign?.campaign_name || '캠페인 없음'}</span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {slot.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <KeenIcon icon="shop" className="size-3" />
                            <span className="font-medium">MID:</span> {mid}
                          </span>
                          <span className="text-gray-400">|</span>
                          <span className="flex items-center gap-1">
                            <KeenIcon icon="tag" className="size-3" />
                            <span className="font-medium">키워드:</span> {keyword}
                          </span>
                          {slot.user && (
                            <>
                              <span className="text-gray-400">|</span>
                              <span className="flex items-center gap-1">
                                <KeenIcon icon="user" className="size-3" />
                                {slot.user.full_name}
                              </span>
                            </>
                          )}
                        </div>
                        {slot.refund_approval && (
                          <div className="mt-2 space-y-1">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-600 dark:text-blue-400 font-medium">
                              <KeenIcon icon="check-circle" className="size-4 inline mr-1" />
                              환불 승인일: {format(new Date(slot.refund_approval.approval_date), 'yyyy-MM-dd HH:mm')}
                            </div>
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-600 dark:text-green-400">
                              <KeenIcon icon="wallet" className="size-4 inline mr-1" />
                              신청 금액: {slot.refund_approval.refund_amount?.toLocaleString()}원
                              {slot.refund_approval.approved_amount && slot.refund_approval.approved_amount !== slot.refund_approval.refund_amount && (
                                <span className="ml-2 font-medium">
                                  → 승인: {slot.refund_approval.approved_amount.toLocaleString()}원
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date">시작일</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">종료일</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="refund-approval-date">환불 승인일</Label>
              <Input
                id="refund-approval-date"
                type="date"
                value={refundApprovalDate}
                onChange={(e) => setRefundApprovalDate(e.target.value)}
                disabled={!selectedRefundApprovalId}
                placeholder={selectedRefundApprovalId ? "환불 승인일 선택" : "환불 승인 없음"}
              />
            </div>
          </div>

          <Button
            onClick={handleUpdateSlotDates}
            disabled={isLoading || !selectedSlotId}
            className="w-full"
          >
            <KeenIcon icon="calendar-tick" className="size-4 mr-2" />
            날짜 업데이트
          </Button>
        </CardContent>
      </Card>

      {/* 환불 프로세스 실행 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeenIcon icon="wallet" className="size-5" />
            환불 프로세스 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 환불 금액 및 사유 입력 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="refund-amount">환불 금액 (선택사항)</Label>
              <Input
                id="refund-amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="환불 금액 입력"
                min="0"
                step="1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                비워두면 요청된 금액으로 처리됩니다
              </p>
            </div>
            <div>
              <Label htmlFor="refund-reason">환불 사유 (선택사항)</Label>
              <Input
                id="refund-reason"
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="환불 사유 입력"
              />
              <p className="text-xs text-gray-500 mt-1">
                승인 시 메모로 저장됩니다
              </p>
            </div>
          </div>

          {/* 실행 버튼 */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleSimulateRefunds}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <KeenIcon icon="eye" className="size-4 mr-2" />
              시뮬레이션 실행
            </Button>
            <Button
              onClick={handleProcessRefunds}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <KeenIcon icon="play" className="size-4 mr-2" />
              실제 환불 처리 실행
            </Button>
          </div>

          {processResult && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <KeenIcon icon="check-circle" className="size-5 text-green-600 dark:text-green-400" />
                <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                  <p>처리 건수: {processResult.processed_count}</p>
                  <p>성공: {processResult.success_count}</p>
                  <p>실패: {processResult.failed_count}</p>
                  <p>총 환불 금액: {Number(processResult.total_refund_amount).toLocaleString()}원</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 시뮬레이션 결과 */}
      {showSimulation && simulationResult.length > 0 && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeenIcon icon="eye" className="size-5 text-purple-600 dark:text-purple-400" />
                <span>+N일 환불 프로세스 시뮬레이션 결과</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSimulation(false)}
              >
                <KeenIcon icon="cross" className="size-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                아래는 실제 실행 시 발생할 변경사항입니다. (실제로 변경되지 않음)
              </p>
              
              {/* 슬롯별로 그룹화 */}
              {(() => {
                // 먼저 슬롯별로 그룹화
                const slotGroups: Record<string, any[]> = {};
                const noSlotItems: any[] = [];
                
                simulationResult.forEach((item: any) => {
                  const slotId = item.changes?.slot_id || 
                               (item.table_name === 'slots' ? item.record_id : null) ||
                               (item.table_name === 'slot_pending_balances' ? item.record_id : null);
                  
                  if (slotId) {
                    if (!slotGroups[slotId]) slotGroups[slotId] = [];
                    slotGroups[slotId].push(item);
                  } else {
                    noSlotItems.push(item);
                  }
                });
                
                return (
                  <>
                    {/* 슬롯별 변경사항 */}
                    {Object.entries(slotGroups).map(([slotId, items]) => {
                      // slot_refund_approvals 정보 찾기
                      const refundApproval = items.find(item => item.table_name === 'slot_refund_approvals');
                      const refundInfo = refundApproval?.changes;
                      
                      // 슬롯 정보 찾기
                      const slot = slots.find(s => s.id === (refundInfo?.slot_id || slotId));
                      const slotInfo = slot ? {
                        campaign: refundInfo?.campaign_name || slot.campaign?.campaign_name || '캠페인 정보 없음',
                        user: slot.user?.full_name || '사용자 정보 없음',
                        mid: (() => {
                          let inputData = slot.input_data;
                          if (typeof inputData === 'string') {
                            try { inputData = JSON.parse(inputData); } catch (e) { inputData = {}; }
                          }
                          return inputData?.mid || inputData?.placeId || inputData?.businessId || 'MID 없음';
                        })(),
                        keyword: (() => {
                          let inputData = slot.input_data;
                          if (typeof inputData === 'string') {
                            try { inputData = JSON.parse(inputData); } catch (e) { inputData = {}; }
                          }
                          return inputData?.keyword || inputData?.searchKeyword || inputData?.keywords || inputData?.mainKeyword || '키워드 없음';
                        })(),
                        amount: refundInfo?.amount,
                        delay_days: refundInfo?.delay_days,
                        scheduled_date: refundInfo?.scheduled_date
                      } : null;
                      
                      return (
                        <div key={slotId} className="border-2 border-blue-200 rounded-lg p-4 mb-4">
                          <div className="mb-3">
                            <h4 className="font-bold text-base flex items-center gap-2 text-blue-700">
                              <KeenIcon icon="layers" className="size-5" />
                              {slotInfo?.campaign || `슬롯 ${slotId.substring(0, 8)}...`}
                            </h4>
                            {slotInfo && (
                              <div className="mt-2 space-y-2">
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <KeenIcon icon="shop" className="size-3" />
                                    <span className="font-medium">MID:</span> {slotInfo.mid}
                                  </span>
                                <span className="text-gray-400">|</span>
                                <span className="flex items-center gap-1">
                                  <KeenIcon icon="tag" className="size-3" />
                                  <span className="font-medium">키워드:</span> {slotInfo.keyword}
                                </span>
                                <span className="text-gray-400">|</span>
                                <span className="flex items-center gap-1">
                                  <KeenIcon icon="user" className="size-3" />
                                  {slotInfo.user}
                                </span>
                              </div>
                                {slotInfo.amount && (
                                  <div className="bg-amber-50 rounded-lg p-2 mt-2">
                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                      <span className="flex items-center gap-1">
                                        <KeenIcon icon="wallet" className="size-4 text-amber-600" />
                                        <span className="font-medium">환불 금액:</span>
                                        <span className="font-bold text-amber-700">{slotInfo.amount.toLocaleString()}원</span>
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <KeenIcon icon="calendar-tick" className="size-4 text-amber-600" />
                                        <span className="font-medium">처리 일정:</span>
                                        <span className="font-bold text-amber-700">+{slotInfo.delay_days}일</span>
                                      </span>
                                      {slotInfo.scheduled_date && (
                                        <span className="flex items-center gap-1">
                                          <KeenIcon icon="time" className="size-4 text-amber-600" />
                                          <span className="font-medium">예정일:</span>
                                          <span className="font-bold text-amber-700">
                                            {format(new Date(slotInfo.scheduled_date), 'yyyy-MM-dd HH:mm', { locale: ko })}
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        
                        {/* 테이블별로 다시 그룹화 */}
                        {Object.entries(
                          items.reduce((acc: Record<string, any[]>, item: any) => {
                            if (!acc[item.table_name]) acc[item.table_name] = [];
                            acc[item.table_name].push(item);
                            return acc;
                          }, {} as Record<string, any[]>)
                        ).map(([tableName, tableItems]) => (
                          <div key={tableName} className="border rounded-lg p-3 mb-2">
                            <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <KeenIcon icon="database" className="size-4" />
                              {tableName} 테이블
                            </h5>
                            <div className="space-y-2">
                              {tableItems.map((item: any, idx: number) => (
                                <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge 
                                      variant={item.action === 'INSERT' ? 'default' : item.action === 'UPDATE' ? 'secondary' : 'outline'} 
                                      className={`text-xs ${item.action === 'UPDATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}`}
                                    >
                                      {item.action}
                                    </Badge>
                                    <span className="text-xs text-gray-500">ID: {item.record_id || 'NEW'}</span>
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-300">{item.description}</p>
                                  {item.changes && Object.keys(item.changes).length > 0 && (
                                    <details className="mt-2">
                                      <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                                        상세 정보 보기
                                      </summary>
                                      <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(item.changes, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )})}
                    
                    {/* 슬롯과 관련없는 항목들 */}
                    {noSlotItems.length > 0 && (
                      <div className="border rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <KeenIcon icon="information-3" className="size-4" />
                          기타 변경사항
                        </h4>
                        <div className="space-y-2">
                          {noSlotItems.map((item: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={item.action === 'INSERT' ? 'default' : 'secondary'} className="text-xs">
                                  {item.action}
                                </Badge>
                                <span className="text-xs text-gray-500">{item.table_name}</span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 환불 승인 대기 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeenIcon icon="time-schedule" className="size-5" />
            환불 지급 대기 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {refundApprovals.length === 0 ? (
              <p className="text-center text-gray-500 py-8">승인된 환불 요청이 없습니다.</p>
            ) : (
              refundApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {approval.slot?.campaign?.campaign_name || '캠페인 정보 없음'}
                        </span>
                        <Badge
                          variant={
                            new Date(approval.approval_date).getTime() + 3 * 24 * 60 * 60 * 1000 <= Date.now()
                              ? 'destructive'
                              : 'outline'
                          }
                          className={
                            new Date(approval.approval_date).getTime() + 3 * 24 * 60 * 60 * 1000 > Date.now()
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700'
                              : ''
                          }
                        >
                          {new Date(approval.approval_date).getTime() + 3 * 24 * 60 * 60 * 1000 <= Date.now()
                            ? '3일 경과'
                            : '대기중'}
                        </Badge>
                      </div>
                      <p className="text-sm">
                        신청 금액: {Number(approval.refund_amount).toLocaleString()}원
                        {approval.approved_amount && approval.approved_amount !== approval.refund_amount && (
                          <span className="ml-2 text-green-600">
                            (승인: {Number(approval.approved_amount).toLocaleString()}원)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        승인일: {format(new Date(approval.approval_date), 'yyyy-MM-dd HH:mm', { locale: ko })}
                      </p>
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                          <KeenIcon icon="calendar-check" className="size-4" />
                          환불 예정일: {format(new Date(new Date(approval.approval_date).getTime() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd HH:mm', { locale: ko })}
                        </p>
                        {new Date(approval.approval_date).getTime() + 3 * 24 * 60 * 60 * 1000 <= Date.now() ? (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">환불 처리 가능</p>
                        ) : (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {Math.ceil((new Date(approval.approval_date).getTime() + 3 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24))}일 후 처리 예정
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        사유: {approval.refund_reason}
                      </p>
                      {approval.approval_notes && (
                        <p className="text-xs text-gray-400">
                          승인 메모: {approval.approval_notes}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label htmlFor={`amount-${approval.id}`} className="text-xs">즉시 환불 금액</Label>
                          <Input
                            id={`amount-${approval.id}`}
                            type="number"
                            placeholder={approval.approved_amount?.toString() || approval.refund_amount.toString()}
                            className="h-8 text-sm"
                            min="0"
                            max={approval.refund_amount}
                            step="1000"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor={`reason-${approval.id}`} className="text-xs">즉시 환불 사유</Label>
                          <Input
                            id={`reason-${approval.id}`}
                            type="text"
                            placeholder="즉시 환불 사유"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const amountInput = document.getElementById(`amount-${approval.id}`) as HTMLInputElement;
                              const reasonInput = document.getElementById(`reason-${approval.id}`) as HTMLInputElement;
                              let amount = amountInput?.value || '';
                              const reason = reasonInput?.value || '';
                              
                              // 금액이 입력되지 않았으면 승인 금액 사용
                              if (!amount) {
                                amount = (approval.approved_amount || approval.refund_amount).toString();
                              }
                              
                              // 금액 검증
                              const requestedAmount = approval.refund_amount; // 신청 금액 기준
                              const inputAmount = parseFloat(amount);
                              if (inputAmount > requestedAmount) {
                                alert(`환불 금액은 신청 금액(${requestedAmount.toLocaleString()}원)을 초과할 수 없습니다.`);
                                return;
                              }
                              
                              handleSimulateSingleRefund(approval.id, amount, reason);
                            }}
                            disabled={isLoading}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <KeenIcon icon="eye" className="size-3 mr-1" />
                            시뮬레이션
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                            onClick={() => {
                              const amountInput = document.getElementById(`amount-${approval.id}`) as HTMLInputElement;
                              const reasonInput = document.getElementById(`reason-${approval.id}`) as HTMLInputElement;
                              let amount = amountInput?.value || '';
                              const reason = reasonInput?.value || '';
                              
                              // 금액이 입력되지 않았으면 승인 금액 사용
                              if (!amount) {
                                amount = (approval.approved_amount || approval.refund_amount).toString();
                              }
                              
                              // 금액 검증
                              const requestedAmount = approval.refund_amount; // 신청 금액 기준
                              const inputAmount = parseFloat(amount);
                              if (inputAmount > requestedAmount) {
                                alert(`환불 금액은 신청 금액(${requestedAmount.toLocaleString()}원)을 초과할 수 없습니다.`);
                                return;
                              }
                              
                              handleProcessSingleRefund(approval.id, amount, reason);
                            }}
                            disabled={isLoading}
                          >
                            즉시 처리
                          </Button>
                        </div>
                      </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 개별 환불 시뮬레이션 결과 */}
      {showSingleSimulation && singleSimulationResult.length > 0 && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeenIcon icon="eye" className="size-5 text-purple-600 dark:text-purple-400" />
                <span>개별 환불 시뮬레이션 결과</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSingleSimulation(false)}
              >
                <KeenIcon icon="cross" className="size-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                아래는 개별 환불 처리 시 발생할 변경사항입니다. (실제로 변경되지 않음)
              </p>
              
              {/* 테이블별로 그룹화 */}
              {Object.entries(
                singleSimulationResult.reduce((acc: Record<string, any[]>, item: any) => {
                  if (!acc[item.table_name]) acc[item.table_name] = [];
                  acc[item.table_name].push(item);
                  return acc;
                }, {} as Record<string, any[]>)
              ).map(([tableName, items]) => (
                <div key={tableName} className="border rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <KeenIcon icon="database" className="size-4" />
                    {tableName} 테이블
                  </h4>
                  <div className="space-y-2">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={
                              item.action === 'INSERT' ? 'default' : 
                              item.action === 'ERROR' ? 'destructive' : 
                              item.action === 'UPDATE' ? 'secondary' : 
                              'outline'
                            } 
                            className={`text-xs ${item.action === 'UPDATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}`}
                          >
                            {item.action}
                          </Badge>
                          <span className="text-xs text-gray-500">ID: {item.record_id || 'NEW'}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{item.description}</p>
                        {item.changes && Object.keys(item.changes).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                              상세 정보 보기
                            </summary>
                            <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                              {JSON.stringify(item.changes, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RefundTestPage;