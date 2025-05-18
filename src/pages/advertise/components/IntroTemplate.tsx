import React, { Fragment, useState, useEffect } from 'react';
import { ServiceData } from '@/data/advertiseServices';
import { IAdCampaignsContentItem } from '../data/adCampaignTypes';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components/container';
import { Navbar } from '@/partials/navbar';
import { PageMenu } from '@/partials/pagemenu';
import { ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { IntroLogo } from '@/partials/intro-logo';
import { toAbsoluteUrl } from '@/utils';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem, KeenIcon } from '@/components';
import { CardAdCampaign, CardAdCampaignRow } from './campaign-cards';
import { supabase } from '@/supabase';
import { getServiceTypeFromPath } from '@/data/advertiseServices';
import { 
  formatCampaignData, 
  CampaignData, 
  getStatusBadgeClass, 
  getStatusLabel 
} from '@/utils/CampaignFormat';

interface IntroTemplateProps {
  serviceData: ServiceData;
  campaignPath: string;
}

const IntroTemplate: React.FC<IntroTemplateProps> = ({ serviceData, campaignPath }) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);
  
  // 상태 관리
  const [currentMode, setCurrentMode] = useState('cards');
  const [items, setItems] = useState<IAdCampaignsContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 상태값 관련 함수는 유틸리티로 이동했습니다.
  
  // 페이지 로딩 시 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 새로운 URL 형식 처리 (/advertise/campaigns/info/:serviceType)
        const pathSegments = pathname.split('/').filter(Boolean);
        
        // serviceType 추출 (naver-traffic, naver-shopping-traffic 등)
        const serviceType = pathSegments.length >= 3 ? pathSegments[3] : '';
        
        if (!serviceType) {
          setLoading(false);
          return;
        }
        
        // URL 형식 분석 (naver-shopping-traffic, naver-auto, coupang-traffic 등)
        const parts = serviceType.split('-');
        
        let platform = '';
        let type = '';
        let subservice = '';
        
        if (parts.length === 3) {
          // naver-shopping-traffic 같은 형식
          platform = parts[0];
          subservice = parts[1];
          type = parts[2];
        } else if (parts.length === 2) {
          // naver-auto, coupang-traffic 같은 형식
          platform = parts[0];
          type = parts[1];
        }
        
        
        
        // 서비스 타입 코드 변환
        const serviceTypeCode = getServiceTypeFromPath(platform, type, subservice);
        
        if (!serviceTypeCode) {
          
          setLoading(false);
          return;
        }
        
        // Supabase에서 해당 서비스 타입의 캠페인 가져오기 (표시안함 상태 제외)
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('service_type', serviceTypeCode)
          .neq('status', 'pause') // 'pause' 상태인 캠페인 제외
          .order('id', { ascending: true });
          
        if (error) {
          
          setLoading(false);
          return;
        }
        
        // 유틸리티 함수를 사용하여 데이터 변환 (인덱스 전달)
        const formattedItems: IAdCampaignsContentItem[] = data.map((campaign, index) => 
          formatCampaignData(campaign as CampaignData, index)
        );
        
        setItems(formattedItems);
        setLoading(false);
      } catch (error) {
        
        setItems([]);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [pathname]);
  
  // breadcrumbs 정보에서 상위 메뉴 찾기
  const parentMenu = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].title : '';
  
  // 캠페인 소개 페이지 타이틀 생성
  const pageTitle = "캠페인 소개";
  
  // 서비스 카테고리 생성 - NS 트래픽, NP 저장 등의 형식으로 표시
  let serviceCategory = '';
  // 새로운 URL 형식 분석 (/advertise/campaigns/info/:serviceType)
  const pathSegments = pathname.split('/').filter(Boolean);
  const serviceType = pathSegments.length >= 3 ? pathSegments[3] : '';
  
  if (serviceType === 'naver-shopping-traffic') {
    serviceCategory = 'NS 트래픽';
  } else if (serviceType === 'naver-place-save') {
    serviceCategory = 'NP 저장';
  } else if (serviceType === 'naver-place-share') {
    serviceCategory = 'NP 공유';
  } else if (serviceType === 'naver-place-traffic') {
    serviceCategory = 'NP 트래픽';
  } else if (serviceType === 'naver-auto') {
    serviceCategory = 'N 자동완성';
  } else if (serviceType === 'naver-traffic') {
    serviceCategory = 'N 트래픽';
  } else if (serviceType === 'coupang-traffic') {
    serviceCategory = 'CP 트래픽';
  } else if (serviceType === 'ohouse-traffic') {
    serviceCategory = 'OH 트래픽';
  } else {
    // 알 수 없는 형식인 경우 그대로 표시
    serviceCategory = serviceType ? serviceType.replaceAll('-', ' ') : '';
  }

  // 서비스 로고 이미지 결정
  let logoPath = '';
  if (serviceType === 'naver-shopping-traffic') {
    logoPath = '/media/ad-brand/naver-shopping.png';
  } else if (serviceType.startsWith('naver-place')) {
    logoPath = '/media/ad-brand/naver-place.png';
  } else if (serviceType === 'naver-auto') {
    logoPath = '/media/ad-brand/naver.png';
  } else if (serviceType === 'naver-traffic') {
    logoPath = '/media/ad-brand/naver.png';
  } else if (serviceType.startsWith('coupang')) {
    logoPath = '/media/ad-brand/coupang-app.png';
  } else if (serviceType.startsWith('ohouse')) {
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
        url={campaignPath}
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
        url={campaignPath}
        key={index}
      />
    );
  };

  return (
    <Fragment>
      <Container fullWidth>
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
      <Container fullWidth>
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

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow">
                <KeenIcon icon="information-circle" className="size-16 mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-500 mb-2">캠페인 데이터가 없습니다</p>
                <p className="text-sm text-gray-400">현재 제공 가능한 캠페인이 없습니다. 나중에 다시 확인해 주세요.</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </Container>
    </Fragment>
  );
};

export { IntroTemplate };