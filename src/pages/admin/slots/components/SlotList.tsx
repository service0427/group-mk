import React, { useState, useEffect } from 'react';
import { Slot, User } from './types';
import SlotDetails from './SlotDetails';
import { formatDate } from './constants';
import { supabase } from '@/supabase';
// 모달 컴포넌트는 부모에서 사용하므로 import 제거

interface SlotListProps {
  slots: Slot[];
  selectedServiceType: string;
  onApprove: (slotId: string | string[], actionType?: string) => void;
  onReject: (slotId: string | string[], reason?: string) => void;
  onMemo: (slotId: string) => void;
  selectedSlots?: string[]; // 부모로부터 전달받을 선택된 슬롯 ID 배열 (옵션)
  onSelectedSlotsChange?: (selectedSlots: string[]) => void; // 선택된 슬롯 상태가 변경될 때 호출될 콜백
}

const SlotList: React.FC<SlotListProps> = ({ 
  slots, 
  selectedServiceType, 
  onApprove, 
  onReject,
  onMemo,
  selectedSlots: externalSelectedSlots,
  onSelectedSlotsChange
}) => {
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  // 외부에서 관리되는 selectedSlots가 있으면 사용, 없으면 내부 상태로 관리
  const [internalSelectedSlots, setInternalSelectedSlots] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  
  // 실제 사용할 selectedSlots와 업데이트 함수 결정
  const selectedSlots = externalSelectedSlots !== undefined ? externalSelectedSlots : internalSelectedSlots;
  const updateSelectedSlots = (newSelectedSlots: string[]) => {
    if (onSelectedSlotsChange) {
      // 외부에서 관리되는 경우 콜백 호출
      onSelectedSlotsChange(newSelectedSlots);
    } else {
      // 내부에서 관리되는 경우 상태 업데이트
      setInternalSelectedSlots(newSelectedSlots);
    }
  };
  
  // 모달 상태 제거 - 부모 컴포넌트에서 모달을 관리함
  
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
      const selectableSlots = slots
        .filter(slot => slot.status === 'pending' || slot.status === 'submitted')
        .map(slot => slot.id);
      updateSelectedSlots(selectableSlots);
    }
    setSelectAll(!selectAll);
  };
  
  // 선택된 슬롯들에 대한 일괄 처리
  const handleBulkApprove = () => {
    if (selectedSlots.length > 0) {
      // 직접 onApprove 호출하여 부모에서 모달을 표시하도록 함
      onApprove(selectedSlots);
    }
  };
  
  const handleBulkReject = () => {
    if (selectedSlots.length > 0) {
      // 직접 onReject 호출하여 부모에서 모달을 표시하도록 함
      onReject(selectedSlots);
    }
  };
  
  // 슬롯들의 사용자 정보를 한 번에 로드하는 함수
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!slots || slots.length === 0) return;
      
      // 모든 슬롯에서 고유한 user_id 목록 추출
      const userIds = [...new Set(slots.map(slot => slot.user_id).filter(Boolean))];
      
      if (userIds.length === 0) return;
      
      try {
        // Supabase에서 users 테이블 조회
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);
          
        if (error) {
          console.error('사용자 정보 로드 중 오류:', error);
          return;
        }
        
        // user_id를 키로 하는 맵 생성
        const newUserMap: Record<string, User> = {};
        data.forEach(user => {
          newUserMap[user.id] = {
            id: user.id,
            full_name: user.full_name,
            email: user.email
          };
        });
        
        setUserMap(newUserMap);
      } catch (error) {
        console.error('사용자 정보 로드 중 예외 발생:', error);
      }
    };
    
    loadUserInfo();
  }, [slots]);
  return (
    <>
      {/* 선택된 슬롯에 대한 일괄 작업 버튼 */}
      {selectedSlots.length > 0 && (
        <div className="mb-4 px-6 py-3 bg-light-primary rounded-lg flex items-center justify-between">
          <div className="text-primary font-medium">{selectedSlots.length}개 항목 선택됨</div>
          <div className="flex gap-2">
            <button 
              className="btn btn-sm btn-success hover:bg-success-dark text-white" 
              onClick={handleBulkApprove}
            >
              일괄 승인
            </button>
            <button 
              className="btn btn-sm btn-danger hover:bg-danger-dark text-white" 
              onClick={handleBulkReject}
            >
              일괄 반려
            </button>
            <button 
              className="btn btn-sm btn-light-primary" 
              onClick={() => {
                updateSelectedSlots([]);
                setSelectAll(false);
              }}
            >
              선택 취소
            </button>
          </div>
        </div>
      )}
      
      {/* 데스크톱 및 태블릿 뷰 */}
      <div className="hidden lg:block">
        <div className="table-responsive" style={{ width: '100%', padding: '0 1.25rem' }}>
          <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3 border-collapse border" style={{ width: '100%' }}>
            <thead>
              <tr className="fw-bold text-muted">
                <th className="text-center" style={{ width: '5%' }}>
                  <input 
                    type="checkbox" 
                    className="form-check-input" 
                    checked={selectAll}
                    onChange={handleSelectAll}
                    title="전체 선택/해제"
                  />
                </th>
                <th style={{ width: '15%' }}>사용자</th>
                <th style={{ width: '15%' }}>메인 키워드</th>
                <th style={{ width: '8%' }}>작업 타수</th>
                <th style={{ width: '8%' }}>마감일</th>
                <th style={{ width: '8%' }}>캠페인</th>
                <th style={{ width: '10%' }}>상태</th>
                <th style={{ width: '23%' }}>상세/메모</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.id} className="border-b">
                  <td className="text-center border">
                    {(slot.status === 'pending' || slot.status === 'submitted') && (
                      <input 
                        type="checkbox" 
                        className="form-check-input"
                        checked={selectedSlots.includes(slot.id)} 
                        onChange={() => handleSlotSelect(slot.id)}
                      />
                    )}
                  </td>
                  <td className="border">
                    {userMap[slot.user_id] ? (
                      <>
                        <div className="font-bold text-dark mb-1">{userMap[slot.user_id].full_name || '이름 없음'}</div>
                        {userMap[slot.user_id].email && 
                          <div className="text-primary text-sm font-medium">
                            {userMap[slot.user_id].email}
                          </div>
                        }
                      </>
                    ) : slot.user ? (
                      <>
                        <div className="font-bold text-dark mb-1">{slot.user.full_name || '이름 없음'}</div>
                        {slot.user.email && 
                          <div className="text-primary text-sm font-medium">
                            {slot.user.email}
                          </div>
                        }
                      </>
                    ) : (
                      <div className="text-muted">사용자 정보 로딩 중...</div>
                    )}
                  </td>
                <td className="border">
                  {slot.input_data?.mainKeyword ? (
                    <div className="text-primary font-medium">{slot.input_data.mainKeyword}</div>
                  ) : (
                    slot.input_data?.keyword1 ? <div className="text-primary font-medium">{slot.input_data.keyword1}</div> : '-'
                  )}
                  
                  {/* 추가 키워드 나란히 표시 */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(slot.input_data?.keyword1) && (
                      <span className="badge badge-light-primary">{slot.input_data.keyword1}</span>
                    )}
                    {slot.input_data?.keyword2 && (
                      <span className="badge badge-light-primary">{slot.input_data.keyword2}</span>
                    )}
                    {slot.input_data?.keyword3 && (
                      <span className="badge badge-light-primary">{slot.input_data.keyword3}</span>
                    )}
                  </div>
                </td>
                <td className="text-center border">
                  {slot.quantity ? 
                    <span className="badge bg-light-info text-info font-bold text-base px-3 py-1">{slot.quantity.toLocaleString()}</span> : 
                    slot.input_data?.quantity ? <span className="badge bg-light-info text-info font-bold text-base px-3 py-1">{slot.input_data.quantity}</span> : 
                    '-'}
                </td>
                <td className="text-center border">
                  {slot.deadline ? (
                    <span className="badge bg-success text-white fw-bold px-3 py-2">
                      {new Date(slot.deadline).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')}
                    </span>
                  ) : (
                    slot.input_data && slot.input_data.due_date ? (
                      <span className="badge bg-primary text-white fw-bold px-3 py-2">
                        {new Date(slot.input_data.due_date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')}
                      </span>
                    ) : (
                      <span className="badge bg-gray-500 text-white px-3 py-2">마감일 없음</span>
                    )
                  )}
                </td>
                <td className="border">
                  <span className="badge badge-light-primary fw-bold py-1 px-3">
                    {slot.campaign_name || '-'}
                  </span>
                </td>
                <td className="border">
                  <div className="d-flex flex-column">
                    <div>
                      {slot.status === 'pending' && <span className="badge bg-primary text-white py-2 px-3">대기중</span>}
                      {slot.status === 'submitted' && <span className="badge bg-warning text-dark py-2 px-3">검토 대기중</span>}
                      {slot.status === 'approved' && <span className="badge bg-success text-white py-2 px-3">승인됨</span>}
                      {slot.status === 'rejected' && <span className="badge bg-danger text-white py-2 px-3">반려됨</span>}
                      {slot.status === 'success' && <span className="badge bg-info text-white py-2 px-3">작업 완료</span>}
                      {slot.status === 'refund' && <span className="badge bg-indigo text-white py-2 px-3">환불</span>}
                      {slot.status === 'complete' && <span className="badge bg-dark text-white py-2 px-3">거래 완료</span>}
                      {!slot.status && <span className="badge bg-secondary text-white py-2 px-3">상태 없음</span>}
                    </div>
                    
                    {slot.status === 'rejected' && slot.rejection_reason && (
                      <div className="mt-2">
                        <small className="text-danger font-bold">사유: {slot.rejection_reason}</small>
                      </div>
                    )}
                  </div>
                </td>
                <td className="border">
                  <div className="flex flex-wrap gap-2 w-full">
                    <button
                      className="btn btn-sm bg-primary text-white px-3 py-1.5"
                      data-bs-toggle="modal"
                      data-bs-target={`#slotDetailsModal-${slot.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // 모달 열기 로직 (필요하면 추가)
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                      상세
                    </button>
                    <button
                      className="btn btn-sm bg-light-primary text-primary px-3 py-1.5"
                      onClick={() => onMemo(slot.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      메모
                    </button>
                    
                    {/* 상태별 액션 버튼 추가 */}
                    {(slot.status === 'pending' || slot.status === 'submitted') && (
                      <>
                        <button
                          className="btn btn-sm bg-success hover:bg-success-dark text-white px-3 py-1.5"
                          onClick={() => onApprove(slot.id)}
                          title="이 슬롯을 승인합니다"
                        >
                          승인
                        </button>
                        <button
                          className="btn btn-sm bg-danger hover:bg-danger-dark text-white px-3 py-1.5"
                          onClick={() => onReject(slot.id)}
                          title="이 슬롯을 반려합니다 (사유 입력 필요)"
                        >
                          반려
                        </button>
                      </>
                    )}
                    
                    {/* 승인된 상태일 때 완료/환불 버튼 표시 */}
                    {slot.status === 'approved' && (
                      <>
                        <button
                          className="btn btn-sm bg-info hover:bg-info-dark text-white px-3 py-1.5"
                          onClick={() => onApprove(slot.id, 'success')}
                          title="작업이 완료되었음을 표시합니다"
                        >
                          완료
                        </button>
                        <button
                          className="btn btn-sm bg-warning hover:bg-warning-dark text-white px-3 py-1.5"
                          onClick={() => onApprove(slot.id, 'refund')}
                          title="환불 처리합니다"
                        >
                          환불
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* 상세 정보 - URL 표시 */}
                  <div className="mt-3 text-sm">
                    <SlotDetails slot={slot} selectedServiceType={selectedServiceType} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    
    {/* 모바일 뷰 (카드 레이아웃) */}
    <div className="lg:hidden px-4">
      <div className="space-y-4">
        {slots.map((slot) => (
          <div key={slot.id} className="bg-white rounded-lg shadow-sm border p-4 relative">
            {/* 모바일 체크박스 (오른쪽 상단에 배치) */}
            {(slot.status === 'pending' || slot.status === 'submitted') && (
              <div className="absolute top-2 right-2">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  checked={selectedSlots.includes(slot.id)}
                  onChange={() => handleSlotSelect(slot.id)}
                />
              </div>
            )}
            {/* 헤더 - 사용자 정보 및 상태 */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold text-dark">
                  {userMap[slot.user_id]?.full_name || slot.user?.full_name || '사용자 정보 없음'}
                </div>
                <div className="text-primary text-sm">
                  {userMap[slot.user_id]?.email || slot.user?.email || ''}
                </div>
              </div>
              <div>
                {slot.status === 'pending' && <span className="badge bg-primary text-white py-1 px-2">대기중</span>}
                {slot.status === 'submitted' && <span className="badge bg-warning text-dark py-1 px-2">검토 대기중</span>}
                {slot.status === 'approved' && <span className="badge bg-success text-white py-1 px-2">승인됨</span>}
                {slot.status === 'rejected' && <span className="badge bg-danger text-white py-1 px-2">반려됨</span>}
                {slot.status === 'success' && <span className="badge bg-info text-white py-1 px-2">작업 완료</span>}
                {slot.status === 'refund' && <span className="badge bg-indigo text-white py-1 px-2">환불</span>}
                {slot.status === 'complete' && <span className="badge bg-dark text-white py-1 px-2">거래 완료</span>}
              </div>
            </div>
            
            {/* 요약 정보 - 키워드, 작업타수, 마감일 */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-sm text-gray-500 mb-1">메인 키워드</div>
                <div className="font-medium text-primary">
                  {slot.input_data?.mainKeyword || slot.input_data?.keyword1 || '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">작업 타수</div>
                <div className="font-bold">
                  {slot.quantity ? slot.quantity.toLocaleString() : slot.input_data?.quantity || '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">마감일</div>
                <div>
                  {slot.deadline ? 
                    new Date(slot.deadline).toLocaleDateString('ko-KR') : 
                    slot.input_data?.due_date ? 
                      new Date(slot.input_data.due_date).toLocaleDateString('ko-KR') : 
                      '마감일 없음'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">캠페인</div>
                <div className="font-medium">
                  {slot.campaign_name || '-'}
                </div>
              </div>
            </div>
            
            {/* 버튼 그룹 */}
            <div className="mt-4 border-t pt-3">
              <div className="flex flex-wrap gap-2">
                {/* 상세/메모 버튼 */}
                <button 
                  className="btn btn-sm bg-primary text-white py-2 px-4"
                  data-bs-toggle="modal"
                  data-bs-target={`#slotDetailsModal-${slot.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  상세
                </button>
                <button 
                  className="btn btn-sm bg-light-primary text-primary py-2 px-4"
                  onClick={() => onMemo(slot.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  메모
                </button>
                
                {/* 상태별 추가 버튼 */}
                {(slot.status === 'pending' || slot.status === 'submitted') && (
                  <>
                    <button 
                      className="btn btn-sm bg-success text-white py-2 px-4"
                      onClick={() => onApprove(slot.id)}
                    >
                      승인
                    </button>
                    <button 
                      className="btn btn-sm bg-danger text-white py-2 px-4"
                      onClick={() => onReject(slot.id)}
                    >
                      반려
                    </button>
                  </>
                )}
                
                {/* 승인된 상태일 때의 버튼 */}
                {slot.status === 'approved' && (
                  <>
                    <button 
                      className="btn btn-sm bg-info text-white py-2 px-4"
                      onClick={() => onApprove(slot.id, 'success')}
                    >
                      완료
                    </button>
                    <button 
                      className="btn btn-sm bg-warning text-white py-2 px-4"
                      onClick={() => onApprove(slot.id, 'refund')}
                    >
                      환불
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* 모달은 부모 컴포넌트에서 표시됨 */}
    </>
  );
};

export default SlotList;