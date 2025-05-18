import React, { useState, useEffect } from 'react';
import { ServiceData } from '@/data/advertiseServices';
import { IAdCampaignsContentItem } from '../data/adCampaignTypes';
import { useLocation } from 'react-router-dom';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, KeenIcon } from '@/components';
import { CardAdCampaign, CardAdCampaignRow } from './campaign-cards';
import { supabase } from '@/supabase';
import {
  formatCampaignData,
  CampaignData,
} from '@/utils/CampaignFormat';
import { getServiceTypeFromPath } from '@/data/advertiseServices';
import { CampaignServiceType } from '@/components/campaign-modals/types';

interface CampaignInfoTemplateProps {
  serviceData: ServiceData;
  campaignPath: string;
}

export const CampaignInfoTemplate: React.FC<CampaignInfoTemplateProps> = ({ serviceData, campaignPath }) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);

  // 상태 관리
  const [items, setItems] = useState<IAdCampaignsContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 가져오기 함수
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 새로운 URL 형식 처리 (/advertise/campaigns/info/:serviceType)
      const pathSegments = pathname.split('/').filter(Boolean);
      
      // serviceType 추출 (naver-traffic, naver-shopping-traffic 등)
      const serviceType = pathSegments.length >= 3 ? pathSegments[3] : '';
      
      if (!serviceType) {
        setError('서비스 타입 정보가 없습니다.');
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
      } else {
        setError('올바르지 않은 서비스 타입 형식입니다.');
        setLoading(false);
        return;
      }

      // 서비스 타입 코드 변환
      const serviceTypeCode = getServiceTypeFromPath(platform, type, subservice);

      if (!serviceTypeCode) {
        setError('서비스 타입 코드를 찾을 수 없습니다.');
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
        console.error("캠페인 데이터 가져오기 오류:", error);
        throw new Error('캠페인 데이터를 불러오는 중 오류가 발생했습니다.');
      }

      // 유틸리티 함수를 사용하여 데이터 변환 (인덱스와 서비스 타입 코드 전달)
      const formattedItems: IAdCampaignsContentItem[] = data.map((campaign, index) =>
        formatCampaignData(campaign as any, index, serviceTypeCode)
      );

      setItems(formattedItems);
      setLoading(false);
    } catch (err: any) {
      console.error("데이터 로딩 중 오류:", err);
      setError(err.message || '캠페인 데이터를 불러오는 중 오류가 발생했습니다.');
      setItems([]);
      setLoading(false);
    }
  };

  // 페이지 로딩 시 데이터 가져오기
  useEffect(() => {
    fetchData();
  }, [pathname]);

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

  // 카드/목록 형식 모두 지원
  const [currentMode, setCurrentMode] = useState('cards');

  // 카드 형식으로 렌더링
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

  // 리스트 형식으로 렌더링
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

  // 캠페인 정보만 보여줄 페이지 콘텐츠
  const pageContent = (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-10 bg-white rounded-lg shadow">
          <KeenIcon icon="warning" className="size-16 mb-4 text-red-500" />
          <p className="text-lg font-medium text-red-600 mb-2">데이터 로딩 오류</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchData()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
          >
            <KeenIcon icon="arrows-circle" className="size-4" />
            다시 시도
          </button>
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
              <p className="text-sm text-gray-400 mb-4">현재 제공 가능한 캠페인이 없습니다.</p>
              <button 
                onClick={() => fetchData()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2"
              >
                <KeenIcon icon="arrows-circle" className="size-4" />
                다시 시도
              </button>
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
    </>
  );

  // 직접 콘텐츠만 반환
  return pageContent;
};