import { KeenIcon } from '@/components';
import { useState } from 'react';
import { toAbsoluteUrl } from '@/utils/Assets';
import { CampaignDetailViewModal } from '@/pages/advertise/components';
import { IAdCampaignItem, IAdCampaignProps } from './CardAdCampaign';

const CardAdCampaignRow = ({
  logo,
  logoSize,
  title,
  description,
  status,
  statistics,
  url
}: IAdCampaignProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  
  // 모달에 표시할 캠페인 데이터 객체
  const campaignData = {
    id: "", // ID 표시하지 않음
    campaignName: title,
    description: description,
    logo: logo,
    efficiency: `${statistics.find(stat => stat.description.includes('효율'))?.total || '0'}%`,
    minQuantity: `${statistics.find(stat => stat.description.includes('수량'))?.total || '0'}개`,
    deadline: statistics.find(stat => stat.description.includes('시간'))?.total || '-',
    status: {
      label: status.label,
      color: status.variant
    }
  };

  const renderItem = (statistic: IAdCampaignItem, index: number) => {
    // 설명에 따라 적절한 단위 추가
    let displayValue = statistic.total;
    if (statistic.description.includes('효율')) {
      displayValue = `${statistic.total}%`;
    } else if (statistic.description.includes('로직') || statistic.description.includes('수량')) {
      displayValue = `${statistic.total}개`;
    }

    return (
      <div
        key={index}
        className="flex flex-col gap-1.5 border border-dashed border-gray-300 rounded-md px-2.5 py-2"
      >
        <span className="text-gray-900 text-sm leading-none font-medium">{displayValue}</span>
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
                src={toAbsoluteUrl(`/media/animal/svg/${logo}`)}
                className={`size-[${logoSize}] shrink-0`}
                alt=""
              />
            </div>

            <div className="">
              <div className="flex items-center gap-2 mb-1">
                <a href={url} className="text-lg font-medium text-gray-900 hover:text-primary">
                  {title}
                </a>
                <span className={`badge ${status.variant} badge-outline`}>{status.label}</span>
              </div>

              <div className="flex items-center text-sm text-gray-700">{description}</div>
            </div>
          </div>

          <div className="flex items-center flex-wrap justify-between gap-5 lg:gap-12">
            <div className="flex items-center flex-wrap gap-2 lg:gap-5">
              {statistics.map((statistic, index) => {
                return renderItem(statistic, index);
              })}
            </div>

            <button 
              className="btn btn-sm btn-info"
              onClick={() => setModalOpen(true)}
            >
              <KeenIcon icon="eye" className="me-1.5" />
              상세보기
            </button>
          </div>
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

export { CardAdCampaignRow };
