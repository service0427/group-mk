import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CAMPAIGNS } from '@/config/campaign.config';
import { CampaignServiceType, SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';
import { SERVICE_METADATA } from '@/config/service-metadata';
import { USER_ROLES } from '@/config/roles.config';

interface ServiceSelectorProps {
  selectedService: string | null;
  onServiceSelect: (service: string) => void;
  showDisabled?: boolean;
  showCount?: boolean;
  serviceCounts?: Record<string, number>;
  className?: string;
  requiresKeyword?: boolean;  // 키워드가 필요한 서비스만 표시할지 여부
  userRole?: string;  // 사용자 역할
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedService,
  onServiceSelect,
  showDisabled = true,
  showCount = false,
  serviceCounts = {},
  className = '',
  requiresKeyword,
  userRole
}) => {
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
          // 가구매 서비스와 N 자동완성은 비활성화
          disabled: type.code === CampaignServiceType.NAVER_SHOPPING_FAKESALE ||
            type.code === CampaignServiceType.COUPANG_FAKESALE ||
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

    return services;
  }, [allServices, showDisabled, requiresKeyword, userRole]);

  return (
    <div className={`flex flex-wrap gap-1.5 lg:gap-2 ${className}`}>
      {filteredServices.map((service) => (
        <Button
          key={service.path}
          variant={selectedService === service.path ? "default" : "outline"}
          size="sm"
          onClick={() => onServiceSelect(service.path)}
          disabled={service.disabled}
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
          <span className="whitespace-nowrap">{service.name}</span>
          {showCount && serviceCounts[service.code || service.path] && (
            <Badge
              variant="outline"
              className={`ml-1.5 min-w-[20px] h-5 px-1 ${selectedService === service.path
                  ? 'bg-white/20 border-white/40 text-white'
                  : ''
                }`}
            >
              {serviceCounts[service.code || service.path]}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
};