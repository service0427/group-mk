import React, { useState, useEffect } from 'react';
import { ServiceData } from '@/data/advertiseServices';
import { IAdCampaignsContentItem } from '../data/adCampaignTypes';
import { useLocation } from 'react-router-dom';
import { CommonTemplate } from '@/components/pageTemplate';
// import { IntroLogo } from '@/partials/intro-logo'; // 상단 이미지 제거
// import { toAbsoluteUrl } from '@/utils'; // 이미지 경로 관련 유틸 제거
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, KeenIcon } from '@/components';
import { CardAdCampaign } from './campaign-cards';
import { supabase } from '@/supabase';
import {
  formatCampaignData,
  CampaignData,
  getStatusBadgeClass,
  getStatusLabel
} from '@/utils/CampaignFormat';
import { getServiceTypeFromPath } from '@/data/advertiseServices';

interface DescTemplateProps {
  serviceData: ServiceData;
  campaignPath: string;
}

export const DescTemplate: React.FC<DescTemplateProps> = ({ serviceData, campaignPath }) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);

  // 상태 관리
  const [items, setItems] = useState<IAdCampaignsContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 상태값 관련 함수는 유틸리티로 이동했습니다.

  // 페이지 로딩 시 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // ntraffic 경로에 대한 특별 처리
        if (pathname === '/advertise/ntraffic/desc') {
          const serviceTypeCode = 'ntraffic';

          // Supabase에서 ntraffic 서비스 타입의 캠페인 가져오기 (active 상태만)
          const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('service_type', serviceTypeCode)
            .eq('status', 'active') // 오직 'active' 상태인 캠페인만 표시
            .order('id', { ascending: true });

          if (error) {
            console.error('Error fetching ntraffic campaign data:', error);
            setLoading(false);
            return;
          }

          // 데이터 변환
          const formattedItems: IAdCampaignsContentItem[] = data.map((campaign, index) =>
            formatCampaignData(campaign as CampaignData, index)
          );

          setItems(formattedItems);
          setLoading(false);
          return;
        }

        // 일반적인 경로 처리 (기존 로직)
        // URL 경로에서 서비스 타입 추출
        const pathSegments = pathname.split('/').filter(Boolean);

        // /advertise/platform/type/desc 와 /advertise/platform/subservice/type/desc 구분
        let platform = '';
        let type = '';
        let subservice = '';

        if (pathSegments.length >= 4) {
          platform = pathSegments[1]; // advertise가 0번 인덱스

          if (pathSegments.length === 4) {
            // /advertise/naver/auto/desc 형태
            type = pathSegments[2];
            subservice = '';
          } else if (pathSegments.length === 5) {
            // /advertise/naver/place/save/desc 형태
            subservice = pathSegments[2];
            type = pathSegments[3];
          }
        }

        // 서비스 타입 코드 변환
        const serviceTypeCode = getServiceTypeFromPath(platform, type, subservice);

        if (!serviceTypeCode) {
          console.error('Service type code not found for the given path', { platform, type, subservice });
          setLoading(false);
          return;
        }

        // Supabase에서 해당 서비스 타입의 캠페인 가져오기 (active 상태만)
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('service_type', serviceTypeCode)
          .eq('status', 'active') // 오직 'active' 상태인 캠페인만 표시
          .order('id', { ascending: true });

        if (error) {
          console.error('Error fetching campaign data:', error);
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
        console.error('캠페인 데이터 로딩 오류:', error);
        setItems([]);
        setLoading(false);
      }
    };

    fetchData();
  }, [pathname]);

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
  } else if (pathname.includes('naver/traffic') || pathname.includes('/ntraffic')) {
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

  // 서비스 로고 이미지 코드 제거

  // 카드 형식으로만 렌더링 (목록 형식 제거)
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

  // 캠페인 정보만 보여줄 페이지 콘텐츠 (IntroLogo 제거)
  const pageContent = (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
          <div className="flex flex-wrap items-center gap-5 justify-between">
            <h3 className="text-lg text-gray-900 font-semibold">총 {items.length} 개의 캠페인</h3>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow">
              <KeenIcon icon="information-circle" className="size-16 mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-500 mb-2">캠페인 데이터가 없습니다</p>
              <p className="text-sm text-gray-400">현재 제공 가능한 캠페인이 없습니다. 나중에 다시 확인해 주세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7.5">
              {items.map((item, index) => {
                return renderProject(item, index);
              })}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <CommonTemplate
      title="캠페인 소개"
      description={`캠페인 소개 > ${serviceCategory}`}
      showPageMenu={false}
      showBreadcrumb={true}
    >
      {pageContent}
    </CommonTemplate>
  );
};
