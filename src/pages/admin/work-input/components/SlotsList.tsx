import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Slot, WorkInputFormData } from '../types';
import { CAMPAIGNS, getCampaignByName } from '@/config/campaign.config';
import { CampaignServiceType, SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';
import WorkInputModal from './WorkInputModal';
import SlotDetailModal from './SlotDetailModal';
import WorkExcelUploadModal from './WorkExcelUploadModal';
import { useResponsive } from '@/hooks';
import { formatDate } from '../utils/dateUtils';

// 정렬 타입 정의
type SortField = 'user_slot_number' | 'campaign_name' | 'service_type' | 'quantity' | 'start_date' | 'end_date';
type SortDirection = 'asc' | 'desc';

interface SlotsListProps {
  slots: Slot[];
  onSubmit: (data: WorkInputFormData) => Promise<void>;
  isLoading: boolean;
  matId: string;
  isAdmin?: boolean;
}

const SlotsList: React.FC<SlotsListProps> = ({ slots, isLoading, onSubmit, matId, isAdmin = false }) => {
  // 반응형 디바이스 체크
  const isMobile = !useResponsive('up', 'md');

  // 모달 상태
  const [isWorkInputModalOpen, setIsWorkInputModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // 정렬 상태
  const [sortField, setSortField] = useState<SortField>('user_slot_number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // 키워드 툴팁 상태
  const [openKeywordTooltipId, setOpenKeywordTooltipId] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  // 상세보기 핸들러
  const handleDetailView = (slot: Slot) => {
    setSelectedSlot(slot);
    setIsDetailModalOpen(true);
  };

  // 작업 입력 핸들러
  const handleWorkInput = (slot: Slot) => {
    setSelectedSlot(slot);
    setIsWorkInputModalOpen(true);
  };

  // 작업 입력 제출 핸들러
  const handleWorkInputSubmit = async (data: WorkInputFormData) => {
    await onSubmit(data);
  };
  // 선택된 플랫폼과 서비스 타입 상태
  const [selectedPlatform, setSelectedPlatform] = useState<string>('전체');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('전체');

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [minQuantityFilter, setMinQuantityFilter] = useState<string>('');

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className={`w-3 h-3 text-gray-700 dark:text-gray-300 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  // 엑셀 업로드 성공 핸들러
  const handleExcelUploadSuccess = () => {
    // 데이터 새로고침
    window.location.reload();
  };

  // 슬롯별 플랫폼 정보 계산
  const slotsWithPlatform = useMemo(() => {
    return slots.map(slot => {

      // 서비스 타입에서 플랫폼 추출 (더 유연한 매칭)
      let platform = '기타';
      if (slot.service_type) {
        const serviceType = slot.service_type.toUpperCase();
        if (serviceType.includes('NAVER') || serviceType.includes('네이버')) {
          platform = '네이버';
        } else if (serviceType.includes('COUPANG') || serviceType.includes('쿠팡')) {
          platform = '쿠팡';
        } else if (serviceType.includes('OHOUSE') || serviceType.includes('오늘의집')) {
          platform = '오늘의집';
        }

        // 추가 매핑 시도 - 다양한 형태 대응
        const normalizedType = serviceType.replace(/[-_\s]/g, '').toLowerCase();
        if (normalizedType.includes('navertraffic') || normalizedType.includes('naverauto') ||
          normalizedType.includes('navershopping') || normalizedType.includes('naverplace')) {
          platform = '네이버';
        } else if (normalizedType.includes('coupangtraffic') || normalizedType.includes('coupangfakesale')) {
          platform = '쿠팡';
        }
      }
      return { ...slot, platform };
    });
  }, [slots]);

  // 모든 플랫폼과 개수 계산 (config 기반)
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { '전체': slots.length };

    // config에서 모든 플랫폼 추가
    CAMPAIGNS.forEach(campaign => {
      counts[campaign.name] = 0;
    });

    // 실제 슬롯 개수 계산
    slotsWithPlatform.forEach(slot => {
      if (Object.prototype.hasOwnProperty.call(counts, slot.platform)) {
        counts[slot.platform]++;
      }
    });

    return counts;
  }, [slotsWithPlatform, slots.length]);

  // 선택된 플랫폼의 모든 서비스 타입과 개수
  const serviceTypeCounts = useMemo(() => {
    const counts: Record<string, number> = { '전체': 0 };

    if (selectedPlatform === '전체') {
      counts['전체'] = slots.length;
      // 전체 선택시에는 서브탭 안보임
      return counts;
    }

    // 선택된 플랫폼의 config 찾기
    const platformConfig = getCampaignByName(selectedPlatform);
    if (platformConfig) {
      // config의 모든 서비스 타입 추가
      platformConfig.types.forEach(type => {
        const label = SERVICE_TYPE_LABELS[type.code as CampaignServiceType] || type.name;
        counts[label] = 0;
      });
    }

    // 해당 플랫폼의 실제 슬롯들로 개수 계산
    const platformSlots = slotsWithPlatform.filter(slot => slot.platform === selectedPlatform);
    counts['전체'] = platformSlots.length;

    platformSlots.forEach(slot => {
      if (slot.service_type) {
        // 실제 서비스 타입과 config 라벨 매칭 시도
        const actualServiceType = slot.service_type;

        // 1. 정확한 매칭 시도
        let label = SERVICE_TYPE_LABELS[actualServiceType as CampaignServiceType];

        // 2. 매칭되지 않으면 변형해서 시도
        if (!label) {
          // 다양한 형태로 변환해서 시도
          const variations = [
            actualServiceType,
            actualServiceType.toUpperCase(),
            actualServiceType.toLowerCase(),
            actualServiceType.replace(/[-_]/g, ''),
            actualServiceType.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()
          ];

          for (const variation of variations) {
            if (SERVICE_TYPE_LABELS[variation as CampaignServiceType]) {
              label = SERVICE_TYPE_LABELS[variation as CampaignServiceType];
              break;
            }
          }
        }

        // 3. 여전히 매칭되지 않으면 플랫폼 기반 추론
        if (!label) {
          const upperType = actualServiceType.toUpperCase();
          if (upperType.includes('TRAFFIC')) {
            if (upperType.includes('NAVER')) {
              if (upperType.includes('SHOPPING')) {
                label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_SHOPPING_TRAFFIC];
              } else if (upperType.includes('PLACE')) {
                label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_TRAFFIC];
              } else {
                label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_TRAFFIC];
              }
            } else if (upperType.includes('COUPANG')) {
              label = SERVICE_TYPE_LABELS[CampaignServiceType.COUPANG_TRAFFIC];
            }
          } else if (upperType.includes('AUTO') && upperType.includes('NAVER')) {
            label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_AUTO];
          } else if (upperType.includes('SAVE') && upperType.includes('PLACE')) {
            label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_SAVE];
          } else if (upperType.includes('SHARE') && upperType.includes('PLACE')) {
            label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_SHARE];
          } else if (upperType.includes('FAKESALE')) {
            if (upperType.includes('NAVER')) {
              label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_SHOPPING_FAKESALE];
            } else if (upperType.includes('COUPANG')) {
              label = SERVICE_TYPE_LABELS[CampaignServiceType.COUPANG_FAKESALE];
            }
          }
        }

        // 4. 최종적으로 원본을 사용
        if (!label) {
          label = actualServiceType;
        }

        if (Object.prototype.hasOwnProperty.call(counts, label)) {
          counts[label]++;
        }
      }
    });

    return counts;
  }, [slotsWithPlatform, selectedPlatform, slots.length]);

  // 필터링된 슬롯들
  const filteredSlots = useMemo(() => {
    let filtered = slotsWithPlatform;

    // 검색어 필터링
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(slot => {
        // 안전한 문자열 변환 함수
        const safeToLower = (value: any): string => {
          if (typeof value === 'string') return value.toLowerCase();
          if (value != null) return String(value).toLowerCase();
          return '';
        };

        return (
          safeToLower(slot.campaign_name).includes(searchLower) ||
          safeToLower(slot.keywords).includes(searchLower) ||
          safeToLower(slot.user_name).includes(searchLower) ||
          safeToLower(slot.user_email).includes(searchLower) ||
          safeToLower(slot.mid).includes(searchLower) ||
          safeToLower(slot.url).includes(searchLower)
        );
      });
    }

    // 날짜 필터링
    if (startDateFilter) {
      filtered = filtered.filter(slot => {
        if (!slot.start_date) return false;
        return slot.start_date >= startDateFilter;
      });
    }

    if (endDateFilter) {
      filtered = filtered.filter(slot => {
        if (!slot.end_date) return false;
        return slot.end_date <= endDateFilter;
      });
    }

    // 작업량 필터링
    if (minQuantityFilter && Number(minQuantityFilter) > 0) {
      const minQty = Number(minQuantityFilter);
      filtered = filtered.filter(slot => {
        return slot.quantity && slot.quantity >= minQty;
      });
    }

    if (selectedPlatform !== '전체') {
      filtered = filtered.filter(slot => slot.platform === selectedPlatform);
    }

    if (selectedServiceType !== '전체') {
      filtered = filtered.filter(slot => {
        if (!slot.service_type) return false;

        // 동일한 매칭 로직 사용
        const actualServiceType = slot.service_type;
        let label = SERVICE_TYPE_LABELS[actualServiceType as CampaignServiceType];

        if (!label) {
          const variations = [
            actualServiceType,
            actualServiceType.toUpperCase(),
            actualServiceType.toLowerCase(),
            actualServiceType.replace(/[-_]/g, ''),
            actualServiceType.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()
          ];

          for (const variation of variations) {
            if (SERVICE_TYPE_LABELS[variation as CampaignServiceType]) {
              label = SERVICE_TYPE_LABELS[variation as CampaignServiceType];
              break;
            }
          }
        }

        if (!label) {
          const upperType = actualServiceType.toUpperCase();
          if (upperType.includes('TRAFFIC')) {
            if (upperType.includes('NAVER')) {
              if (upperType.includes('SHOPPING')) {
                label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_SHOPPING_TRAFFIC];
              } else if (upperType.includes('PLACE')) {
                label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_TRAFFIC];
              } else {
                label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_TRAFFIC];
              }
            } else if (upperType.includes('COUPANG')) {
              label = SERVICE_TYPE_LABELS[CampaignServiceType.COUPANG_TRAFFIC];
            }
          } else if (upperType.includes('AUTO') && upperType.includes('NAVER')) {
            label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_AUTO];
          } else if (upperType.includes('SAVE') && upperType.includes('PLACE')) {
            label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_SAVE];
          } else if (upperType.includes('SHARE') && upperType.includes('PLACE')) {
            label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_SHARE];
          } else if (upperType.includes('FAKESALE')) {
            if (upperType.includes('NAVER')) {
              label = SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_SHOPPING_FAKESALE];
            } else if (upperType.includes('COUPANG')) {
              label = SERVICE_TYPE_LABELS[CampaignServiceType.COUPANG_FAKESALE];
            }
          }
        }

        if (!label) {
          label = actualServiceType;
        }

        return label === selectedServiceType;
      });
    }

    // 정렬 적용
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'user_slot_number':
          aValue = a.user_slot_number || 0;
          bValue = b.user_slot_number || 0;
          break;
        case 'campaign_name':
          aValue = a.campaign_name || '';
          bValue = b.campaign_name || '';
          break;
        case 'service_type':
          aValue = a.service_type || '';
          bValue = b.service_type || '';
          break;
        case 'quantity':
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        case 'start_date':
          aValue = a.start_date || '';
          bValue = b.start_date || '';
          break;
        case 'end_date':
          aValue = a.end_date || '';
          bValue = b.end_date || '';
          break;
        default:
          aValue = a.user_slot_number || 0;
          bValue = b.user_slot_number || 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [slotsWithPlatform, selectedPlatform, selectedServiceType, searchTerm, sortField, sortDirection, startDateFilter, endDateFilter, minQuantityFilter]);

  // 모바일 카드 레이아웃 렌더링
  const renderMobileCard = (slot: Slot & { platform: string }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = slot.end_date ? new Date(slot.end_date) : null;
    const isExpired = endDate && endDate < today;

    return (
      <div key={slot.id} className="card mb-4 overflow-hidden">
        <div className="p-4">
          {/* 헤더 영역 */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  슬롯 #{slot.user_slot_number || '-'}
                </span>
                {isExpired && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                    종료됨
                  </span>
                )}
              </div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                {slot.campaign_name || `캠페인 #${slot.id.substring(0, 8)}`}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ID: {slot.id.substring(0, 8)}...
              </p>
            </div>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {slot.quantity ? `${slot.quantity.toLocaleString()} 타` : '미지정'}
            </span>
          </div>

          {/* 정보 영역 */}
          <div className="space-y-2 mb-3">
            {/* 키워드 */}
            {slot.keywords && (
              <div className="flex">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">키워드</span>
                <div className="flex-1">
                  <div className="flex items-center gap-1 relative">
                    {(() => {
                      const keywordArray = slot.keywords.split('\n').filter(k => k.trim());
                      
                      if (keywordArray.length === 0) {
                        return null;
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
                                  setOpenKeywordTooltipId(openKeywordTooltipId === slot.id ? null : slot.id);
                                }}
                              >
                                +{additionalCount}
                              </button>
                              {/* Tooltip - 모바일에서도 동일하게 사용 */}
                              {openKeywordTooltipId === slot.id && ReactDOM.createPortal(
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
                                      <div>
                                        <div className="text-xs text-gray-400 mb-1">메인 키워드</div>
                                        <div className="flex flex-wrap gap-1">
                                          {keywordArray.slice(0, 1).map((keyword, index) => (
                                            <span
                                              key={index}
                                              className="px-2 py-0.5 text-xs rounded-md inline-block bg-blue-500/20 text-blue-200 font-medium"
                                            >
                                              {keyword}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      {/* 서브 키워드 */}
                                      {keywordArray.length > 1 && (
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
            )}

            {/* MID/URL */}
            {(slot.mid || slot.url) && (
              <div className="flex">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">정보</span>
                <div className="flex-1">
                  {slot.mid && (
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      MID: {slot.mid}
                    </div>
                  )}
                  {slot.url && (
                    <a
                      href={slot.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {slot.url}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 사용자 */}
            <div className="flex">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">사용자</span>
              <div className="flex-1">
                <div className="text-sm text-gray-900 dark:text-white">
                  {slot.user_name || '-'}
                </div>
                {slot.user_email && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {slot.user_email}
                  </div>
                )}
              </div>
            </div>

            {/* 총판 (ADMIN만) */}
            {isAdmin && (slot.mat_name || slot.mat_email) && (
              <div className="flex">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">총판</span>
                <div className="flex-1">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {slot.mat_name || '-'}
                  </div>
                  {slot.mat_email && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {slot.mat_email}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 기간 */}
            <div className="flex">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-16 flex-shrink-0">기간</span>
              <div className="flex-1 text-sm text-gray-900 dark:text-white">
                {formatDate(slot.start_date)} ~ {formatDate(slot.end_date)}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={() => handleDetailView(slot)}
              className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              상세보기
            </button>
            {!isExpired && (
              <button
                onClick={() => handleWorkInput(slot)}
                className="flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 text-sm font-medium rounded-md transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                입력
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* 검색 조건 카드 */}
      <div className="card shadow-sm">
        <div className="card-header px-6 py-4">
          <h3 className="card-title">슬롯 검색</h3>
        </div>
        <div className="card-body px-6 py-4">
          {/* 플랫폼 탭 */}
          <div className={`flex ${isMobile ? 'overflow-x-auto scrollbar-hide -mx-2 px-2' : 'flex-wrap'} gap-1 mb-4`}>
            {Object.entries(platformCounts).map(([platform, count]) => (
              <button
                key={platform}
                onClick={() => {
                  setSelectedPlatform(platform);
                  setSelectedServiceType('전체');
                }}
                className={`${isMobile ? 'flex-shrink-0' : ''} px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${selectedPlatform === platform
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
              >
                {platform} ({count})
              </button>
            ))}
          </div>

          {/* 서비스 타입 서브탭 */}
          {selectedPlatform !== '전체' && Object.keys(serviceTypeCounts).length > 1 && (
            <div className={`flex ${isMobile ? 'overflow-x-auto scrollbar-hide -mx-2 px-2' : 'flex-wrap'} gap-1 mb-3`}>
              {Object.entries(serviceTypeCounts).map(([serviceType, count]) => (
                <button
                  key={serviceType}
                  onClick={() => setSelectedServiceType(serviceType)}
                  className={`${isMobile ? 'flex-shrink-0' : ''} px-2 py-1 text-xs font-medium rounded transition-colors ${selectedServiceType === serviceType
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500'
                    }`}
                >
                  {serviceType} ({count})
                </button>
              ))}
            </div>
          )}

          {/* 검색 및 필터 영역 */}
          <div className={`${isMobile ? 'space-y-2' : ''}`}>
            {/* 데스크탑 검색 폼 */}
            <div className="hidden md:block space-y-4">
              {/* 필터 라인 */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3">
                  <div className="flex items-center h-9">
                    <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[80px]">시작일</label>
                    <input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center h-9">
                    <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[80px]">종료일</label>
                    <input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center h-9">
                    <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[80px]">최소작업량</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={minQuantityFilter}
                      onChange={(e) => setMinQuantityFilter(e.target.value)}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center h-9">
                    <label className="text-sm text-gray-700 dark:text-gray-300 font-medium min-w-[60px]">검색어</label>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="이름, 키워드, URL"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input input-bordered input-sm w-full pr-8"
                      />
                      {searchTerm && (
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setSearchTerm('')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-1 flex items-center">
                  <button
                    className="btn btn-primary btn-sm px-6 w-full"
                    onClick={() => {
                      // 검색 실행 - 필터링은 이미 자동으로 되고 있으므로 추가 동작 불필요
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="loading loading-spinner loading-xs"></span>
                        검색 중
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        검색
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 모바일 검색 폼 */}
            <div className="block md:hidden space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">시작일</label>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="input input-bordered input-sm w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">종료일</label>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="input input-bordered input-sm w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">최소 작업량</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minQuantityFilter}
                    onChange={(e) => setMinQuantityFilter(e.target.value)}
                    className="input input-bordered input-sm w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">검색어</label>
                  <input
                    type="text"
                    placeholder="이름, 키워드, URL"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input input-bordered input-sm w-full"
                  />
                </div>
              </div>

              {/* 모바일 검색 버튼 */}
              <div className="flex justify-end mt-3">
                <button
                  className="btn btn-primary btn-sm w-full"
                  onClick={() => {
                    // 검색 실행
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="loading loading-spinner loading-xs"></span>
                      검색 중
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      검색
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 승인된 슬롯 목록 카드 */}
      <div className="card shadow-sm">
        <div className="card-header px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <h3 className="card-title flex-none">슬롯 목록</h3>
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                총 <span className="text-primary font-semibold">{filteredSlots.length.toLocaleString()}</span>건
              </span>
              <button
                onClick={() => setIsExcelUploadModalOpen(true)}
                className="btn btn-success btn-sm"
              >
                <svg className={`w-4 h-4 ${isMobile ? '' : 'mr-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <span className={isMobile ? 'hidden' : ''}>엑셀 업로드</span>
              </button>
            </div>
          </div>
        </div>

        {isMobile ? (
          // 모바일 카드 레이아웃
          <div className="card-body px-6 py-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-2">로딩 중...</span>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-base font-medium mb-2">
                  {selectedPlatform === '전체' && selectedServiceType === '전체'
                    ? '승인된 슬롯이 없습니다.'
                    : selectedServiceType !== '전체'
                      ? `${selectedServiceType}에 승인된 슬롯이 없습니다.`
                      : `${selectedPlatform}에 승인된 슬롯이 없습니다.`}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm text-center">
                  {selectedServiceType !== '전체'
                    ? '다른 서비스 타입을 선택하거나 새로운 캠페인을 생성해보세요.'
                    : '캠페인 생성 후 슬롯 승인을 받아보세요.'}
                </p>
              </div>
            ) : (
              <div>
                {filteredSlots.map((slot) => renderMobileCard(slot))}
              </div>
            )}
          </div>
        ) : (
          // 데스크톱 테이블 레이아웃
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('user_slot_number')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        슬롯#
                        {renderSortIcon('user_slot_number')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('campaign_name')}
                    >
                      <div className="flex items-center gap-1">
                        캠페인명
                        {renderSortIcon('campaign_name')}
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      키워드
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      MID/URL
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      사용자
                    </th>
                    {isAdmin && (
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        총판
                      </th>
                    )}
                    <th
                      scope="col"
                      className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        작업량
                        {renderSortIcon('quantity')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('start_date')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        시작일
                        {renderSortIcon('start_date')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('end_date')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        종료일
                        {renderSortIcon('end_date')}
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      상세보기
                    </th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={isAdmin ? 11 : 10} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex justify-center">
                          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="ml-2">로딩 중...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSlots.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 11 : 10} className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center py-8">
                          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          <p className="text-gray-500 dark:text-gray-400 text-base font-medium mb-2">
                            {selectedPlatform === '전체' && selectedServiceType === '전체'
                              ? '승인된 슬롯이 없습니다.'
                              : selectedServiceType !== '전체'
                                ? `${selectedServiceType}에 승인된 슬롯이 없습니다.`
                                : `${selectedPlatform}에 승인된 슬롯이 없습니다.`}
                          </p>
                          <p className="text-gray-400 dark:text-gray-500 text-sm">
                            {selectedServiceType !== '전체'
                              ? '다른 서비스 타입을 선택하거나 새로운 캠페인을 생성해보세요.'
                              : '캠페인 생성 후 슬롯 승인을 받아보세요.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSlots.map((slot) => (
                      <tr key={slot.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {/* 슬롯 번호 */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {slot.user_slot_number || '-'}
                          </div>
                        </td>

                        {/* 캠페인명 */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {slot.campaign_name || `캠페인 #${slot.id.substring(0, 8)}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {slot.id.substring(0, 8)}...
                          </div>
                        </td>

                        {/* 키워드 */}
                        <td className="px-3 py-3">
                          <div className="text-sm text-gray-900 dark:text-white max-w-40">
                            <div className="flex items-center gap-1 relative">
                              {(() => {
                                // keywords 문자열을 배열로 변환
                                const keywordArray = slot.keywords ? slot.keywords.split('\n').filter(k => k.trim()) : [];
                                
                                if (keywordArray.length === 0) {
                                  return <span className="text-gray-400">-</span>;
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
                                            setOpenKeywordTooltipId(openKeywordTooltipId === slot.id ? null : slot.id);
                                          }}
                                        >
                                          +{additionalCount}
                                        </button>
                                        {/* Tooltip */}
                                        {openKeywordTooltipId === slot.id && ReactDOM.createPortal(
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
                                                    {keywordArray.slice(0, 1).map((keyword, index) => (
                                                      <span
                                                        key={index}
                                                        className="px-2 py-0.5 text-xs rounded-md inline-block bg-blue-500/20 text-blue-200 font-medium"
                                                      >
                                                        {keyword}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                                
                                                {/* 서브 키워드 */}
                                                {keywordArray.length > 1 && (
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
                          </div>
                        </td>

                        {/* MID/URL */}
                        <td className="px-3 py-3">
                          <div className="text-sm text-gray-900 dark:text-white max-w-40">
                            {slot.mid && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1" title={slot.mid}>
                                MID: {slot.mid}
                              </div>
                            )}
                            {slot.url ? (
                              <a
                                href={slot.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline text-xs truncate block"
                                title={slot.url}
                              >
                                {slot.url}
                              </a>
                            ) : (!slot.mid ? '-' : '')}
                          </div>
                        </td>

                        {/* 사용자 */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {slot.user_name || '-'}
                          </div>
                          {slot.user_email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 max-w-32 truncate" title={slot.user_email}>
                              {slot.user_email}
                            </div>
                          )}
                        </td>

                        {/* 총판 정보 (ADMIN만 볼 수 있음) */}
                        {isAdmin && (
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {slot.mat_name || '-'}
                            </div>
                            {slot.mat_email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 max-w-32 truncate" title={slot.mat_email}>
                                {slot.mat_email}
                              </div>
                            )}
                          </td>
                        )}

                        {/* 작업량 */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {slot.quantity ? `${slot.quantity.toLocaleString()} 타` : '미지정'}
                          </div>
                        </td>

                        {/* 시작일 */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(slot.start_date)}
                          </div>
                        </td>

                        {/* 종료일 */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(slot.end_date)}
                          </div>
                        </td>

                        {/* 상세보기 */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDetailView(slot)}
                            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-md transition-colors duration-200 flex items-center mx-auto"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            상세보기
                          </button>
                        </td>

                        {/* 작업 입력 */}
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {(() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const endDate = slot.end_date ? new Date(slot.end_date) : null;
                            const isExpired = endDate && endDate < today;

                            if (isExpired) {
                              return (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  종료됨
                                </span>
                              );
                            }

                            return (
                              <button
                                onClick={() => handleWorkInput(slot)}
                                className="px-3 py-1.5 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 text-xs font-medium rounded-md transition-colors duration-200 flex items-center mx-auto"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                입력
                              </button>
                            );
                          })()}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      <SlotDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        slot={selectedSlot}
      />

      {/* 작업 입력 모달 */}
      <WorkInputModal
        isOpen={isWorkInputModalOpen}
        onClose={() => setIsWorkInputModalOpen(false)}
        slot={selectedSlot}
        onSubmit={handleWorkInputSubmit}
      />

      {/* 엑셀 업로드 모달 */}
      <WorkExcelUploadModal
        isOpen={isExcelUploadModalOpen}
        onClose={() => setIsExcelUploadModalOpen(false)}
        onSuccess={handleExcelUploadSuccess}
        matId={matId}
      />
    </div>
  );
};

export default SlotsList;