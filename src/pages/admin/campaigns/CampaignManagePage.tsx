import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { hasPermission, PERMISSION_GROUPS, USER_ROLES } from '@/config/roles.config';
import { CAMPAIGNS } from '@/config/campaign.config';
import { CampaignServiceType, SERVICE_TYPE_LABELS } from '@/components/campaign-modals/types';
import { ServiceSelector } from '@/components/service-selector';
import { supabase } from '@/supabase';


const CampaignManagePage: React.FC = () => {
  const navigate = useNavigate();

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const { currentUser, userRole } = useAuthContext();

  // 캠페인 데이터 상태
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 캠페인 추가 모달 상태
  const [addCampaignModalOpen, setAddCampaignModalOpen] = useState<boolean>(false);
  
  // 서비스별 캠페인 개수
  const [serviceCampaignCounts, setServiceCampaignCounts] = useState<Record<string, number>>({});
  // 캠페인이 있는 서비스 목록
  const [servicesWithCampaigns, setServicesWithCampaigns] = useState<Set<string>>(new Set());

  // 권한 확인
  const isAdmin = hasPermission(userRole, PERMISSION_GROUPS.ADMIN);
  const isOperator = hasPermission(userRole, PERMISSION_GROUPS.ADMIN);


  const handleServiceClick = (path: string) => {
    setSelectedService(path);
  };

  // 서비스별 캠페인 개수를 가져오는 함수
  const fetchAllServiceCounts = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      // 모든 캠페인 가져오기 (상태 조건 없이)
      let query = supabase
        .from('campaigns')
        .select('service_type');

      // 개발자가 아니고 운영자도 아닌 경우 본인 캠페인만
      if (userRole !== USER_ROLES.DEVELOPER && !isOperator) {
        query = query.eq('mat_id', currentUser.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('서비스별 캠페인 수 조회 오류:', error);
        return;
      }

      // 서비스별로 카운트 계산
      const counts: Record<string, number> = {};
      const servicesSet = new Set<string>();
      
      if (data) {
        data.forEach((campaign: any) => {
          if (campaign.service_type) {
            counts[campaign.service_type] = (counts[campaign.service_type] || 0) + 1;
            servicesSet.add(campaign.service_type);
          }
        });
      }

      setServiceCampaignCounts(counts);
      setServicesWithCampaigns(servicesSet);
    } catch (error) {
      console.error('서비스별 캠페인 수 조회 중 오류:', error);
    }
  }, [currentUser?.id, userRole, isOperator]);

  // 캠페인 데이터 로드
  const loadCampaigns = async () => {
    if (!selectedService) return;

    setLoading(true);
    try {
      const dbServiceType = getServiceTypeCode(selectedService);

      // 운영자가 아니면 본인 캠페인만 조회
      const userId = isOperator ? undefined : currentUser?.id;
      const rawData = await fetchCampaigns(dbServiceType, userId);

      // fetchCampaigns가 이미 ICampaign 형식으로 변환해서 반환하므로 그대로 사용
      setCampaigns(rawData);
      setError(null);
      
      // 캠페인 개수도 업데이트
      await fetchAllServiceCounts();
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

  // 컴포넌트 마운트 시 모든 서비스의 캠페인 수 가져오기
  useEffect(() => {
    fetchAllServiceCounts();
  }, [fetchAllServiceCounts]);

  const handleAllCampaignsClick = () => {
    navigate('/admin/campaigns/all');
  };

  // 툴바 액션 버튼 - 운영자만 새 캠페인 추가 가능
  const toolbarActions = isOperator ? (
    <Button
      variant="outline"
      size="sm"
      className="bg-primary-600 text-white hover:bg-primary-700 flex items-center"
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
      <Card className="mb-4 lg:mb-6">
        <CardContent className="p-4 lg:p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">서비스</h3>
          <ServiceSelector
            selectedService={selectedService}
            onServiceSelect={handleServiceClick}
            showDisabled={true}
            userRole={userRole}
            showCount={true}
            serviceCounts={serviceCampaignCounts}
            servicesWithSlots={servicesWithCampaigns}
            collapsible={true}
            initialDisplayCount={6}
          />
        </CardContent>
      </Card>

      {/* 캠페인 목록 */}
      {!selectedService ? (
        <Card>
          <CardContent className="p-4 lg:p-6">
            <div className="text-center py-6 lg:py-8">
              <KeenIcon icon="information-3" className="text-4xl lg:text-5xl text-muted-foreground mb-3 lg:mb-4" />
              <p className="text-base lg:text-lg text-muted-foreground">서비스를 선택해주세요</p>
              <p className="text-xs lg:text-sm text-muted-foreground mt-1 lg:mt-2">선택한 서비스의 캠페인 목록이 표시됩니다</p>
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
          <p className="text-muted-foreground">
            {isOperator ? '등록된 캠페인이 없습니다.' : '내가 등록한 캠페인이 없습니다.'}
          </p>
          {!isOperator && (
            <p className="text-sm text-muted-foreground mt-2">
              운영자에게 캠페인 등록을 요청하세요.
            </p>
          )}
        </div>
      ) : (
        <CampaignContent
          campaigns={campaigns}
          onCampaignUpdated={loadCampaigns}
          serviceType={selectedService}
          isAdmin={isAdmin}
          isOperator={isOperator}
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