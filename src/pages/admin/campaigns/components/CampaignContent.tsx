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
}

// 캠페인 콘텐츠 컴포넌트 props 정의
interface CampaignContentProps {
  campaigns: ICampaign[];
  serviceType: string; // 서비스 유형(naver-shopping, naver-place 등)
}

const CampaignContent: React.FC<CampaignContentProps> = ({ campaigns: initialCampaigns, serviceType }) => {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<ICampaign | null>(null);
  const [campaigns, setCampaigns] = useState<ICampaign[]>(initialCampaigns);
  
  // 캠페인 상태 변경 처리 함수
  const handleStatusChange = (campaignId: string, newStatus: string) => {
    // 상태 업데이트 로직
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
    
    // 실제 환경에서는 여기서 API 호출을 수행할 수 있습니다
    console.log(`캠페인 ID: ${campaignId}의 상태를 ${newStatus}로 변경합니다.`);
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
    setSelectedCampaign(campaign);
    setDetailModalOpen(true);
  };
  
  // 캠페인 정보 저장 핸들러
  const handleSaveCampaign = (updatedCampaign: ICampaign) => {
    setCampaigns(prevCampaigns => 
      prevCampaigns.map(campaign => 
        campaign.id === updatedCampaign.id ? updatedCampaign : campaign
      )
    );
    
    // 실제 환경에서는 여기서 API 호출을 수행할 수 있습니다
    console.log(`캠페인 ID: ${updatedCampaign.id}의 정보가 업데이트되었습니다.`, updatedCampaign);
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
                          campaign.description.toLowerCase().includes(searchInput.toLowerCase());
      
      // 상태 필터링
      const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && campaign.status.label === '진행중') ||
                          (statusFilter === 'pending' && campaign.status.label === '준비중');
      
      return matchesSearch && matchesStatus;
    });
  }, [searchInput, statusFilter, campaigns]);

  const serviceTitle = getServiceTitle();

  return (
    <>
    <div className="card">
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm">
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
              </SelectContent>
            </Select>

            <button className="btn btn-sm btn-outline btn-primary">
              <KeenIcon icon="setting-4" /> 고급 필터
            </button>
          </div>
        </div>
      </div>
      
      <div className="card-body px-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '60px' }}>
                  No
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캠페인명
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캠페인 설명
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상승효율
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  최소수량
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  접수마감시간
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '140px' }}>
                  상태
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상세설정
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((campaign, index) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <img
                        src={toAbsoluteUrl(`/media/${campaign.logo}`)}
                        className="rounded-full size-10 shrink-0"
                        alt={campaign.campaignName}
                      />
                      <Link to={`/admin/campaigns/${serviceType}/${campaign.id}`} className="text-sm font-medium text-gray-900 hover:text-primary-active">
                        {campaign.campaignName}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-[300px] line-clamp-2">
                      {campaign.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-base font-medium text-primary">
                      {campaign.efficiency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">
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
                    >
                      <SelectTrigger className={`w-full min-w-[120px] badge badge-${campaign.status.color} shrink-0 badge-outline rounded-[30px] h-auto py-1 border-0 focus:ring-0 text-[12px] font-medium`}>
                        <span className={`size-1.5 rounded-full bg-${getBgColorClass(campaign.status.color)} me-1.5`}></span>
                        <SelectValue>{campaign.status.label}</SelectValue>
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