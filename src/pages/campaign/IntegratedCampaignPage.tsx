import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardTemplate } from '@/components/pageTemplate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeenIcon } from '@/components';
import {
  CampaignServiceType,
  SERVICE_TYPE_LABELS,
  getServiceTypeFromPath
} from '@/components/campaign-modals/types';
import { CAMPAIGNS } from '@/config/campaign.config';

// 모드 타입 정의
type CampaignMode = 'my' | 'manage';

const IntegratedCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();

  // 현재 모드 상태 (my: 내 서비스, manage: 캠페인 관리)
  const [currentMode, setCurrentMode] = useState<CampaignMode>((params.mode as CampaignMode) || 'my');

  // 선택된 플랫폼 (네이버, 쿠팡 등)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

  // 선택된 서비스 타입
  const [selectedServiceType, setSelectedServiceType] = useState<CampaignServiceType | ''>('');

  // URL 파라미터에서 초기값 설정
  useEffect(() => {
    if (params.mode && (params.mode === 'my' || params.mode === 'manage')) {
      setCurrentMode(params.mode as CampaignMode);
    }

    if (params.platform) {
      // 플랫폼 매핑
      const platformMap: Record<string, string> = {
        'naver': '네이버',
        'coupang': '쿠팡'
      };
      const platform = platformMap[params.platform] || params.platform;
      setSelectedPlatform(platform);

      // 서비스 타입 결정
      if (params.type) {
        const serviceType = getServiceTypeFromPath(params.platform, params.type);
        setSelectedServiceType(serviceType);
      }
    }
  }, [params]);

  // 모드 변경 핸들러
  const handleModeChange = (mode: CampaignMode) => {
    setCurrentMode(mode);
    // 모드 변경 시 선택 초기화
    setSelectedPlatform('');
    setSelectedServiceType('');
    // URL 업데이트
    navigate(`/campaign/${mode}`);
  };

  // 플랫폼 선택 핸들러
  const handlePlatformSelect = (platform: string) => {
    setSelectedPlatform(platform);
    setSelectedServiceType('');
    // URL은 업데이트하지 않음 (서비스 타입 선택 시에만 업데이트)
  };

  // 서비스 타입 선택 핸들러
  const handleServiceTypeSelect = (serviceType: CampaignServiceType) => {
    setSelectedServiceType(serviceType);

    // URL 매핑을 위한 플랫폼 변환
    const platformMap: Record<string, string> = {
      '네이버': 'naver',
      '쿠팡': 'coupang'
    };
    const urlPlatform = platformMap[selectedPlatform] || selectedPlatform.toLowerCase();

    // 서비스 타입에서 URL 경로 추출
    const typeMap: Record<CampaignServiceType, string> = {
      [CampaignServiceType.NAVER_TRAFFIC]: 'traffic',
      [CampaignServiceType.NAVER_AUTO]: 'auto',
      [CampaignServiceType.NAVER_SHOPPING_TRAFFIC]: 'shopping-traffic',
      [CampaignServiceType.NAVER_SHOPPING_FAKESALE]: 'shopping-fakesale',
      [CampaignServiceType.NAVER_PLACE_TRAFFIC]: 'place-traffic',
      [CampaignServiceType.NAVER_PLACE_SAVE]: 'place-save',
      [CampaignServiceType.NAVER_PLACE_SHARE]: 'place-share',
      [CampaignServiceType.COUPANG_TRAFFIC]: 'traffic',
      [CampaignServiceType.COUPANG_FAKESALE]: 'fakesale'
    };

    const urlType = typeMap[serviceType];

    // 기존 경로 구조에 맞춰 네비게이션
    if (currentMode === 'my') {
      navigate(`/advertise/campaigns/my/${urlPlatform}-${urlType}`);
    } else {
      navigate(`/admin/campaigns/${urlPlatform}-${urlType}`);
    }
  };

  // 선택된 플랫폼의 서비스 타입 목록
  const availableServiceTypes = useMemo(() => {
    if (!selectedPlatform) return [];

    const campaign = CAMPAIGNS.find(c => c.name === selectedPlatform);
    return campaign ? campaign.types : [];
  }, [selectedPlatform]);

  // 플랫폼별 서비스 개수 계산 (임시 - 실제로는 API에서 가져와야 함)
  const platformCounts = useMemo(() => {
    // 실제 구현에서는 API를 통해 각 플랫폼별 캠페인 수를 가져와야 함
    const counts: Record<string, number> = {
      '네이버': 15,
      '쿠팡': 8
    };
    return counts;
  }, []);

  // 페이지 제목과 설명
  const pageTitle = currentMode === 'my' ? '내 서비스 관리' : '캠페인 관리';
  const pageDescription = currentMode === 'my'
    ? '진행 중인 캠페인을 관리하고 상태를 확인할 수 있습니다.'
    : '모든 캠페인을 통합적으로 관리할 수 있습니다.';

  return (
    <DashboardTemplate
      title={pageTitle}
      description={pageDescription}
      headerTextClass="text-white"
    >
      {/* 모드 선택 탭 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={currentMode === 'my' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeChange('my')}
              className={currentMode === 'my' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              <KeenIcon icon="user" className="size-4 mr-1" />
              내 서비스 관리
            </Button>
            <Button
              variant={currentMode === 'manage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeChange('manage')}
              className={currentMode === 'manage' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              <KeenIcon icon="setting-3" className="size-4 mr-1" />
              캠페인 관리
            </Button>
          </div>

          {/* 구분선 */}
          <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>

          {/* 플랫폼 선택 버튼 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              플랫폼 선택
            </h3>
            <div className="flex flex-wrap gap-2">
              {CAMPAIGNS.map(campaign => (
                <Button
                  key={campaign.name}
                  variant={selectedPlatform === campaign.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePlatformSelect(campaign.name)}
                  className={`relative ${selectedPlatform === campaign.name
                    ? (campaign.name === '네이버' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700')
                    : ''
                    }`}
                >
                  {campaign.logo && (
                    <img
                      src={campaign.logo}
                      alt={campaign.name}
                      className="size-4 mr-2"
                    />
                  )}
                  {campaign.name}
                  {platformCounts[campaign.name] && (
                    <Badge
                      variant="outline"
                      className={`ml-2 ${selectedPlatform === campaign.name
                        ? 'bg-white border-white text-gray-900'
                        : ''
                        }`}
                    >
                      {platformCounts[campaign.name]}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* 서비스 타입 선택 - 플랫폼이 선택된 경우에만 표시 */}
          {selectedPlatform && availableServiceTypes.length > 0 && (
            <>
              <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  서비스 타입 선택
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableServiceTypes.map(type => {
                    const isDisabled = type.name.includes('가구매'); // 가구매는 비활성화
                    return (
                      <Button
                        key={type.code}
                        variant={selectedServiceType === type.code ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => !isDisabled && handleServiceTypeSelect(type.code as CampaignServiceType)}
                        disabled={isDisabled}
                        className={`justify-start ${selectedServiceType === type.code
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : ''
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="truncate">{type.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 안내 메시지 - 아무것도 선택하지 않은 경우 */}
      {!selectedPlatform && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <KeenIcon icon="information-2" className="size-6 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                플랫폼을 선택해주세요
              </h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              상단의 플랫폼 버튼을 클릭하여 관리할 캠페인 플랫폼을 선택하세요.
              플랫폼별로 다양한 캠페인 서비스를 관리할 수 있습니다.
            </p>
          </div>
        </Card>
      )}

      {/* 서비스 타입 선택 안내 - 플랫폼은 선택했지만 서비스 타입을 선택하지 않은 경우 */}
      {selectedPlatform && !selectedServiceType && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <KeenIcon icon="information-2" className="size-6 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                서비스 타입을 선택해주세요
              </h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              {selectedPlatform} 플랫폼의 서비스 타입을 선택하여
              해당 캠페인을 관리할 수 있습니다.
            </p>
          </div>
        </Card>
      )}
    </DashboardTemplate>
  );
};

export default IntegratedCampaignPage;