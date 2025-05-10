import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toAbsoluteUrl } from '@/utils';
import { CampaignDetailModal } from './campaign-modals';
import { updateCampaignStatus } from '../services/campaignService';

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
  };
  additionalLogic?: string;
  detailedDescription?: string;
  originalData?: any; // DB에서 가져온 원본 데이터
}

// 캠페인 콘텐츠 컴포넌트 props 정의
interface CampaignContentProps {
  campaigns: ICampaign[];
  serviceType: string; // 서비스 유형(naver-shopping, naver-place 등)
  onCampaignUpdated?: () => void; // 캠페인 업데이트 시 호출할 콜백 함수
  onAddCampaign?: () => void; // 캠페인 추가 버튼 클릭 시 호출할 콜백 함수
}

const CampaignContent: React.FC<CampaignContentProps> = ({ 
  campaigns: initialCampaigns, 
  serviceType, 
  onCampaignUpdated,
  onAddCampaign
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<ICampaign | null>(null);
  const [campaigns, setCampaigns] = useState<ICampaign[]>(initialCampaigns);
  const [loadingStatus, setLoadingStatus] = useState<{[key: string]: boolean}>({});
  
  // 캠페인 상태 변경 처리 함수
  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    // 로딩 상태 설정
    setLoadingStatus(prev => ({ ...prev, [campaignId]: true }));
    
    try {
      // DB 상태 업데이트
      const success = await updateCampaignStatus(parseInt(campaignId), newStatus);
      
      if (success) {
        // UI 상태 업데이트
        setCampaigns(prevCampaigns => 
          prevCampaigns.map(campaign => 
            campaign.id === campaignId 
              ? { 
                  ...campaign, 
                  status: { 
                    label: getStatusLabel(newStatus), 
                    color: getStatusColor(newStatus) 
                  } 
                } 
              : campaign
          )
        );
        
        console.log(`캠페인 ID: ${campaignId}의 상태를 ${newStatus}로 변경했습니다.`);
      } else {
        console.error(`캠페인 ID: ${campaignId}의 상태 변경에 실패했습니다.`);
        alert('상태 변경 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('상태 변경 중 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
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
      default: return '준비중';
    }
  };
  
  // 상태값에 따른 색상 반환
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'success';
      case 'pause': return 'warning';
      case 'pending': return 'info';
      case 'completed': return 'primary';
      case 'rejected': return 'danger';
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
  const handleSaveCampaign = (updatedCampaign: ICampaign) => {
    // 로컬 상태 업데이트 - 수정된 캠페인 정보 반영
    setCampaigns(prevCampaigns => 
      prevCampaigns.map(campaign => 
        campaign.id === updatedCampaign.id ? updatedCampaign : campaign
      )
    );
    
    // 선택된 캠페인도 업데이트 - 모달이 다시 열릴 때 최신 데이터 표시
    setSelectedCampaign(updatedCampaign);
    
    console.log(`캠페인 ID: ${updatedCampaign.id}의 정보가 업데이트되었습니다.`, updatedCampaign);
    
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

  // 필터링 적용
  const filteredData = useMemo(() => {
    return campaigns.filter(campaign => {
      // 검색어 필터링
      const matchesSearch = campaign.campaignName.toLowerCase().includes(searchInput.toLowerCase()) ||
                          (campaign.description?.toLowerCase().includes(searchInput.toLowerCase()) || false);
      
      // 상태 필터링
      const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && campaign.status.label === '진행중') ||
                          (statusFilter === 'pending' && campaign.status.label === '준비중') ||
                          (statusFilter === 'pause' && campaign.status.label === '표시안함');
      
      return matchesSearch && matchesStatus;
    });
  }, [searchInput, statusFilter, campaigns]);

  const serviceTitle = getServiceTitle();

  return (
    <>
    <div className="card bg-card">
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm text-card-foreground">
          전체 {campaigns.length}개 {serviceTitle} 캠페인
        </h3>

        <div className="flex flex-wrap gap-2 lg:gap-5">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                type="text"
                placeholder="캠페인명 검색"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Select 
              value={statusFilter} 
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-28" size="sm">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent className="w-32">
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="active">진행중</SelectItem>
                <SelectItem value="pending">준비중</SelectItem>
                <SelectItem value="pause">표시안함</SelectItem>
              </SelectContent>
            </Select>
            
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                if (onAddCampaign) {
                  onAddCampaign();
                } else {
                  console.log('캠페인 추가 버튼 클릭');
                  // 기본 동작 - 추후에 캠페인 추가 모달을 직접 열거나 할 수 있음
                }
              }}
            >
              <KeenIcon icon="plus" className="me-1" />
              캠페인 추가
            </button>
          </div>
        </div>
      </div>
      
      <div className="card-body px-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ width: '60px' }}>
                  No
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  캠페인명
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캠페인 설명
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  상승효율
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  최소수량
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  접수마감시간
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ minWidth: '140px' }}>
                  상태
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상세설정
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {filteredData.map((campaign, index) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-foreground">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          typeof campaign.originalData?.add_info === 'object' 
                            ? campaign.originalData.add_info?.logo_url 
                            : (campaign.originalData?.add_info_logo_url || toAbsoluteUrl(`/media/${campaign.logo}`))
                        }
                        className="rounded-full size-10 shrink-0"
                        alt={campaign.campaignName}
                        onError={(e) => {
                          // 이미지 로드 실패 시 기본 이미지 사용
                          (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/animal-default.svg');
                        }}
                      />
                      <Link to={`/admin/campaigns/${serviceType}/${campaign.id}`} className="text-sm font-medium text-foreground hover:text-primary-active">
                        {campaign.campaignName}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground max-w-[400px] line-clamp-2">
                      {campaign.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-base font-medium text-primary">
                      {campaign.efficiency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-foreground">
                      {campaign.minQuantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">
                      {campaign.deadline}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center" style={{ minWidth: '140px' }}>
                    <Select 
                      value={getStatusValue(campaign.status.label)} 
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
                          <>
                            <span className={`size-1.5 rounded-full bg-${getBgColorClass(campaign.status.color)} me-1.5`}></span>
                            <SelectValue>{campaign.status.label}</SelectValue>
                          </>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">진행중</SelectItem>
                        <SelectItem value="pending">준비중</SelectItem>
                        <SelectItem value="pause">표시안함</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
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
                      <KeenIcon icon="information-circle" className="size-8 mb-2 text-gray-400" />
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
    

    {/* 캠페인 상세 정보 모달 */}
    <CampaignDetailModal 
      open={detailModalOpen} 
      onClose={() => setDetailModalOpen(false)}
      campaign={selectedCampaign}
      onSave={handleSaveCampaign}
    />
    </>
  );
};

export { CampaignContent };