import React, { Fragment, useState, useEffect } from 'react';
import { ServiceData } from '@/data/advertiseServices';
import { IAdCampaignsContentItem } from '../data/adCampaignTypes';
import { sampleCampaigns, getCampaignsData } from '../data/adCampaignsSampleData';
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

const IntroTemplate: React.FC<IntroTemplateProps> = ({ serviceData }) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);
  
  // 상태 관리
  const [currentMode, setCurrentMode] = useState('cards');
  const [items, setItems] = useState<IAdCampaignsContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 페이지 로딩 시 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 실제 환경에서는 getCampaignsData 함수를 호출하여 Supabase에서 데이터 가져옴
        // const data = await getCampaignsData();
        
        // 현재는 샘플 데이터 사용
        setItems(sampleCampaigns);
        setLoading(false);
      } catch (error) {
        console.error('캠페인 데이터 로딩 오류:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
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

  // 서비스 로고 이미지 결정
  let logoPath = '';
  if (pathname.includes('naver/shopping')) {
    logoPath = '/media/ad-brand/naver-shopping.png';
  } else if (pathname.includes('naver/place')) {
    logoPath = '/media/ad-brand/naver-place.png';
  } else if (pathname.includes('naver/auto')) {
    logoPath = '/media/ad-brand/naver.png';
  } else if (pathname.includes('naver/traffic')) {
    logoPath = '/media/ad-brand/naver.png';
  } else if (pathname.includes('coupang')) {
    logoPath = '/media/ad-brand/coupang-app.png';
  } else if (pathname.includes('ohouse')) {
    logoPath = '/media/ad-brand/ohouse.png';
  } else {
    // 기본 이미지 설정
    logoPath = '/media/ad-brand/naver.png';
  }

  const image = (
    <img
      src={toAbsoluteUrl(logoPath)}
      className="rounded-full border-3 h-[100px] shrink-0"
    />
  );

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
            { label: `${serviceData.name}의 캠페인을 소개합니다`, icon: 'information-3 text-primary' },
          ]}
        />
      </Container>
      <Container>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
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
        )}
      </Container>
    </Fragment>
  );
};

export default IntroTemplate;