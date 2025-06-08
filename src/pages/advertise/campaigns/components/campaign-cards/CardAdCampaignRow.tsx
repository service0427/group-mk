import { KeenIcon } from '@/components';
import { useState } from 'react';
import { toAbsoluteUrl } from '@/utils/Assets';
import { useNavigate } from 'react-router-dom';
import { CampaignDetailViewModal, CampaignSlotWithKeywordModal } from '@/components/campaign-modals';
import { IAdCampaignItem, IAdCampaignProps } from './CardAdCampaign';
import { getStatusColorClass, formatCampaignDetailData } from '@/utils/CampaignFormat';
import { useAuthContext } from '@/auth';
import { USER_ROLES } from '@/config/roles.config';

const CardAdCampaignRow = ({
  logo,
  logoSize = '50px', // 기본값 제공
  title,
  description,
  detailedDescription,
  status,
  statistics,
  progress = { variant: 'progress-primary', value: 100 }, // 기본값 제공
  url,
  rawId,  // 원본 데이터 ID
  rawData,  // 원본 데이터 전체
  serviceTypeCode  // 서비스 타입 코드
}: IAdCampaignProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const navigate = useNavigate();

  // 사용자 역할 가져오기
  const { userRole } = useAuthContext();

  // 이제 props로 받은 rawData와 ID만 사용
  // 원본 데이터는 더 이상 확인하지 않음, 모달에서 직접 조회

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
    // 상세 설명 전달 - 상세정보는 모달에서 직접 조회
    detailedDescription: detailedDescription || description,
    // 원본 데이터 전체를 originalData로 전달하여 모달에서 활용할 수 있게 함
    originalData: rawData,
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
      <div className="card p-5 lg:p-7.5">
        <div className="flex items-center flex-wrap justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-[50px]">
              <img
                src={logo && logo.includes('http') ? logo : toAbsoluteUrl(logo)}
                className={`size-[${logoSize}] shrink-0`}
                alt=""
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

              {/* 총판 또는 운영자 역할이 아닌 경우에만 구매하기 버튼 표시 */}
              {userRole !== USER_ROLES.DISTRIBUTOR && userRole !== USER_ROLES.OPERATOR && (
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 상세보기 모달 */}
      <CampaignDetailViewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        campaign={{
          ...campaignData,
          id: rawId || ""  // ID를 반드시 전달하여 상세 정보를 가져올 수 있도록 함
        }}
      />

      {/* 슬롯 추가 모달 */}
      <CampaignSlotWithKeywordModal
        open={slotModalOpen}
        onClose={() => setSlotModalOpen(false)}
        category={title}
        campaign={{
          id: rawId || 1, // 실제 ID 사용
          campaign_name: title,
          status: status.label,
          service_type: serviceTypeCode || 'NaverTraffic' // 전달받은 서비스 타입 코드 사용
        }}
        serviceCode={serviceTypeCode || 'NaverTraffic'} // 전달받은 서비스 타입 코드 사용
      />
    </>
  );
};

export { CardAdCampaignRow };