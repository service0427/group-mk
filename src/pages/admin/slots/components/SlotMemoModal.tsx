import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle
} from '@/components/ui/dialog';
import { supabase } from '@/supabase';
import { Slot, User } from './types';

interface SlotMemoModalProps {
  open: boolean;
  onClose: () => void;
  slotId: string | null;
  initialMemo?: string;
  onSave: (slotId: string, memo: string) => Promise<boolean>;
  slot?: Slot | null;
}

// 객체에서 특정 키를 가진 값을 찾는 헬퍼 함수 (재귀적으로 모든 중첩 객체 탐색)
const findValueByKey = (obj: any, key: string): any => {
  // 객체가 null이거나 객체가 아닌 경우 탐색 중단
  if (!obj || typeof obj !== 'object') return null;
  
  // 직접 키를 가지고 있는 경우
  if (key in obj) return obj[key];
  
  // 중첩된 객체에서 찾기
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'object') {
      const result = findValueByKey(obj[k], key);
      if (result !== null) return result;
    }
  }
  
  return null;
};

const SlotMemoModal: React.FC<SlotMemoModalProps> = ({
  open,
  onClose,
  slotId,
  initialMemo = '',
  onSave,
  slot
}) => {
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [slotData, setSlotData] = useState<Slot | null>(null);
  const [userReason, setUserReason] = useState<string | null>(null);
  
  // 사용자 메모(user_reason) 찾기
  useEffect(() => {
    if (slotData) {
      // 1. slots 테이블의 user_reason 필드 확인 (우선순위 1)
      if (slotData.user_reason) {
        console.log('슬롯 테이블에서 user_reason 발견:', slotData.user_reason);
        setUserReason(slotData.user_reason);
      } 
      // 2. input_data에서 재귀적으로 탐색 (우선순위 2)
      else if (slotData.input_data) {
        const foundReason = findValueByKey(slotData.input_data, 'user_reason');
        console.log('input_data에서 user_reason 탐색 결과:', foundReason);
        setUserReason(foundReason);
      } else {
        console.log('user_reason을 찾을 수 없음');
        setUserReason(null);
      }
    }
  }, [slotData]);
  
  // 슬롯 데이터 가져오기
  useEffect(() => {
    if (open && slotId) {
      // 메모 초기화 - mat_reason으로 설정
      setMemo(initialMemo || '');
      
      if (slot) {
        setSlotData(slot);
      } else {
        fetchSlotData();
      }
    }
  }, [open, slotId, slot, initialMemo]);
  
  // 상태 모니터링
  useEffect(() => {
    // 상태 변경 감지
  }, [slotData, memo, open, slotId, userReason]);

  // 슬롯 데이터 조회 함수
  const fetchSlotData = async () => {
    try {
      if (!slotId) return;
      
      
      
      const { data, error } = await supabase
        .from('slots')
        .select(`
          id,
          mat_id,
          user_id,
          product_id,
          status,
          created_at,
          submitted_at,
          processed_at,
          input_data,
          mat_reason,
          user_reason,
          quantity,
          start_date,
          end_date,
          user:users!user_id (id, full_name, email)
        `)
        .eq('id', slotId)
        .single();
        
      if (error) {
        
        return;
      }
      
      if (data) {
        // 전체 데이터 구조를 자세히 출력
        
        
        if (data.input_data) {
          
          
          
          // user_reason이 직접적으로 있는지 확인
          if ('user_reason' in data.input_data) {
            
            
          } 
          // 중첩된 객체 내에 있는지 확인
          else {
            
            
            // 중첩 객체 탐색
            Object.keys(data.input_data).forEach(key => {
              if (typeof data.input_data[key] === 'object' && data.input_data[key] !== null) {
                
                
                if ('user_reason' in data.input_data[key]) {
                  
                }
              }
            });
          }
        } else {
          
        }
        
        // 사용자 정보 변환 (user는 단일 객체)
        const finalSlotData: Slot = data as any;
        
        console.log('슬롯 데이터 최종 설정:', {
          id: finalSlotData.id,
          mat_reason: finalSlotData.mat_reason,
          user_reason: finalSlotData.user_reason,
          user: finalSlotData.user
        });
        
        setSlotData(finalSlotData);
      }
    } catch (error) {
      
    }
  };

  const handleSave = async () => {
    if (!slotId) return;
    
    
    setSaving(true);
    try {
      const success = await onSave(slotId, memo);
      
      if (success) {
        onClose();
      }
    } catch (error) {
      
      alert('메모 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !slotId) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="bg-background py-4 px-6 border-b">
          <DialogTitle className="text-lg font-medium text-foreground">메모 관리</DialogTitle>
        </DialogHeader>
        <DialogBody className="p-6">
          {/* 메모 입력 영역 */}
          <div className="space-y-4 mb-4">
            <div className="form-group">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label htmlFor="memo" className="block text-md font-semibold text-gray-800">
                  메모
                </label>
                {memo && (
                  <span className="badge badge-light-primary">저장된 메모 있음</span>
                )}
              </div>
              <textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모 내용을 입력하세요"
                className="form-control border-primary w-100"
                rows={8}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>
          
          {/* 사용자 메모 영역 (user_reason 필드) */}
          <div className="mt-5">
            <h5 className="text-md font-semibold text-gray-800 mb-3">사용자 메모</h5>
            
            {slotData ? (
              <div>
                {userReason && typeof userReason === 'string' && userReason.trim() !== '' ? (
                  <div className="p-4 border border-gray-200 rounded-lg bg-light-warning">
                    <div className="text-md">{userReason}</div>
                    <div className="mt-2 text-right">
                      <small className="text-muted">사용자: {slotData.user?.full_name || '-'}</small>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-light-secondary rounded-lg text-center">
                    <p className="text-gray-600 mb-0">사용자가 작성한 메모가 없습니다.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-light-secondary rounded-lg text-center">
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                <span className="text-gray-600">데이터 로드 중...</span>
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter className="px-6 py-4 border-t d-flex justify-content-between align-items-center">
          <div></div>
          <div>
            <button
              onClick={onClose}
              className="btn btn-md btn-light-primary me-2"
              disabled={saving}
            >
              취소
            </button>
            <button 
              onClick={handleSave}
              className="btn btn-md btn-primary px-6"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  저장 중...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  저장
                </>
              )}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SlotMemoModal;