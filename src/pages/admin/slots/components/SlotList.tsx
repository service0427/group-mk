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
  
  // 노출 안할 inputData
  const passItem = ['campaign_name', 'dueDays', 'expected_deadline', 'keyword1' , 'keyword2' , 'keyword3', 'keywordId', 'mainKeyword', 'mid', 'price', 'service_type', 'url', 'workCount', 'keywords'];
  
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
    <div className="w-full px-4">
      {/* 선택된 슬롯에 대한 일괄 작업 버튼 */}
      {selectedSlots.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="text-blue-600 dark:text-blue-400 font-medium">{selectedSlots.length}개 항목 선택됨</div>
          <div className="flex flex-wrap gap-2">
            <button 
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors" 
              onClick={handleBulkApprove}
            >
              일괄 승인
            </button>
            <button 
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors" 
              onClick={handleBulkReject}
            >
              일괄 반려
            </button>
            <button 
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors" 
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
      
      {/* 데스크탑 및 태블릿 뷰 - 중간(md) 크기 이상에서만 표시 */}
      <div className="w-full overflow-x-auto hidden md:block">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <th className="w-10 py-3 px-4 text-center">
                <input 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  checked={selectAll}
                  onChange={handleSelectAll}
                  title="전체 선택/해제"
                />
              </th>
              <th className="py-3 px-4 text-left font-medium text-sm">사용자</th>
              <th className="py-3 px-4 text-left font-medium text-sm">메인 키워드</th>
              <th className="py-3 px-4 text-center font-medium text-sm hidden lg:table-cell">작업 타수</th>
              <th className="py-3 px-4 text-center font-medium text-sm hidden lg:table-cell">작업일</th>
              <th className="py-3 px-4 text-left font-medium text-sm hidden xl:table-cell">캠페인</th>
              <th className="py-3 px-4 text-center font-medium text-sm">상태</th>
              <th className="py-3 px-4 text-left font-medium text-sm hidden lg:table-cell">사용자 입력필드</th>
              <th className="py-3 px-4 text-center font-medium text-sm">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {slots.map((slot) => (
              <tr key={slot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="py-3 px-4 text-center">
                  {(slot.status === 'pending' || slot.status === 'submitted') && (
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedSlots.includes(slot.id)} 
                      onChange={() => handleSlotSelect(slot.id)}
                    />
                  )}
                </td>
                
                {/* 사용자 정보 */}
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {userMap[slot.user_id]?.full_name || slot.user?.full_name || '이름 없음'}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {userMap[slot.user_id]?.email || slot.user?.email || ''}
                    </div>
                  </div>
                </td>
                
                {/* 키워드 정보 */}
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <div className="font-medium text-blue-600 dark:text-blue-400">
                      {slot.input_data?.mainKeyword || slot.input_data?.keyword1 || '-'}
                    </div>
                    
                    {/* 추가 키워드 */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {slot.input_data?.keywords && Array.isArray(slot.input_data.keywords) && slot.input_data.keywords.length > 0 ? (
                        slot.input_data.keywords.map((keyword, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <>
                          {slot.input_data?.keyword1 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              {slot.input_data.keyword1}
                            </span>
                          )}
                          {slot.input_data?.keyword2 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              {slot.input_data.keyword2}
                            </span>
                          )}
                          {slot.input_data?.keyword3 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                              {slot.input_data.keyword3}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </td>
                
                {/* 작업 타수 */}
                <td className="py-3 px-4 text-center hidden lg:table-cell">
                  <span className="px-3 py-1 inline-flex text-sm font-medium rounded-full bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    {slot.quantity ? slot.quantity.toLocaleString() : 
                     slot.input_data?.quantity ? slot.input_data.quantity : 
                     slot.input_data?.workCount ? slot.input_data.workCount : '-'}
                  </span>
                </td>
                
                {/* 작업일 */}
                <td className="py-3 px-4 text-center hidden lg:table-cell">
                  {slot.start_date && slot.end_date ? (
                    <div className="flex flex-col gap-1">
                      <span className="px-2 py-1 inline-flex text-xs font-medium rounded-md bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                        시작: {new Date(slot.start_date).toLocaleDateString('ko-KR', {
                          year: 'numeric', month: '2-digit', day: '2-digit'
                        }).replace(/\. /g, '-').replace('.', '')}
                      </span>
                      <span className="px-2 py-1 inline-flex text-xs font-medium rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                        종료: {new Date(slot.end_date).toLocaleDateString('ko-KR', {
                          year: 'numeric', month: '2-digit', day: '2-digit'
                        }).replace(/\. /g, '-').replace('.', '')}
                      </span>
                    </div>
                  ) : slot.deadline ? (
                    <span className="px-2 py-1 inline-flex text-xs font-medium rounded-md bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                      {new Date(slot.deadline).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: '2-digit', day: '2-digit'
                      }).replace(/\. /g, '-').replace('.', '')}
                    </span>
                  ) : (
                    slot.input_data?.due_date ? (
                      <span className="px-2 py-1 inline-flex text-xs font-medium rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                        {new Date(slot.input_data.due_date).toLocaleDateString('ko-KR', {
                          year: 'numeric', month: '2-digit', day: '2-digit'
                        }).replace(/\. /g, '-').replace('.', '')}
                      </span>
                    ) : (
                      slot.input_data?.dueDays ? (
                        <span className="px-2 py-1 inline-flex text-xs font-medium rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300">
                          {slot.input_data.dueDays}일
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                          작업일 없음
                        </span>
                      )
                    )
                  )}
                </td>
                
                {/* 캠페인 */}
                <td className="py-3 px-4 hidden xl:table-cell">
                  <span className="px-2 py-1 text-sm font-medium rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                    {slot.campaign_name || '-'}
                  </span>
                </td>
                
                {/* 상태 */}
                <td className="py-3 px-4 text-center">
                  <div className="flex flex-col items-center">
                    {slot.status === 'pending' && 
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">대기중</span>}
                    {slot.status === 'submitted' && 
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-yellow-100 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-300">검토 대기중</span>}
                    {slot.status === 'approved' && 
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">승인됨</span>}
                    {slot.status === 'rejected' && 
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">반려됨</span>}
                    {slot.status === 'success' && 
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300">작업 완료</span>}
                    {slot.status === 'refund' && 
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">환불</span>}
                    {slot.status === 'complete' && 
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-800 dark:bg-gray-700 text-white">거래 완료</span>}
                    {!slot.status && 
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">상태 없음</span>}
                    
                    {/* 반려 사유 */}
                    {slot.status === 'rejected' && slot.rejection_reason && (
                      <div className="mt-1 px-2 text-xs text-red-600 dark:text-red-400 font-medium">
                        {slot.rejection_reason}
                      </div>
                    )}
                  </div>
                </td>
                
                {/* 사용자 입력 필드 */}
                <td className="py-3 px-4 hidden lg:table-cell">
                  {slot.input_data && (() => {
                    const userInputFields = Object.entries(slot.input_data).filter(([key]) => !passItem.includes(key));
                    
                    if (userInputFields.length === 0) 
                      return <div className="text-gray-400 text-xs">추가 필드 없음</div>;
                    
                    return (
                      <div className="flex flex-col gap-1">
                        {userInputFields.map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{key}:</span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{value || '-'}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </td>
                
                {/* 액션 버튼 */}
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-2">
                    {/* 상세/메모 버튼 (맨 위) */}
                    <div className="flex flex-wrap gap-1">
                      <button
                        className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        data-bs-toggle="modal"
                        data-bs-target={`#slotDetailsModal-${slot.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                          상세
                        </span>
                      </button>
                      <button
                        className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 transition-colors"
                        onClick={() => onMemo(slot.id)}
                      >
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          메모
                        </span>
                      </button>
                    </div>
                    
                    {/* 상태별 액션 버튼 (하단에 표시) */}
                    {(slot.status === 'pending' || slot.status === 'submitted') && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        <button
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors"
                          onClick={() => onApprove(slot.id)}
                          title="이 슬롯을 승인합니다"
                        >
                          승인
                        </button>
                        <button
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors"
                          onClick={() => onReject(slot.id)}
                          title="이 슬롯을 반려합니다 (사유 입력 필요)"
                        >
                          반려
                        </button>
                      </div>
                    )}
                    
                    {/* 승인된 상태일 때 액션 버튼 */}
                    {slot.status === 'approved' && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        <button
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                          onClick={() => onApprove(slot.id, 'success')}
                          title="작업이 완료되었음을 표시합니다"
                        >
                          완료
                        </button>
                        <button
                          className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                          onClick={() => onApprove(slot.id, 'refund')}
                          title="환불 처리합니다"
                        >
                          환불
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* 모바일에서만 표시되는 요약 정보 */}
                  <div className="md:hidden mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">메인 키워드:</span>
                        <div className="text-blue-600 dark:text-blue-400 font-medium">{slot.input_data?.mainKeyword || slot.input_data?.keyword1 || '-'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">작업 타수:</span>
                        <div className="font-medium">{slot.quantity || slot.input_data?.workCount || '-'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">작업 기간:</span>
                        <div>
                          {slot.start_date && slot.end_date ? (
                            <>
                              <div className="text-xs text-green-600 dark:text-green-400">시작: {new Date(slot.start_date).toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}</div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">종료: {new Date(slot.end_date).toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}</div>
                            </>
                          ) : (
                            slot.input_data?.dueDays ? `${slot.input_data.dueDays}일` : '작업일 없음'
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">캠페인:</span>
                        <div>{slot.campaign_name || '-'}</div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 형식 - 중간(md) 크기 미만에서만 표시 */}
      <div className="md:hidden space-y-4">
        {slots.map((slot) => (
          <div key={slot.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            {/* 상단 - 사용자 정보 및 상태 */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {userMap[slot.user_id]?.full_name || slot.user?.full_name || '이름 없음'}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  {userMap[slot.user_id]?.email || slot.user?.email || ''}
                </div>
              </div>
              <div className="flex items-center">
                {(slot.status === 'pending' || slot.status === 'submitted') && (
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedSlots.includes(slot.id)} 
                    onChange={() => handleSlotSelect(slot.id)}
                  />
                )}
                <div>
                  {slot.status === 'pending' && 
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">대기중</span>}
                  {slot.status === 'submitted' && 
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-yellow-100 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-300">검토 대기중</span>}
                  {slot.status === 'approved' && 
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">승인됨</span>}
                  {slot.status === 'rejected' && 
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">반려됨</span>}
                  {slot.status === 'success' && 
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300">작업 완료</span>}
                  {slot.status === 'refund' && 
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">환불</span>}
                  {slot.status === 'complete' && 
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-800 dark:bg-gray-700 text-white">거래 완료</span>}
                </div>
              </div>
            </div>
            
            {/* 반려 사유 */}
            {slot.status === 'rejected' && slot.rejection_reason && (
              <div className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-sm text-red-600 dark:text-red-400">
                <strong>반려 사유:</strong> {slot.rejection_reason}
              </div>
            )}
            
            {/* 요약 정보 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">메인 키워드</div>
                <div className="font-medium text-blue-600 dark:text-blue-400">
                  {slot.input_data?.mainKeyword || slot.input_data?.keyword1 || '-'}
                </div>
                
                {/* 추가 키워드 */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {slot.input_data?.keywords && Array.isArray(slot.input_data.keywords) && slot.input_data.keywords.length > 0 ? (
                    slot.input_data.keywords.map((keyword, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <>
                      {slot.input_data?.keyword1 && (
                        <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          {slot.input_data.keyword1}
                        </span>
                      )}
                      {slot.input_data?.keyword2 && (
                        <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          {slot.input_data.keyword2}
                        </span>
                      )}
                      {slot.input_data?.keyword3 && (
                        <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          {slot.input_data.keyword3}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">캠페인</div>
                <div className="font-medium">
                  {slot.campaign_name || '-'}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">작업 타수</div>
                <div className="font-bold">
                  {slot.quantity ? 
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                      {slot.quantity.toLocaleString()}
                    </span> : 
                    slot.input_data?.quantity ? 
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        {slot.input_data.quantity}
                      </span> : 
                      slot.input_data?.workCount ? 
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                          {slot.input_data.workCount}
                        </span> : 
                        '-'}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">작업일</div>
                <div>
                  {slot.deadline ? 
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                      {new Date(slot.deadline).toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}
                    </span> : 
                    slot.input_data?.due_date ? 
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        {new Date(slot.input_data.due_date).toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}
                      </span> : 
                      slot.input_data?.dueDays ? 
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                          {slot.input_data.dueDays}일
                        </span> : 
                        <span className="text-gray-500 dark:text-gray-400">작업일 없음</span>}
                </div>
              </div>
            </div>
            
            {/* 사용자 입력 필드 (접을 수 있는 섹션) */}
            {slot.input_data && (() => {
              const userInputFields = Object.entries(slot.input_data).filter(([key]) => !passItem.includes(key));
              
              if (userInputFields.length === 0) return null;
              
              return (
                <div className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50">
                  <details>
                    <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      사용자 입력 필드 ({userInputFields.length}개)
                    </summary>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {userInputFields.map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{key}:</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{value || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              );
            })()}
            
            {/* 버튼 그룹 */}
            <div className="flex flex-col gap-2">
              {/* 상세/메모 버튼 (맨 위) */}
              <div className="flex flex-wrap gap-2">
                <button
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center"
                  data-bs-toggle="modal"
                  data-bs-target={`#slotDetailsModal-${slot.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  상세
                </button>
                <button
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 transition-colors flex items-center"
                  onClick={() => onMemo(slot.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  메모
                </button>
              </div>
              
              {/* 상태별 액션 버튼 (하단에 표시) */}
              {(slot.status === 'pending' || slot.status === 'submitted') && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors"
                    onClick={() => onApprove(slot.id)}
                    title="이 슬롯을 승인합니다"
                  >
                    승인
                  </button>
                  <button
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors"
                    onClick={() => onReject(slot.id)}
                    title="이 슬롯을 반려합니다 (사유 입력 필요)"
                  >
                    반려
                  </button>
                </div>
              )}
              
              {/* 승인된 상태일 때 액션 버튼 */}
              {slot.status === 'approved' && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-teal-500 hover:bg-teal-600 text-white transition-colors"
                    onClick={() => onApprove(slot.id, 'success')}
                    title="작업이 완료되었음을 표시합니다"
                  >
                    완료
                  </button>
                  <button
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                    onClick={() => onApprove(slot.id, 'refund')}
                    title="환불 처리합니다"
                  >
                    환불
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* 모바일에서 슬롯이 없는 경우 표시 */}
        {slots.length === 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">표시할 슬롯이 없습니다.</p>
          </div>
        )}
      </div>
      
      {/* 데스크탑에서 슬롯이 없는 경우 표시 */}
      {slots.length === 0 && (
        <div className="hidden md:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">표시할 슬롯이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default SlotList;