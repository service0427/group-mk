import React from 'react';
import { Slot } from './types';
import SlotDetails from './SlotDetails';
import { formatDate } from './constants';

interface SlotListProps {
  slots: Slot[];
  selectedServiceType: string;
  onApprove: (slotId: string) => void;
  onReject: (slotId: string) => void;
  onMemo: (slotId: string) => void;
}

const SlotList: React.FC<SlotListProps> = ({ 
  slots, 
  selectedServiceType, 
  onApprove, 
  onReject,
  onMemo
}) => {
  return (
    <div className="hidden md:block">
      <div className="table-responsive" style={{ width: '100%', padding: '0 1.25rem' }}>
        <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3" style={{ width: '100%' }}>
          <thead>
            <tr className="fw-bold text-muted">
              <th style={{ width: '13%' }}>사용자</th>
              <th style={{ width: '13%' }}>상품명</th>
              <th style={{ width: '8%' }}>MID</th>
              <th style={{ width: '10%' }}>캠페인</th>
              <th style={{ width: '8%' }}>제출 시간</th>
              <th style={{ width: '10%' }}>상태</th>
              <th style={{ width: '10%' }}>승인</th>
              <th style={{ width: '18%' }}>상세 정보</th>
              <th style={{ width: '10%' }} className="text-end">메모</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id}>
                <td>
                  {slot.user ? (
                    <>
                      <div>{slot.user.full_name || '-'}</div>
                      <div className="text-muted fs-7">{slot.user.email || '-'}</div>
                    </>
                  ) : (
                    '사용자 정보 없음'
                  )}
                </td>
                <td>
                  {slot.input_data?.productName ? (
                    <span className="text-primary">{slot.input_data.productName}</span>
                  ) : (
                    '-'
                  )}
                </td>
                <td>{slot.input_data?.mid || slot.mat_id.substring(0, 8) + '...'}</td>
                <td>
                  <span className="badge badge-light-primary">
                    {slot.product_id ? `캠페인 #${slot.product_id}` : '-'}
                  </span>
                </td>
                <td>{formatDate(slot.submitted_at)}</td>
                <td>
                  <div className="d-flex flex-column">
                    <div>
                      {slot.status === 'submitted' && <span className="badge badge-warning">검토 대기중</span>}
                      {slot.status === 'approved' && <span className="badge badge-success">승인됨</span>}
                      {slot.status === 'rejected' && <span className="badge badge-danger">반려됨</span>}
                    </div>
                    
                    {(slot.status === 'approved' || slot.status === 'rejected') && slot.processed_at && (
                      <small className="text-gray-700 font-weight-semibold mt-1">
                        {slot.status === 'approved' ? '승인' : '반려'} 시간: {formatDate(slot.processed_at)}
                      </small>
                    )}
                    
                    {slot.status === 'rejected' && (
                      <div className="mt-2">
                        <small className="text-muted d-block text-red-600 font-bold">반려 사유: {slot.rejection_reason || '없음'}</small>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="d-flex flex-column gap-2">
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
                  </div>
                </td>
                <td>
                  <SlotDetails slot={slot} selectedServiceType={selectedServiceType} />
                </td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-light-primary"
                    onClick={() => onMemo(slot.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    {slot.mat_reason ? '메모 수정' : '메모 추가'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SlotList;