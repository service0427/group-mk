import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { KeenIcon } from '@/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toAbsoluteUrl } from '@/utils';
import { CampaignModal } from '@/components/campaign-modals';
import { updateCampaignStatus, updateCampaign } from '../services/campaignService';
import { useToast } from '@/providers';

// 캠페인 데이터 인터페이스 정의
export interface ICampaign {
  id: string;
  campaignName: string;
  description: string;
  logo: string;
  efficiency: string;
  minQuantity: string;
  deadline: string;
  status: {
    label: string;
    color: string;
    status?: string;
  };
  additionalLogic?: string;
  detailedDescription?: string;
  originalData?: any; // DB에서 가져온 원본 데이터
  serviceType?: string; // 서비스 유형
  matId?: string; // 매트 ID
  serviceName?: string; // 서비스 이름
  updatedAt?: string; // 업데이트 시간
  matName?: string; // 총판 이름
  matEmail?: string; // 총판 이메일
  matDisplay?: string; // 총판 표시명
}

// 캠페인 콘텐츠 컴포넌트 props 정의
interface CampaignContentProps {
  campaigns: ICampaign[];
  serviceType: string; // 서비스 유형(ntraffic, naver-shopping, naver-place 등)
  onCampaignUpdated?: () => void; // 캠페인 업데이트 시 호출할 콜백 함수
  onAddCampaign?: () => void; // 캠페인 추가 버튼 클릭 시 호출할 콜백 함수
  isOperator?: boolean; // 운영자 모드 여부
  isAdmin?: boolean; // 관리자 권한 여부 (ADMIN: 운영자/개발자)
}

const CampaignContent: React.FC<CampaignContentProps> = ({
  campaigns: initialCampaigns,
  serviceType,
  onCampaignUpdated,
  onAddCampaign,
  isOperator = false, // 기본값은 총판 모드
  isAdmin = false // 기본값은 관리자 권한 없음
}) => {
  const location = useLocation();
  const { success, error, info } = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<ICampaign | null>(null);
  const [campaigns, setCampaigns] = useState<ICampaign[]>(initialCampaigns);
  const [loadingStatus, setLoadingStatus] = useState<{ [key: string]: boolean }>({});

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    // 초기 캠페인 데이터 설정
    setCampaigns(initialCampaigns);
  }, [initialCampaigns]);

  // 캠페인 상태 변경 처리 함수
  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    // 현재 캠페인 찾기
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      error('캠페인을 찾을 수 없습니다.');
      return;
    }

    // 현재 상태 확인 - status 객체에서 원본 status 값 사용
    const currentStatus = campaign.status.status || campaign.originalData?.status || '';

    // 승인/미승인 상태인 경우 관리자만 변경 가능
    if ((currentStatus === 'waiting_approval' || currentStatus === 'rejected') && !isAdmin) {
      error('승인 대기 중이거나 반려된 캠페인의 상태는 관리자만 변경할 수 있습니다.');
      return;
    }

    // 로딩 상태 설정
    setLoadingStatus(prev => ({ ...prev, [campaignId]: true }));

    // 최종 상태 결정
    // 1. 총판이 반려된 캠페인을 변경하려고 하는 경우, 상태를 자동으로 승인 대기중으로 설정
    let finalStatus = newStatus;
    if (!isAdmin && currentStatus === 'rejected') {
      finalStatus = 'waiting_approval';
    }

    try {
      // DB 상태 업데이트
      const result = await updateCampaignStatus(parseInt(campaignId), finalStatus);

      if (result) {
        // UI 상태 업데이트
        setCampaigns(prevCampaigns =>
          prevCampaigns.map(campaign =>
            campaign.id === campaignId
              ? {
                ...campaign,
                status: {
                  label: getStatusLabel(finalStatus),
                  color: getStatusColor(finalStatus),
                  status: finalStatus
                },
                originalData: {
                  ...campaign.originalData,
                  status: finalStatus
                }
              }
              : campaign
          )
        );

        // 성공 메시지 표시
        success(`캠페인 상태가 ${getStatusLabel(finalStatus)}(으)로 변경되었습니다.`);

        // 반려된 캠페인이 재승인 요청으로 변경된 경우 알림
        if (currentStatus === 'rejected' && finalStatus === 'waiting_approval' && !isAdmin) {
          info('반려된 캠페인이 승인 요청 상태로 변경되었습니다. 운영자 승인 후 처리됩니다.');
        }
      } else {
        console.error('상태 변경 실패');
        error('상태 변경 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('상태 변경 오류:', err);
      error('상태 변경 중 오류가 발생했습니다.');
    } finally {
      // 로딩 상태 해제
      setLoadingStatus(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  // 상태값에 따른 라벨 반환
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

  // 상태 변경 가능 여부 확인 (권한 및 상태 체크)
  const canChangeStatus = (campaign: ICampaign): boolean => {
    // 관리자는 모든 상태 변경 가능
    if (isAdmin) return true;

    // 현재 상태 체크 - status 객체에서 원본 status 값 사용
    const currentStatus = campaign.status.status || campaign.originalData?.status || '';

    // 승인 대기 중이거나 반려된 캠페인은 관리자만 상태 변경 가능
    if (currentStatus === 'waiting_approval' || currentStatus === 'rejected') {
      return false;
    }

    // 기타 상태는 변경 가능
    return true;
  };

  // 상태값에 따른 색상 반환
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'success';
      case 'pause': return 'warning';
      case 'pending': return 'info';
      case 'completed': return 'primary';
      case 'rejected': return 'danger';
      case 'waiting_approval': return 'warning'; // 승인 대기중은 warning 색상으로 변경
      default: return 'info';
    }
  };

  // 배경색 클래스 반환 (bg- 접두사에 맞게 변환)
  const getBgColorClass = (color: string): string => {
    // 색상 값에 따라 적절한 배경색 클래스 반환
    switch (color) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'primary': return 'primary';
      case 'danger': return 'danger';
      case 'info': return 'info';
      case 'gray-300': return 'gray-300';
      default: return 'info'; // 기본값으로 info 색상 사용
    }
  };

  // 상세 정보 모달 열기
  const openDetailModal = (campaign: ICampaign) => {
    // 항상 최신 데이터를 사용하기 위해 campaigns 배열에서 해당 캠페인 찾기
    const currentCampaign = campaigns.find(c => c.id === campaign.id) || campaign;
    setSelectedCampaign(currentCampaign);
    setDetailModalOpen(true);
  };

  // 캠페인 정보 저장 핸들러
  const handleSaveCampaign = (updatedCampaign: any) => {
    // 로컬 상태 업데이트 - 수정된 캠페인 정보 반영
    setCampaigns(prevCampaigns =>
      prevCampaigns.map(campaign =>
        campaign.id === updatedCampaign.id ? updatedCampaign : campaign
      )
    );

    // 선택된 캠페인도 업데이트 - 모달이 다시 열릴 때 최신 데이터 표시
    setSelectedCampaign(updatedCampaign);

    // 성공 메시지 표시 - 토스트로 알림
    success('캠페인 정보가 성공적으로 저장되었습니다.');

    // 부모 컴포넌트에게 업데이트 알림 (있을 경우만)
    // 이렇게 하면 Template 컴포넌트에서 최신 데이터를 다시 가져올 수 있음
    if (onCampaignUpdated) {
      // 약간의 지연을 두고 호출하여 DB 업데이트가 완료되도록 함
      setTimeout(() => {
        onCampaignUpdated();
      }, 500);
    }
  };

  // 상태값의 실제 값(value) 반환
  const getStatusValue = (label: string): string => {
    switch (label) {
      case '진행중': return 'active';
      case '준비중': return 'pending';
      case '표시안함': return 'pause';
      case '승인 대기중': return 'waiting_approval';
      case '반려됨': return 'rejected';
      default: return 'pending';
    }
  };

  // 서비스 유형에 따른 타이틀 설정
  const getServiceTitle = (): string => {
    switch (serviceType) {
      case 'naver-shopping':
        return '네이버 쇼핑 트래픽';
      case 'naver-place-save':
        return '네이버 플레이스 저장하기';
      case 'naver-place-share':
        return '네이버 플레이스 블로그공유';
      case 'naver-place-traffic':
        return '네이버 플레이스';
      case 'naver-auto':
        return '네이버 자동완성';
      case 'naver-traffic':
        return '네이버 트래픽';
      case 'coupang':
        return '쿠팡 트래픽';
      case 'ohouse':
        return '오늘의집 트래픽';
      default:
        return '';
    }
  };

  // 동물 아이콘 목록 (기본 아이콘이 없을 때 랜덤 선택용)
  const animalIcons = [
    'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant', 'flamingo',
    'giraffe', 'horse', 'kangaroo', 'koala', 'leopard', 'lion', 'llama',
    'owl', 'pelican', 'penguin', 'sheep', 'teddy-bear', 'turtle'
  ];

  // 동물 이름과 아이콘을 매핑하는 객체 (한글/영어 모두 처리)
  const animalNameMap: Record<string, string> = {
    // 한글 동물 이름
    '곰': 'bear',
    '고양이': 'cat',
    '소': 'cow',
    '악어': 'crocodile',
    '돌고래': 'dolphin',
    '코끼리': 'elephant',
    '플라밍고': 'flamingo',
    '기린': 'giraffe',
    '말': 'horse',
    '캥거루': 'kangaroo',
    '코알라': 'koala',
    '표범': 'leopard',
    '사자': 'lion',
    '라마': 'llama',
    '올빼미': 'owl',
    '펠리컨': 'pelican',
    '펭귄': 'penguin',
    '양': 'sheep',
    '테디베어': 'teddy-bear',
    '거북이': 'turtle',

    // 영어 동물 이름
    'bear': 'bear',
    'cat': 'cat',
    'cow': 'cow',
    'crocodile': 'crocodile',
    'dolphin': 'dolphin',
    'elephant': 'elephant',
    'flamingo': 'flamingo',
    'giraffe': 'giraffe',
    'horse': 'horse',
    'kangaroo': 'kangaroo',
    'koala': 'koala',
    'leopard': 'leopard',
    'lion': 'lion',
    'llama': 'llama',
    'owl': 'owl',
    'pelican': 'pelican',
    'penguin': 'penguin',
    'sheep': 'sheep',
    'teddy-bear': 'teddy-bear',
    'teddy': 'teddy-bear',
    'turtle': 'turtle',
  };

  // 캠페인 이름에서 동물 아이콘 추출 함수
  const getAnimalIconFromName = (name: string): string | null => {
    if (!name) return null;

    // 캠페인 이름에서 동물 이름을 찾아서 매핑된 아이콘 반환
    const lowerName = name.toLowerCase();

    // 정확한 일치 먼저 검사
    for (const [animalName, iconName] of Object.entries(animalNameMap)) {
      const normalizedName = lowerName.replace(/\s+/g, '');
      const normalizedAnimal = animalName.toLowerCase().replace(/\s+/g, '');

      if (normalizedName === normalizedAnimal) {

        return iconName;
      }
    }

    // 길이가 긴 동물 이름부터 검사 (더 구체적인 이름 우선)
    const sortedEntries = Object.entries(animalNameMap)
      .sort((a, b) => b[0].length - a[0].length);

    for (const [animalName, iconName] of sortedEntries) {
      if (lowerName.includes(animalName.toLowerCase())) {

        return iconName;
      }
    }

    return null;
  };

  // 랜덤 동물 아이콘 선택 함수
  const getRandomAnimalIcon = () => {
    const randomIndex = Math.floor(Math.random() * animalIcons.length);
    return animalIcons[randomIndex];
  };

  // 로고 경로 생성 함수
  const getLogoPath = (campaign: ICampaign) => {
    // 이미 있는 로고가 있는 경우 (add_info 객체 내)
    if (typeof campaign.originalData?.add_info === 'object' && campaign.originalData.add_info?.logo_url) {
      return campaign.originalData.add_info.logo_url;
    }

    // add_info가 문자열이고 logo_url이 있는 경우
    if (typeof campaign.originalData?.add_info === 'string' && campaign.originalData?.add_info_logo_url) {
      return campaign.originalData.add_info_logo_url;
    }

    // campaign.logo 값이 있고, 확장자가 있으면 처리
    if (campaign.logo && (campaign.logo.includes('.svg') || campaign.logo.includes('.png'))) {


      // 경로에서 동물 아이콘 이름 추출 시도
      if (campaign.logo.includes('animal/svg/') || campaign.logo.includes('animal\\svg\\')) {
        const segments = campaign.logo.split(/[\/\\]/);
        for (let i = 0; i < segments.length; i++) {
          if (segments[i] === 'svg' && i + 1 < segments.length) {
            const animalName = segments[i + 1].split('.')[0];
            if (animalIcons.includes(animalName)) {

              return toAbsoluteUrl(`/media/animal/svg/${animalName}.svg`);
            }
          }
        }
      }

      // 이미 /media/ 경로가 포함되어 있으면 그대로 사용
      if (campaign.logo.startsWith('/media/')) {
        return toAbsoluteUrl(campaign.logo);
      }

      // 그 외에는 기본 경로에 추가
      return toAbsoluteUrl(`/media/${campaign.logo}`);
    }

    // campaign.logo 값이 있지만 확장자가 없는 경우, svg로 가정
    if (campaign.logo && animalIcons.includes(campaign.logo)) {
      return toAbsoluteUrl(`/media/animal/svg/${campaign.logo}.svg`);
    }

    // 캠페인 이름을 기반으로 동물 아이콘 추출
    const animalFromName = getAnimalIconFromName(campaign.campaignName);
    if (animalFromName) {
      return toAbsoluteUrl(`/media/animal/svg/${animalFromName}.svg`);
    }

    // 마지막으로 랜덤 동물 아이콘 선택
    const randomAnimal = getRandomAnimalIcon();

    return toAbsoluteUrl(`/media/animal/svg/${randomAnimal}.svg`);
  };

  // 필터링 적용
  const filteredData = useMemo(() => {


    return campaigns.filter(campaign => {
      // 검색어 필터링
      const matchesSearch = (campaign.campaignName?.toLowerCase().includes(searchInput.toLowerCase()) || false) ||
        (campaign.description?.toLowerCase().includes(searchInput.toLowerCase()) || false);

      // 상태 필터링
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && campaign.status.label === '진행중') ||
        (statusFilter === 'pending' && campaign.status.label === '준비중') ||
        (statusFilter === 'waiting_approval' && campaign.status.label === '승인 대기중') ||
        (statusFilter === 'rejected' && campaign.status.label === '반려됨') ||
        (statusFilter === 'pause' && campaign.status.label === '표시안함');

      return matchesSearch && matchesStatus;
    });
  }, [searchInput, statusFilter, campaigns]);

  const serviceTitle = getServiceTitle();

  return (
    <>
      <div className="card bg-card overflow-hidden">
        <div className="card-header flex-col sm:flex-row flex-wrap gap-3 border-b-0 px-4 md:px-5 sticky top-0 bg-card z-10 shadow-sm">
          <h3 className="card-title font-medium text-xs lg:text-sm text-card-foreground w-full sm:w-auto mb-2 sm:mb-0">
            전체 {campaigns.length}개 캠페인
          </h3>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto sm:ml-auto gap-2 lg:gap-3">
            <div className="flex w-full sm:w-auto">
              <label className="input input-sm w-full sm:w-auto">
                <KeenIcon icon="magnifier" className="text-muted-foreground" />
                <input
                  type="text"
                  placeholder="캠페인명 검색"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full text-xs lg:text-sm"
                />
              </label>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-24 lg:w-28 h-8 lg:h-9" size="sm">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent className="w-44">
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">진행중</SelectItem>
                  <SelectItem value="pending">준비중</SelectItem>
                  <SelectItem value="waiting_approval">승인 대기중</SelectItem>
                  <SelectItem value="rejected">반려됨</SelectItem>
                  <SelectItem value="pause">표시안함</SelectItem>
                </SelectContent>
              </Select>

              {onAddCampaign && (
                <button
                  className="btn btn-sm btn-primary h-8 lg:h-9 px-2 lg:px-4 text-xs lg:text-sm"
                  onClick={() => {
                    if (onAddCampaign) {
                      onAddCampaign();
                    } else {

                      // 기본 동작 - 추후에 캠페인 추가 모달을 직접 열거나 할 수 있음
                    }
                  }}
                >
                  <KeenIcon icon="plus" />
                  캠페인 추가
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card-body px-0">
          {/* 모바일에서는 카드 형태로 표시 */}
          <div className="md:hidden px-4">
            {filteredData.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredData.map((campaign, index) => (
                  <div key={campaign.id} className="bg-background border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getLogoPath(campaign)}
                          className="rounded-full size-10 shrink-0"
                          alt={campaign.campaignName || '캠페인'}
                          onError={(e) => {


                            // logo 필드 다시 확인
                            if (campaign.logo) {


                              // 로고가 동물 이름인 경우
                              if (animalIcons.includes(campaign.logo)) {

                                (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${campaign.logo}.svg`);
                                return;
                              }

                              // 경로에서 동물 이름 추출 시도
                              if (campaign.logo.includes('animal/svg/') || campaign.logo.includes('animal\\svg\\')) {
                                const segments = campaign.logo.split(/[\/\\]/);
                                for (let i = 0; i < segments.length; i++) {
                                  if (segments[i] === 'svg' && i + 1 < segments.length) {
                                    const animalName = segments[i + 1].split('.')[0];
                                    if (animalIcons.includes(animalName)) {

                                      (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${animalName}.svg`);
                                      return;
                                    }
                                  }
                                }
                              }
                            }

                            // 캠페인 이름에서 동물 추출 시도
                            const animalFromName = getAnimalIconFromName(campaign.campaignName);
                            if (animalFromName) {

                              (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${animalFromName}.svg`);
                            } else {
                              // 이름에서 동물을 찾지 못하면 랜덤 동물 아이콘 사용
                              const randomAnimal = getRandomAnimalIcon();

                              (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${randomAnimal}.svg`);
                            }
                          }}
                        />
                        <div>
                          <button
                            onClick={() => openDetailModal(campaign)}
                            className="text-base font-medium text-foreground hover:text-primary-active line-clamp-1 text-left"
                          >
                            {campaign.campaignName}
                          </button>
                          <div className="text-xs text-muted-foreground mt-1">#{index + 1}</div>
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-icon btn-info ml-2"
                        title="상세설정"
                        onClick={() => openDetailModal(campaign)}
                      >
                        <KeenIcon icon="setting-3" />
                      </button>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-foreground line-clamp-2">
                        {campaign.description || '-'}
                      </p>
                      <div className="text-xs text-muted-foreground mt-1">
                        총판: {campaign.matDisplay || `${campaign.matName || '알 수 없음'} (${campaign.matEmail || ''})`}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-muted/50 p-2 rounded text-center">
                        <div className="text-xs text-muted-foreground mb-1">상승효율</div>
                        <div className="text-sm font-medium text-primary">{campaign.efficiency}</div>
                      </div>
                      <div className="bg-muted/50 p-2 rounded text-center">
                        <div className="text-xs text-muted-foreground mb-1">최소수량</div>
                        <div className="text-sm text-foreground">{campaign.minQuantity}</div>
                      </div>
                      <div className="bg-muted/50 p-2 rounded text-center">
                        <div className="text-xs text-muted-foreground mb-1">마감시간</div>
                        <div className="text-sm text-foreground">{campaign.deadline}</div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">상태</label>
                      {/* 승인 대기 중이거나 반려된 캠페인은 총판에게는 라벨로 표시 - Select와 동일한 높이/너비로 설정 */}
                      {!canChangeStatus(campaign) ? (
                        <div className={`w-full min-w-[120px] badge badge-${campaign.status.color} shrink-0 badge-outline rounded-[30px] h-[28px] py-1 border-0 text-[12px] font-medium flex items-center justify-center`}>
                          <span className={`size-1.5 rounded-full bg-${getBgColorClass(campaign.status.color)} me-1.5`}></span>
                          <span>{campaign.status.label}</span>
                          {campaign.status.label === '반려됨' && !isAdmin && (
                            <span className="ml-1 text-xs text-red-500">(수정 필요)</span>
                          )}
                        </div>
                      ) : (
                        /* 그 외에는 상태 변경 가능 Select 표시 */
                        <Select
                          value={campaign.status.status || getStatusValue(campaign.status.label)}
                          onValueChange={(value) => handleStatusChange(campaign.id, value)}
                          disabled={loadingStatus[campaign.id]}
                        >
                          <SelectTrigger className={`w-full min-w-[120px] badge badge-${campaign.status.color} shrink-0 badge-outline rounded-[30px] h-auto py-1 border-0 focus:ring-0 text-[12px] font-medium`}>
                            {loadingStatus[campaign.id] ? (
                              <span className="flex items-center">
                                <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                                처리중...
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <span className={`size-1.5 rounded-full bg-${getBgColorClass(campaign.status.color)} me-1.5`}></span>
                                <SelectValue />
                              </span>
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">진행중</SelectItem>
                            <SelectItem value="pending">준비중</SelectItem>
                            <SelectItem value="pause">표시안함</SelectItem>
                            {isAdmin && (
                              <>
                                <SelectItem value="waiting_approval">승인 대기중</SelectItem>
                                <SelectItem value="rejected">반려됨</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      )}

                      {/* 반려된 캠페인인 경우 반려 사유 표시 */}
                      {campaign.status.label === '반려됨' && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-md">
                          <div className="font-medium mb-0.5">반려 사유:</div>
                          <div>{campaign.originalData?.rejected_reason || '반려 사유 없음'}</div>
                          {!isAdmin && (
                            <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                              <KeenIcon icon="information-2" className="mr-1 inline-block size-3" />
                              수정 후 저장하시면 자동으로 재승인 요청이 진행됩니다.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 bg-muted/20 rounded-lg">
                <KeenIcon icon="information-2" className="size-8 mb-2 text-gray-400" />
                <p className="text-muted-foreground">생성된 캠페인이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 데스크톱에서는 테이블 형태로 표시 */}
          <div className="hidden md:block">
            <table className="w-full min-w-full divide-y divide-border">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '60px' }}>
                    No
                  </th>
                  <th scope="col" className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '120px' }}>
                    서비스타입
                  </th>
                  <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[200px]">
                    캠페인명
                  </th>
                  <th scope="col" className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    캠페인 설명
                  </th>
                  <th scope="col" className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    상승효율
                  </th>
                  <th scope="col" className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    최소수량
                  </th>
                  <th scope="col" className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    접수마감시간
                  </th>
                  <th scope="col" className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ minWidth: '140px' }}>
                    상태
                  </th>
                  <th scope="col" className="px-3 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상세설정
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {filteredData.map((campaign, index) => (
                  <tr key={campaign.id}>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-foreground">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center">
                      <span className={`badge ${campaign.originalData?.slot_type === 'guarantee'
                        ? 'badge-info'
                        : 'badge-primary'
                        } badge-outline rounded-[30px] h-auto py-0.5 text-xs`}>
                        {campaign.originalData?.slot_type === 'guarantee' ? '보장형' : '일반형'}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 lg:gap-4">
                        <img
                          src={getLogoPath(campaign)}
                          className="rounded-full size-8 lg:size-10 shrink-0"
                          alt={campaign.campaignName || '캠페인'}
                          onError={(e) => {


                            // logo 필드 다시 확인
                            if (campaign.logo) {


                              // 로고가 동물 이름인 경우
                              if (animalIcons.includes(campaign.logo)) {

                                (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${campaign.logo}.svg`);
                                return;
                              }

                              // 경로에서 동물 이름 추출 시도
                              if (campaign.logo.includes('animal/svg/') || campaign.logo.includes('animal\\svg\\')) {
                                const segments = campaign.logo.split(/[\/\\]/);
                                for (let i = 0; i < segments.length; i++) {
                                  if (segments[i] === 'svg' && i + 1 < segments.length) {
                                    const animalName = segments[i + 1].split('.')[0];
                                    if (animalIcons.includes(animalName)) {

                                      (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${animalName}.svg`);
                                      return;
                                    }
                                  }
                                }
                              }
                            }

                            // 캠페인 이름에서 동물 추출 시도
                            const animalFromName = getAnimalIconFromName(campaign.campaignName);
                            if (animalFromName) {

                              (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${animalFromName}.svg`);
                            } else {
                              // 이름에서 동물을 찾지 못하면 랜덤 동물 아이콘 사용
                              const randomAnimal = getRandomAnimalIcon();

                              (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${randomAnimal}.svg`);
                            }
                          }}
                        />
                        <button
                          onClick={() => openDetailModal(campaign)}
                          className="text-xs lg:text-sm font-medium text-foreground hover:text-primary-active line-clamp-2 text-left"
                        >
                          {campaign.campaignName}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 hidden md:table-cell">
                      <div className="text-sm text-foreground max-w-[400px] line-clamp-2">
                        {campaign.description || '-'}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm lg:text-base font-medium text-primary">
                        {campaign.efficiency}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center hidden lg:table-cell">
                      <span className="text-sm text-foreground">
                        {campaign.minQuantity}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center hidden lg:table-cell">
                      <span className="text-sm text-gray-900">
                        {campaign.deadline}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center" style={{ minWidth: '140px' }}>
                      <div className="flex flex-col items-center gap-1">
                        {/* 승인 대기 중이거나 반려된 캠페인은 총판에게는 라벨로 표시 - Select와 동일한 높이/너비로 설정 */}
                        {!canChangeStatus(campaign) ? (
                          <div className={`w-full min-w-[120px] badge badge-${campaign.status.color} shrink-0 badge-outline rounded-[30px] h-[28px] py-1 border-0 text-[12px] font-medium flex items-center justify-center`}>
                            <span className={`size-1.5 rounded-full bg-${getBgColorClass(campaign.status.color)} me-1.5`}></span>
                            <span>{campaign.status.label}</span>
                            {campaign.status.label === '반려됨' && !isAdmin && (
                              <span className="ml-1 text-xs text-red-500">(수정 필요)</span>
                            )}
                          </div>
                        ) : (
                          /* 그 외에는 상태 변경 가능 Select 표시 */
                          <Select
                            value={campaign.status.status || getStatusValue(campaign.status.label)}
                            onValueChange={(value) => handleStatusChange(campaign.id, value)}
                            disabled={loadingStatus[campaign.id]}
                          >
                            <SelectTrigger className={`w-full min-w-[120px] badge badge-${campaign.status.color} shrink-0 badge-outline rounded-[30px] h-auto py-1 border-0 focus:ring-0 text-[12px] font-medium`}>
                              {loadingStatus[campaign.id] ? (
                                <span className="flex items-center">
                                  <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                                  처리중...
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <span className={`size-1.5 rounded-full bg-${getBgColorClass(campaign.status.color)} me-1.5`}></span>
                                  <SelectValue />
                                </span>
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">진행중</SelectItem>
                              <SelectItem value="pending">준비중</SelectItem>
                              <SelectItem value="pause">표시안함</SelectItem>
                              {isAdmin && (
                                <>
                                  <SelectItem value="waiting_approval">승인 대기중</SelectItem>
                                  <SelectItem value="rejected">반려됨</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        )}

                        {/* 반려된 캠페인인 경우 반려 사유 표시 */}
                        {campaign.status.label === '반려됨' && (
                          <div className="flex flex-col">
                            <div className="mt-1 text-xs text-red-500 max-w-[200px] truncate" title={campaign.originalData?.rejected_reason || '반려 사유 없음'}>
                              <span className="font-medium">반려 사유:</span> {campaign.originalData?.rejected_reason || '반려 사유 없음'}
                            </div>
                            {!isAdmin && (
                              <div className="mt-0.5 text-xs text-blue-500">
                                <span className="font-medium" title="수정 후 저장하시면 자동으로 재승인 요청이 진행됩니다">
                                  <KeenIcon icon="information-2" className="mr-0.5 inline-block size-3" />
                                  수정하여 재승인 요청
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          className="btn btn-sm btn-icon btn-info"
                          title="상세설정"
                          onClick={() => openDetailModal(campaign)}
                        >
                          <KeenIcon icon="setting-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <KeenIcon icon="information-2" className="size-8 mb-2 text-gray-400" />
                        <p>생성된 캠페인이 없습니다.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      {/* 캠페인 상세 정보 모달 (통합된 CampaignModal 사용) */}
      <CampaignModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        campaign={selectedCampaign}
        onSave={handleSaveCampaign}
        isDetailMode={true}
        isOperator={isOperator} // 부모 컴포넌트에서 전달받은 운영자 모드 여부 전달
        updateCampaign={updateCampaign} // 캠페인 업데이트 서비스 함수 전달
        serviceType={selectedCampaign?.serviceType || (selectedCampaign?.originalData?.service_type || '')}
      />
    </>
  );
};

export { CampaignContent };