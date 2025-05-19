import { KeenIcon } from '@/components';
import { useState } from 'react';
import { CampaignDetailViewModal, CampaignSlotWithKeywordModal } from '@/pages/advertise/components';
import { toAbsoluteUrl } from '@/utils/Assets';
import { useNavigate } from 'react-router-dom';
import {
  getStatusColorClass,
  formatCampaignDetailData,
  getAnimalIconFromName
} from '@/utils/CampaignFormat';

interface IAdCampaignItem {
  total: string;
  description: string;
}
type IAdCampaignItems = Array<IAdCampaignItem>

interface IAdCampaignProps {
  logo: string;
  logoSize?: string;
  title: string;
  description: string;
  detailedDescription?: string; // 추가: 상세 설명 필드 (옵셔널)
  status: {
    variant: string;
    label: string;
  };
  statistics: IAdCampaignItem[];
  progress?: {
    variant: string;
    value: number;
  };
  url: string;
  rawId?: string | number;  // 추가: 원본 데이터 ID
}

const CardAdCampaign = ({
  logo,
  logoSize = '50px', // 기본값 제공
  title,
  description,
  detailedDescription,
  status,
  statistics,
  progress = { variant: 'progress-primary', value: 100 }, // 기본값 제공
  url,
  rawId  // 원본 데이터 ID
}: IAdCampaignProps) => {
  // 컴포넌트 렌더링
  const [modalOpen, setModalOpen] = useState(false);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // 원본 데이터에서 상세 설명 가져오기 (전역 변수에 저장된 rawItems 활용)
  // @ts-ignore - window에 campaignRawItems 추가
  const rawItems = window.campaignRawItems || [];
  const rawItem = rawItems.find((item: any) => item.id === rawId);
  
  // 원본 데이터에서 직접 detailed_description 가져오기
  const rawDetailedDesc = rawItem?.detailed_description;
  
  // 직접 상세보기 모달에 전달할 데이터 구성
  const campaignData = {
    id: rawId || "",
    campaignName: title,
    description: description,
    logo: logo,
    efficiency: statistics.find(stat => stat.description.includes('상승효율'))?.total || '0%',
    minQuantity: statistics.find(stat => stat.description.includes('최소수량'))?.total || '0개',
    deadline: statistics.find(stat => stat.description.includes('접수마감'))?.total || '-',
    unitPrice: statistics.find(stat => stat.description.includes('건당단가'))?.total || '0원',
    additionalLogic: statistics.find(stat => stat.description.includes('추가로직'))?.total || '없음',
    // 원본 데이터의 상세 설명 우선 사용
    detailedDescription: rawDetailedDesc ? rawDetailedDesc.replace(/\\n/g, '\n') : detailedDescription,
    status: {
      label: status.label,
      color: status.variant
    }
  };

  const renderItem = (statistic: IAdCampaignItem, index: number) => {
    // 표시할 값 그대로 사용 (IntroTemplate에서 이미 적절한 형식으로 변환했음)
    return (
      <div
        key={index}
        className="flex flex-col gap-1.5 border border-dashed border-gray-300 rounded-md px-2.5 py-2"
      >
        <span className="text-gray-900 text-sm leading-none font-medium">{statistic.total}</span>
        <span className="text-gray-700 text-xs">{statistic.description}</span>
      </div>
    );
  };

  return (
    <>
      <div className="card overflow-hidden grow flex flex-col justify-between">
        <div className="p-5 mb-5 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <span className={`badge ${status.variant} badge-outline rounded-[30px] h-auto py-1`}>
              <span className={`size-1.5 rounded-full bg-${getStatusColorClass(status.variant)} me-1.5`}></span>
              {status.label}
            </span>

            <div className="flex gap-2">
              <button
                className="btn btn-sm btn-info"
                onClick={() => setModalOpen(true)}
              >
                <KeenIcon icon="eye" className="me-1.5" />
                상세보기
              </button>

              <button
                className="btn btn-sm btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  setSlotModalOpen(true);
                }}
              >
                <KeenIcon icon="purchase" className="me-1.5" />
                구매하기
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center mb-7">
            <div className="flex items-center gap-2 mb-3">
              <img
                src={logo && logo.includes('http') ? logo : (logo.startsWith('/media') ? toAbsoluteUrl(logo) : toAbsoluteUrl(`/media/animal/svg/${logo}`))}
                className={`size-[30px] shrink-0`}
                alt=""
                onError={(e) => {
                  // 캠페인 이름에서 동물 추출 시도
                  const animalFromName = getAnimalIconFromName(title);
                  if (animalFromName) {
                    (e.target as HTMLImageElement).src = toAbsoluteUrl(`/media/animal/svg/${animalFromName}.svg`);
                  } else {
                    // 기본 이미지 사용
                    (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/lion.svg');
                  }
                }}
              />
              <a href={url} className="text-lg font-medium text-gray-900 hover:text-primary">
                {title}
              </a>
            </div>
            <div className="text-sm text-gray-700 w-full text-center flex flex-col justify-center" style={{ height: '4.5rem', position: 'relative' }}>
              {/* 3줄 이상인 경우와 2줄 이하인 경우 다르게 처리 */}
              {(description.split('\n').length > 2 || description.length > 120) ? (
                /* 3줄 이상인 경우: 2줄만 표시 + ... */
                <>
                  <div className="h-[3rem] overflow-hidden" style={{ 
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5rem'
                  }}>
                    {description}
                  </div>
                  <div className="h-[1.5rem] flex items-center justify-center">
                    ...
                  </div>
                </>
              ) : (
                /* 2줄 이하인 경우: 세로 중앙 정렬 */
                <div className="flex items-center justify-center h-full" style={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.5rem'
                }}>
                  {description}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center flex-wrap gap-2 lg:gap-5 mt-auto">
            {statistics.map((statistic, index) => {
              return renderItem(statistic, index);
            })}
          </div>
        </div>

        <div className={`progress ${progress?.variant}`}>
          <div className="progress-bar" style={{ width: `${progress?.value}%` }}></div>
        </div>
      </div>
      
      {/* 상세보기 모달 */}
      <CampaignDetailViewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        campaign={campaignData}
      />
      
      {/* 슬롯 추가 모달 */}
      <CampaignSlotWithKeywordModal
        open={slotModalOpen}
        onClose={() => setSlotModalOpen(false)}
        category={title}
        campaign={{
          id: 1, // 실제 환경에서는 적절한 ID 필요
          campaign_name: title,
          status: status.label,
          service_type: 'ntraffic' // 기본값으로 설정, 실제로는 URL에서 파싱 필요
        }}
        serviceCode={'NaverShopTraffic'} // 기본값으로 설정, 실제로는 URL에서 파싱 필요
      />
    </>
  );
};

export { CardAdCampaign, type IAdCampaignItem, type IAdCampaignItems, type IAdCampaignProps };