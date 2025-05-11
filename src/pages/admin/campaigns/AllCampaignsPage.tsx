import React, { useEffect, useState } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { useAuthContext } from '@/auth/useAuthContext';
import { USER_ROLES, hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';
import { supabase } from '@/supabase';
import { ICampaign } from './components/CampaignContent';
import { formatCampaignData } from '@/utils/CampaignFormat';
import { AllCampaignsContent } from './components/AllCampaignsContent';
import { useMenus } from '@/providers';
import { useLocation } from 'react-router-dom';

const AllCampaignsPage: React.FC = () => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  
  // 인증 컨텍스트
  const { userRole } = useAuthContext();
  
  // 캠페인 데이터 상태
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 운영자 권한 확인
  const isOperator = userRole === USER_ROLES.OPERATOR || userRole === USER_ROLES.DEVELOPER;
  
  // 데이터 로드 함수
  const loadAllCampaigns = async () => {
    if (!isOperator) {
      setError('이 페이지는 최고 운영자만 접근할 수 있습니다.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      // 모든 캠페인 데이터 가져오기
      const { data, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (fetchError) {
        
        setError('캠페인 데이터를 불러오는 중 오류가 발생했습니다.');
        setCampaigns([]);
        return;
      }
      
      // 데이터 변환
      const formattedCampaigns = data.map((item, index) => {
        // add_info가 문자열로 저장되어 있으면 JSON으로 파싱
        let parsedItem = { ...item };
        
        // add_info 필드 처리
        if (typeof parsedItem.add_info === 'string' && parsedItem.add_info) {
          try {
            parsedItem.add_info = JSON.parse(parsedItem.add_info);
          } catch (error) {
            
            // 파싱에 실패했지만 logo_url이 문자열 안에 있는 경우
            const logoUrlMatch = parsedItem.add_info.match(/"logo_url":\s*"([^"]+)"/);
            if (logoUrlMatch && logoUrlMatch[1]) {
              parsedItem.add_info_logo_url = logoUrlMatch[1];
            }
          }
        }
        
        // 상태 값에 따른 라벨과 색상
        const getStatusLabel = (status: string): string => {
          switch (status) {
            case 'active': return '진행중';
            case 'pending': return '준비중';
            case 'pause': return '표시안함';
            case 'waiting_approval': return '승인 대기중';
            case 'rejected': return '반려됨';
            default: return '준비중';
          }
        };
        
        const getStatusColor = (status: string): string => {
          switch (status) {
            case 'active': return 'success';
            case 'pause': return 'warning';
            case 'pending': return 'info';
            case 'completed': return 'primary';
            case 'rejected': return 'danger';
            case 'waiting_approval': return 'primary';
            default: return 'info';
          }
        };
        
        // 서비스 타입에 따른 서비스 이름
        const getServiceName = (serviceType: string): string => {
          switch (serviceType) {
            case 'ntraffic': return 'N 트래픽';
            case 'nfakesale': return 'N 자동완성';
            case 'nblog': return 'N 블로그';
            case 'nweb': return 'N 웹';
            case 'nplace': return 'N 플레이스';
            case 'ncafe': return 'N 카페';
            case 'CoupangTraffic': return '쿠팡 트래픽';
            case 'OhouseTraffic': return '오늘의집 트래픽';
            default: return serviceType;
          }
        };
        
        return {
          id: parsedItem.id.toString(),
          campaignName: parsedItem.campaign_name,
          description: parsedItem.description || '',
          logo: parsedItem.logo,
          serviceName: getServiceName(parsedItem.service_type),
          serviceType: parsedItem.service_type,
          createdAt: parsedItem.created_at ? new Date(parsedItem.created_at).toLocaleString() : '-',
          updatedAt: parsedItem.updated_at ? new Date(parsedItem.updated_at).toLocaleString() : '-',
          matId: parsedItem.mat_id || '-',
          efficiency: parsedItem.efficiency ? `${parsedItem.efficiency}%` : '-',
          minQuantity: parsedItem.min_quantity ? `${parsedItem.min_quantity}개` : '-',
          deadline: parsedItem.deadline || '22:00',
          status: {
            label: getStatusLabel(parsedItem.status),
            color: getStatusColor(parsedItem.status),
            status: parsedItem.status
          },
          additionalLogic: parsedItem.additional_logic ? parsedItem.additional_logic.toString() : '',
          detailedDescription: parsedItem.detailed_description || '',
          // 원본 데이터도 포함 (파싱된 add_info 포함)
          originalData: parsedItem
        };
      });
      
      setCampaigns(formattedCampaigns);
      setError(null);
    } catch (err) {
      
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 페이지 로드시 데이터 가져오기
  useEffect(() => {
    loadAllCampaigns();
  }, []);
  
  return (
    <CommonTemplate
      title="모든 캠페인 통합 관리"
      description="관리자 메뉴 > 모든 캠페인 통합 관리"
      showPageMenu={true}
    >
      <div className="grid gap-5 lg:gap-7.5">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="alert alert-danger p-5 rounded-lg">
            <div className="flex items-center">
              <span className="i-keenicon-warning-triangle text-2xl mr-2"></span>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <AllCampaignsContent 
            campaigns={campaigns} 
            onCampaignUpdated={loadAllCampaigns}
          />
        )}
      </div>
    </CommonTemplate>
  );
};

export { AllCampaignsPage };