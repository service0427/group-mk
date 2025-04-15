import React, { Fragment, useState } from 'react';
import { ServiceData } from '@/data/advertiseServices';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components/container';
import { Navbar } from '@/partials/navbar';
import { PageMenu } from '@/pages/public-profile';
import { ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { IntroLogo } from '@/partials/intro-logo';
import { toAbsoluteUrl } from '@/utils';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem, KeenIcon } from '@/components';
import { CardAdCampaign, CardAdCampaignRow } from '@/partials/cards';

interface IntroTemplateProps {
  serviceData: ServiceData;
  campaignPath: string;
}

interface IAdCampaignsContentItem {
  logo: string;
  logoSize?: string;
  title: string;
  description: string;
  status: {
    variant: string;
    label: string;
  };
  statistics: Array<{ total: string; description: string }>;
  progress: {
    variant: string;
    value: number;
  };
}

const IntroTemplate: React.FC<IntroTemplateProps> = ({ serviceData }) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);
  
  // breadcrumbs 정보에서 상위 메뉴 찾기
  const parentMenu = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].title : '';
  
  // 캠페인 소개 페이지 타이틀 생성
  const pageTitle = "캠페인 소개";
  
  // 서비스 카테고리 생성 - NS 트래픽, NP 저장 등의 형식으로 표시
  let serviceCategory = '';
  if (pathname.includes('naver/shopping/traffic')) {
    serviceCategory = 'NS 트래픽';
  } else if (pathname.includes('naver/place/save')) {
    serviceCategory = 'NP 저장';
  } else if (pathname.includes('naver/place/share')) {
    serviceCategory = 'NP 공유';
  } else if (pathname.includes('naver/place/traffic')) {
    serviceCategory = 'NP 트래픽';
  } else if (pathname.includes('naver/auto')) {
    serviceCategory = 'N 자동완성';
  } else if (pathname.includes('naver/traffic')) {
    serviceCategory = 'N 트래픽';
  } else if (pathname.includes('coupang/traffic')) {
    serviceCategory = 'C 트래픽';
  } else if (pathname.includes('ohouse/traffic')) {
    serviceCategory = 'OH 트래픽';
  } else {
    // URL에서 기본 서비스 정보 추출 (fallback)
    const pathSegments = pathname.split('/').filter(Boolean);
    serviceCategory = pathSegments.length >= 3 ? `${pathSegments[1]} > ${pathSegments[2]}` : '';
  }
  
  const [currentMode, setCurrentMode] = useState('cards');

  // 서비스 로고 이미지 결정
  let logoPath = '';
  if (pathname.includes('naver/shopping')) {
    logoPath = '/media/ad-brand/naver-shopping.png';
  } else if (pathname.includes('naver/place')) {
    logoPath = '/media/ad-brand/naver-place.png';
  } else if (pathname.includes('naver/auto')) {
    logoPath = '/media/ad-brand/naver-ci.png';
  } else if (pathname.includes('naver/traffic')) {
    logoPath = '/media/ad-brand/naver-ci.png';
  } else if (pathname.includes('coupang')) {
    logoPath = '/media/ad-brand/coupang-app.png';
  } else if (pathname.includes('ohouse')) {
    logoPath = '/media/ad-brand/ohouse.png';
  } else {
    // 기본 이미지 설정
    logoPath = '/media/ad-brand/naver-ci.png';
  }

  const image = (
    <img
      src={toAbsoluteUrl(logoPath)}
      className="rounded-full border-3 h-[100px] shrink-0"
    />
  );

  // 샘플 캠페인 데이터 (기존 페이지의 내용과 동일하게 유지)
  const items: IAdCampaignsContentItem[] = [
    {
      logo: 'lion.svg',
      logoSize: '50px',
      title: '라이언',
      description: '4개 방식을 혼합하여 진행하는 플러스 캠페인(1)',
      status: {
        variant: 'badge-primary',
        label: '진행 중'
      },
      statistics: [
        {
          total: '60%',
          description: '🚀상승효율'
        },
        {
          total: '3종 세트',
          description: '📌추가로직'
        },
        {
          total: '100개',
          description: '📦최소수량'
        },
        {
          total: '22:00',
          description: '🕛접수마감'
        }
      ],
      progress: {
        variant: 'progress-warning',
        value: 100
      }
    },
    {
      logo: 'crocodile.svg',
      logoSize: '50px',
      title: '크로커다일',
      description: '4개 방식을 혼합하여 진행하는 플러스 캠페인(2)',
      status: {
        variant: 'badge-primary',
        label: '진행 중'
      },
      statistics: [
        {
          total: '55%',
          description: '🚀상승효율'
        },
        {
          total: '2종 세트',
          description: '📌추가로직'
        },
        {
          total: '100개',
          description: '📦최소수량'
        },
        {
          total: '22:00',
          description: '🕛접수마감'
        }
      ],
      progress: {
        variant: 'progress-success',
        value: 100
      }
    },
    {
      logo: 'flamingo.svg',
      logoSize: '50px',
      title: '플라밍고',
      description: '4개 방식을 혼합하여 진행하는 플러스 캠페인(3)',
      status: {
        variant: 'badge-primary',
        label: '진행 중'
      },
      statistics: [
        {
          total: '53%',
          description: '🚀상승효율'
        },
        {
          total: '1종 세트',
          description: '📌추가로직'
        },
        {
          total: '100개',
          description: '📦최소수량'
        },
        {
          total: '22:00',
          description: '🕛접수마감'
        }
      ],
      progress: {
        variant: 'progress-danger',
        value: 100
      }
    },
    {
      logo: 'llama.svg',
      logoSize: '50px',
      title: '라마',
      description: '단일 방식을 진행하는 기본형 캠페인(1)',
      status: {
        variant: 'badge-primary',
        label: '진행 중'
      },
      statistics: [
        {
          total: '40%',
          description: '🚀상승효율'
        },
        {
          total: '100개',
          description: '📦최소수량'
        },
        {
          total: '22:00',
          description: '🕛접수마감'
        }
      ],
      progress: {
        variant: 'progress-dark',
        value: 100
      }
    },
    {
      logo: 'teddy-bear.svg',
      logoSize: '50px',
      title: '테디베어',
      description: '단일 방식을 진행하는 기본형 캠페인(2)',
      status: {
        variant: 'badge-primary',
        label: '진행 중'
      },
      statistics: [
        {
          total: '39%',
          description: '🚀상승효율'
        },
        {
          total: '100개',
          description: '📦최소수량'
        },
        {
          total: '22:00',
          description: '🕛접수마감'
        }
      ],
      progress: {
        variant: 'progress-info',
        value: 100
      }
    },
    {
      logo: 'dolphin.svg',
      logoSize: '50px',
      title: '돌핀',
      description: '단일 방식을 진행하는 기본형 캠페인(3)',
      status: {
        variant: 'badge-primary',
        label: '진행 중'
      },
      statistics: [
        {
          total: '39%',
          description: '🚀상승효율'
        },
        {
          total: '100개',
          description: '📦최소수량'
        },
        {
          total: '22:00',
          description: '🕛접수마감'
        }
      ],
      progress: {
        variant: 'progress-primary',
        value: 100
      }
    },
    {
      logo: 'pelican.svg',
      logoSize: '50px',
      title: '펠리칸',
      description: '단일 방식을 진행하는 기본형 캠페인(4)',
      status: {
        variant: 'badge-gray-300',
        label: '준비 중'
      },
      statistics: [
        {
          total: '-%',
          description: '🚀상승효율'
        },
        {
          total: '50개',
          description: '📦최소수량'
        },
        {
          total: '22:00',
          description: '🕛접수마감'
        }
      ],
      progress: {
        variant: 'progress-secondary',
        value: 100
      }
    },
    {
      logo: 'elephant.svg',
      logoSize: '50px',
      title: '엘레펀트',
      description: '단일 방식을 진행하는 기본형 캠페인(5)',
      status: {
        variant: 'badge-gray-300',
        label: '준비 중'
      },
      statistics: [
        {
          total: '-%',
          description: '🚀상승효율'
        },
        {
          total: '50개',
          description: '📦최소수량'
        },
        {
          total: '22:00',
          description: '🕛접수마감'
        }
      ],
      progress: {
        variant: 'progress-gray-3300',
        value: 100
      }
    },
    {
      logo: 'kangaroo.svg',
      logoSize: '50px',
      title: '캥거루',
      description: '단일 방식을 진행하는 기본형 캠페인(6)',
      status: {
        variant: 'badge-gray-300',
        label: '준비 중'
      },
      statistics: [
        {
          total: '-%',
          description: '🚀상승효율'
        },
        {
          total: '50개',
          description: '📦최소수량'
        },
        {
          total: '22:00',
          description: '🕛접수마감'
        }
      ],
      progress: {
        variant: 'progress-gray-3300',
        value: 100
      }
    },
    {
      logo: 'giraffe.svg',
      logoSize: '50px',
      title: '지라프',
      description: '단일 방식을 진행하는 기본형 캠페인(7)',
      status: {
        variant: 'badge-gray-300',
        label: '준비 중'
      },
      statistics: [
        {
          total: '-%',
          description: '🚀상승효율'
        },
        {
          total: '50개',
          description: '📦최소수량'
        },
        {
          total: '22:00',
          description: '🕛접수마감'
        }
      ],
      progress: {
        variant: 'progress-gray-3300',
        value: 100
      }
    }
  ];

  const renderProject = (item: IAdCampaignsContentItem, index: number) => {
    return (
      <CardAdCampaign
        logo={item.logo}
        logoSize={item.logoSize}
        title={item.title}
        description={item.description}
        status={item.status}
        statistics={item.statistics}
        progress={item.progress}
        url="#"
        key={index}
      />
    );
  };

  const renderItem = (data: IAdCampaignsContentItem, index: number) => {
    return (
      <CardAdCampaignRow
        logo={data.logo}
        logoSize={data.logoSize}
        title={data.title}
        description={data.description}
        status={data.status}
        statistics={data.statistics}
        url="#"
        key={index}
      />
    );
  };

  return (
    <Fragment>
      <Container>
        <Navbar>
          <PageMenu />
        </Navbar>

        <ToolbarHeading>
          <ToolbarPageTitle customTitle={pageTitle} />
          <ToolbarDescription>
            {serviceCategory} &gt; 캠페인 소개 페이지
          </ToolbarDescription>
        </ToolbarHeading>
        <IntroLogo
          name={serviceData.name}
          image={image}
          info={[
            { label: `${serviceData.name}의 캠페인을 소개합니다.`, icon: 'information-3 text-primary' },
          ]}
        />
      </Container>
      <Container>
        <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
          <div className="flex flex-wrap items-center gap-5 justify-between">
            <h3 className="text-lg text-gray-900 font-semibold">총 {items.length} 개의 캠페인</h3>

            <div className="flex gap-5">
              <div className="btn-tabs" data-tabs="true">
                <a
                  href="#"
                  className={`btn btn-icon ${currentMode === 'cards' ? 'active' : ''}`}
                  data-tab-toggle="#campaigns_cards"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentMode('cards');
                  }}
                >
                  <KeenIcon icon="category" />
                </a>
                <a
                  href="#"
                  className={`btn btn-icon ${currentMode === 'list' ? 'active' : ''}`}
                  data-tab-toggle="#campaigns_list"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentMode('list');
                  }}
                >
                  <KeenIcon icon="row-horizontal" />
                </a>
              </div>
            </div>
          </div>

          <div id="campaigns_cards" className={currentMode === 'list' ? 'hidden' : ''}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7.5">
              {items.map((item, index) => {
                return renderProject(item, index);
              })}
            </div>
          </div>

          <div id="campaigns_list" className={currentMode === 'cards' ? 'hidden' : ''}>
            <div className="flex flex-col gap-5 lg:gap-7.5">
              {items.map((data, index) => {
                return renderItem(data, index);
              })}
            </div>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export default IntroTemplate;
