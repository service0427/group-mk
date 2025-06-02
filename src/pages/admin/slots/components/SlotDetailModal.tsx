eximport React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Slot } from './types';
import { formatDate } from './constants';
import { X } from 'lucide-react';

interface SlotDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot | null;
  selectedServiceType: string;
}

const SlotDetailModal: React.FC<SlotDetailModalProps> = ({
  isOpen,
  onClose,
  slot,
  selectedServiceType
}) => {
  if (!slot) return null;

  const inputData = slot.input_data || {};

  // 필수 필드를 제외한 추가 필드만 필터링
  const excludeFields = [
    'campaign_name', 'dueDays', 'expected_deadline', 
    'keyword1', 'keyword2', 'keyword3', 'keywordId', 
    'mainKeyword', 'mid', 'price', 'service_type', 
    'url', 'workCount', 'keywords', 'productName',
    'quantity', 'due_date', 'product_url', 'ohouse_url'
  ];
  
  const additionalFields = Object.entries(inputData).filter(
    ([key]) => !excludeFields.includes(key)
  );

  // 키워드 목록 가져오기
  const getKeywords = () => {
    const keywords = [];
    
    // keywords 배열 확인
    if (inputData.keywords && Array.isArray(inputData.keywords)) {
      keywords.push(...inputData.keywords);
    }
    
    // 개별 키워드 필드 확인
    if (inputData.mainKeyword) keywords.push(inputData.mainKeyword);
    if (inputData.keyword1) keywords.push(inputData.keyword1);
    if (inputData.keyword2) keywords.push(inputData.keyword2);
    if (inputData.keyword3) keywords.push(inputData.keyword3);
    
    return [...new Set(keywords)]; // 중복 제거
  };

  const keywords = getKeywords();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* 백드롭 */}
        <div 
          className="fixed inset-0 bg-black/50" 
          onClick={onClose}
        />
        
        {/* 모달 컨텐츠 */}
        <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden z-10">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              슬롯 상세 정보
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* 바디 */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {/* 기본 정보 */}
            <div className="mb-6">
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                기본 정보
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">사용자</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {slot.user?.full_name || '알 수 없음'} ({slot.user?.email || ''})
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">상태</label>
                  <p className="text-sm font-medium">
                    {slot.status === 'pending' && <span className="text-gray-600">대기중</span>}
                    {slot.status === 'submitted' && <span className="text-yellow-600">검토중</span>}
                    {slot.status === 'approved' && <span className="text-blue-600">승인</span>}
                    {slot.status === 'rejected' && <span className="text-red-600">반려</span>}
                    {slot.status === 'completed' && <span className="text-green-600">완료</span>}
                    {slot.status === 'success' && <span className="text-blue-600">완료</span>}
                    {slot.status === 'refund' && <span className="text-purple-600">환불</span>}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">생성일</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(slot.created_at)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">처리일</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {slot.processed_at ? formatDate(slot.processed_at) : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* 상품 정보 */}
            <div className="mb-6">
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                상품 정보
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">상품명</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {inputData.productName || slot.campaign_name || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">작업 타수</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {slot.quantity || inputData.quantity || inputData.workCount || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">작업 기간</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {slot.start_date && slot.end_date ? (
                      <>{formatDate(slot.start_date)} ~ {formatDate(slot.end_date)}</>
                    ) : inputData.dueDays ? (
                      `${inputData.dueDays}일`
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">URL</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {inputData.url || inputData.product_url || inputData.ohouse_url || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* 키워드 정보 */}
            {keywords.length > 0 && (
              <div className="mb-6">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  키워드
                </h4>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 추가 정보 */}
            {additionalFields.length > 0 && (
              <div className="mb-6">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  추가 정보
                </h4>
                <div className="space-y-2">
                  {additionalFields.map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-32 flex-shrink-0">
                        {key}:
                      </span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {value ? String(value) : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 메모 */}
            {(slot.mat_reason || slot.user_reason) && (
              <div className="mb-6">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  메모
                </h4>
                {slot.mat_reason && (
                  <div className="mb-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">관리자 메모</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {slot.mat_reason}
                    </p>
                  </div>
                )}
                {slot.user_reason && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">사용자 메모</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {slot.user_reason}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 반려 사유 */}
            {slot.rejection_reason && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
                  반려 사유
                </h4>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {slot.rejection_reason}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default SlotDetailModal;