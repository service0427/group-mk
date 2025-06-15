import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
import { SERVICE_TYPE_LABELS, getStatusLabel, getStatusColor } from '@/components/campaign-modals/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
}

// 페이지네이션 컴포넌트
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void
}) => {
  // 모바일에서는 페이지 버튼 개수를 줄임
  const isMobile = window.innerWidth < 768;
  const maxButtons = isMobile ? 3 : 5;

  return (
    <div className="flex items-center justify-center gap-1 md:gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 md:h-9 md:w-auto md:px-3"
      >
        <KeenIcon icon="arrow-left" className="size-3" />
        <span className="hidden md:inline ml-1">이전</span>
      </Button>

      <div className="flex gap-1">
        {Array.from({ length: Math.min(maxButtons, totalPages) }, (_, i) => {
          // 페이지 버튼 표시 로직
          let pageNum;
          if (totalPages <= maxButtons) {
            // maxButtons 이하면 모든 페이지 버튼 표시
            pageNum = i + 1;
          } else if (currentPage <= Math.ceil(maxButtons / 2)) {
            // 현재 페이지가 앞쪽이면 1부터 표시
            pageNum = i + 1;
          } else if (currentPage >= totalPages - Math.floor(maxButtons / 2)) {
            // 현재 페이지가 끝쪽이면 마지막 페이지들 표시
            pageNum = totalPages - maxButtons + 1 + i;
          } else {
            // 그 외에는 현재 페이지 중심으로 표시
            pageNum = currentPage - Math.floor(maxButtons / 2) + i;
          }

          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className={`h-8 w-8 md:h-9 md:w-auto md:px-3 ${currentPage === pageNum ? 'bg-primary text-white' : ''}`}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 md:h-9 md:w-auto md:px-3"
      >
        <KeenIcon icon="arrow-right" className="size-3" />
        <span className="hidden md:inline ml-1">다음</span>
      </Button>
    </div>
  );
};

interface AllCampaignsContentProps {
  campaigns: ICampaign[];
  onCampaignUpdated: () => void;
  isOperator?: boolean;
}

export const AllCampaignsContent: React.FC<AllCampaignsContentProps> = ({
  campaigns: initialCampaigns,
  onCampaignUpdated,
  isOperator = false
}) => {
  const location = useLocation();
  const { success, error, info } = useToast();
  
  // 상태 필터
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // 서비스 타입 필터
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  // 검색어
  const [searchTerm, setSearchTerm] = useState<string>('');
  // 정렬 기준
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<ICampaign | null>(null);
  const [campaigns, setCampaigns] = useState<ICampaign[]>(initialCampaigns);
  const [loadingStatus, setLoadingStatus] = useState<{ [key: string]: boolean }>({});
  
  // 승인 확인 모달
  const [approvalModalOpen, setApprovalModalOpen] = useState<boolean>(false);
  const [campaignToApprove, setCampaignToApprove] = useState<string | null>(null);
  
  // 반려 모달
  const [rejectionModalOpen, setRejectionModalOpen] = useState<boolean>(false);
  const [campaignToReject, setCampaignToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    setCampaigns(initialCampaigns);
  }, [initialCampaigns]);

  // 캠페인 상태 변경 처리 함수
  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      error('캠페인을 찾을 수 없습니다.');
      return;
    }

    const currentStatus = campaign.status.status || campaign.originalData?.status || '';

    setLoadingStatus(prev => ({ ...prev, [campaignId]: true }));

    const finalStatus = newStatus;

    try {
      const result = await updateCampaignStatus(parseInt(campaignId), finalStatus);

      if (result) {
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

        success(`캠페인 상태가 ${getStatusLabel(finalStatus)}(으)로 변경되었습니다.`);
      } else {
        error('상태 변경 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('상태 변경 오류:', err);
      error('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setLoadingStatus(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  // 빠른 상태 변경 핸들러
  const handleQuickStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      const result = await updateCampaignStatus(parseInt(campaignId), newStatus);
      
      if (result) {
        onCampaignUpdated();
        success(`캠페인이 성공적으로 승인되었습니다.`);
      } else {
        error('캠페인 상태 변경에 실패했습니다.');
      }
    } catch (err) {
      console.error('캠페인 상태 변경 오류:', err);
      error('캠페인 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 승인 확인 모달 열기
  const handleOpenApprovalModal = (campaignId: string) => {
    setCampaignToApprove(campaignId);
    setApprovalModalOpen(true);
  };
  
  // 반려 모달 열기
  const handleOpenRejectionModal = (campaignId: string) => {
    setCampaignToReject(campaignId);
    setRejectionReason('');
    setRejectionModalOpen(true);
  };
  
  // 캠페인 반려 처리
  const handleRejectCampaign = async () => {
    if (!campaignToReject || !rejectionReason.trim()) {
      error('반려 사유를 입력해주세요.');
      return;
    }
    
    try {
      const result = await updateCampaign(parseInt(campaignToReject), {
        status: 'rejected',
        rejected_reason: rejectionReason
      });
      
      if (result) {
        onCampaignUpdated();
        success('캠페인이 반려되었습니다.');
        setRejectionModalOpen(false);
        setCampaignToReject(null);
        setRejectionReason('');
      } else {
        error('캠페인 반려에 실패했습니다.');
      }
    } catch (err) {
      console.error('캠페인 반려 오류:', err);
      error('캠페인 반려 중 오류가 발생했습니다.');
    }
  };

  // 모달에서 저장 성공 시 처리
  const handleCampaignUpdated = () => {
    onCampaignUpdated();
  };


  // 상태 변경 가능 여부 확인 (권한 및 상태 체크)
  const canChangeStatus = (campaign: ICampaign): boolean => {
    if (isOperator) return true;
    const currentStatus = campaign.status.status || campaign.originalData?.status || '';
    if (currentStatus === 'waiting_approval' || currentStatus === 'rejected') {
      return false;
    }
    return true;
  };


  // 배경색 클래스 반환
  const getBgColorClass = (color: string): string => {
    switch (color) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'primary': return 'primary';
      case 'danger': return 'danger';
      case 'info': return 'info';
      case 'gray-300': return 'gray-300';
      default: return 'info';
    }
  };

  // 상세 정보 모달 열기
  const openDetailModal = (campaign: ICampaign) => {
    const currentCampaign = campaigns.find(c => c.id === campaign.id) || campaign;
    setSelectedCampaign(currentCampaign);
    setDetailModalOpen(true);
  };

  // 캠페인 정보 저장 핸들러
  const handleSaveCampaign = (updatedCampaign: any) => {
    setCampaigns(prevCampaigns =>
      prevCampaigns.map(campaign =>
        campaign.id === updatedCampaign.id ? updatedCampaign : campaign
      )
    );

    setSelectedCampaign(updatedCampaign);
    success('캠페인 정보가 성공적으로 저장되었습니다.');

    if (onCampaignUpdated) {
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

  // 동물 아이콘 목록
  const animalIcons = [
    'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant', 'flamingo',
    'giraffe', 'horse', 'kangaroo', 'koala', 'leopard', 'lion', 'llama',
    'owl', 'pelican', 'penguin', 'sheep', 'teddy-bear', 'turtle'
  ];

  // 동물 이름과 아이콘을 매핑하는 객체
  const animalNameMap: Record<string, string> = {
    '곰': 'bear', '고양이': 'cat', '소': 'cow', '악어': 'crocodile', '돌고래': 'dolphin',
    '코끼리': 'elephant', '플라밍고': 'flamingo', '기린': 'giraffe', '말': 'horse',
    '캥거루': 'kangaroo', '코알라': 'koala', '표범': 'leopard', '사자': 'lion',
    '라마': 'llama', '올빼미': 'owl', '펠리컨': 'pelican', '펭귄': 'penguin',
    '양': 'sheep', '테디베어': 'teddy-bear', '거북이': 'turtle',
    'bear': 'bear', 'cat': 'cat', 'cow': 'cow', 'crocodile': 'crocodile',
    'dolphin': 'dolphin', 'elephant': 'elephant', 'flamingo': 'flamingo',
    'giraffe': 'giraffe', 'horse': 'horse', 'kangaroo': 'kangaroo',
    'koala': 'koala', 'leopard': 'leopard', 'lion': 'lion', 'llama': 'llama',
    'owl': 'owl', 'pelican': 'pelican', 'penguin': 'penguin', 'sheep': 'sheep',
    'teddy-bear': 'teddy-bear', 'teddy': 'teddy-bear', 'turtle': 'turtle',
  };

  // 캠페인 이름에서 동물 아이콘 추출 함수
  const getAnimalIconFromName = (name: string): string | null => {
    if (!name) return null;
    const lowerName = name.toLowerCase();

    for (const [animalName, iconName] of Object.entries(animalNameMap)) {
      const normalizedName = lowerName.replace(/\s+/g, '');
      const normalizedAnimal = animalName.toLowerCase().replace(/\s+/g, '');
      if (normalizedName === normalizedAnimal) {
        return iconName;
      }
    }

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
    if (typeof campaign.originalData?.add_info === 'object' && campaign.originalData.add_info?.logo_url) {
      return campaign.originalData.add_info.logo_url;
    }

    if (typeof campaign.originalData?.add_info === 'string' && campaign.originalData?.add_info_logo_url) {
      return campaign.originalData.add_info_logo_url;
    }

    if (campaign.logo && (campaign.logo.includes('.svg') || campaign.logo.includes('.png'))) {
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

      if (campaign.logo.startsWith('/media/')) {
        return toAbsoluteUrl(campaign.logo);
      }
      return toAbsoluteUrl(`/media/${campaign.logo}`);
    }

    if (campaign.logo && animalIcons.includes(campaign.logo)) {
      return toAbsoluteUrl(`/media/animal/svg/${campaign.logo}.svg`);
    }

    const animalFromName = getAnimalIconFromName(campaign.campaignName);
    if (animalFromName) {
      return toAbsoluteUrl(`/media/animal/svg/${animalFromName}.svg`);
    }

    const randomAnimal = getRandomAnimalIcon();
    return toAbsoluteUrl(`/media/animal/svg/${randomAnimal}.svg`);
  };

  // 필터링된 캠페인
  const filteredCampaigns = campaigns.filter(campaign => {
    // 상태 필터링
    if (statusFilter !== 'all' && campaign.status.status !== statusFilter) {
      return false;
    }

    // 서비스 타입 필터링
    if (serviceFilter !== 'all' && campaign.serviceType !== serviceFilter) {
      return false;
    }

    // 검색어 필터링
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return (
        campaign.campaignName.toLowerCase().includes(lowerSearchTerm) ||
        campaign.description.toLowerCase().includes(lowerSearchTerm) ||
        campaign.id.includes(lowerSearchTerm) ||
        (campaign.matId && campaign.matId.toString().includes(lowerSearchTerm))
      );
    }

    return true;
  });

  // 정렬
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.campaignName.toLowerCase();
        bValue = b.campaignName.toLowerCase();
        break;
      case 'status':
        aValue = a.status.status;
        bValue = b.status.status;
        break;
      case 'service':
        aValue = a.serviceType;
        bValue = b.serviceType;
        break;
      case 'created_at':
        aValue = a.originalData?.created_at || '';
        bValue = b.originalData?.created_at || '';
        break;
      case 'updated_at':
      default:
        aValue = a.originalData?.updated_at || '';
        bValue = b.originalData?.updated_at || '';
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(sortedCampaigns.length / itemsPerPage));
  const paginatedCampaigns = sortedCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 사용 가능한 서비스 유형 목록
  const availableServices = Array.from(
    new Set(campaigns.map(campaign => campaign.serviceType || ''))
  ).filter(service => service !== '').sort();
  
  // 서비스 타입을 라벨로 변환하는 함수
  const getServiceLabel = (serviceType: string) => {
    return SERVICE_TYPE_LABELS[serviceType] || serviceType;
  };

  // 상태 필터 변경 시 1페이지로 돌아가기
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, serviceFilter, searchTerm]);

  // 정렬 방향 토글 핸들러
  const toggleSortDirection = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  // 정렬 핸들러
  const handleSort = useCallback((field: string) => {
    if (sortBy === field) {
      toggleSortDirection();
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  }, [sortBy, toggleSortDirection]);

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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

              {/* 서비스 타입 필터 */}
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="서비스 필터" />
                </SelectTrigger>
                <SelectContent className="w-44">
                  <SelectItem value="all">전체 서비스</SelectItem>
                  {availableServices.map((service) => (
                    <SelectItem key={service} value={service}>
                      {getServiceLabel(service)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="card-body px-0">
          {/* 모바일에서는 카드 형태로 표시 */}
          <div className="md:hidden px-4">
            {paginatedCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {paginatedCampaigns.map((campaign, index) => (
                  <div key={campaign.id} className="bg-background border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getLogoPath(campaign)}
                          className="rounded-full size-10 shrink-0"
                          alt={campaign.campaignName || '캠페인'}
                          onError={(e) => {
                            const animalIcons = [
                              'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant', 'flamingo',
                              'giraffe', 'horse', 'kangaroo', 'koala', 'leopard', 'lion', 'llama',
                              'owl', 'pelican', 'penguin', 'sheep', 'teddy-bear', 'turtle'
                            ];
                            const randomAnimal = animalIcons[Math.floor(Math.random() * animalIcons.length)];
                            e.currentTarget.src = toAbsoluteUrl(`/media/animal/${randomAnimal}.png`);
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-base font-medium text-foreground line-clamp-1">
                            {campaign.campaignName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>#{(currentPage - 1) * itemsPerPage + index + 1}</span>
                            <span>•</span>
                            <span className="inline-flex items-center">
                              <span className="size-1.5 rounded-full bg-primary mr-1"></span>
                              {getServiceLabel(campaign.serviceType || campaign.serviceName || '')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-icon btn-primary ml-2"
                        title="캠페인 상세"
                        onClick={() => openDetailModal(campaign)}
                      >
                        <KeenIcon icon="notepad-edit" />
                      </button>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-foreground line-clamp-2">
                        {campaign.description || '설명이 없습니다.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-muted/50 p-2 rounded">
                        <div className="text-xs text-muted-foreground mb-1">수정시간</div>
                        <div className="text-xs text-foreground">{campaign.updatedAt}</div>
                      </div>
                      <div className="bg-muted/50 p-2 rounded">
                        <div className="text-xs text-muted-foreground mb-1">상태</div>
                        <div className="flex items-center justify-center">
                          {/* 승인 대기중 상태는 변경 불가 */}
                          {campaign.status.status === 'waiting_approval' ? (
                            <span className={`badge badge-${campaign.status.color} badge-outline rounded-[30px] h-[24px] py-0.5 text-xs inline-flex items-center justify-center`}>
                              <span className={`size-1.5 rounded-full bg-${campaign.status.color} me-1.5`}></span>
                              {campaign.status.label}
                            </span>
                          ) : (
                            /* 그 외 상태는 변경 가능 */
                            <Select
                              value={campaign.status.status || getStatusValue(campaign.status.label)}
                              onValueChange={(value) => handleStatusChange(campaign.id, value)}
                              disabled={loadingStatus[campaign.id]}
                            >
                              <SelectTrigger className={`w-full badge badge-${campaign.status.color} shrink-0 badge-outline rounded-[30px] h-[24px] py-0.5 border-0 focus:ring-0 text-xs font-medium`}>
                                {loadingStatus[campaign.id] ? (
                                  <span className="flex items-center text-xs">
                                    <span className="animate-spin mr-1 h-3 w-3 border-t-2 border-b-2 border-current rounded-full"></span>
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
                                <SelectItem value="waiting_approval">승인 대기중</SelectItem>
                                <SelectItem value="rejected">반려됨</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 승인/반려 버튼 */}
                    {campaign.status.status === 'waiting_approval' && (
                      <div className="flex gap-2 mb-3">
                        <button
                          className="btn btn-sm btn-success flex-1"
                          onClick={() => handleOpenApprovalModal(campaign.id)}
                          title="승인"
                        >
                          <KeenIcon icon="check" className="text-sm me-1" />
                          승인
                        </button>
                        <button
                          className="btn btn-sm btn-danger flex-1"
                          onClick={() => handleOpenRejectionModal(campaign.id)}
                          title="반려"
                        >
                          <KeenIcon icon="cross" className="text-sm me-1" />
                          반려
                        </button>
                      </div>
                    )}

                    {/* 반려된 경우 반려 사유 표시 */}
                    {campaign.status.status === 'rejected' && campaign.originalData?.rejected_reason && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-md">
                        <div className="font-medium mb-0.5">반려 사유:</div>
                        <div>{campaign.originalData.rejected_reason}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 bg-muted/20 rounded-lg">
                <KeenIcon icon="document-search" className="size-8 mb-2 text-gray-400" />
                <p className="text-muted-foreground">검색 결과가 없습니다.</p>
              </div>
            )}
          </div>

          {/* 데스크톱에서는 테이블 형태로 표시 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="table align-middle text-sm w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="py-4 px-5 text-center font-medium w-[60px]">No</th>
                  <th 
                    onClick={() => handleSort('service')}
                    className="py-4 px-5 text-center font-medium cursor-pointer hover:bg-muted w-[160px]"
                  >
                    <div className="flex items-center justify-center">
                      서비스명
                      {sortBy === 'service' && (
                        <KeenIcon
                          icon={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                          className="ml-1 size-3"
                        />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-5 text-center font-medium w-[100px]">서비스구분</th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="py-4 px-5 text-start font-medium cursor-pointer hover:bg-muted min-w-[280px]"
                  >
                    <div className="flex items-center">
                      캠페인
                      {sortBy === 'name' && (
                        <KeenIcon
                          icon={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                          className="ml-1 size-3"
                        />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('updated_at')}
                    className="py-4 px-5 text-center font-medium cursor-pointer hover:bg-muted w-[180px]"
                  >
                    <div className="flex items-center justify-center">
                      캠페인 수정시간
                      {sortBy === 'updated_at' && (
                        <KeenIcon
                          icon={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                          className="ml-1 size-3"
                        />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="py-4 px-5 text-center font-medium cursor-pointer hover:bg-muted w-[130px]"
                  >
                    <div className="flex items-center justify-center">
                      상태
                      {sortBy === 'status' && (
                        <KeenIcon
                          icon={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                          className="ml-1 size-3"
                        />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-5 text-center font-medium w-[180px]">승인/반려</th>
                  <th className="py-4 px-5 text-center font-medium w-[110px]">캠페인 상세</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <KeenIcon icon="document-search" className="size-12 mb-2" />
                        <p>검색 결과가 없습니다.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCampaigns.map((campaign, index) => (
                    <tr key={campaign.id} className="border-b border-border hover:bg-muted/30">
                      {/* 1. No */}
                      <td className="py-4 px-5 text-center">
                        <span className="text-sm font-medium text-foreground">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </span>
                      </td>
                      
                      {/* 2. 서비스명 */}
                      <td className="py-4 px-5">
                        <div className="flex justify-center">
                          <span className="inline-flex items-center">
                            <span className="size-2 rounded-full bg-primary mr-2"></span>
                            {getServiceLabel(campaign.serviceType || campaign.serviceName || '')}
                          </span>
                        </div>
                      </td>
                      
                      {/* 3. 서비스구분 */}
                      <td className="py-4 px-5 text-center">
                        <span className={`badge ${
                          campaign.originalData?.slot_type === 'guarantee' 
                            ? 'badge-info' 
                            : 'badge-primary'
                        } badge-outline rounded-[30px] h-auto py-0.5 text-xs`}>
                          {campaign.originalData?.slot_type === 'guarantee' ? '보장형' : '일반형'}
                        </span>
                      </td>
                      
                      {/* 4. 캠페인 */}
                      <td className="py-4 px-5">
                        <div className="flex items-center">
                          <div className="relative mr-3 flex-shrink-0">
                            <img
                              src={getLogoPath(campaign)}
                              alt={campaign.campaignName}
                              className="size-10 rounded-full object-cover"
                              onError={(e) => {
                                const animalIcons = [
                                  'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant', 'flamingo',
                                  'giraffe', 'horse', 'kangaroo', 'koala', 'leopard', 'lion', 'llama',
                                  'owl', 'pelican', 'penguin', 'sheep', 'teddy-bear', 'turtle'
                                ];
                                const randomAnimal = animalIcons[Math.floor(Math.random() * animalIcons.length)];
                                e.currentTarget.src = toAbsoluteUrl(`/media/animal/${randomAnimal}.png`);
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{campaign.campaignName}</p>
                            <p className="text-xs text-muted-foreground">ID: {campaign.id}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* 5. 캠페인 수정시간 */}
                      <td className="py-4 px-5 text-center">
                        {campaign.updatedAt}
                      </td>
                      
                      {/* 7. 상태 */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-1 items-center">
                          {/* 승인 대기중 상태는 변경 불가 */}
                          {campaign.status.status === 'waiting_approval' ? (
                            <span className={`w-[120px] badge badge-${campaign.status.color} badge-outline rounded-[30px] h-[28px] py-1 inline-flex items-center justify-center`}>
                              <span className={`size-1.5 rounded-full bg-${campaign.status.color} me-1.5`}></span>
                              {campaign.status.label}
                            </span>
                          ) : (
                            /* 그 외 상태는 변경 가능 */
                            <Select
                              value={campaign.status.status || getStatusValue(campaign.status.label)}
                              onValueChange={(value) => handleStatusChange(campaign.id, value)}
                              disabled={loadingStatus[campaign.id]}
                            >
                              <SelectTrigger className={`w-[120px] badge badge-${campaign.status.color} shrink-0 badge-outline rounded-[30px] h-[28px] py-1 border-0 focus:ring-0 text-[12px] font-medium`}>
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
                                <SelectItem value="waiting_approval">승인 대기중</SelectItem>
                                <SelectItem value="rejected">반려됨</SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          {/* 반려된 경우 반려 사유 표시 */}
                          {campaign.status.status === 'rejected' && campaign.originalData?.rejected_reason && (
                            <div className="text-xs text-red-500 max-w-[200px] truncate mt-1 text-center" title={campaign.originalData.rejected_reason}>
                              <span className="font-medium">반려 사유:</span> {campaign.originalData.rejected_reason}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* 8. 승인/반려 */}
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {campaign.status.status === 'waiting_approval' ? (
                            <>
                              <button
                                className="btn btn-xs btn-success"
                                onClick={() => handleOpenApprovalModal(campaign.id)}
                                title="승인"
                              >
                                <KeenIcon icon="check" className="text-sm me-1" />
                                승인
                              </button>
                              <button
                                className="btn btn-xs btn-danger"
                                onClick={() => handleOpenRejectionModal(campaign.id)}
                                title="반려"
                              >
                                <KeenIcon icon="cross" className="text-sm me-1" />
                                반려
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                      
                      {/* 9. 캠페인 상세 */}
                      <td className="py-4 px-5 text-center">
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => openDetailModal(campaign)}
                        >
                          <KeenIcon icon="notepad-edit" className="text-sm me-1" />
                          상세
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* 캠페인 상세 모달 */}
      {selectedCampaign && (
        <CampaignModal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          campaign={selectedCampaign}
          onSave={handleSaveCampaign}
          isDetailMode={true}
          isOperator={isOperator}
          updateCampaign={updateCampaign}
          serviceType={selectedCampaign?.serviceType}
        />
      )}

      {/* 캠페인 승인 확인 모달 */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <KeenIcon icon="check-circle" className="text-green-500 size-5 mr-2" />
              캠페인 승인 확인
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                선택한 캠페인을 승인하시겠습니까?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                승인 시 캠페인이 준비중 상태로 변경됩니다.
              </p>
            </div>

            {/* 캠페인 정보 표시 */}
            {campaignToApprove && campaigns.find(c => c.id === campaignToApprove) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-blue-700 dark:text-blue-300">
                      <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                      캠페인 이름
                    </span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {campaigns.find(c => c.id === campaignToApprove)?.campaignName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-blue-700 dark:text-blue-300">
                      <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                      서비스 유형
                    </span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {getServiceLabel(campaigns.find(c => c.id === campaignToApprove)?.serviceType || '')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-blue-700 dark:text-blue-300">
                      <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                      현재 상태
                    </span>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {campaigns.find(c => c.id === campaignToApprove)?.status.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-blue-700 dark:text-blue-300">
                      <KeenIcon icon="check-circle" className="size-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                      변경될 상태
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      준비중
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={async () => {
                if (campaignToApprove) {
                  await handleQuickStatusChange(campaignToApprove, 'pending');
                  setApprovalModalOpen(false);
                  setCampaignToApprove(null);
                }
              }}
            >
              승인하기
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setApprovalModalOpen(false);
                setCampaignToApprove(null);
              }}
            >
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 캠페인 반려 모달 */}
      <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <KeenIcon icon="cross-circle" className="text-red-500 size-5 mr-2" />
              캠페인 반려
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                캠페인을 반려하시겠습니까?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                반려 사유를 입력해주세요.
              </p>
            </div>

            {/* 캠페인 정보 표시 */}
            {campaignToReject && campaigns.find(c => c.id === campaignToReject) && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-red-700 dark:text-red-300">
                      <KeenIcon icon="information" className="size-4 mr-1.5 text-red-600 dark:text-red-400" />
                      캠페인 이름
                    </span>
                    <span className="font-medium text-red-900 dark:text-red-100">
                      {campaigns.find(c => c.id === campaignToReject)?.campaignName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-red-700 dark:text-red-300">
                      <KeenIcon icon="information" className="size-4 mr-1.5 text-red-600 dark:text-red-400" />
                      서비스 유형
                    </span>
                    <span className="font-medium text-red-900 dark:text-red-100">
                      {getServiceLabel(campaigns.find(c => c.id === campaignToReject)?.serviceType || '')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 반려 사유 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                반려 사유 <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="반려 사유를 상세히 입력해주세요..."
                className="w-full min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectionReason.length}/500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleRejectCampaign}
              disabled={!rejectionReason.trim()}
            >
              반려하기
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionModalOpen(false);
                setCampaignToReject(null);
                setRejectionReason('');
              }}
            >
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};