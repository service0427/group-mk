import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CAMPAIGNS } from '@/config/campaign.config';
import { CampaignServiceType, SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';
import { SERVICE_METADATA } from '@/config/service-metadata';
import { USER_ROLES } from '@/config/roles.config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ServiceSelectorProps {
  selectedService: string | null;
  onServiceSelect: (service: string) => void;
  showDisabled?: boolean;
  showCount?: boolean;
  serviceCounts?: Record<string, number>;
  guaranteeCounts?: Record<string, number>;
  className?: string;
  requiresKeyword?: boolean;  // 키워드가 필요한 서비스만 표시할지 여부
  userRole?: string;  // 사용자 역할
  servicesWithSlots?: Set<string>;  // 슬롯이 있는 서비스 목록
  collapsible?: boolean;  // 접기/펼치기 기능 사용 여부
  initialDisplayCount?: number;  // 초기 표시 개수
  expandableServices?: boolean;  // 서비스별 일반형/보장형 확장 기능 사용 여부
  onGuaranteeSelect?: (service: string) => void;  // 보장형 선택 콜백
  getTotalCount?: (serviceType: string) => number;
  getGeneralCount?: (serviceType: string) => number;
  getGuaranteeCount?: (serviceType: string) => number;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedService,
  onServiceSelect,
  showDisabled = true,
  showCount = false,
  serviceCounts = {},
  guaranteeCounts = {},
  className = '',
  requiresKeyword,
  userRole,
  servicesWithSlots,
  collapsible = false,
  initialDisplayCount = 6,
  expandableServices = false,
  onGuaranteeSelect,
  getTotalCount,
  getGeneralCount,
  getGuaranteeCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // 모든 서비스를 menu.config.tsx 순서대로 정렬
  const allServices = useMemo(() => {
    // menu.config.tsx의 순서에 맞춰 수동으로 정렬
    const orderedServiceCodes = [
      CampaignServiceType.NAVER_SHOPPING_RANK,    // NS 순위확인
      CampaignServiceType.NAVER_SHOPPING_TRAFFIC, // NS 트래픽
      CampaignServiceType.NAVER_PLACE_RANK,       // NP 순위확인
      CampaignServiceType.NAVER_PLACE_TRAFFIC,    // NP 트래픽
      CampaignServiceType.NAVER_PLACE_SAVE,       // NP 저장하기
      CampaignServiceType.NAVER_PLACE_SHARE,      // NP 블로그공유
      CampaignServiceType.NAVER_BLOG_POST,        // NB 포스팅
      CampaignServiceType.NAVER_AUTO,             // N 자동완성
      CampaignServiceType.NAVER_SHOPPING_FAKESALE,// NS 가구매
      CampaignServiceType.COUPANG_TRAFFIC,        // CP 트래픽
      CampaignServiceType.COUPANG_FAKESALE,       // CP 가구매
      CampaignServiceType.INSTAGRAM,              // 인스타그램
      CampaignServiceType.PHOTO_VIDEO_PRODUCTION, // 포토&영상 제작
      CampaignServiceType.LIVE_BROADCASTING       // 라이브방송
    ];

    // 모든 서비스를 플랫폼별로 매핑
    const serviceMap = new Map<string, any>();
    CAMPAIGNS.forEach(campaign => {
      campaign.types.forEach(type => {
        // 서비스별 아이콘 매핑
        let icon = campaign.logo || '';
        if (type.code === CampaignServiceType.NAVER_SHOPPING_TRAFFIC ||
          type.code === CampaignServiceType.NAVER_SHOPPING_FAKESALE ||
          type.code === CampaignServiceType.NAVER_SHOPPING_RANK) {
          icon = '/media/ad-brand/naver-shopping.png';
        } else if (type.code === CampaignServiceType.NAVER_PLACE_TRAFFIC ||
          type.code === CampaignServiceType.NAVER_PLACE_SAVE ||
          type.code === CampaignServiceType.NAVER_PLACE_RANK) {
          icon = '/media/ad-brand/naver-place.png';
        } else if (type.code === CampaignServiceType.NAVER_PLACE_SHARE) {
          icon = '/media/ad-brand/naver-place.png';
        } else if (type.code === CampaignServiceType.NAVER_BLOG_POST) {
          icon = '/media/ad-brand/naver-blog.png';
        }

        // URL 경로 생성 (서비스 타입 코드를 kebab-case로 변환)
        const path = type.code.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1);

        serviceMap.set(path, {
          name: type.name,
          path: path,
          code: type.code,
          icon: icon,
          platform: campaign.name,
          // CP 가구매와 N 자동완성은 비활성화 (NS 가구매, NB 포스팅은 활성화)
          disabled: type.code === CampaignServiceType.COUPANG_FAKESALE ||
            type.code === CampaignServiceType.NAVER_AUTO
        });
      });
    });

    // 추가 서비스들을 수동으로 serviceMap에 추가
    const additionalServices = [
      {
        code: CampaignServiceType.INSTAGRAM,
        name: '인스타그램',
        path: 'instagram',
        icon: '/media/ad-brand/instagram.png',
        platform: '인스타그램',
        disabled: true
      },
      {
        code: CampaignServiceType.PHOTO_VIDEO_PRODUCTION,
        name: '포토&영상 제작',
        path: 'photo-video-production',
        icon: '/media/brand-logos/vimeo.svg',
        platform: '포토&영상 제작',
        disabled: true
      },
      {
        code: CampaignServiceType.LIVE_BROADCASTING,
        name: '라이브방송',
        path: 'live-broadcasting',
        icon: '/media/ad-brand/youtube.png',
        platform: '라이브방송',
        disabled: true
      }
    ];

    // 추가 서비스들을 serviceMap에 추가
    additionalServices.forEach(service => {
      serviceMap.set(service.path, service);
    });

    // 순서대로 서비스 배열 생성
    const orderedServices = orderedServiceCodes
      .map(code => {
        const path = code.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1);
        return serviceMap.get(path);
      })
      .filter(Boolean);

    // 활성화된 서비스를 먼저, 비활성화된 서비스를 나중에 정렬
    const enabledServices = orderedServices.filter(service => !service.disabled);
    const disabledServices = orderedServices.filter(service => service.disabled);

    return [...enabledServices, ...disabledServices];
  }, []);

  // 서비스를 필터링 (비활성화된 서비스 표시 여부 및 키워드 필터)
  const filteredServices = useMemo(() => {
    let services = allServices;

    // 비기너 역할인 경우 NS 순위확인과 NP 순위확인만 표시
    if (userRole === USER_ROLES.BEGINNER) {
      services = services.filter(service => 
        service.code === CampaignServiceType.NAVER_SHOPPING_RANK ||
        service.code === CampaignServiceType.NAVER_PLACE_RANK
      );
    }

    // 총판(Distributor) 역할인 경우 NS 순위확인과 NP 순위확인 제외
    if (userRole === USER_ROLES.DISTRIBUTOR) {
      services = services.filter(service => 
        service.code !== CampaignServiceType.NAVER_SHOPPING_RANK &&
        service.code !== CampaignServiceType.NAVER_PLACE_RANK
      );
    }

    // 키워드 필터 적용
    if (requiresKeyword !== undefined) {
      services = services.filter(service => {
        // service.code가 있으면 메타데이터 확인
        if (service.code && SERVICE_METADATA[service.code]) {
          return SERVICE_METADATA[service.code].requiresKeyword === requiresKeyword;
        }
        // 추가 서비스들(인스타그램 등)은 키워드가 필요없는 것으로 간주
        return !requiresKeyword;
      });
    }

    // 비활성화 필터 적용
    if (!showDisabled) {
      services = services.filter(service => !service.disabled);
    }

    // servicesWithSlots가 제공된 경우, 슬롯이 있는 서비스를 앞쪽으로 정렬
    if (servicesWithSlots && servicesWithSlots.size > 0) {
      const servicesWithSlotsArray: typeof services = [];
      const servicesWithoutSlotsArray: typeof services = [];
      
      services.forEach(service => {
        const hasSlots = servicesWithSlots.has(service.code);
        if (hasSlots && !service.disabled) {
          servicesWithSlotsArray.push(service);
        } else {
          servicesWithoutSlotsArray.push(service);
        }
      });
      
      services = [...servicesWithSlotsArray, ...servicesWithoutSlotsArray];
    }

    return services;
  }, [allServices, showDisabled, requiresKeyword, userRole, servicesWithSlots]);

  // 표시할 서비스 결정
  const displayedServices = useMemo(() => {
    if (!collapsible || isExpanded) {
      return filteredServices;
    }
    return filteredServices.slice(0, initialDisplayCount);
  }, [filteredServices, collapsible, isExpanded, initialDisplayCount]);

  const hasMoreServices = collapsible && filteredServices.length > initialDisplayCount;

  return (
    <div className={`${className} overflow-x-auto`}>
      <div className="flex flex-wrap gap-1.5 lg:gap-2 min-w-0">
        {displayedServices.map((service) => {
          // servicesWithSlots가 제공되면, 슬롯이 없는 서비스는 비활성화
          const hasSlots = !servicesWithSlots || servicesWithSlots.has(service.code);
          const isDisabled = service.disabled || (!hasSlots && servicesWithSlots !== undefined);
          
          if (expandableServices) {
            // 확장 모드: DropdownMenu 사용
            return (
              <DropdownMenu key={service.path}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={selectedService === service.path ? "default" : "outline"}
                    size="sm"
                    disabled={isDisabled}
                    className={`relative text-xs lg:text-sm px-2 lg:px-4 py-1.5 lg:py-2 ${selectedService === service.path
                        ? 'bg-primary hover:bg-primary/90'
                        : ''
                      }`}
                  >
                    {service.icon && (
                      <img
                        src={service.icon}
                        alt={service.name}
                        className="size-3 lg:size-4 mr-1 lg:mr-2"
                      />
                    )}
                    <span className="sm:whitespace-nowrap">{service.name}</span>
                    {showCount && (
                      <Badge
                        variant="outline"
                        className={`ml-1.5 min-w-[20px] h-5 px-1 ${selectedService === service.path
                            ? 'bg-white/20 border-white/40 text-white'
                            : ''
                          }`}
                      >
                        {getTotalCount ? getTotalCount(service.code || service.path) : (serviceCounts[service.code || service.path] || 0)}
                      </Badge>
                    )}
                    <span className="ml-2 text-gray-400">▼</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[140px]">
                  <DropdownMenuItem 
                    onClick={() => onServiceSelect(service.path)}
                    className="cursor-pointer"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        일반형
                      </span>
                      {showCount && (
                        <Badge variant="outline" className="text-xs ml-2">
                          {getGeneralCount ? getGeneralCount(service.code || service.path) : (serviceCounts[service.code || service.path] || 0)}
                        </Badge>
                      )}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onGuaranteeSelect?.(service.path)}
                    className="cursor-pointer"
                  >
                    <span className="flex items-center justify-between w-full">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        보장형
                      </span>
                      {showCount && (
                        <Badge variant="outline" className="text-xs ml-2">
                          {getGuaranteeCount ? getGuaranteeCount(service.code || service.path) : (guaranteeCounts[service.code || service.path] || 0)}
                        </Badge>
                      )}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          } else {
            // 기본 모드: 일반 버튼
            return (
              <Button
                key={service.path}
                variant={selectedService === service.path ? "default" : "outline"}
                size="sm"
                onClick={() => onServiceSelect(service.path)}
                disabled={isDisabled}
                className={`relative text-xs lg:text-sm px-2 lg:px-4 py-1.5 lg:py-2 ${selectedService === service.path
                    ? 'bg-primary hover:bg-primary/90'
                    : ''
                  }`}
              >
                {service.icon && (
                  <img
                    src={service.icon}
                    alt={service.name}
                    className="size-3 lg:size-4 mr-1 lg:mr-2"
                  />
                )}
                <span className="sm:whitespace-nowrap">{service.name}</span>
                {showCount && (
                  <Badge
                    variant="outline"
                    className={`ml-1.5 min-w-[20px] h-5 px-1 ${selectedService === service.path
                        ? 'bg-white/20 border-white/40 text-white'
                        : ''
                      }`}
                  >
                    {serviceCounts[service.code || service.path] || 0}
                  </Badge>
                )}
              </Button>
            );
          }
        })}
        
        {/* 더보기/접기 버튼 */}
        {hasMoreServices && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`text-xs lg:text-sm px-2 lg:px-4 py-1.5 lg:py-2 ${
              isExpanded 
                ? 'border-gray-400 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800' 
                : 'border-primary text-primary hover:bg-primary/10 dark:border-primary dark:text-primary dark:hover:bg-primary/20'
            }`}
          >
            <span className="sm:whitespace-nowrap">
              {isExpanded ? '접기' : `더보기 (+${filteredServices.length - initialDisplayCount})`}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
};