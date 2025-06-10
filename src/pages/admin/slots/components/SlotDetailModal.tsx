import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dialog } from '@/components/ui/dialog';
import { Slot } from './types';
import { formatDate } from './constants';
import { X, Calendar, User, Tag, Link, FileText, MessageSquare, Clock, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { KeenIcon } from '@/components';

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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  // ESC 키로 이미지 모달 닫기 - Hook을 조건문 밖으로 이동
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && imageModalOpen) {
        setImageModalOpen(false);
        setSelectedImage(null);
      }
    };
    
    if (imageModalOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [imageModalOpen]);

  // ESC 키로 메인 모달 닫기
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !imageModalOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, imageModalOpen, onClose]);

  // slot이 없으면 null 반환 - Hook 호출 이후로 이동
  if (!slot) return null;

  const inputData = slot.input_data || {};

  // 필수 필드를 제외한 추가 필드만 필터링 (_fileName으로 끝나는 필드도 제외)
  const excludeFields = [
    'campaign_name', 'dueDays', 'expected_deadline', 
    'keyword1', 'keyword2', 'keyword3', 'keywordId', 
    'mainKeyword', 'mid', 'price', 'service_type', 
    'url', 'workCount', 'keywords', 'productName',
    'quantity', 'due_date', 'product_url', 'ohouse_url'
  ];
  
  const additionalFields = Object.entries(inputData).filter(
    ([key]) => !excludeFields.includes(key) && !key.endsWith('_fileName')
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

  // 이미지 클릭 핸들러
  const handleImageClick = (url: string, title: string) => {
    setSelectedImage({ url, title });
    setImageModalOpen(true);
  };

  // 상태 배지 렌더링
  const renderStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { bg: string; text: string; label: string } } = {
      pending: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', label: '대기중' },
      submitted: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: '검토중' },
      approved: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: '승인' },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: '반려' },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: '완료' },
      success: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: '완료' },
      refund: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: '환불' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 백드롭 */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={onClose}
          />
          
          {/* 모달 컨텐츠 */}
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden z-10 animate-in fade-in-0 zoom-in-95 duration-200">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/70 dark:to-gray-800/50">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  슬롯 상세 정보
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {slot.campaign_name || '캠페인 정보'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* 바디 */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)] space-y-8">
            {/* 기본 정보 */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  기본 정보
                </h4>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">사용자</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        {slot.user?.full_name || '알 수 없음'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {slot.user?.email || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">상태</label>
                      <div className="mt-1.5">
                        {renderStatusBadge(slot.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">생성일</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        {formatDate(slot.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">처리일</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                        {slot.processed_at ? formatDate(slot.processed_at) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 상품 정보 */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  상품 정보
                </h4>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">상품명</label>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1.5">
                      {inputData.productName || slot.campaign_name || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">작업수</label>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1.5">
                      {slot.quantity ? slot.quantity.toLocaleString() : 
                       inputData.quantity ? inputData.quantity.toLocaleString() : 
                       inputData.workCount ? inputData.workCount.toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">작업 기간</label>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1.5">
                      {slot.start_date && slot.end_date ? (
                        <>{formatDate(slot.start_date)} ~ {formatDate(slot.end_date)}</>
                      ) : inputData.dueDays ? (
                        `${inputData.dueDays}일`
                      ) : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">URL</label>
                    {inputData.url || inputData.product_url || inputData.ohouse_url ? (
                      <a 
                        href={inputData.url || inputData.product_url || inputData.ohouse_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1.5 transition-colors"
                      >
                        <Link className="w-4 h-4" />
                        링크 바로가기
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1.5">-</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 키워드 정보 */}
            {keywords.length > 0 && (
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    키워드
                  </h4>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex flex-wrap gap-2.5">
                    {keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3.5 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-full font-medium shadow-sm hover:shadow-md transition-shadow"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 추가 정보 */}
            {additionalFields.length > 0 && (
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    추가 정보
                  </h4>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="space-y-3">
                    {additionalFields.map(([key, value]) => {
                      // 파일 URL인지 확인 (Supabase Storage URL 패턴)
                      const isFileUrl = value && typeof value === 'string' && 
                        (value.includes('supabase.co/storage/') || value.includes('/storage/v1/object/'));
                      
                      // 이미지 파일인지 확인
                      const isImage = isFileUrl && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(value);
                      
                      // 파일명 추출
                      const fileNameKey = `${key}_fileName`;
                      const fileName = inputData[fileNameKey] || (isFileUrl ? value.split('/').pop() || '파일' : '');
                      
                      return (
                        <div key={key} className="flex items-start gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-lg transition-colors">
                          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[140px] flex-shrink-0 font-semibold">
                            {key}
                          </span>
                          <div className="flex-1">
                            {isFileUrl ? (
                              isImage ? (
                                // 이미지인 경우 클릭 가능한 썸네일 표시
                                <div className="inline-block">
                                  <div 
                                    className="cursor-pointer group"
                                    onClick={() => handleImageClick(value, key)}
                                  >
                                    <img
                                      src={value}
                                      alt={key}
                                      className="max-w-[200px] max-h-[150px] rounded-lg border-2 border-gray-200 dark:border-gray-700 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-all duration-200 object-cover shadow-md group-hover:shadow-lg"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">{fileName}</p>
                                  </div>
                                </div>
                              ) : (
                                // 일반 파일인 경우 링크로 표시
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  {fileName}
                                </a>
                              )
                            ) : (
                              // 일반 텍스트인 경우
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {value ? String(value) : '-'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 메모 */}
            {(slot.mat_reason || slot.user_reason) && (
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    메모
                  </h4>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50 space-y-4">
                  {slot.mat_reason && (
                    <div className="p-3 bg-white dark:bg-gray-700/50 rounded-lg">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">관리자 메모</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap mt-2 leading-relaxed">
                        {slot.mat_reason}
                      </p>
                    </div>
                  )}
                  {slot.user_reason && (
                    <div className="p-3 bg-white dark:bg-gray-700/50 rounded-lg">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">사용자 메모</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap mt-2 leading-relaxed">
                        {slot.user_reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 반려 사유 */}
            {slot.rejection_reason && (
              <div className="p-5 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 rounded-xl border border-red-200 dark:border-red-800/30 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-red-700 dark:text-red-300 mb-2">
                      반려 사유
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">
                      {slot.rejection_reason}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
    
    {/* 이미지 모달 - SlotList와 동일한 스타일 */}
    {imageModalOpen && selectedImage && createPortal(
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
        onClick={() => {
          setImageModalOpen(false);
          setSelectedImage(null);
        }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div className="relative max-w-4xl max-h-[90vh]">
          <img
            src={selectedImage.url}
            alt={selectedImage.title}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-2 right-2 btn btn-sm btn-light shadow-lg"
            onClick={() => {
              setImageModalOpen(false);
              setSelectedImage(null);
            }}
          >
            <KeenIcon icon="cross" className="text-lg" />
          </button>
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-white bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg inline-block shadow-lg">
              {selectedImage.title}
            </p>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default SlotDetailModal;