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
import { CampaignAddModal } from './campaign-modals';
import { useAuthContext } from '@/auth/useAuthContext';
import { USER_ROLES, hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';

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
  
  // 인증 컨텍스트 가져오기
  const { currentUser, userRole } = useAuthContext();

  // 캠페인 데이터 상태
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 권한 확인 - 관리자/운영자/개발자 여부
  const isAdmin = hasPermission(userRole, PERMISSION_GROUPS.ADMIN);
  // 광고주나 대행사인지 확인
  const isAdvertiserOrAgency = userRole === USER_ROLES.ADVERTISER || userRole === USER_ROLES.AGENCY;

  // 캠페인 추가 모달 상태
  const [addCampaignModalOpen, setAddCampaignModalOpen] = useState<boolean>(false);

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
          // 관리자가 아니면서 현재 사용자가 있는 경우 본인 캠페인만 필터링
          const userId = !isAdmin && currentUser?.id ? currentUser.id : undefined;
          data = await fetchCampaigns(dbServiceType, userId);

          // 사용자 필터링 로그
          if (userId) {
            
          } else {
            
          }
        } catch (dbError) {
          
          useBackupData = true;
        }
      } else {
        useBackupData = true;
      }

      // DB에 데이터가 없을 경우 빈 배열 유지, 백업 데이터 사용하지 않음
      if (useBackupData) {
        
        setCampaigns([]);
      } else {
        // DB에서 데이터를 성공적으로 가져온 경우
        setCampaigns(data);
      }

      setError(null);
    } catch (err) {
      
      setError('데이터를 불러오는 중 오류가 발생했습니다.');

      // 오류 발생 시에도 빈 배열 사용 (백업 데이터 사용 안함)
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  // 캠페인 추가 모달 열기 핸들러
  const handleAddCampaign = () => {
    setAddCampaignModalOpen(true);
  };

  // 데이터 가져오기
  useEffect(() => {
    loadCampaigns();
  }, [serviceType, serviceCode]);

  return (
    <>
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
              onAddCampaign={!isAdvertiserOrAgency ? handleAddCampaign : undefined} // 광고주나 대행사는 캠페인 추가 버튼 비활성화
              isOperator={userRole === USER_ROLES.OPERATOR || userRole === USER_ROLES.DEVELOPER} // 역할에 따라 운영자 모드 설정
            />
          )}
          <AdMiscFaq />
        </div>
      </CommonTemplate>

      {/* 캠페인 추가 모달 - 광고주나 대행사는 접근 불가 */}
      {addCampaignModalOpen && !isAdvertiserOrAgency && (
        <CampaignAddModal
          open={addCampaignModalOpen}
          onClose={() => setAddCampaignModalOpen(false)}
          serviceType={serviceType}
          onSave={(newCampaign) => {
            // 새 캠페인이 저장되면 캠페인 목록을 다시 로드
            loadCampaigns();
            setAddCampaignModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export { CampaignTemplate };