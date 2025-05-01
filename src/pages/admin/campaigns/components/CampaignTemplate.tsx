import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CommonTemplate } from '@/components/pageTemplate';
import { useMenuBreadcrumbs } from '@/components';
import { useMenus } from '@/providers';
import { AdMiscFaq } from '@/partials/misc';
import { CampaignContent } from './CampaignContent';
import { fetchCampaigns, getServiceTypeCode } from '../services/campaignService';
import { ICampaign } from './CampaignContent';
import { getCampaignsByService } from '../data'; // 백업 데이터용

interface CampaignTemplateProps {
  title: string;
  description?: string;
  serviceCode?: string;
  customContent?: React.ReactNode;
}

const CampaignTemplate: React.FC<CampaignTemplateProps> = ({ 
  title, 
  description, 
  serviceCode = '',
  customContent 
}) => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);
  
  // 캠페인 데이터 상태
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // breadcrumbs 정보에서 상위 메뉴 찾기
  const parentMenu = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].title : '';

  // 캠페인 페이지 타이틀 생성
  const pageTitle = title || "캠페인 리스트";

  // 페이지 설명 생성
  const pageDescription = description || `${parentMenu} > ${pageTitle}`;

  // 현재 경로에서 서비스 유형 추출
  const pathSegments = pathname.split('/');
  const serviceType = pathSegments[pathSegments.length - 1];
  
  // 캠페인 데이터 로드 함수 - 컴포넌트 외부에서도 호출할 수 있도록 분리
  const loadCampaigns = async () => {
    setLoading(true);
    try {
      
      // 서비스 코드를 DB 형식으로 변환
      const dbServiceType = getServiceTypeCode(serviceType);
      
      let data: ICampaign[] = [];
      let useBackupData = false;
      
      // DB에서 캠페인 데이터 가져오기 (단, 빈 서비스 타입은 시도하지 않음)
      if (dbServiceType) {
        try {
          data = await fetchCampaigns(dbServiceType);
        } catch (dbError) {
          console.error('DB 데이터 조회 오류:', dbError);
          useBackupData = true;
        }
      } else {
        useBackupData = true;
      }
      
      // DB에 데이터가 없거나 오류 발생 시 백업 데이터 사용
      if (data.length === 0 || useBackupData) {
        console.warn('DB에서 데이터를 가져오지 못했습니다. 백업 데이터를 사용합니다.');
        // 서비스 코드를 사용하거나, 없으면 URL에서 추출한 서비스 타입을 사용
        const backupData = getCampaignsByService(serviceCode || dbServiceType);
        setCampaigns(backupData);
      } else {
        // DB에서 데이터를 성공적으로 가져온 경우
        setCampaigns(data);
      }
      
      setError(null);
    } catch (err) {
      console.error('캠페인 데이터 로드 중 오류:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      
      // 오류 발생 시 기본 하드코딩 데이터 사용 (빈 배열 방지)
      const backupData = getCampaignsByService(serviceCode);
      setCampaigns(backupData.length > 0 ? backupData : campaignData);
    } finally {
      setLoading(false);
    }
  };

  // 데이터 가져오기
  useEffect(() => {
    loadCampaigns();
  }, [serviceType, serviceCode]);

  return (
    <CommonTemplate
      title={pageTitle}
      description={pageDescription}
      showPageMenu={true}
    >
      <div className="grid gap-5 lg:gap-7.5">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            <p>{error}</p>
          </div>
        ) : customContent ? (
          customContent
        ) : (
          <CampaignContent 
            campaigns={campaigns} 
            serviceType={serviceType}
            onCampaignUpdated={loadCampaigns} // 캠페인 업데이트 시 다시 로드하는 함수 전달
          />
        )}
        <AdMiscFaq />
      </div>
    </CommonTemplate>
  );
};

export { CampaignTemplate };