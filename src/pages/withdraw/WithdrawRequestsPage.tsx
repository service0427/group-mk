import React, { useState, useEffect } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/auth';
import { approveSlot, rejectSlot } from '@/pages/admin/slots/services/slotService';

interface SlotItem {
  id: string;
  matId: string;
  productId: number;
  userId: string;
  status: string;
  submittedAt: string | null;
  processedAt: string | null;
  rejectionReason: string | null;
  userReason: string | null;
  inputData: {
    productName: string;
    mid: string;
    url: string;
    keywords: string[];
  };
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  campaignName?: string;
}

const WithdrawRequestsPage: React.FC = () => {
  const [pendingSlots, setPendingSlots] = useState<SlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  
  const { currentUser } = useAuthContext();
  
  // 대기 중인 슬롯 목록 조회
  useEffect(() => {
    const fetchPendingSlots = async () => {
      setLoading(true);
      try {
        // 관리자인지 확인
        if (!currentUser || !currentUser.role || !['admin', 'manager'].includes(currentUser.role)) {
          setError('관리자 권한이 필요합니다.');
          setLoading(false);
          return;
        }
        
        // 대기 중인 슬롯 조회
        const { data, error } = await supabase
          .from('slots')
          .select(`
            id, 
            mat_id,
            product_id,
            user_id,
            status,
            submitted_at,
            processed_at,
            rejection_reason,
            user_reason,
            input_data,
            deadline,
            created_at,
            updated_at,
            campaigns(campaign_name)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // 데이터 변환
        const formattedSlots = data.map(slot => ({
          id: slot.id,
          matId: slot.mat_id,
          productId: slot.product_id,
          userId: slot.user_id,
          status: slot.status,
          submittedAt: slot.submitted_at,
          processedAt: slot.processed_at,
          rejectionReason: slot.rejection_reason,
          userReason: slot.user_reason,
          inputData: slot.input_data,
          deadline: slot.deadline,
          createdAt: slot.created_at,
          updatedAt: slot.updated_at,
          campaignName: slot.campaigns?.campaign_name
        }));
        
        setPendingSlots(formattedSlots);
      } catch (err) {
        console.error('슬롯 목록 조회 실패:', err);
        setError('슬롯 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPendingSlots();
  }, [currentUser]);
  
  // 슬롯 승인 처리
  const handleApprove = async (slotId: string) => {
    if (!currentUser || !currentUser.id) return;
    
    try {
      setProcessingId(slotId);
      
      // 클라이언트 함수 호출 (RPC 대신)
      const result = await approveSlot(slotId, currentUser.id);
      
      if (!result.success) throw new Error(result.message);
      
      // 목록에서 해당 슬롯 제거 (또는 업데이트)
      setPendingSlots(prev => prev.filter(slot => slot.id !== slotId));
      
      alert('슬롯이 성공적으로 승인되었습니다.');
    } catch (err: any) {
      console.error('슬롯 승인 중 오류 발생:', err);
      alert(`슬롯 승인 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setProcessingId(null);
    }
  };
  
  // 슬롯 반려 처리 - 반려 사유 입력 모달 표시
  const handleRejectClick = (slotId: string) => {
    setSelectedSlotId(slotId);
    setRejectionReason('');
    setShowRejectModal(true);
  };
  
  // 슬롯 반려 처리 - 반려 사유 입력 후 처리
  const handleRejectConfirm = async () => {
    if (!currentUser || !currentUser.id || !selectedSlotId) return;
    
    if (!rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    
    try {
      setProcessingId(selectedSlotId);
      
      // 클라이언트 함수 호출 (RPC 대신)
      const result = await rejectSlot(selectedSlotId, currentUser.id, rejectionReason);
      
      if (!result.success) throw new Error(result.message);
      
      // 목록에서 해당 슬롯 제거 (또는 업데이트)
      setPendingSlots(prev => prev.filter(slot => slot.id !== selectedSlotId));
      
      setShowRejectModal(false);
      setSelectedSlotId(null);
      alert('슬롯이 성공적으로 반려되었습니다.');
    } catch (err: any) {
      console.error('슬롯 반려 중 오류 발생:', err);
      alert(`슬롯 반려 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setProcessingId(null);
    }
  };
  
  // 슬롯 상세 정보 표시
  const renderSlotDetails = (slot: SlotItem) => {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md mb-4">
        <div className="mb-4 flex justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{slot.inputData.productName}</h3>
            <p className="text-sm text-gray-500">캠페인: {slot.campaignName || `ID: ${slot.productId}`}</p>
          </div>
          <div className="badge badge-primary">대기중</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">MID</h4>
            <p className="text-sm text-gray-900">{slot.inputData.mid}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">URL</h4>
            <a 
              href={slot.inputData.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-blue-600 hover:underline break-words"
            >
              {slot.inputData.url}
            </a>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">키워드</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {slot.inputData.keywords.map((keyword, index) => (
                <span key={index} className="badge badge-light text-xs">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">생성일</h4>
            <p className="text-sm text-gray-900">
              {new Date(slot.createdAt).toLocaleString('ko-KR')}
            </p>
          </div>
        </div>
        
        {slot.userReason && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-700">사용자 메모</h4>
            <p className="text-sm text-gray-900">{slot.userReason}</p>
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleRejectClick(slot.id)}
            disabled={processingId === slot.id}
            className="btn btn-outline-danger"
          >
            {processingId === slot.id ? '처리 중...' : '반려'}
          </button>
          <button
            onClick={() => handleApprove(slot.id)}
            disabled={processingId === slot.id}
            className="btn btn-primary"
          >
            {processingId === slot.id ? '처리 중...' : '승인'}
          </button>
        </div>
      </div>
    );
  };
  
  // 반려 사유 입력 모달
  const renderRejectModal = () => {
    if (!showRejectModal) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">반려 사유 입력</h3>
          
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full p-2 border rounded-md mb-4 h-32"
            placeholder="반려 사유를 자세히 입력해주세요."
          />
          
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowRejectModal(false)}
              className="btn btn-outline-secondary"
            >
              취소
            </button>
            <button
              onClick={handleRejectConfirm}
              className="btn btn-danger"
              disabled={!rejectionReason.trim()}
            >
              반려하기
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <CommonTemplate title="슬롯 승인 관리" description="대기 중인 슬롯을 승인하거나 반려합니다.">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">슬롯 승인 관리</h1>
          <p className="text-gray-600">대기 중인 슬롯 승인 요청을 처리합니다.</p>
        </div>
        
        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">로딩 중...</span>
            </div>
          </div>
        ) : pendingSlots.length > 0 ? (
          <div>
            <p className="mb-4 text-sm text-gray-600">총 {pendingSlots.length}개의 대기 중인 요청이 있습니다.</p>
            {pendingSlots.map(slot => renderSlotDetails(slot))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <p className="text-lg text-gray-500">대기 중인 슬롯 요청이 없습니다.</p>
          </div>
        )}
      </div>
      
      {renderRejectModal()}
    </CommonTemplate>
  );
};

export { WithdrawRequestsPage };