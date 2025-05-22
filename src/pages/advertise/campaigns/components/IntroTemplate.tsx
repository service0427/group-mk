import React, { Fragment, useState, useEffect } from 'react';
import { ServiceData } from '@/data/advertiseServices';
import { IAdCampaignsContentItem } from '@/pages/advertise/campaigns/data/adCampaignTypes';
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
  const [rawItems, setRawItems] = useState<any[]>([]); // 원본 데이터 저장
  const [loading, setLoading] = useState(true);

  // 서비스 타입 코드를 동기적으로 계산
  const getServiceTypeCodeFromURL = () => {
    console.log('🔍 [DEBUG] getServiceTypeCodeFromURL 호출 시작');
    const pathSegments = pathname.split('/').filter(Boolean);
    const serviceType = pathSegments.length >= 3 ? pathSegments[3] : '';

    console.log('🔍 [DEBUG] getServiceTypeCodeFromURL:', {
      pathname,
      pathSegments,
      serviceType
    });

    if (!serviceType) {
      console.log('🔍 [DEBUG] serviceType이 없어서 빈 문자열 반환');
      return '';
    }

    const parts = serviceType.split('-');
    let platform = '';
    let type = '';
    let subservice = '';

    if (parts.length === 3) {
      platform = parts[0];
      subservice = parts[1];
      type = parts[2];
    } else if (parts.length === 2) {
      platform = parts[0];
      type = parts[1];
    }

    console.log('🔍 [DEBUG] URL 파싱 결과:', { platform, type, subservice });

    const result = getServiceTypeFromPath(platform, type, subservice);
    console.log('🔍 [DEBUG] getServiceTypeFromPath 결과:', result);

    return result;
  };

  const serviceTypeCode = getServiceTypeCodeFromURL();
  console.log('🔍 [DEBUG] IntroTemplate - 최종 serviceTypeCode:', serviceTypeCode);

  // 상태값 관련 함수는 유틸리티로 이동했습니다.

  // 페이지 로딩 시 데이터 가져오기
  useEffect(() => {
    console.log('🔍 [DEBUG] IntroTemplate - useEffect 시작');
    const fetchData = async () => {
      console.log('🔍 [DEBUG] IntroTemplate - fetchData 시작');
      console.log('🔍 [DEBUG] IntroTemplate - 사용할 serviceTypeCode:', serviceTypeCode);
      try {
        setLoading(true);

        if (!serviceTypeCode) {
          console.log('🔍 [DEBUG] IntroTemplate - serviceTypeCode가 없어서 종료');
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

        console.log('🔍 [DEBUG] IntroTemplate - DB 조회 결과:', { data, error });

        if (error) {
          console.error('Error fetching campaign data:', error);
          setLoading(false);
          return;
        }

        // 첫 번째 캠페인의 detailed_description 확인
        if (data && data.length > 0) {
          const firstCampaign = data[0];
        }

        // 원본 데이터 저장
        setRawItems(data);

        // 데이터 변환 전에 원본 데이터를 직접 확인
        if (data && data.length > 0) {

          // DB에서 가져온 데이터의 키 목록 확인 (모든 필드명 표시)
          const sampleItem = data[0];
        }

        // 유틸리티 함수를 사용하여 데이터 변환 (인덱스 전달)
        const formattedItems: IAdCampaignsContentItem[] = data.map((campaign, index) => {
          // 기존 방식으로 포맷된 아이템 생성
          const formattedItem = formatCampaignData(campaign as CampaignData, index);

          if (campaign.detailed_description) {
            formattedItem.detailedDescription = campaign.detailed_description.replace(/\\n/g, '\n');
          }

          // ID 설정 (나중에 원본 데이터와 매칭하기 위해)
          formattedItem.id = campaign.id;

          // 원본 데이터를 아이템에 직접 포함시킴 (타입 확장)
          (formattedItem as any).originalData = campaign;

          return formattedItem;
        });

        setItems(formattedItems);
        setLoading(false);
      } catch (error) {

        setItems([]);
        setLoading(false);
      }
    };

    fetchData();
  }, [pathname, serviceTypeCode]);

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
    serviceCategory = serviceType ? serviceType.replace(/-/g, ' ') : '';
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

  // 전역 변수로 원본 데이터 참조를 저장 (모든 컴포넌트에서 공유)
  // 데이터가 있을 때만 설정
  if (rawItems && rawItems.length > 0) {
    console.log('IntroTemplate - Setting rawItems:', rawItems);
    window.campaignRawItems = rawItems;
  }

  const renderProject = (item: IAdCampaignsContentItem, index: number) => {
    // 상세 설명 가져오기 (이제 originalData에서 직접 가져옴)
    const detailedDesc = item.originalData?.detailed_description?.replace(/\\n/g, '\n') || item.detailedDescription;

    console.log('🔍 [DEBUG] IntroTemplate renderProject 호출:', {
      index,
      title: item.title,
      serviceTypeCode,
      serviceTypeCodeType: typeof serviceTypeCode,
      serviceTypeCodeLength: serviceTypeCode?.length
    });

    return (
      <CardAdCampaign
        logo={item.logo}
        logoSize={item.logoSize}
        title={item.title}
        description={item.description}
        detailedDescription={detailedDesc}  // 원본 데이터 우선 사용
        status={item.status}
        statistics={item.statistics}
        progress={item.progress}
        url={campaignPath}
        key={index}
        rawId={item.id}  // 원본 데이터 ID 전달
        rawData={item.originalData}  // 원본 데이터 전체 전달
        serviceTypeCode={serviceTypeCode}  // 서비스 타입 코드 전달
      />
    );
  };

  const renderItem = (data: IAdCampaignsContentItem, index: number) => {
    // 상세 설명 가져오기 (이제 originalData에서 직접 가져옴)
    const detailedDesc = data.originalData?.detailed_description?.replace(/\\n/g, '\n') || data.detailedDescription;

    return (
      <CardAdCampaignRow
        logo={data.logo}
        logoSize={data.logoSize}
        title={data.title}
        description={data.description}
        detailedDescription={detailedDesc}  // 원본 데이터 우선 사용
        status={data.status}
        statistics={data.statistics}
        url={campaignPath}
        key={index}
        rawId={data.id}  // 원본 데이터 ID 전달
        rawData={data.originalData}  // 원본 데이터 전체 전달
        serviceTypeCode={serviceTypeCode}  // 서비스 타입 코드 전달
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

            {/* 디버그 정보 출력 */}
            <div className="mb-4 p-4 bg-gray-100 rounded border border-gray-300">
              <h4 className="font-bold mb-2">디버그 정보:</h4>
              <p>캠페인 개수: {items.length}</p>
              <p>원본 데이터 개수: {rawItems.length}</p>
              {rawItems.length > 0 && (
                <div>
                  <p>첫 번째 캠페인 ID: {rawItems[0].id}</p>
                  <p>첫 번째 캠페인 이름: {rawItems[0].campaign_name}</p>
                  <p>상세 설명 유무: {rawItems[0].detailed_description ? '있음' : '없음'}</p>
                  <p>상세 설명 미리보기: {rawItems[0].detailed_description?.substring(0, 30)}...</p>
                </div>
              )}
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