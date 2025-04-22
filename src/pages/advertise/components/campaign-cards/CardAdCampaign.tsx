import { KeenIcon } from '@/components';
import { useState } from 'react';
import { CampaignDetailViewModal } from '@/pages/advertise/components';
import { toAbsoluteUrl } from '@/utils/Assets';
import { getStatusColorClass, formatCampaignDetailData } from '@/utils/CampaignFormat';

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
  logoSize = '50px', // 기본값 제공
  title,
  description,
  status,
  statistics,
  progress = { variant: 'progress-primary', value: 100 }, // 기본값 제공
  url
}: IAdCampaignProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  
  // 유틸리티 함수를 사용하여 모달 데이터 생성
  const campaignData = formatCampaignDetailData({
    logo, 
    logoSize, 
    title, 
    description, 
    status, 
    statistics, 
    progress
  });

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
      <div className="card overflow-hidden grow justify-between">
        <div className="p-5 mb-5">
          <div className="flex items-center justify-between mb-5">
            <span className={`badge ${status.variant} badge-outline rounded-[30px] h-auto py-1`}>
              <span className={`size-1.5 rounded-full bg-${getStatusColorClass(status.variant)} me-1.5`}></span>
              {status.label}
            </span>
            
            <button 
              className="btn btn-sm btn-info"
              onClick={() => setModalOpen(true)}
            >
              <KeenIcon icon="eye" className="me-1.5" />
              상세보기
            </button>
          </div>

          <div className="flex items-center justify-center h-[50px] mb-2">
            <img
              src={logo.startsWith('/media') ? toAbsoluteUrl(logo) : toAbsoluteUrl(`/media/${logo}`)}
              className={`size-[${logoSize}] shrink-0`}
              alt=""
              onError={(e) => {
                console.error(`이미지 로드 실패:`, e);
                (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/lion.svg');
              }}
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