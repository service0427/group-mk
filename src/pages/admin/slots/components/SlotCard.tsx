import React from 'react';
import { Slot } from './types';
import SlotDetails from './SlotDetails';
import { formatDate } from './constants';

interface SlotCardProps {
  slots: Slot[];
  selectedServiceType: string;
  onApprove: (slotId: string | string[], actionType?: string) => void;
  onReject: (slotId: string | string[], reason?: string) => void;
  onMemo: (slotId: string) => void;
  selectedSlots?: string[];
  onSelectedSlotsChange?: (selectedSlots: string[]) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({ 
  slots, 
  selectedServiceType, 
  onApprove, 
  onReject,
  onMemo,
  selectedSlots,
  onSelectedSlotsChange
}) => {
  return (
    <div className="block md:hidden px-4">
      <div className="divide-y divide-gray-200">
        {slots.map((slot) => (
          <div key={slot.id} className="py-4 px-2 bg-white mb-4 rounded shadow-sm">
            {/* 체크박스 (선택 가능한 슬롯인 경우) */}
            {(slot.status === 'pending' || slot.status === 'submitted') && (
              <div className="flex justify-end mb-2">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  checked={selectedSlots?.includes(slot.id) || false}
                  onChange={() => {
                    if (onSelectedSlotsChange) {
                      if (selectedSlots?.includes(slot.id)) {
                        onSelectedSlotsChange(selectedSlots.filter(id => id !== slot.id));
                      } else {
                        onSelectedSlotsChange([...(selectedSlots || []), slot.id]);
                      }
                    }
                  }}
                />
              </div>
            )}
            {/* 헤더 영역 (사용자, 상태) */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <div className="font-weight-bold fs-5">{slot.user?.full_name || '사용자 정보 없음'}</div>
                <div className="text-muted small mt-1">{slot.user?.email || '-'}</div>
              </div>
              <div>
                {slot.status === 'submitted' && <span className="badge badge-warning">검토 대기중</span>}
                {slot.status === 'approved' && <span className="badge badge-success">승인됨</span>}
                {slot.status === 'rejected' && <span className="badge badge-danger">반려됨</span>}
              </div>
            </div>
            
            {/* 상품명 */}
            {slot.input_data?.productName && (
              <div className="mb-3 px-3 py-2 bg-light rounded">
                <div className="small text-muted mb-1">상품명</div>
                <div className="text-primary font-weight-medium">{slot.input_data.productName}</div>
              </div>
            )}
            
            {/* 주요 정보 */}
            <div className="d-flex flex-wrap mb-3 mt-3">
              <div className="me-4 mb-2 flex-grow-1">
                <div className="small text-muted mb-1">MID</div>
                <div>{slot.input_data?.mid || slot.mat_id.substring(0, 8) + '...'}</div>
              </div>
              <div className="mb-2 flex-grow-1">
                <div className="small text-muted mb-1">제출 시간</div>
                <div>{formatDate(slot.submitted_at)}</div>
              </div>
            </div>

            {/* 캠페인 정보 (추가) */}
            <div className="mb-3 px-3 py-2 bg-light rounded">
              <div className="small text-muted mb-1">캠페인</div>
              <div className="font-weight-medium">
                {slot.product_id ? (
                  slot.campaign_name ?
                  `${slot.campaign_name} (#${slot.product_id})` :
                  `캠페인 #${slot.product_id}`
                ) : '-'}
              </div>
            </div>
            
            {/* 상세 정보 */}
            <div className="mb-3">
              <div className="small text-muted mb-1 d-flex justify-content-between">
                <span>상세 정보</span>
                <button
                  className="btn btn-sm btn-light p-0 ps-2 pe-2"
                  onClick={(e) => {
                    const target = e.currentTarget.parentElement?.nextElementSibling;
                    if (target) {
                      target.classList.toggle('hidden');
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>
              <div className="p-3 bg-light rounded hidden">
                <SlotDetails slot={slot} selectedServiceType={selectedServiceType} />
              </div>
            </div>
            
            {/* 반려 사유 */}
            {slot.status === 'rejected' && (
              <div className="mb-3">
                <div className="small text-muted mb-1">반려 사유</div>
                <div className="text-danger p-2 bg-light rounded">{slot.rejection_reason || '없음'}</div>
              </div>
            )}
            
            {/* 상태 및 승인 영역 */}
            <div className="mb-3">
              <div className="small text-muted mb-2">상태</div>
              <div>
                {slot.status === 'submitted' && <span className="badge badge-warning">검토 대기중</span>}
                {slot.status === 'approved' && <span className="badge badge-success">승인됨</span>}
                {slot.status === 'rejected' && <span className="badge badge-danger">반려됨</span>}
                
                {(slot.status === 'approved' || slot.status === 'rejected') && slot.processed_at && (
                  <small className="text-gray-700 font-weight-semibold mt-1 d-block">
                    {slot.status === 'approved' ? '승인' : '반려'} 시간: {formatDate(slot.processed_at)}
                  </small>
                )}
              </div>
            </div>

            {/* 승인 버튼 영역 */}
            <div className="d-flex flex-column gap-2 mt-3">
              <button
                className="btn btn-sm btn-primary w-100"
                onClick={() => onApprove(slot.id)}
                disabled={slot.status === 'approved'}
                title={slot.status === 'approved' ? '이미 승인된 슬롯입니다' : '이 슬롯을 승인합니다'}
              >
                {slot.status === 'approved' ? '승인됨' : '승인'}
              </button>
              <button
                className="btn btn-sm btn-danger w-100"
                onClick={() => onReject(slot.id)}
                disabled={slot.status === 'rejected'}
                title={slot.status === 'rejected' ? '이미 반려된 슬롯입니다' : '이 슬롯을 반려합니다 (사유 입력 필요)'}
              >
                {slot.status === 'rejected' ? '반려됨' : '반려'}
              </button>
              <button
                className="btn btn-sm btn-light-primary w-100"
                onClick={() => onMemo(slot.id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                {slot.mat_reason ? '메모 수정' : '메모 추가'}
              </button>
              
              {/* 메모 내용이 있는 경우 표시 */}
              {slot.mat_reason && (
                <div className="mt-3">
                  <div className="small text-muted mb-1">메모 내용</div>
                  <div className="p-2 bg-light-primary rounded">
                    {slot.mat_reason}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlotCard;
