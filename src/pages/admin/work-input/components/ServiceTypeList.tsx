import React, { useState, useEffect } from 'react';
import { getServiceTypeName, CampaignGroup, getCampaignGroups } from '../services/workInputService';
import { useAuthContext } from '@/auth/useAuthContext';

interface ServiceTypeListProps {
  selectedServiceType: string;
  onServiceTypeSelect: (serviceType: string) => void;
  onMatIdSelect: (matId: string) => void;
  selectedMatId: string;
  isLoading: boolean;
  onToggle: () => void;
  isCollapsed: boolean;
}

const ServiceTypeList: React.FC<ServiceTypeListProps> = ({
  selectedServiceType,
  onServiceTypeSelect,
  onMatIdSelect,
  selectedMatId,
  isLoading,
  onToggle,
  isCollapsed
}) => {
  const { currentUser } = useAuthContext();
  const [campaignGroups, setCampaignGroups] = useState<CampaignGroup[]>([]);
  const [expandedServiceTypes, setExpandedServiceTypes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  
  // 서비스 타입별 캠페인 그룹 로드
  useEffect(() => {
    const loadCampaignGroups = async () => {
      if (!currentUser?.id) return;
      
      setLoading(true);
      try {
        const groups = await getCampaignGroups(currentUser.id);
        setCampaignGroups(groups);
        
        // 초기 확장 상태 설정 (모두 열린 상태)
        const initialExpandState: Record<string, boolean> = {};
        serviceTypes.forEach(type => {
          initialExpandState[type.id] = true;
        });
        // 플랫폼도 모두 열기
        initialExpandState['naver'] = true;
        initialExpandState['coupang'] = true;
        initialExpandState['ohouse'] = true;
        setExpandedServiceTypes(initialExpandState);
      } catch (error) {
        console.error('캠페인 그룹 로드 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCampaignGroups();
  }, [currentUser?.id]);
  
  // 서비스 타입 토글
  const toggleServiceType = (serviceTypeId: string) => {
    setExpandedServiceTypes(prev => ({
      ...prev,
      [serviceTypeId]: !prev[serviceTypeId]
    }));
  };
  // 서비스 타입 목록 
  const serviceTypes = [
    { id: 'NaverTraffic', name: '네이버 트래픽', icon: '/media/ad-brand/naver.png' },
    { id: 'NaverAuto', name: '네이버 자동완성', icon: '/media/ad-brand/naver.png' },
    { id: 'NaverShoppingTraffic', name: '네이버 쇼핑 트래픽', icon: '/media/ad-brand/naver-shopping.png' },
    { id: 'NaverShoppingFakeSale', name: '네이버 쇼핑 가구매', icon: '/media/ad-brand/naver-shopping.png' },
    { id: 'NaverPlaceTraffic', name: '네이버 플레이스 트래픽', icon: '/media/ad-brand/naver-place.png' },
    { id: 'NaverPlaceSave', name: '네이버 플레이스 저장', icon: '/media/ad-brand/naver-place.png' },
    { id: 'NaverPlaceShare', name: '네이버 플레이스 공유', icon: '/media/ad-brand/naver-blog.png' },
    { id: 'CoupangTraffic', name: '쿠팡 트래픽', icon: '/media/ad-brand/coupang-app.png' },
    { id: 'CoupangFakeSale', name: '쿠팡 가구매', icon: '/media/ad-brand/coupang-app.png' }
  ];

  // 서비스 타입을 플랫폼별로 그룹화
  const groupedServiceTypes = {
    'naver': serviceTypes.filter(type => type.id.startsWith('Naver')),
    'coupang': serviceTypes.filter(type => type.id.startsWith('Coupang')),
    'ohouse': serviceTypes.filter(type => type.id.startsWith('Ohouse'))
  };

  // 서비스 타입별 캠페인 그룹 필터링
  const getGroupsByServiceType = (serviceType: string) => {
    return campaignGroups.filter(group => group.service_type === serviceType);
  };

  // 현재 선택된 서비스 타입 가져오기
  const getSelectedServiceTypeInfo = () => {
    return serviceTypes.find(type => type.id === selectedServiceType) || serviceTypes[0];
  };

  const selectedServiceTypeInfo = getSelectedServiceTypeInfo();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-lg font-medium">서비스 유형</h2>
          {selectedServiceTypeInfo && (
            <div className="ml-2 flex items-center">
              <div className="h-5 w-5 rounded-full overflow-hidden flex-shrink-0">
                <img src={selectedServiceTypeInfo.icon} alt={selectedServiceTypeInfo.name} className="h-full w-full object-cover" />
              </div>
              <span className="ml-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                {selectedServiceTypeInfo.name}
              </span>
            </div>
          )}
        </div>
        <button 
          onClick={onToggle} 
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hidden lg:block"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
            )}
          </svg>
        </button>
      </div>

      <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
        {loading ? (
          <div className="py-4 text-center text-gray-500">
            <div className="inline-block animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full mr-2"></div>
            캠페인 로딩 중...
          </div>
        ) : (
          <>
            {/* 네이버 서비스 */}
            <div className="space-y-1">
              <div 
                className="flex items-center justify-between py-2 px-2 bg-gray-100 dark:bg-gray-700 rounded-md"
              >
                <div className="flex items-center">
                  <img src="/media/ad-brand/naver.png" alt="네이버" className="w-5 h-5 mr-2" />
                  <span className="font-medium text-sm">네이버</span>
                </div>
                <div className="text-gray-500">
                  {expandedServiceTypes['naver'] ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  )}
                </div>
              </div>
              
              {(
                <div className="ml-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600 space-y-1">
                  {groupedServiceTypes['naver'].map((service) => {
                    const serviceGroups = getGroupsByServiceType(service.id);
                    const isSelected = selectedServiceType === service.id;
                    const isExpanded = isSelected || expandedServiceTypes[service.id];
                    
                    return (
                      <div key={service.id} className="space-y-1">
                        <div
                          className={`flex items-center justify-between py-2 px-2 rounded-md cursor-pointer ${
                            isSelected
                              ? 'bg-blue-100 dark:bg-blue-800 border-l-4 border-blue-500 shadow-md'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onServiceTypeSelect(service.id);
                          }}
                        >
                          <div className="flex items-center">
                            <img src={service.icon} alt={service.name} className="w-4 h-4 mr-2" />
                            <span className={`text-sm ${
                              isSelected
                                ? 'font-bold text-blue-800 dark:text-blue-300'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {service.name}
                            </span>
                          </div>
                          
                          {serviceGroups.length > 0 && (
                            <div 
                              className="text-gray-500"
                            >
                              {isExpanded ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* 서비스 타입에 속한 캠페인 목록 */}
                        {serviceGroups.length > 0 && (
                          <div className="ml-4 space-y-1">
                            {serviceGroups.map((group) => (
                              <div
                                key={`${group.mat_id}_${group.service_type}`}
                                className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer ${
                                  selectedMatId === group.mat_id
                                    ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-300 font-bold'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                                onClick={() => onMatIdSelect(group.mat_id)}
                              >
                                <div className="flex items-center">
                                  <span className="w-4 h-4 flex items-center justify-center mr-2 text-xs">
                                    •
                                  </span>
                                  <span className="text-xs truncate max-w-[140px]">
                                    {group.campaign_name || group.mat_id.substring(0, 10)}
                                  </span>
                                </div>
                                <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                  {group.slot_count}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 쿠팡 서비스 */}
            <div className="space-y-1">
              <div 
                className="flex items-center justify-between py-2 px-2 bg-gray-100 dark:bg-gray-700 rounded-md"
              >
                <div className="flex items-center">
                  <img src="/media/ad-brand/coupang-app.png" alt="쿠팡" className="w-5 h-5 mr-2" />
                  <span className="font-medium text-sm">쿠팡</span>
                </div>
                <div className="text-gray-500">
                  {expandedServiceTypes['coupang'] ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  )}
                </div>
              </div>
              
              {(
                <div className="ml-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600 space-y-1">
                  {groupedServiceTypes['coupang'].map((service) => {
                    const serviceGroups = getGroupsByServiceType(service.id);
                    const isSelected = selectedServiceType === service.id;
                    const isExpanded = isSelected || expandedServiceTypes[service.id];
                    
                    return (
                      <div key={service.id} className="space-y-1">
                        <div
                          className={`flex items-center justify-between py-2 px-2 rounded-md cursor-pointer ${
                            isSelected
                              ? 'bg-blue-100 dark:bg-blue-800 border-l-4 border-blue-500 shadow-md'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onServiceTypeSelect(service.id);
                          }}
                        >
                          <div className="flex items-center">
                            <img src={service.icon} alt={service.name} className="w-4 h-4 mr-2" />
                            <span className={`text-sm ${
                              isSelected
                                ? 'font-bold text-blue-800 dark:text-blue-300'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {service.name}
                            </span>
                          </div>
                          
                          {serviceGroups.length > 0 && (
                            <div 
                              className="text-gray-500"
                            >
                              {isExpanded ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* 서비스 타입에 속한 캠페인 목록 */}
                        {serviceGroups.length > 0 && (
                          <div className="ml-4 space-y-1">
                            {serviceGroups.map((group) => (
                              <div
                                key={`${group.mat_id}_${group.service_type}`}
                                className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer ${
                                  selectedMatId === group.mat_id
                                    ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-300 font-bold'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                                onClick={() => onMatIdSelect(group.mat_id)}
                              >
                                <div className="flex items-center">
                                  <span className="w-4 h-4 flex items-center justify-center mr-2 text-xs">
                                    •
                                  </span>
                                  <span className="text-xs truncate max-w-[140px]">
                                    {group.campaign_name || group.mat_id.substring(0, 10)}
                                  </span>
                                </div>
                                <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                  {group.slot_count}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 오늘의집 서비스 */}
            <div className="space-y-1">
              <div 
                className="flex items-center justify-between py-2 px-2 bg-gray-100 dark:bg-gray-700 rounded-md"
              >
                <div className="flex items-center">
                  <img src="/media/ad-brand/ohouse.png" alt="오늘의집" className="w-5 h-5 mr-2" />
                  <span className="font-medium text-sm">오늘의집</span>
                </div>
                <div className="text-gray-500">
                  {expandedServiceTypes['ohouse'] ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  )}
                </div>
              </div>
              
              {(
                <div className="ml-2 pl-2 border-l-2 border-gray-200 dark:border-gray-600 space-y-1">
                  {groupedServiceTypes['ohouse'].map((service) => {
                    const serviceGroups = getGroupsByServiceType(service.id);
                    const isSelected = selectedServiceType === service.id;
                    const isExpanded = isSelected || expandedServiceTypes[service.id];
                    
                    return (
                      <div key={service.id} className="space-y-1">
                        <div
                          className={`flex items-center justify-between py-2 px-2 rounded-md cursor-pointer ${
                            isSelected
                              ? 'bg-blue-100 dark:bg-blue-800 border-l-4 border-blue-500 shadow-md'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onServiceTypeSelect(service.id);
                          }}
                        >
                          <div className="flex items-center">
                            <img src={service.icon} alt={service.name} className="w-4 h-4 mr-2" />
                            <span className={`text-sm ${
                              isSelected
                                ? 'font-bold text-blue-800 dark:text-blue-300'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {service.name}
                            </span>
                          </div>
                          
                          {serviceGroups.length > 0 && (
                            <div 
                              className="text-gray-500"
                            >
                              {isExpanded ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* 서비스 타입에 속한 캠페인 목록 */}
                        {serviceGroups.length > 0 && (
                          <div className="ml-4 space-y-1">
                            {serviceGroups.map((group) => (
                              <div
                                key={`${group.mat_id}_${group.service_type}`}
                                className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer ${
                                  selectedMatId === group.mat_id
                                    ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-300 font-bold'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                                onClick={() => onMatIdSelect(group.mat_id)}
                              >
                                <div className="flex items-center">
                                  <span className="w-4 h-4 flex items-center justify-center mr-2 text-xs">
                                    •
                                  </span>
                                  <span className="text-xs truncate max-w-[140px]">
                                    {group.campaign_name || group.mat_id.substring(0, 10)}
                                  </span>
                                </div>
                                <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                  {group.slot_count}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceTypeList;