import { RefundSettings, RefundCalculation } from '@/types/refund.types';

/**
 * 환불 가능 여부 및 금액 계산
 */
export const calculateRefund = (
  startDate: string | null,
  endDate: string | null,
  originalAmount: number,
  refundSettings: RefundSettings,
  currentDate: Date = new Date()
): RefundCalculation => {
  // 환불이 비활성화된 경우
  if (!refundSettings.enabled) {
    return {
      isRefundable: false,
      refundAmount: 0,
      originalAmount,
      usedDays: 0,
      remainingDays: 0,
      refundRate: 0,
      message: '환불이 불가능한 상품입니다.',
      requiresApproval: false
    };
  }

  // 날짜가 없는 경우
  if (!startDate || !endDate) {
    return {
      isRefundable: false,
      refundAmount: 0,
      originalAmount,
      usedDays: 0,
      remainingDays: 0,
      refundRate: 0,
      message: '시작일 또는 종료일이 설정되지 않았습니다.',
      requiresApproval: false
    };
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  // 전체 기간 계산 (일)
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // 사용 일수 계산
  let usedDays = 0;
  let remainingDays = totalDays;
  
  if (today < start) {
    // 아직 시작하지 않은 경우
    usedDays = 0;
    remainingDays = totalDays;
  } else if (today > end) {
    // 이미 종료된 경우
    usedDays = totalDays;
    remainingDays = 0;
  } else {
    // 진행 중인 경우
    usedDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    // SlotList와 동일한 계산 방식 사용
    remainingDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // 최소 사용 일수 체크
  if (usedDays < refundSettings.refund_rules.min_usage_days) {
    return {
      isRefundable: false,
      refundAmount: 0,
      originalAmount,
      usedDays,
      remainingDays,
      refundRate: 0,
      message: `최소 ${refundSettings.refund_rules.min_usage_days}일 이상 사용 후 환불 가능합니다.`,
      requiresApproval: false
    };
  }

  // 최대 환불 가능 일수 체크
  if (usedDays > refundSettings.refund_rules.max_refund_days) {
    return {
      isRefundable: false,
      refundAmount: 0,
      originalAmount,
      usedDays,
      remainingDays,
      refundRate: 0,
      message: `사용 ${refundSettings.refund_rules.max_refund_days}일 이내에만 환불 가능합니다.`,
      requiresApproval: false
    };
  }

  // 환불 금액 계산
  let refundAmount = 0;
  let refundRate = 100; // 기본값 100%

  if (refundSettings.refund_rules.partial_refund && totalDays > 0) {
    // 부분 환불: 남은 일수 비율로 계산
    refundRate = (remainingDays / totalDays) * 100;
    refundAmount = Math.ceil(originalAmount * (refundRate / 100));
  } else {
    // 전액 환불 (사용하지 않은 기간 전체)
    refundAmount = originalAmount;
  }

  // 예상 환불 날짜 계산
  let expectedRefundDate: string | undefined;
  if (refundSettings.type === 'delayed' && refundSettings.delay_days) {
    const refundDate = new Date(currentDate);
    refundDate.setDate(refundDate.getDate() + refundSettings.delay_days);
    expectedRefundDate = refundDate.toISOString().split('T')[0];
  } else if (refundSettings.type === 'cutoff_based' && refundSettings.cutoff_time) {
    const [hours, minutes] = refundSettings.cutoff_time.split(':').map(Number);
    const cutoffToday = new Date(currentDate);
    cutoffToday.setHours(hours, minutes, 0, 0);
    
    const refundDate = new Date(currentDate);
    if (currentDate > cutoffToday) {
      // 마감 시간이 지났으면 다음날부터 환불
      refundDate.setDate(refundDate.getDate() + 1);
    }
    expectedRefundDate = refundDate.toISOString().split('T')[0];
  }

  return {
    isRefundable: true,
    refundAmount,
    originalAmount,
    usedDays,
    remainingDays,
    refundRate,
    requiresApproval: refundSettings.requires_approval,
    expectedRefundDate
  };
};

/**
 * 환불 시점 텍스트 생성
 */
export const getRefundTypeText = (refundSettings: RefundSettings): string => {
  switch (refundSettings.type) {
    case 'immediate':
      return '즉시 환불';
    case 'delayed':
      return `${refundSettings.delay_days}일 후 환불`;
    case 'cutoff_based':
      return `마감시간(${refundSettings.cutoff_time}) 기준 환불`;
    default:
      return '즉시 환불';
  }
};

/**
 * 환불 규칙 요약 텍스트 생성
 */
export const getRefundRulesSummary = (refundSettings: RefundSettings): string[] => {
  const rules: string[] = [];
  
  if (!refundSettings.enabled) {
    rules.push('환불 불가');
    return rules;
  }

  // 환불 시점
  rules.push(getRefundTypeText(refundSettings));

  // 최소 사용 일수
  if (refundSettings.refund_rules.min_usage_days > 0) {
    rules.push(`최소 ${refundSettings.refund_rules.min_usage_days}일 사용 후 환불 가능`);
  }

  // 최대 환불 가능 일수
  if (refundSettings.refund_rules.max_refund_days < 365) {
    rules.push(`사용 ${refundSettings.refund_rules.max_refund_days}일 이내 환불 가능`);
  }

  // 환불 방식
  if (refundSettings.refund_rules.partial_refund) {
    rules.push('일할 계산 환불');
  } else {
    rules.push('전액 환불');
  }

  // 승인 필요 여부
  if (refundSettings.requires_approval) {
    rules.push('승인 후 환불');
  }

  return rules;
};