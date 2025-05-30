import { KeenIcon } from '@/components';
import { useState } from 'react';
import { CampaignDetailViewModal } from '@/pages/advertise/components';
import { toAbsoluteUrl } from '@/utils/Assets';

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
}

const CardAdCampaign = ({
  logo,
  logoSize,
  title,
  description,
  status,
  statistics,
  progress,
  url
}: IAdCampaignProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  
  // 모달에 표시할 캠페인 데이터 객체 - 누락된 속성 추가
  const campaignData = {
    id: "", // ID 표시하지 않음
    campaignName: title,
    description: description,
    logo: logo,
    efficiency: statistics.find(stat => stat.description.includes('효율'))?.total || '0%',
    minQuantity: statistics.find(stat => stat.description.includes('수량'))?.total || '0개',
    deadline: statistics.find(stat => stat.description.includes('시간'))?.total || '-',
    unitPrice: statistics.find(stat => stat.description.includes('단가'))?.total || '0원', // 추가
    additionalLogic: statistics.find(stat => stat.description.includes('추가로직'))?.total || '없음', // 추가
    status: {
      label: status.label,
      color: status.variant
    }
  };

  const renderItem = (statistic: IAdCampaignItem, index: number) => {
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
      <div className="card overflow-hidden grow justify-between">
        <div className="p-5 mb-5">
          <div className="flex items-center justify-between mb-5">
            <span className={`badge ${status.variant} badge-outline`}>{status.label}</span>
            
            <button 
              className="btn btn-sm btn-light"
              onClick={() => setModalOpen(true)}
            >
              <KeenIcon icon="eye" className="me-1.5" />
              상세보기
            </button>
          </div>

          <div className="flex items-center justify-center h-[50px] mb-2">
            <img
              src={toAbsoluteUrl(`/media/animal/svg/${logo}`)}
              className={`size-[${logoSize}] shrink-0`}
              alt=""
            />
          </div>

          <div className="text-center mb-7">
            <a href={url} className="text-lg font-medium text-gray-900 hover:text-primary">
              {title}
            </a>

            <div className="text-sm text-gray-700">{description}</div>
          </div>

          <div className="flex items-center justify-center flex-wrap gap-2 lg:gap-5">
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
    </>
  );
};

export { CardAdCampaign, type IAdCampaignItem, type IAdCampaignItems, type IAdCampaignProps };