import { KeenIcon } from '@/components';
import { useState } from 'react';
import { toAbsoluteUrl } from '@/utils/Assets';
import { useNavigate } from 'react-router-dom';
import { CampaignDetailViewModal, CampaignSlotWithKeywordModal } from '@/pages/advertise/components';
import { IAdCampaignItem, IAdCampaignProps } from './CardAdCampaign';
import { getStatusColorClass, formatCampaignDetailData } from '@/utils/CampaignFormat';

const CardAdCampaignRow = ({
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
  const [slotModalOpen, setSlotModalOpen] = useState(false);
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
      <div className="card p-5 lg:p-7.5">
        <div className="flex items-center flex-wrap justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-[50px]">
              <img
                src={logo && logo.includes('http') ? logo : (logo.startsWith('/media') ? toAbsoluteUrl(logo) : toAbsoluteUrl(`/media/animal/svg/${logo}`))}
                className={`size-[${logoSize}] shrink-0`}
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/lion.svg');
                }}
              />
            </div>

            <div className="">
              <div className="flex items-center gap-2 mb-1">
                <a href={url} className="text-lg font-medium text-gray-900 hover:text-primary">
                  {title}
                </a>
                <span className={`badge ${status.variant} badge-outline rounded-[30px] h-auto py-1`}>
                  <span className={`size-1.5 rounded-full bg-${getStatusColorClass(status.variant)} me-1.5`}></span>
                  {status.label}
                </span>
              </div>

              <div className="flex text-sm text-gray-700 items-center" style={{ height: '3rem' }}>
                {/* 3줄 이상인 경우와 2줄 이하인 경우 다르게 처리 */}
                {(description.split('\n').length > 2 || description.length > 80) ? (
                  /* 3줄 이상인 경우: 2줄만 표시 + ... */
                  <div className="h-[3rem] relative w-full">
                    <div className="h-[3rem] overflow-hidden" style={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.5rem'
                    }}>
                      {description}
                    </div>
                    <div className="absolute bottom-0 left-0">...</div>
                  </div>
                ) : (
                  /* 2줄 이하인 경우: 세로 중앙 정렬 */
                  <div className="flex items-center h-full w-full" style={{ 
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5rem'
                  }}>
                    {description}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap justify-between gap-5 lg:gap-12">
            <div className="flex items-center flex-wrap gap-2 lg:gap-5">
              {statistics.map((statistic, index) => {
                return renderItem(statistic, index);
              })}
            </div>

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

export { CardAdCampaignRow };