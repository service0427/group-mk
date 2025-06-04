import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardTemplate } from '@/components/pageTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { CampaignModal } from '@/components/campaign-modals';
import { AllCampaignsContent } from './components';
import { hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';
import { supabase } from '@/supabase';

const AllCampaignsPage: React.FC = () => {
  const navigate = useNavigate();

  const { userRole } = useAuthContext();

  // 캠페인 데이터 상태
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 캠페인 추가 모달 상태
  const [addCampaignModalOpen, setAddCampaignModalOpen] = useState<boolean>(false);

  // 권한 확인
  const isAdmin = hasPermission(userRole, PERMISSION_GROUPS.ADMIN);
  const isOperator = hasPermission(userRole, PERMISSION_GROUPS.ADMIN);


  // 모든 캠페인 데이터 로드 (서비스 타입 무관)
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
        const parsedItem = { ...item };

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
          createdAt: parsedItem.created_at ? (() => {
            const date = new Date(parsedItem.created_at);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
          })() : '-',
          updatedAt: parsedItem.updated_at ? (() => {
            const date = new Date(parsedItem.updated_at);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
          })() : '-',
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

  // 페이지 로드시 모든 캠페인 데이터 가져오기
  useEffect(() => {
    loadAllCampaigns();
  }, []);

  // 툴바 액션 버튼 - 운영자만 새 캠페인 추가 가능
  const toolbarActions = isOperator ? (
    <Button
      variant="outline"
      size="sm"
      className="bg-primary-600 text-white hover:bg-primary-700 flex items-center"
      onClick={() => setAddCampaignModalOpen(true)}
    >
      <KeenIcon icon="plus" className="size-4 mr-2" />
      새 캠페인 추가
    </Button>
  ) : null;

  return (
    <DashboardTemplate
      title="모든 캠페인 통합 관리"
      description="모든 서비스의 캠페인을 통합적으로 관리할 수 있습니다."
      headerTextClass="text-white"
      toolbarActions={toolbarActions}
    >

      {/* 캠페인 목록 */}
      {loading ? (
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
        <AllCampaignsContent
          campaigns={campaigns}
          onCampaignUpdated={loadAllCampaigns}
          isOperator={isOperator}
        />
      )}

      {/* 캠페인 추가 모달 */}
      <CampaignModal
        open={addCampaignModalOpen}
        onClose={() => {
          setAddCampaignModalOpen(false);
          loadAllCampaigns();
        }}
        serviceType=""
        isOperator={isOperator}
      />
    </DashboardTemplate>
  );
};

export { AllCampaignsPage };