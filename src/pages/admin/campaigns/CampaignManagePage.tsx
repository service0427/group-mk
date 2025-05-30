import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardTemplate } from '@/components/pageTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { CampaignModal } from '@/components/campaign-modals';
import { fetchCampaigns, getServiceTypeCode } from './services/campaignService';
import { CampaignContent } from './components';
import { hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';
import { CAMPAIGNS } from '@/config/campaign.config';
import { CampaignServiceType, SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';

// 서비스 타입 정보를 campaign.config.ts 기반으로 생성
const getServiceTypes = () => {
  // CAMPAIGNS 설정을 기반으로 서비스 타입 생성
  const campaignServices = CAMPAIGNS.map(campaign => ({
    platform: campaign.name,
    logo: campaign.logo || '',
    services: campaign.types.map(type => {
      // 서비스별 아이콘 매핑
      let icon = campaign.logo || '';
      if (type.code === CampaignServiceType.NAVER_SHOPPING_TRAFFIC || 
          type.code === CampaignServiceType.NAVER_SHOPPING_FAKESALE) {
        icon = '/media/ad-brand/naver-shopping.png';
      } else if (type.code === CampaignServiceType.NAVER_PLACE_TRAFFIC || 
                 type.code === CampaignServiceType.NAVER_PLACE_SAVE) {
        icon = '/media/ad-brand/naver-place.png';
      } else if (type.code === CampaignServiceType.NAVER_PLACE_SHARE) {
        icon = '/media/ad-brand/naver-blog.png';
      }
      
      // URL 경로 생성 (서비스 타입 코드를 kebab-case로 변환)
      const path = type.code.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1);
      
      return {
        name: type.name,
        path: path,
        icon: icon,
        // 가구매 서비스는 비활성화
        disabled: type.code === CampaignServiceType.NAVER_SHOPPING_FAKESALE || 
                  type.code === CampaignServiceType.COUPANG_FAKESALE
      };
    })
  }));
  
  // 추가 플랫폼들 (미구현)
  const additionalPlatforms = [
    {
      platform: '인스타그램',
      logo: '/media/ad-brand/instagram.png',
      services: [],
      disabled: true
    },
    {
      platform: '포토&영상 제작',
      logo: '/media/brand-logos/vimeo.svg',
      services: [],
      disabled: true
    },
    {
      platform: '라이브방송',
      logo: '/media/ad-brand/youtube.png',
      services: [],
      disabled: true
    }
  ];
  
  return [...campaignServices, ...additionalPlatforms];
};

const CampaignManagePage: React.FC = () => {
  const navigate = useNavigate();
  
  // 서비스 타입 정보를 campaign.config.ts 기반으로 생성
  const SERVICE_TYPES = useMemo(() => getServiceTypes(), []);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const { currentUser, userRole } = useAuthContext();

  // 캠페인 데이터 상태
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 캠페인 추가 모달 상태
  const [addCampaignModalOpen, setAddCampaignModalOpen] = useState<boolean>(false);

  // 권한 확인
  const isAdmin = hasPermission(userRole, PERMISSION_GROUPS.ADMIN);

  // 모든 서비스를 하나의 배열로 통합
  const allServices = useMemo(() => {
    return SERVICE_TYPES.flatMap(platform =>
      platform.services.map(service => ({
        ...service,
        platform: platform.platform,
        platformLogo: platform.logo
      }))
    );
  }, []);

  const handleServiceClick = (path: string) => {
    setSelectedService(path);
  };

  // 캠페인 데이터 로드
  const loadCampaigns = async () => {
    if (!selectedService) return;

    setLoading(true);
    try {
      const dbServiceType = getServiceTypeCode(selectedService);
      const rawData = await fetchCampaigns(dbServiceType);
      
      // 데이터 형식 변환 (CampaignContent가 기대하는 형식으로)
      const formattedData = rawData.map((item: any) => ({
        id: item.id.toString(),
        campaignName: item.campaign_name,
        description: item.description || '',
        logo: item.logo,
        efficiency: item.efficiency ? `${item.efficiency}%` : '-',
        minQuantity: item.min_quantity ? `${item.min_quantity}개` : '-',
        deadline: item.deadline || '22:00',
        status: {
          label: item.status === 'active' ? '활성' : item.status === 'inactive' ? '비활성' : item.status,
          color: item.status === 'active' ? 'success' : 'secondary',
          status: item.status
        },
        additionalLogic: item.additional_logic?.toString() || '',
        detailedDescription: item.detailed_description || '',
        originalData: item,
        serviceType: item.service_type,
        matId: item.mat_id,
        updatedAt: item.updated_at
      }));
      
      setCampaigns(formattedData);
      setError(null);
    } catch (err) {
      console.error('캠페인 데이터 조회 오류:', err);
      setError('캠페인 데이터를 불러오는데 실패했습니다.');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  // 선택된 서비스가 변경될 때 데이터 로드
  useEffect(() => {
    if (selectedService) {
      loadCampaigns();
    }
  }, [selectedService]);

  const handleAllCampaignsClick = () => {
    navigate('/admin/campaigns/all');
  };

  // 툴바 액션 버튼
  const toolbarActions = isAdmin ? (
    <Button
      variant="outline"
      size="sm"
      className="bg-primary-600 text-white hover:bg-primary-700"
      onClick={() => setAddCampaignModalOpen(true)}
      disabled={!selectedService}
    >
      <KeenIcon icon="plus" className="size-4 mr-2" />
      새 캠페인 추가
    </Button>
  ) : null;

  return (
    <DashboardTemplate
      title="캠페인 관리"
      description="모든 캠페인을 통합적으로 관리할 수 있습니다."
      headerTextClass="text-white"
      toolbarActions={toolbarActions}
    >
      {/* 서비스 목록 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            {allServices.map((service) => (
              <Button
                key={service.path}
                variant={selectedService === service.path ? "default" : "outline"}
                size="sm"
                onClick={() => handleServiceClick(service.path)}
                disabled={service.disabled}
                className={`relative ${selectedService === service.path
                  ? 'bg-primary hover:bg-primary/90'
                  : ''
                  }`}
              >
                {service.icon && (
                  <img
                    src={service.icon}
                    alt={service.name}
                    className="size-4 mr-2"
                  />
                )}
                {service.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 캠페인 목록 */}
      {!selectedService ? (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <KeenIcon icon="information-3" className="text-5xl text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">서비스를 선택해주세요</p>
              <p className="text-sm text-muted-foreground mt-2">선택한 서비스의 캠페인 목록이 표시됩니다</p>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">데이터를 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive">{error}</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">등록된 캠페인이 없습니다.</p>
        </div>
      ) : (
        <CampaignContent
          campaigns={campaigns}
          onCampaignUpdated={loadCampaigns}
          serviceType={selectedService}
          isAdmin={isAdmin}
        />
      )}

      {/* 캠페인 추가 모달 */}
      <CampaignModal
            open={addCampaignModalOpen}
            onClose={() => {
              setAddCampaignModalOpen(false);
              loadCampaigns();
            }}
            serviceType={selectedService || ''}
          />
    </DashboardTemplate>
  );
};

export default CampaignManagePage;