import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardTemplate } from '@/components/pageTemplate/DashboardTemplate';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { CampaignServiceType, SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';

const CampaignRequestPage: React.FC = () => {
  const navigate = useNavigate();

  // 페이지로 이동
  const navigateToCampaignAddPage = (serviceType: CampaignServiceType) => {
    navigate(`/campaign-request/add?type=${serviceType}`);
  };

  // 서비스 유형 목록 - 사이드바 메뉴 순서와 일치, 활성화된 서비스 먼저, 비활성화된 서비스 나중에
  const serviceTypes = [
    // 활성화된 서비스들
    {
      id: CampaignServiceType.NAVER_SHOPPING_TRAFFIC,
      name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_SHOPPING_TRAFFIC],
      icon: '/media/ad-brand/naver-shopping.png',
      iconAbbr: 'NS',
      description: '네이버 쇼핑 페이지 노출 및 트래픽',
      disabled: false
    },
    {
      id: CampaignServiceType.NAVER_SHOPPING_FAKESALE,
      name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_SHOPPING_FAKESALE],
      icon: '/media/ad-brand/naver-shopping.png',
      iconAbbr: 'NS',
      description: '네이버 쇼핑 가구매 증가',
      disabled: false
    },
    {
      id: CampaignServiceType.NAVER_PLACE_TRAFFIC,
      name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_TRAFFIC],
      icon: '/media/ad-brand/naver-place.png',
      iconAbbr: 'NP',
      description: '네이버 플레이스 트래픽 증가',
      disabled: false
    },
    {
      id: CampaignServiceType.NAVER_PLACE_SAVE,
      name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_SAVE],
      icon: '/media/ad-brand/naver-place.png',
      iconAbbr: 'NP',
      description: '네이버 플레이스 저장하기 증가',
      disabled: false
    },
    {
      id: CampaignServiceType.NAVER_PLACE_SHARE,
      name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_PLACE_SHARE],
      icon: '/media/ad-brand/naver-place.png',
      iconAbbr: 'NP',
      description: '네이버 플레이스 블로그 공유 증가',
      disabled: false
    },
    {
      id: CampaignServiceType.NAVER_BLOG_POST,
      name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_BLOG_POST],
      icon: '/media/ad-brand/naver-blog.png',
      iconAbbr: 'NB',
      description: '네이버 블로그 포스팅 마케팅',
      disabled: false
    },
    {
      id: CampaignServiceType.COUPANG_TRAFFIC,
      name: SERVICE_TYPE_LABELS[CampaignServiceType.COUPANG_TRAFFIC],
      icon: '/media/ad-brand/coupang-app.png',
      iconAbbr: 'CP',
      description: '쿠팡을 통한 사이트 방문자 유치',
      disabled: false
    },
    // 비활성화된 서비스들 (SOON 표시)
    {
      id: CampaignServiceType.NAVER_AUTO,
      name: SERVICE_TYPE_LABELS[CampaignServiceType.NAVER_AUTO],
      icon: '/media/ad-brand/naver.png',
      iconAbbr: 'NA',
      description: '네이버 검색어 자동완성 노출',
      disabled: true
    },
    {
      id: CampaignServiceType.COUPANG_FAKESALE,
      name: SERVICE_TYPE_LABELS[CampaignServiceType.COUPANG_FAKESALE],
      icon: '/media/ad-brand/coupang-app.png',
      iconAbbr: 'CP',
      description: '쿠팡 가구매 증가',
      disabled: true
    },
    {
      id: CampaignServiceType.INSTAGRAM,
      name: SERVICE_TYPE_LABELS[CampaignServiceType.INSTAGRAM],
      icon: '/media/ad-brand/instagram.png',
      iconAbbr: 'IG',
      description: '인스타그램 마케팅 캠페인',
      disabled: true
    },
    {
      id: CampaignServiceType.PHOTO_VIDEO_PRODUCTION,
      name: SERVICE_TYPE_LABELS[CampaignServiceType.PHOTO_VIDEO_PRODUCTION],
      icon: '/media/brand-logos/vimeo.svg',
      iconAbbr: 'PV',
      description: '전문적인 포토 및 영상 제작',
      disabled: true
    },
    {
      id: CampaignServiceType.LIVE_BROADCASTING,
      name: SERVICE_TYPE_LABELS[CampaignServiceType.LIVE_BROADCASTING],
      icon: '/media/ad-brand/youtube.png',
      iconAbbr: 'YT',
      description: '라이브 방송 마케팅',
      disabled: true
    },
  ];

  return (
    <DashboardTemplate
      title="신규 캠페인 신청"
      description="새로운 캠페인을 제안하고 승인 받을 수 있습니다. 원하는 캠페인 유형을 선택해 시작하세요."
      headerTextClass="text-white"
    >
      <Card className="overflow-hidden mb-6">
        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <div className="flex">
              <KeenIcon icon="information" className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">신규 캠페인 제안 안내</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  총판은 새로운 캠페인을 제안하고 승인 받을 수 있습니다. 아래 캠페인 유형 중 하나를 선택하여 시작하세요.
                  제안한 캠페인은 관리자 검토 후 승인되면 활성화됩니다.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-4">캠페인 유형 선택</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {serviceTypes.map((service) => {
              const isDisabled = service.disabled;

              return (
                <div
                  key={service.id}
                  className={`border dark:border-gray-700 rounded-lg p-5 flex flex-col transition-colors ${isDisabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:border-primary hover:bg-primary/5 cursor-pointer'
                    }`}
                  onClick={() => !isDisabled && navigateToCampaignAddPage(service.id)}
                >
                  <div className="flex items-center mb-3">
                    <div className="relative inline-block mr-3">
                      <img src={service.icon} alt={service.name} className="w-6 h-6" />
                      {service.iconAbbr && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[7px] font-bold px-1 rounded leading-tight min-w-[14px] text-center">
                          {service.iconAbbr}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-lg">{service.name}</span>
                    {isDisabled && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        SOON
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{service.description}</p>
                  <div className="mt-auto text-right">
                    <Button
                      className={`${isDisabled
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                      onClick={(e) => {
                        e.stopPropagation(); // 부모 div의 onClick 이벤트 전파 방지
                        !isDisabled && navigateToCampaignAddPage(service.id);
                      }}
                      disabled={isDisabled}
                    >
                      {isDisabled ? '준비중' : '신규 캠페인 등록'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </DashboardTemplate>
  );
};

export default CampaignRequestPage;