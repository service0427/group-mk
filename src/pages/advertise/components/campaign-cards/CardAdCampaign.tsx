import { KeenIcon } from '@/components';
import { useState } from 'react';
import { CampaignDetailViewModal } from '@/pages/advertise/components';
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
  const navigate = useNavigate();
  
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
                onClick={() => navigate(url)}
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
            <div className="text-sm text-gray-700 w-full text-center" style={{ whiteSpace: 'pre-wrap' }}>{description}</div>
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