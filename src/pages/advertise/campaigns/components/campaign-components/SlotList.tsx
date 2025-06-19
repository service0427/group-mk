import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { SlotItem, Campaign } from './types';
import { KeenIcon } from '@/components';
import EditableCell from './EditableCell';
import { formatDate, getStatusBadge } from './constants';
import { hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';
import TransactionConfirmModal from './TransactionConfirmModal';

interface SlotListProps {
  filteredSlots: SlotItem[];
  isLoading: boolean;
  error: string | null;
  serviceType: string;
  editingCell: { id: string; field: string };
  editingValue: string;
  onEditStart: (id: string, field: string) => void;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDeleteSlot: (id: string) => void;
  onOpenMemoModal: (id: string) => void;
  onConfirmTransaction?: (id: string) => void;
  userRole?: string;
  hasFilters?: boolean;
  isAllData?: boolean;
  onCancelSlot?: (id: string | string[]) => void;
  onRefundSlot?: (id: string | string[]) => void; // 환불 핸들러 추가
  showBulkActions?: boolean;
  selectedSlots?: string[];
  onSelectedSlotsChange?: (selectedSlots: string[]) => void;
  showBulkCancel?: boolean;
  customStatusLabels?: Record<string, string>; // 커스텀 상태 라벨
}

// CSS for tooltip
const tooltipStyles = `
  .campaign-status-dot {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .campaign-status-tooltip {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    z-index: 50;
    background-color: #1f2937;
    color: white;
    font-size: 0.75rem;
    border-radius: 0.375rem;
    padding: 0.5rem;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 0.5rem;
    white-space: nowrap;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid #374151;
    transition: opacity 0.2s, visibility 0.2s;
  }
  
  .campaign-status-dot:hover .campaign-status-tooltip {
    visibility: visible;
    opacity: 1;
  }
  
  .campaign-status-arrow {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #1f2937;
  }
`;

const SlotList: React.FC<SlotListProps> = ({
  filteredSlots,
  isLoading,
  error,
  serviceType,
  editingCell,
  editingValue,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDeleteSlot,
  onOpenMemoModal,
  onConfirmTransaction,
  userRole,
  hasFilters = false,
  isAllData = false,
  onCancelSlot,
  onRefundSlot,
  showBulkActions = false,
  selectedSlots: externalSelectedSlots,
  onSelectedSlotsChange,
  showBulkCancel = false,
  customStatusLabels
}) => {
  // 외부에서 관리되는 selectedSlots가 있으면 사용, 없으면 내부 상태로 관리
  const [internalSelectedSlots, setInternalSelectedSlots] = useState<string[]>([]);
  const selectedSlots = externalSelectedSlots !== undefined ? externalSelectedSlots : internalSelectedSlots;
  const updateSelectedSlots = (newSelectedSlots: string[]) => {
    if (onSelectedSlotsChange) {
      onSelectedSlotsChange(newSelectedSlots);
    } else {
      setInternalSelectedSlots(newSelectedSlots);
    }
  };

  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [openRejectionId, setOpenRejectionId] = useState<string | null>(null);
  const [openKeywordTooltipId, setOpenKeywordTooltipId] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTransactionSlot, setSelectedTransactionSlot] = useState<SlotItem | null>(null);
  const [openRefundRejectionId, setOpenRefundRejectionId] = useState<string | null>(null);
  
  // 추가 정보 팝오버 상태 (수동 입력 서비스용)
  const [openInfoPopoverId, setOpenInfoPopoverId] = useState<string | null>(null);
  const [infoPopoverPosition, setInfoPopoverPosition] = useState({ top: 0, left: 0 });

  // 남은 일수 계산 함수
  const calculateRemainingDays = (endDate: string | null): number | null => {
    if (!endDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // 남은 일수에 따른 색상 클래스 반환
  const getRemainingDaysColorClass = (days: number | null, slot?: SlotItem): string => {
    // 환불 승인 상태거나 환불 요청이 승인된 경우 일반 색상
    if (slot?.status === 'refund_approved' || 
        slot?.refund_requests?.some(req => req.status === 'approved')) {
      return 'text-gray-700 dark:text-gray-300';
    }
    
    if (days === null) return 'text-gray-400';
    if (days < 0) return 'text-gray-500'; // 마감됨
    if (days === 0) return 'text-red-600 font-bold'; // 오늘 마감
    if (days <= 3) return 'text-orange-500 font-semibold'; // 3일 이하
    if (days <= 7) return 'text-yellow-600'; // 7일 이하
    return 'text-gray-700 dark:text-gray-300'; // 일반
  };

  // 남은 일수 표시 텍스트
  const getRemainingDaysText = (days: number | null, slot?: SlotItem): string => {
    // 환불 승인 상태거나 환불 요청이 승인된 경우 '-' 표시
    if (slot?.status === 'refund_approved' || 
        slot?.refund_requests?.some(req => req.status === 'approved')) {
      return '-';
    }
    
    if (days === null) return '-';
    if (days < 0) return '마감';
    if (days === 0) return '0일';
    return `${days}일`;
  };

  // 커스텀 상태 배지 (MyServicesPage용)
  const getCustomStatusBadge = (status: string, slot?: SlotItem): JSX.Element => {
    // 환불 거절된 슬롯 확인
    const hasRejectedRefund = slot?.refund_requests?.some(req => req.status === 'rejected');
    // 환불 승인된 슬롯 확인
    const hasApprovedRefund = slot?.refund_requests?.some(req => req.status === 'approved');
    
    // refund_approved 상태는 특별 처리
    if (status === 'refund_approved') {
      return (
        <div className="flex items-center gap-1">
          <span className="badge badge-primary whitespace-nowrap">환불승인</span>
          <div className="relative">
            <button
              className="badge badge-info whitespace-nowrap text-xs cursor-pointer flex items-center gap-1"
              data-refund-rejection-id={slot?.id}
              onClick={(e) => {
                e.stopPropagation();
                setOpenRefundRejectionId(openRefundRejectionId === slot?.id ? null : slot?.id || null);
              }}
            >
              환불정보
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </button>
            {openRefundRejectionId === slot?.id && ReactDOM.createPortal(
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenRefundRejectionId(null)} />
                <div 
                  className="fixed z-50 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded p-3 w-72 max-w-xs shadow-xl border border-gray-700 dark:border-gray-600"
                  style={{
                    left: (() => {
                      const button = document.querySelector(`[data-refund-rejection-id="${slot.id}"]`);
                      if (!button) return '0px';
                      const rect = button.getBoundingClientRect();
                      const tooltipWidth = 288; // w-72 = 18rem = 288px
                      let left = rect.right - tooltipWidth;
                      if (left < 10) left = 10;
                      if (left + tooltipWidth > window.innerWidth - 10) {
                        left = window.innerWidth - tooltipWidth - 10;
                      }
                      return `${left}px`;
                    })(),
                    top: (() => {
                      const button = document.querySelector(`[data-refund-rejection-id="${slot.id}"]`);
                      if (!button) return '0px';
                      const rect = button.getBoundingClientRect();
                      const tooltipHeight = 150; // 대략적인 툴팁 높이
                      
                      // 화면 상단에 공간이 충분한지 확인
                      if (rect.top - tooltipHeight - 8 < 10) {
                        // 공간이 부족하면 버튼 아래에 표시
                        return `${rect.bottom + 8}px`;
                      } else {
                        // 공간이 충분하면 버튼 위에 표시
                        return `${rect.top - tooltipHeight - 8}px`;
                      }
                    })()
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-sm">환불 정보</div>
                    <button
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenRefundRejectionId(null);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  {/* 환불 승인 정보 */}
                  {slot?.refund_requests && slot.refund_requests.length > 0 ? (
                    slot.refund_requests
                      .filter(req => req.status === 'approved')
                      .map((request, index) => (
                      <div key={request.id} className={index > 0 ? 'mt-3 pt-3 border-t border-gray-700' : ''}>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-400 mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span className="font-medium">환불 승인됨</span>
                          </div>
                          <div>
                            <span className="text-gray-400">환불 사유:</span>
                            <div className="text-gray-200 mt-1">{request.refund_reason || '사유 없음'}</div>
                          </div>
                          {request.approval_date && (
                            <div className="text-gray-400 text-xs">
                              승인일: {formatDate(request.approval_date)}
                            </div>
                          )}
                          {slot.campaign?.refund_settings && request.approval_date && (
                            <div className="bg-blue-900/30 border border-blue-700/50 rounded-md p-2 mt-2">
                              <div className="text-blue-300 text-xs space-y-1">
                                {slot.campaign.refund_settings.type === 'immediate' && (
                                  <>
                                    <div className="font-medium">💡 즉시 환불</div>
                                    <div>환불 예정일: 즉시 처리</div>
                                  </>
                                )}
                                {slot.campaign.refund_settings.type === 'delayed' && (
                                  <>
                                    <div className="font-medium">💡 지연 환불</div>
                                    <div>
                                      환불 예정일: {(() => {
                                        const approvalDate = new Date(request.approval_date);
                                        const refundDate = new Date(approvalDate);
                                        refundDate.setDate(refundDate.getDate() + (slot.campaign.refund_settings.delay_days || 0));
                                        return formatDate(refundDate.toISOString());
                                      })()}
                                    </div>
                                    <div className="text-gray-400">
                                      (승인일 + {slot.campaign.refund_settings.delay_days}일)
                                    </div>
                                  </>
                                )}
                                {slot.campaign.refund_settings.type === 'cutoff_based' && (
                                  <>
                                    <div className="font-medium">💡 마감시간 기준 환불</div>
                                    <div>
                                      환불 예정일: {(() => {
                                        const approvalDate = new Date(request.approval_date);
                                        const [hours, minutes] = (slot.campaign.refund_settings.cutoff_time || '00:00').split(':').map(Number);
                                        const refundDate = new Date(approvalDate);
                                        refundDate.setHours(hours, minutes, 0, 0);
                                        
                                        // 승인 시간이 마감시간을 지났으면 다음날로
                                        if (refundDate <= approvalDate) {
                                          refundDate.setDate(refundDate.getDate() + 1);
                                        }
                                        
                                        return `${formatDate(refundDate.toISOString())} ${slot.campaign.refund_settings.cutoff_time}`;
                                      })()}
                                    </div>
                                    <div className="text-gray-400">
                                      (마감시간: {slot.campaign.refund_settings.cutoff_time})
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    // 환불 요청 정보가 없을 때
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-blue-400 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span className="font-medium">환불 승인 상태</span>
                      </div>
                      <div className="text-gray-300">
                        이 슬롯은 환불이 승인되었습니다.
                      </div>
                      {slot?.campaign?.refund_settings && (
                        <div className="bg-blue-900/30 border border-blue-700/50 rounded-md p-2 mt-2">
                          <div className="text-blue-300 text-xs">
                            {slot.campaign.refund_settings.type === 'immediate' && '💡 즉시 환불 처리'}
                            {slot.campaign.refund_settings.type === 'delayed' && 
                              `💡 ${slot.campaign.refund_settings.delay_days}일 후 환불 예정`}
                            {slot.campaign.refund_settings.type === 'cutoff_based' && 
                              `💡 마감시간(${slot.campaign.refund_settings.cutoff_time}) 이후 환불 예정`}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>,
              document.body
            )}
          </div>
        </div>
      );
    }
    
    // customStatusLabels가 있고 해당 상태가 정의되어 있으면 커스텀 라벨 사용
    if (customStatusLabels && customStatusLabels[status]) {
      // approved 상태를 진행중으로 표시
      if (status === 'approved') {
        return (
          <div className="flex items-center gap-1">
            <span className="badge badge-success whitespace-nowrap">{customStatusLabels[status]}</span>
            {hasRejectedRefund && (
              <div className="relative">
                <button
                  className="badge badge-danger whitespace-nowrap text-xs cursor-pointer flex items-center gap-1"
                  data-refund-rejection-id={slot?.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenRefundRejectionId(openRefundRejectionId === slot?.id ? null : slot?.id || null);
                  }}
                >
                  환불거절
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </button>
                {openRefundRejectionId === slot?.id && ReactDOM.createPortal(
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpenRefundRejectionId(null)} />
                    <div 
                      className="fixed z-50 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded p-3 w-72 max-w-xs shadow-xl border border-gray-700 dark:border-gray-600"
                      style={{
                        left: (() => {
                          const button = document.querySelector(`[data-refund-rejection-id="${slot.id}"]`);
                          if (!button) return '0px';
                          const rect = button.getBoundingClientRect();
                          const tooltipWidth = 288; // w-72 = 18rem = 288px
                          let left = rect.right - tooltipWidth;
                          if (left < 10) left = 10;
                          if (left + tooltipWidth > window.innerWidth - 10) {
                            left = window.innerWidth - tooltipWidth - 10;
                          }
                          return `${left}px`;
                        })(),
                        top: (() => {
                          const button = document.querySelector(`[data-refund-rejection-id="${slot.id}"]`);
                          if (!button) return '0px';
                          const rect = button.getBoundingClientRect();
                          const tooltipHeight = 150; // 대략적인 툴팁 높이
                          
                          // 화면 상단에 공간이 충분한지 확인
                          if (rect.top - tooltipHeight - 8 < 10) {
                            // 공간이 부족하면 버튼 아래에 표시
                            return `${rect.bottom + 8}px`;
                          } else {
                            // 공간이 충분하면 버튼 위에 표시
                            return `${rect.top - tooltipHeight - 8}px`;
                          }
                        })()
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-sm">환불 정보</div>
                        <button
                          className="text-gray-400 hover:text-gray-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenRefundRejectionId(null);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      {/* 환불 승인 정보 */}
                      {slot?.refund_requests && slot.refund_requests.length > 0 ? (
                        slot.refund_requests
                          .filter(req => req.status === 'approved')
                          .map((request, index) => (
                          <div key={request.id} className={index > 0 ? 'mt-3 pt-3 border-t border-gray-700' : ''}>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-green-400 mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <span className="font-medium">환불 승인됨</span>
                              </div>
                              <div>
                                <span className="text-gray-400">환불 사유:</span>
                                <div className="text-gray-200 mt-1">{request.refund_reason || '사유 없음'}</div>
                              </div>
                              {request.approval_date && (
                                <div className="text-gray-400 text-xs">
                                  승인일: {formatDate(request.approval_date)}
                                </div>
                              )}
                              {slot.campaign?.refund_settings && request.approval_date && (
                                <div className="bg-blue-900/30 border border-blue-700/50 rounded-md p-2 mt-2">
                                  <div className="text-blue-300 text-xs space-y-1">
                                    {slot.campaign.refund_settings.type === 'immediate' && (
                                      <>
                                        <div className="font-medium">💡 즉시 환불</div>
                                        <div>환불 예정일: 즉시 처리</div>
                                      </>
                                    )}
                                    {slot.campaign.refund_settings.type === 'delayed' && (
                                      <>
                                        <div className="font-medium">💡 지연 환불</div>
                                        <div>
                                          환불 예정일: {(() => {
                                            const approvalDate = new Date(request.approval_date);
                                            const refundDate = new Date(approvalDate);
                                            refundDate.setDate(refundDate.getDate() + (slot.campaign.refund_settings.delay_days || 0));
                                            return formatDate(refundDate.toISOString());
                                          })()}
                                        </div>
                                        <div className="text-gray-400">
                                          (승인일 + {slot.campaign.refund_settings.delay_days}일)
                                        </div>
                                      </>
                                    )}
                                    {slot.campaign.refund_settings.type === 'cutoff_based' && (
                                      <>
                                        <div className="font-medium">💡 마감시간 기준 환불</div>
                                        <div>
                                          환불 예정일: {(() => {
                                            const approvalDate = new Date(request.approval_date);
                                            const [hours, minutes] = (slot.campaign.refund_settings.cutoff_time || '00:00').split(':').map(Number);
                                            const refundDate = new Date(approvalDate);
                                            refundDate.setHours(hours, minutes, 0, 0);
                                            
                                            // 승인 시간이 마감시간을 지났으면 다음날로
                                            if (refundDate <= approvalDate) {
                                              refundDate.setDate(refundDate.getDate() + 1);
                                            }
                                            
                                            return `${formatDate(refundDate.toISOString())} ${slot.campaign.refund_settings.cutoff_time}`;
                                          })()}
                                        </div>
                                        <div className="text-gray-400">
                                          (마감시간: {slot.campaign.refund_settings.cutoff_time})
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        // 환불 요청 정보가 없을 때
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-blue-400 mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <span className="font-medium">환불 승인 상태</span>
                          </div>
                          <div className="text-gray-300">
                            이 슬롯은 환불이 승인되었습니다.
                          </div>
                          {slot?.campaign?.refund_settings && (
                            <div className="bg-blue-900/30 border border-blue-700/50 rounded-md p-2 mt-2">
                              <div className="text-blue-300 text-xs">
                                {slot.campaign.refund_settings.type === 'immediate' && '💡 즉시 환불 처리'}
                                {slot.campaign.refund_settings.type === 'delayed' && 
                                  `💡 ${slot.campaign.refund_settings.delay_days}일 후 환불 예정`}
                                {slot.campaign.refund_settings.type === 'cutoff_based' && 
                                  `💡 마감시간(${slot.campaign.refund_settings.cutoff_time}) 이후 환불 예정`}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* 환불 거절 정보 */}
                      {slot?.refund_requests && slot.refund_requests
                        .filter(req => req.status === 'rejected')
                        .map((request, index) => (
                          <div key={request.id} className={slot.refund_requests?.filter(r => r.status === 'approved').length || 0 > 0 || index > 0 ? 'mt-3 pt-3 border-t border-gray-700' : ''}>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-red-400 mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                <span className="font-medium">환불 거절됨</span>
                              </div>
                              <div>
                                <span className="text-gray-400">거절 사유:</span>
                                <div className="text-gray-200 mt-1">{request.approval_notes || '사유 없음'}</div>
                              </div>
                              {request.approval_date && (
                                <div className="text-gray-400 text-xs">
                                  거절일: {formatDate(request.approval_date)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </>,
                  document.body
                )}
              </div>
            )}
          </div>
        );
      }
    }
    // 기본 getStatusBadge 사용
    return getStatusBadge(status);
  };

  // 캠페인 상태에 따른 닷 색상과 메시지
  const getCampaignStatusDot = (campaign?: Campaign) => {
    if (!campaign) return null;

    const statusConfig = {
      active: { color: 'bg-green-500', text: '진행중' },
      paused: { color: 'bg-yellow-500', text: '일시중지' },
      completed: { color: 'bg-gray-500', text: '종료' },
      pending: { color: 'bg-blue-500', text: '대기중' }
    };

    const config = statusConfig[campaign.status as keyof typeof statusConfig] ||
      { color: 'bg-gray-400', text: '알 수 없음' };

    return (
      <div className="campaign-status-dot">
        <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
        <div className="campaign-status-tooltip">
          {config.text}
          <div className="campaign-status-arrow"></div>
        </div>
      </div>
    );
  };

  // 캠페인 로고 가져오기 (ApprovePage 로직 적용)
  const getCampaignLogo = (item: SlotItem): string => {
    // 캠페인 로고가 있으면 우선 사용
    if (item.campaign?.logo) {
      // 동물 아이콘인 경우 (/media 경로 포함)
      if (!item.campaign.logo.startsWith('http') && !item.campaign.logo.startsWith('/')) {
        return `/media/${item.campaign.logo}`;
      }
      return item.campaign.logo;
    }

    // 없으면 서비스 타입에 따른 기본 로고 사용
    // 캠페인의 serviceType이나 URL의 serviceType 체크
    const service = item.campaign?.serviceType || serviceType;
    if (service?.includes('Naver') || service?.includes('naver')) {
      return '/media/ad-brand/naver.png';
    } else if (service?.includes('Coupang') || service?.includes('coupang')) {
      return '/media/ad-brand/coupang-app.png';
    } else if (service?.includes('ohouse')) {
      return '/media/ad-brand/ohouse.png';
    }

    return '/media/app/mini-logo-circle-gray.svg';
  };

  // 슬롯 선택 처리
  const handleSlotSelect = (slotId: string) => {
    if (selectedSlots.includes(slotId)) {
      updateSelectedSlots(selectedSlots.filter(id => id !== slotId));
    } else {
      updateSelectedSlots([...selectedSlots, slotId]);
    }
  };

  // 전체 선택/해제 처리
  const handleSelectAll = () => {
    if (selectAll) {
      updateSelectedSlots([]);
    } else {
      // 선택 가능한 슬롯만 필터링 (pending 또는 submitted 상태)
      const selectableSlots = filteredSlots
        .filter(slot => slot.status === 'pending' || slot.status === 'submitted')
        .map(slot => slot.id);
      updateSelectedSlots(selectableSlots);
    }
    setSelectAll(!selectAll);
  };

  // 일괄 취소 처리
  const handleBulkCancel = () => {
    if (selectedSlots.length > 0 && onCancelSlot) {
      onCancelSlot(selectedSlots);
    }
  };

  // 거래 완료 클릭 핸들러
  const handleTransactionClick = (slot: SlotItem) => {
    setSelectedTransactionSlot(slot);
    setTransactionModalOpen(true);
  };

  // 거래 완료 확인 핸들러
  const handleConfirmTransaction = () => {
    if (selectedTransactionSlot && onConfirmTransaction) {
      onConfirmTransaction(selectedTransactionSlot.id);
      setTransactionModalOpen(false);
      setSelectedTransactionSlot(null);
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">데이터를 불러오는 중입니다...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-error">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (filteredSlots.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="text-center py-8 text-gray-500">
            {serviceType
              ? '이 서비스 유형에 대한 등록된 슬롯이 없습니다.'
              : '데이터가 없습니다.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{tooltipStyles}</style>
      <div className="card shadow-sm">
        {/* 자동 거래 완료 안내 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center">
              <KeenIcon icon="information-2" className="text-blue-600 dark:text-blue-400 size-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                자동 거래 완료 안내
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                작업 완료 상태인 슬롯은 <span className="font-semibold">48시간 이내</span>에 거래 완료 버튼을 누르지 않으면
                <span className="font-semibold"> 자동으로 거래가 완료됩니다.</span>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                문제가 있는 경우 48시간 이내에 고객센터로 문의해주세요.
              </p>
            </div>
          </div>
        </div>

        <div className="card-header px-6 py-3.5" style={{ minHeight: '60px' }}>
          <div className="flex items-center justify-between w-full h-full">
            <div className="flex items-center gap-3">
              <h3 className="card-title text-base">슬롯 목록</h3>
              {selectedSlots.length > 0 && (
                <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                  {selectedSlots.length}개 선택됨
                </span>
              )}
            </div>
            <div className="card-toolbar">
              {showBulkActions && selectedSlots.length > 0 ? (
                <div className="flex gap-2 items-center">
                  {showBulkCancel && (
                    <button
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-warning hover:bg-warning/80 text-white transition-colors"
                      onClick={handleBulkCancel}
                    >
                      일괄 취소
                    </button>
                  )}
                  <button
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700 transition-colors"
                    onClick={() => {
                      updateSelectedSlots([]);
                      setSelectAll(false);
                    }}
                  >
                    선택 해제
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    전체 <span className="text-primary font-medium">{filteredSlots.length}</span> 건
                  </span>
                  {hasFilters && <span className="text-gray-500 text-xs">(필터 적용됨)</span>}
                  {isAllData && <span className="text-info text-xs">(전체 데이터)</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop View - 테이블 형식 (md 이상) */}
        <div className="hidden md:block">
          <div className="card-body px-6 py-4">
            <div className="overflow-x-auto">
              <table className="table align-middle text-sm w-full text-left border-separate border-spacing-0 table-fixed slot-list-table">
                <thead>
                  <tr className="bg-muted dark:bg-gray-800/60">
                    {showBulkActions && (
                      <th className="py-2 px-1 text-center w-[5%]">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            title="전체 선택/해제"
                          />
                        </div>
                      </th>
                    )}
                    {userRole && hasPermission(userRole, PERMISSION_GROUPS.ADMIN) && (
                      <th className="py-2 px-3 text-start font-medium text-xs w-[15%]">사용자</th>
                    )}
                    <th className="py-2 px-3 text-start font-medium text-xs w-[15%]">
                      {filteredSlots.some(slot => slot.inputData?.is_manual_input) ? '입력 정보' : '상품명'}
                    </th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-[12%]">
                      {filteredSlots.some(slot => slot.inputData?.is_manual_input) ? '' : '키워드'}
                    </th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-[10%]">캠페인</th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-[8%]">상태</th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-[8%]">시작일</th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-[8%]">마감일</th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-[6%]">남은일</th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-[8%]">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSlots.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/40">
                      {showBulkActions && (
                        <td className="py-2 px-1 text-center w-[5%]">
                          <div className="flex items-center justify-center">
                            {(item.status === 'pending' || item.status === 'submitted') && (
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-primary"
                                checked={selectedSlots.includes(item.id)}
                                onChange={() => handleSlotSelect(item.id)}
                              />
                            )}
                          </div>
                        </td>
                      )}

                      {/* 사용자 */}
                      {userRole && hasPermission(userRole, PERMISSION_GROUPS.ADMIN) && (
                        <td className="py-2 px-3 w-[15%]">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {item.user?.full_name || '이름 없음'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {item.user?.email || ''}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* 상품명 / 입력 정보 */}
                      <td className="py-2 px-3 w-[20%]">
                        {item.inputData?.is_manual_input ? (
                          // 수동 입력 서비스인 경우 - 입력된 정보들을 나열
                          <div 
                            className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setInfoPopoverPosition({
                                top: rect.top + rect.height / 2,
                                left: rect.left + rect.width
                              });
                              setOpenInfoPopoverId(openInfoPopoverId === item.id ? null : item.id);
                            }}
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                              {(() => {
                                // 필드명 한글 매핑
                                const fieldNameMap: Record<string, string> = {
                                  'work_days': '작업일',
                                  'minimum_purchase': '최소 구매수',
                                  'url': 'URL',
                                  'mid': '상점 ID',
                                  'description': '설명',
                                  'product_name': '상품명',
                                  'keywords': '키워드',
                                  'start_date': '시작일',
                                  'end_date': '종료일'
                                };
                                
                                // input_data에서 표시할 필드들 추출
                                const displayFields: string[] = [];
                                const excludeFields = ['is_manual_input', 'mainKeyword', 'service_type', 'campaign_name', 'price', 'workCount', 'minimum_purchase', 'work_days'];
                                
                                Object.entries(item.inputData || {}).forEach(([key, value]) => {
                                  if (!excludeFields.includes(key) && value && value !== '') {
                                    const displayKey = fieldNameMap[key] || key;
                                    displayFields.push(`${displayKey}: ${value}`);
                                  }
                                });
                                
                                const displayText = displayFields.join(', ');
                                return displayText.length > 50 ? displayText.substring(0, 50) + '...' : displayText || '-';
                              })()}
                            </span>
                            <KeenIcon icon="information-2" className="text-gray-400 size-4 flex-shrink-0" />
                          </div>
                        ) : (
                          // 기존 상품명 표시
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <EditableCell
                              id={item.id}
                              field="mid"
                              value={item.inputData?.mid || ''}
                              editingCell={editingCell}
                              editingValue={editingValue}
                              onEditStart={onEditStart}
                              onEditChange={onEditChange}
                              onEditSave={onEditSave}
                              onEditCancel={onEditCancel}
                              placeholder="MID를 입력해주세요"
                              disabled={item.status !== 'pending'}
                            >
                              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {item.inputData?.mid || '-'}
                              </span>
                            </EditableCell>

                            <EditableCell
                              id={item.id}
                              field="url"
                              value={item.inputData?.url || ''}
                              editingCell={editingCell}
                              editingValue={editingValue}
                              onEditStart={onEditStart}
                              onEditChange={onEditChange}
                              onEditSave={onEditSave}
                              onEditCancel={onEditCancel}
                              isUrl={true}
                              disabled={item.status !== 'pending'}
                            />
                          </div>
                        )}
                      </td>

                      {/* 키워드 */}
                      <td className="py-2 px-3 w-[15%]">
                        {item.inputData?.is_manual_input ? (
                          // 수동 입력 서비스인 경우 빈 칸
                          <div></div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 relative">
                            {(() => {
                            // 키워드 배열 생성 (메인키워드 + 서브키워드)
                            const keywordArray = [];
                            if (item.inputData.mainKeyword) {
                              keywordArray.push(item.inputData.mainKeyword);
                            }
                            if (Array.isArray(item.inputData.keywords)) {
                              keywordArray.push(...item.inputData.keywords);
                            }

                            if (keywordArray.length === 0) {
                              return <span className="text-gray-400 text-sm">-</span>;
                            }

                            const mainKeyword = keywordArray[0];
                            const additionalCount = keywordArray.length - 1;

                            return (
                              <>
                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                  {mainKeyword}
                                </span>
                                {additionalCount > 0 && (
                                  <>
                                    <button
                                      className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors cursor-pointer min-w-[20px] h-5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setPopoverPosition({
                                          top: rect.top - 10,
                                          left: rect.left + rect.width / 2
                                        });
                                        setOpenKeywordTooltipId(openKeywordTooltipId === item.id ? null : item.id);
                                      }}
                                    >
                                      +{additionalCount}
                                    </button>
                                    {/* Tooltip */}
                                    {openKeywordTooltipId === item.id && ReactDOM.createPortal(
                                      <>
                                        {/* 배경 클릭 시 닫기 */}
                                        <div
                                          className="fixed inset-0"
                                          style={{ zIndex: 9998 }}
                                          onClick={() => setOpenKeywordTooltipId(null)}
                                        />
                                        <div
                                          className="fixed bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 w-64 shadow-xl border border-gray-700 dark:border-gray-600"
                                          style={{
                                            zIndex: 99999,
                                            left: `${popoverPosition.left}px`,
                                            top: `${popoverPosition.top}px`,
                                            transform: 'translate(-50%, -100%)'
                                          }}
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="font-medium text-gray-100">전체 키워드</div>
                                            <button
                                              className="text-gray-400 hover:text-gray-200 transition-colors"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenKeywordTooltipId(null);
                                              }}
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                              </svg>
                                            </button>
                                          </div>
                                          <div className="space-y-2">
                                            {/* 메인 키워드 */}
                                            <div>
                                              <div className="text-xs text-gray-400 mb-1">메인 키워드</div>
                                              <div className="flex flex-wrap gap-1">
                                                <span
                                                  className="px-2 py-0.5 text-xs rounded-md inline-block bg-blue-500/20 text-blue-200 font-medium"
                                                >
                                                  {item.inputData.mainKeyword}
                                                </span>
                                              </div>
                                            </div>

                                            {/* 서브 키워드 */}
                                            {additionalCount > 0 && (
                                              <>
                                                <div className="border-t border-gray-700 dark:border-gray-600"></div>
                                                <div>
                                                  <div className="text-xs text-gray-400 mb-1">서브 키워드</div>
                                                  <div className="flex flex-wrap gap-1">
                                                    {keywordArray.slice(1).map((keyword, index) => (
                                                      <span
                                                        key={index}
                                                        className={`px-2 py-0.5 text-xs rounded-md inline-block ${index % 4 === 0
                                                            ? 'bg-green-500/20 text-green-200'
                                                            : index % 4 === 1
                                                              ? 'bg-purple-500/20 text-purple-200'
                                                              : index % 4 === 2
                                                                ? 'bg-orange-500/20 text-orange-200'
                                                                : 'bg-pink-500/20 text-pink-200'
                                                          }`}
                                                      >
                                                        {keyword}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              </>
                                            )}
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
                                )}
                              </>
                            );
                          })()}
                          </div>
                        )}
                      </td>

                      {/* 캠페인 */}
                      <td className="py-2 px-3 text-center w-[10%]">
                        <div className="flex items-center justify-center gap-1 min-w-0">
                          <img
                            src={getCampaignLogo(item)}
                            alt="campaign logo"
                            className="w-4 h-4 object-contain rounded flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/media/app/mini-logo-circle-gray.svg';
                            }}
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                            {item.campaign?.campaignName || '-'}
                          </span>
                          {getCampaignStatusDot(item.campaign)}
                        </div>
                      </td>

                      {/* 상태 */}
                      <td className="py-2 px-3 text-center w-[8%]">
                        <div className="flex items-center justify-center">
                          {item.status === 'rejected' ? (
                            <div className="inline-flex items-center gap-1">
                              {getCustomStatusBadge(item.status)}
                              {item.rejectionReason && (
                                <div className="relative inline-block">
                                  <button
                                    className="text-red-500 cursor-pointer hover:text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenRejectionId(openRejectionId === item.id ? null : item.id);
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <line x1="12" y1="8" x2="12" y2="12"></line>
                                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                  </button>
                                  {openRejectionId === item.id && (
                                    <>
                                      <div className="fixed inset-0 z-40" onClick={() => setOpenRejectionId(null)} />
                                      <div className="absolute z-50 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded p-2 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 max-w-xs shadow-xl border border-gray-700 dark:border-gray-600">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="font-medium">반려 사유</div>
                                          <button
                                            className="text-gray-400 hover:text-gray-200 transition-colors"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenRejectionId(null);
                                            }}
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                          </button>
                                        </div>
                                        <div className="text-gray-200 dark:text-gray-300">{item.rejectionReason}</div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : item.status === 'pending_user_confirm' ? (
                            <button
                              className="btn btn-xs btn-info"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTransactionClick(item);
                              }}
                            >
                              거래완료
                            </button>
                          ) : (
                            getCustomStatusBadge(item.status, item)
                          )}
                        </div>
                      </td>

                      {/* 시작일 */}
                      <td className="py-2 px-3 text-center w-[8%]">
                        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {item.startDate ? formatDate(item.startDate) : '-'}
                        </span>
                      </td>

                      {/* 마감일 */}
                      <td className="py-2 px-3 text-center w-[8%]">
                        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {item.endDate ? formatDate(item.endDate) : '-'}
                        </span>
                      </td>

                      {/* 남은일 */}
                      <td className="py-2 px-3 text-center w-[6%]">
                        <span className={`text-xs whitespace-nowrap ${getRemainingDaysColorClass(calculateRemainingDays(item.endDate), item)}`}>
                          {getRemainingDaysText(calculateRemainingDays(item.endDate), item)}
                        </span>
                      </td>

                      {/* 관리 */}
                      <td className="py-2 px-3 w-[8%]">
                        <div className="flex justify-center items-center gap-1">
                          <button
                            className="btn btn-sm btn-icon btn-clear btn-primary h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenMemoModal(item.id);
                            }}
                            title="메모"
                          >
                            <KeenIcon icon="notepad-edit" />
                          </button>
                          {/* 승인 전 상태일 때만 취소 버튼 표시 */}
                          {onCancelSlot && (item.status === 'pending' || item.status === 'submitted') && (
                            <button
                              className="btn btn-sm btn-icon btn-clear btn-warning"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancelSlot(item.id);
                              }}
                              title="취소"
                            >
                              <KeenIcon icon="cross-circle" />
                            </button>
                          )}
                          {/* 진행 중인 슬롯일 때만 환불 버튼 표시 */}
                          {onRefundSlot && (item.status === 'active' || item.status === 'approved') && (
                            <button
                              className="btn btn-sm btn-icon btn-clear btn-info"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRefundSlot(item.id);
                              }}
                              title="환불"
                            >
                              <KeenIcon icon="wallet"/>
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-icon btn-clear btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('정말 삭제하시겠습니까?')) {
                                onDeleteSlot(item.id);
                              }
                            }}
                            title="삭제"
                          >
                            <KeenIcon icon="trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile View - 카드 형식 (md 미만) */}
        <div className="md:hidden">
          <div className="card-body p-4 space-y-4">
            {filteredSlots.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white dark:bg-gray-800 overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <EditableCell
                      id={item.id}
                      field="mid"
                      value={item.inputData?.mid || ''}
                      editingCell={editingCell}
                      editingValue={editingValue}
                      onEditStart={onEditStart}
                      onEditChange={onEditChange}
                      onEditSave={onEditSave}
                      onEditCancel={onEditCancel}
                      placeholder="MID를 입력해주세요"
                      disabled={item.status !== 'pending'}
                    >
                      <h4 className="font-medium text-gray-900">
                        {item.inputData?.mid || '-'}
                      </h4>
                    </EditableCell>
                    <div className="mt-1 flex items-center gap-2">
                      <img
                        src={getCampaignLogo(item)}
                        alt="캠페인 로고"
                        className="w-5 h-5 rounded-full object-contain bg-gray-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/media/app/mini-logo-circle-gray.svg';
                        }}
                      />
                      <span className="text-sm text-gray-600">{item.campaign?.campaignName || '-'}</span>
                      {getCampaignStatusDot(item.campaign)}
                    </div>
                    {userRole && hasPermission(userRole, PERMISSION_GROUPS.ADMIN) && item.user && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        사용자: {item.user.full_name || '이름 없음'}
                      </div>
                    )}
                  </div>
                  <div className="ml-2">
                    {item.status !== 'pending_user_confirm' && getCustomStatusBadge(item.status)}
                  </div>
                </div>

                {item.status === 'rejected' && item.rejectionReason && (
                  <div className="mb-3 p-2 bg-danger-light rounded">
                    <p className="text-sm text-danger">
                      <strong>반려 사유:</strong> {item.rejectionReason}
                    </p>
                  </div>
                )}

                {item.status === 'pending_user_confirm' && (
                  <div className="mb-3 flex justify-center">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTransactionClick(item);
                      }}
                    >
                      거래완료
                    </button>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex">
                      <span className="text-gray-600 w-16">시작일:</span>
                      <span className="text-gray-900">{item.startDate ? formatDate(item.startDate) : '-'}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-600 w-16">마감일:</span>
                      <span className="text-gray-900">{item.endDate ? formatDate(item.endDate) : '-'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-gray-600 w-16">남은일:</span>
                    <span className={`font-medium ${getRemainingDaysColorClass(calculateRemainingDays(item.endDate), item)}`}>
                      {getRemainingDaysText(calculateRemainingDays(item.endDate), item)}
                    </span>
                  </div>

                  <div className="overflow-hidden">
                    <span className="text-gray-600">URL:</span>
                    <div className="w-full overflow-hidden">
                      {editingCell.id === item.id && editingCell.field === 'url' ? (
                        <EditableCell
                          id={item.id}
                          field="url"
                          value={item.inputData?.url || ''}
                          editingCell={editingCell}
                          editingValue={editingValue}
                          onEditStart={onEditStart}
                          onEditChange={onEditChange}
                          onEditSave={onEditSave}
                          onEditCancel={onEditCancel}
                          isUrl={true}
                        />
                      ) : item.inputData?.url ? (
                        <a
                          href={item.inputData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-primary hover:underline text-sm break-all block ${item.status === 'pending' ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (item.status === 'pending') {
                              onEditStart(item.id, 'url');
                            }
                          }}
                          title={item.status !== 'pending' ? "대기중 상태에서만 편집 가능합니다" : ""}
                        >
                          {item.inputData.url}
                        </a>
                      ) : (
                        <span
                          className={`text-gray-400 text-sm block ${item.status === 'pending' ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                          onClick={() => item.status === 'pending' && onEditStart(item.id, 'url')}
                          title={item.status !== 'pending' ? "대기중 상태에서만 편집 가능합니다" : ""}
                        >
                          -
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-600">키워드:</span>
                    <div className="mt-1">
                      <div className="flex items-center gap-1 relative">
                        {(() => {
                          // 키워드 배열 생성 (메인키워드 + 서브키워드)
                          const keywordArray = [];
                          if (item.inputData.mainKeyword) {
                            keywordArray.push(item.inputData.mainKeyword);
                          }
                          if (Array.isArray(item.inputData.keywords)) {
                            keywordArray.push(...item.inputData.keywords);
                          }

                          if (keywordArray.length === 0) {
                            return <span className="text-gray-400 text-sm">-</span>;
                          }

                          const mainKeyword = keywordArray[0];
                          const additionalCount = keywordArray.length - 1;

                          return (
                            <>
                              <span className="text-sm text-gray-900 dark:text-white font-medium">
                                {mainKeyword}
                              </span>
                              {additionalCount > 0 && (
                                <>
                                  <button
                                    className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors cursor-pointer min-w-[20px] h-5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setPopoverPosition({
                                        top: rect.top - 10,
                                        left: rect.left + rect.width / 2
                                      });
                                      setOpenKeywordTooltipId(openKeywordTooltipId === item.id ? null : item.id);
                                    }}
                                  >
                                    +{additionalCount}
                                  </button>
                                  {/* Tooltip - 모바일에서도 동일하게 사용 */}
                                  {openKeywordTooltipId === item.id && ReactDOM.createPortal(
                                    <>
                                      <div
                                        className="fixed inset-0"
                                        style={{ zIndex: 9998 }}
                                        onClick={() => setOpenKeywordTooltipId(null)}
                                      />
                                      <div
                                        className="fixed bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 w-64 shadow-xl border border-gray-700 dark:border-gray-600"
                                        style={{
                                          zIndex: 99999,
                                          left: `${popoverPosition.left}px`,
                                          top: `${popoverPosition.top}px`,
                                          transform: 'translate(-50%, -100%)'
                                        }}
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="font-medium text-gray-100">전체 키워드</div>
                                          <button
                                            className="text-gray-400 hover:text-gray-200 transition-colors"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenKeywordTooltipId(null);
                                            }}
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                        <div className="space-y-2">
                                          {/* 메인 키워드 */}
                                          {item.inputData.mainKeyword && (
                                            <div>
                                              <div className="text-xs text-gray-400 mb-1">메인 키워드</div>
                                              <div className="flex flex-wrap gap-1">
                                                <span
                                                  className="px-2 py-0.5 text-xs rounded-md inline-block bg-blue-500/20 text-blue-200 font-medium"
                                                >
                                                  {item.inputData.mainKeyword}
                                                </span>
                                              </div>
                                            </div>
                                          )}

                                          {/* 서브 키워드 */}
                                          {Array.isArray(item.inputData.keywords) && item.inputData.keywords.length > 0 && (
                                            <>
                                              <div className="border-t border-gray-700 dark:border-gray-600"></div>
                                              <div>
                                                <div className="text-xs text-gray-400 mb-1">서브 키워드</div>
                                                <div className="flex flex-wrap gap-1">
                                                  {item.inputData.keywords.map((keyword, index) => (
                                                    <span
                                                      key={index}
                                                      className={`px-2 py-0.5 text-xs rounded-md inline-block ${index % 4 === 0
                                                          ? 'bg-green-500/20 text-green-200'
                                                          : index % 4 === 1
                                                            ? 'bg-purple-500/20 text-purple-200'
                                                            : index % 4 === 2
                                                              ? 'bg-orange-500/20 text-orange-200'
                                                              : 'bg-pink-500/20 text-pink-200'
                                                        }`}
                                                    >
                                                      {keyword}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-full">
                                          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 dark:border-t-gray-800"></div>
                                        </div>
                                      </div>
                                    </>,
                                    document.body
                                  )}
                                </>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t">
                  {item.userReason && (
                    <span className="badge badge-sm badge-warning mr-auto">메모</span>
                  )}

                  {/* 거래완료대기 상태일 때는 거래완료 버튼만 표시 */}
                  {item.status === 'pending_user_confirm' ? (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleTransactionClick(item)}
                      title="거래완료"
                    >
                      <KeenIcon icon="check-circle" className="mr-1" />
                      거래완료
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn btn-sm btn-icon btn-clear btn-primary"
                        onClick={() => onOpenMemoModal(item.id)}
                        title="메모"
                      >
                        <KeenIcon icon="notepad-edit" />
                      </button>
                      {/* 승인 전 상태일 때만 취소 버튼 표시 */}
                      {onCancelSlot && (item.status === 'pending' || item.status === 'submitted') && (
                        <button
                          className="btn btn-sm btn-icon btn-clear btn-warning"
                          onClick={() => onCancelSlot(item.id)}
                          title="취소"
                        >
                          <KeenIcon icon="cross-circle" />
                        </button>
                      )}
                      {/* 진행 중인 슬롯일 때만 환불 버튼 표시 */}
                      {onRefundSlot && (item.status === 'active' || item.status === 'approved') && (
                        <button
                          className="btn btn-sm btn-icon btn-clear btn-danger"
                          onClick={() => onRefundSlot(item.id)}
                          title="환불"
                        >
                          <KeenIcon icon="dollar-circle" />
                        </button>
                      )}
                      {/* 대기중 상태일 때만 삭제 버튼 표시 */}
                      {item.status === 'pending' && (
                        <button
                          className="btn btn-sm btn-icon btn-clear btn-danger"
                          onClick={() => {
                            if (confirm('정말 삭제하시겠습니까?')) {
                              onDeleteSlot(item.id);
                            }
                          }}
                          title="삭제"
                        >
                          <KeenIcon icon="trash" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 거래 완료 확인 모달 */}
      {selectedTransactionSlot && (
        <TransactionConfirmModal
          isOpen={transactionModalOpen}
          onClose={() => {
            setTransactionModalOpen(false);
            setSelectedTransactionSlot(null);
          }}
          onConfirm={handleConfirmTransaction}
          slotData={{
            campaignName: selectedTransactionSlot.campaign?.campaignName,
            productName: selectedTransactionSlot.inputData?.productName,
            workMemo: selectedTransactionSlot.inputData?.work_memo,
            workMemoDate: selectedTransactionSlot.inputData?.work_memo_date
          }}
        />
      )}

      {/* 수동 입력 정보 팝오버 */}
      {openInfoPopoverId && filteredSlots.find(slot => slot.id === openInfoPopoverId) && ReactDOM.createPortal(
        <>
          {/* 배경 클릭 시 닫기 */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setOpenInfoPopoverId(null)}
          />
          {/* 팝오버 내용 */}
          <div
            className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 max-w-sm"
            style={{
              zIndex: 9999,
              left: `${infoPopoverPosition.left + 10}px`,
              top: `${infoPopoverPosition.top}px`,
              transform: 'translateY(-50%)'
            }}
          >
            <div className="mb-3">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">입력 정보 상세</h4>
            </div>
            <div className="space-y-2">
              {(() => {
                const slot = filteredSlots.find(s => s.id === openInfoPopoverId);
                if (!slot) return null;
                
                // 필드명 한글 매핑
                const fieldNameMap: Record<string, string> = {
                  'work_days': '작업일',
                  'minimum_purchase': '최소 구매수',
                  'url': 'URL',
                  'mid': '상점 ID',
                  'description': '설명',
                  'product_name': '상품명',
                  'keywords': '키워드',
                  'start_date': '시작일',
                  'end_date': '종료일'
                };
                
                const excludeFields = ['is_manual_input', 'mainKeyword', 'service_type', 'campaign_name', 'price', 'workCount', 'keyword1', 'keyword2', 'keyword3', 'minimum_purchase', 'work_days'];
                
                return Object.entries(slot.inputData || {}).map(([key, value]) => {
                  if (excludeFields.includes(key) || !value || value === '') return null;
                  
                  const displayKey = fieldNameMap[key] || key;
                  
                  return (
                    <div key={key} className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[80px]">
                        {displayKey}:
                      </span>
                      <span className="text-xs text-gray-700 dark:text-gray-300 break-all">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  );
                }).filter(Boolean);
              })()}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">최소 구매수:</span>
                  <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
                    {filteredSlots.find(s => s.id === openInfoPopoverId)?.inputData?.minimum_purchase || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">작업일:</span>
                  <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
                    {filteredSlots.find(s => s.id === openInfoPopoverId)?.inputData?.work_days || '-'}일
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default SlotList;