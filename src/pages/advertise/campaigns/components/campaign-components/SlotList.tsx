import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { SlotItem, Campaign } from './types';
import { KeenIcon } from '@/components';
import EditableCell from './EditableCell';
import { formatDate, getStatusBadge } from './constants';
import { hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';

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
  showBulkActions?: boolean;
  selectedSlots?: string[];
  onSelectedSlotsChange?: (selectedSlots: string[]) => void;
  showBulkCancel?: boolean;
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
  showBulkActions = false,
  selectedSlots: externalSelectedSlots,
  onSelectedSlotsChange,
  showBulkCancel = false
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
      return '/media/ad-brand/naver-ci.png';
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
                    <th className="py-2 px-3 text-start font-medium text-xs w-[20%]">상품명</th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-[15%]">키워드</th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-[10%]">캠페인</th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-[8%]">상태</th>
                    <th className="py-2 px-3 text-center font-medium text-xs w-[10%]">등록일</th>
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

                      {/* 상품명 */}
                      <td className="py-2 px-3 w-[20%]">
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
                      </td>

                      {/* 키워드 */}
                      <td className="py-2 px-3 w-[15%]">
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
                                          style={{zIndex: 9998}}
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
                                                        className={`px-2 py-0.5 text-xs rounded-md inline-block ${
                                                          index % 4 === 0
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
                              {getStatusBadge(item.status)}
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
                            <div className="flex flex-col items-center gap-1">
                              {getStatusBadge(item.status)}
                              <button
                                className="btn btn-xs btn-info"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onConfirmTransaction) {
                                    onConfirmTransaction(item.id);
                                  }
                                }}
                              >
                                거래완료
                              </button>
                            </div>
                          ) : (
                            getStatusBadge(item.status)
                          )}
                        </div>
                      </td>

                      {/* 등록일 */}
                      <td className="py-2 px-3 text-center w-[10%]">
                        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </span>
                      </td>

                      {/* 관리 */}
                      <td className="py-2 px-3 w-[8%]">
                        <div className="flex justify-center items-center gap-1">
                          <button
                            className="btn btn-sm btn-icon btn-clear btn-primary"
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
                      {getStatusBadge(item.status)}
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
                          if (onConfirmTransaction) {
                            onConfirmTransaction(item.id);
                          }
                        }}
                      >
                        거래완료
                      </button>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-600 w-16">등록일:</span>
                      <span className="text-gray-900">{formatDate(item.createdAt)}</span>
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
                                          style={{zIndex: 9998}}
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
                                                        className={`px-2 py-0.5 text-xs rounded-md inline-block ${
                                                          index % 4 === 0
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
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </>
  );
};

export default SlotList;