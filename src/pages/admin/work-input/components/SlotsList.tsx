import React, { useState, useMemo } from 'react';
import { Slot, WorkInputFormData } from '../types';
import { Card } from '@/components/ui/card';
import { CAMPAIGNS, getCampaignByName } from '@/config/campaign.config';
import { CampaignServiceType, SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';
import WorkInputModal from './WorkInputModal';
import SlotDetailModal from './SlotDetailModal';
import WorkExcelUploadModal from './WorkExcelUploadModal';
import { toast } from 'sonner';

interface SlotsListProps {
  slots: Slot[];
  onSubmit: (data: WorkInputFormData) => Promise<void>;
  isLoading: boolean;
  matId: string;
}

const SlotsList: React.FC<SlotsListProps> = ({ slots, isLoading, onSubmit, matId }) => {
  // 모달 상태
  const [isWorkInputModalOpen, setIsWorkInputModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExcelUploadModalOpen, setIsExcelUploadModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

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
  
  // 엑셀 업로드 성공 핸들러
  const handleExcelUploadSuccess = () => {
    // 데이터 새로고침
    window.location.reload();
  };

  // 슬롯별 플랫폼 정보 계산
  const slotsWithPlatform = useMemo(() => {
    return slots.map(slot => {
      // 실제 서비스 타입 로깅으로 디버깅
      if (slot.service_type) {
        console.log('실제 슬롯 service_type:', slot.service_type);
      }
      
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
      if (counts.hasOwnProperty(slot.platform)) {
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
        console.log('서비스 타입 매칭 시도:', actualServiceType);
        
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
              console.log('매칭 성공:', variation, '->', label);
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
          console.log('매칭 실패, 원본 사용:', actualServiceType);
        }
        
        if (counts.hasOwnProperty(label)) {
          counts[label]++;
          console.log('카운트 증가:', label, counts[label]);
        } else {
          console.log('counts에 해당 라벨 없음:', label, 'available:', Object.keys(counts));
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
    
    return filtered;
  }, [slotsWithPlatform, selectedPlatform, selectedServiceType, searchTerm]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-base font-bold text-blue-800 dark:text-blue-300">
            승인된 슬롯 목록
            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
              {selectedPlatform === '전체' && selectedServiceType === '전체' 
                ? `총 ${slots.length}개`
                : `${filteredSlots.length}개 (전체 ${slots.length}개)`}
            </span>
          </h2>
        </div>
        
        {/* 플랫폼 탭과 액션 버튼들 */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 mt-3">
          {/* 플랫폼 탭 */}
          <div className="flex flex-wrap gap-1">
            {Object.entries(platformCounts).map(([platform, count]) => (
              <button
                key={platform}
                onClick={() => {
                  setSelectedPlatform(platform);
                  setSelectedServiceType('전체'); // 플랫폼 변경시 서비스 타입 초기화
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  selectedPlatform === platform
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {platform} ({count})
              </button>
            ))}
          </div>
          
          {/* 검색 및 액션 버튼들 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 검색 입력 */}
            <div className="relative">
              <input
                type="text"
                placeholder="캠페인명, 키워드, 사용자명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            
            {/* 필터 버튼 */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"></path>
              </svg>
              필터
            </button>
            
            {/* 엑셀 업로드 버튼 */}
            <button
              onClick={() => setIsExcelUploadModalOpen(true)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 border border-green-600 rounded-md transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              엑셀 업로드
            </button>
          </div>
        </div>
        
        {/* 필터 드롭다운 패널 */}
        {isFilterOpen && (
          <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">고급 필터</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 날짜 범위 필터 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">시작일</label>
                <input
                  type="date"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">종료일</label>
                <input
                  type="date"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* 작업량 범위 필터 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">최소 작업량</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  // TODO: 필터 적용 로직
                  setIsFilterOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-md transition-colors"
              >
                적용
              </button>
            </div>
          </div>
        )}
        
        {/* 서비스 타입 서브탭 */}
        {selectedPlatform !== '전체' && Object.keys(serviceTypeCounts).length > 1 && (
          <div className="flex flex-wrap gap-1 mt-2 pl-4">
            {Object.entries(serviceTypeCounts).map(([serviceType, count]) => (
              <button
                key={serviceType}
                onClick={() => setSelectedServiceType(serviceType)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  selectedServiceType === serviceType
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500'
                }`}
              >
                {serviceType} ({count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 슬롯 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                슬롯#
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                캠페인명
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
              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                작업량
              </th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                시작일
              </th>
              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                종료일
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
                <td colSpan={10} className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
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
                <td colSpan={10} className="px-3 py-4 text-center">
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
                      {slot.keywords ? (
                        <div className="whitespace-pre-line" title={slot.keywords.replace('\n', ' / ')}>
                          {slot.keywords}
                        </div>
                      ) : '-'}
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

                  {/* 작업량 */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {slot.quantity ? `${slot.quantity.toLocaleString()} 타` : '미지정'}
                    </div>
                  </td>

                  {/* 시작일 */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {slot.start_date ? new Date(slot.start_date).toLocaleDateString() : '-'}
                    </div>
                  </td>

                  {/* 종료일 */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {slot.end_date ? new Date(slot.end_date).toLocaleDateString() : '-'}
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
                          <button
                            onClick={() => {
                              // TODO: 환불 처리 로직
                              toast.info('환불 기능은 준비 중입니다.');
                            }}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium rounded-md transition-colors duration-200 flex items-center mx-auto"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                            </svg>
                            환불
                          </button>
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