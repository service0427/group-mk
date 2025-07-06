import { KeenIcon } from '@/components';
import { useState, useEffect } from 'react';
import { toAbsoluteUrl } from '@/utils/Assets';
import { useNavigate } from 'react-router-dom';
import { CampaignDetailViewModal, CampaignSlotWithKeywordModal } from '@/components/campaign-modals';
import { IAdCampaignItem, IAdCampaignProps } from './CardAdCampaign';
import { getStatusColorClass, formatCampaignDetailData } from '@/utils/CampaignFormat';
import { useAuthContext } from '@/auth';
import { USER_ROLES } from '@/config/roles.config';
import { supabase } from '@/supabase';

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
  const [ownerInfo, setOwnerInfo] = useState<{ name: string; mat_id: string; email: string } | null>(null);

  // 사용자 역할 가져오기
  const { userRole } = useAuthContext();

  // 보장형 여부 확인
  const isGuaranteeType = rawData?.slot_type === 'guarantee';
  // 단건형 여부 확인
  const isPerUnitType = rawData?.slot_type === 'per-unit';

  // 운영자/개발자 권한일 때 캠페인 소유자 정보 가져오기
  useEffect(() => {
    const fetchOwnerInfo = async () => {
      if ((userRole === USER_ROLES.OPERATOR || userRole === USER_ROLES.DEVELOPER) && rawData?.mat_id) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id, email, full_name')
            .eq('id', rawData.mat_id)
            .single();

          if (data && !error) {
            setOwnerInfo({
              mat_id: data.id,
              name: data.full_name || '이름 없음',
              email: data.email || '이메일 없음'
            });
          }
        } catch (error) {
          console.error('Failed to fetch owner info:', error);
        }
      }
    };

    fetchOwnerInfo();
  }, [userRole, rawData?.mat_id]);

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
    // 환불 설정 추가
    refundSettings: rawData?.refundSettings || rawData?.refund_settings,
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
                <button 
                  onClick={() => setModalOpen(true)}
                  className="text-lg font-medium text-gray-900 hover:text-primary text-left"
                >
                  {title}
                </button>
                {/* 서비스 타입 배지 */}
                <span className={`badge ${isGuaranteeType
                    ? 'badge-info'
                    : isPerUnitType
                    ? 'badge-warning'
                    : 'badge-primary'
                  } badge-outline rounded-[30px] h-auto py-0.5 px-2`}>
                  <KeenIcon icon={isGuaranteeType ? 'shield-tick' : isPerUnitType ? 'package' : 'element-11'} className="size-3 me-1" />
                  {isGuaranteeType ? '보장형' : isPerUnitType ? '단건형' : '일반형'}
                </span>

                <span className={`badge ${status.variant} badge-outline rounded-[30px] h-auto py-1`}>
                  <span className={`size-1.5 rounded-full bg-${getStatusColorClass(status.variant)} me-1.5`}></span>
                  {status.label}
                </span>
              </div>

              <div className="flex flex-col">
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
                {/* 운영자/개발자 권한일 때 캠페인 소유자 정보 표시 */}
                {(userRole === USER_ROLES.OPERATOR || userRole === USER_ROLES.DEVELOPER) && ownerInfo && (
                  <div className="text-xs text-muted-foreground mt-1">
                    판매자: {ownerInfo.name} ({ownerInfo.email})
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap justify-between gap-5 lg:gap-12">
            <div className="flex items-center flex-wrap gap-2 lg:gap-5">
              {statistics.map((statistic, index) => {
                // 단건형인 경우 건당단가를 단건단가로 표시
                if (isPerUnitType && statistic.description.includes('건당단가')) {
                  return (
                    <div
                      key={index}
                      className="flex flex-col gap-1.5 border border-dashed border-gray-300 rounded-md px-2.5 py-2"
                    >
                      <span className="text-gray-900 text-sm leading-none font-medium">
                        {statistic.total}
                      </span>
                      <span className="text-gray-700 text-xs">📦단건단가</span>
                    </div>
                  );
                }

                // 보장형인 경우 건당단가를 가격범위로 표시
                if (isGuaranteeType && statistic.description.includes('건당단가')) {
                  const minPrice = rawData?.min_guarantee_price;
                  const maxPrice = rawData?.max_guarantee_price;

                  if (minPrice && maxPrice) {
                    const formatPrice = (price: number) => {
                      if (price >= 100000000) {
                        const billions = price / 100000000;
                        return billions % 1 === 0 ? `${billions}억` : `${billions.toFixed(1)}억`;
                      } else if (price >= 10000000) {
                        const tenMillions = price / 10000000;
                        return tenMillions % 1 === 0 ? `${tenMillions}천만` : `${tenMillions.toFixed(1)}천만`;
                      } else if (price >= 10000) {
                        const tenThousands = price / 10000;
                        return tenThousands % 1 === 0 ? `${tenThousands}만` : `${tenThousands.toFixed(1)}만`;
                      }
                      return price.toLocaleString();
                    };

                    return (
                      <div
                        key={index}
                        className="flex flex-col gap-1.5 border border-dashed border-gray-300 rounded-md px-2.5 py-2"
                      >
                        <span className="text-gray-900 text-xs leading-none font-medium">
                          {formatPrice(Number(minPrice))}~{formatPrice(Number(maxPrice))}원
                        </span>
                        <span className="text-gray-700 text-xs">💎가격범위</span>
                      </div>
                    );
                  }
                }

                // 단건형인 경우 최소수량을 최소단건수로 표시
                if (isPerUnitType && statistic.description.includes('최소수량')) {
                  return (
                    <div
                      key={index}
                      className="flex flex-col gap-1.5 border border-dashed border-gray-300 rounded-md px-2.5 py-2"
                    >
                      <span className="text-gray-900 text-sm leading-none font-medium">
                        {statistic.total}
                      </span>
                      <span className="text-gray-700 text-xs">📊최소단건수</span>
                    </div>
                  );
                }

                // 보장형인 경우 최소수량을 보장으로 표시
                if (isGuaranteeType && statistic.description.includes('최소수량')) {
                  const guaranteeCount = rawData?.guarantee_count;
                  const guaranteeUnit = rawData?.guarantee_unit || '일';

                  return (
                    <div
                      key={index}
                      className="flex flex-col gap-1.5 border border-dashed border-gray-300 rounded-md px-2.5 py-2"
                    >
                      <span className="text-gray-900 text-sm leading-none font-medium">
                        {guaranteeCount ? `${guaranteeCount}${guaranteeUnit}` : '-'}
                      </span>
                      <span className="text-gray-700 text-xs">🛡️{guaranteeUnit === '일' ? '보장일수' : '보장횟수'}</span>
                    </div>
                  );
                }

                // 접수마감 시간 처리 - 자정인 경우 특별 표시
                if (statistic.description.includes('접수마감')) {
                  const deadlineTime = statistic.total;
                  return (
                    <div
                      key={index}
                      className="flex flex-col gap-1.5 border border-dashed border-gray-300 rounded-md px-2.5 py-2"
                    >
                      <span className="text-gray-900 text-sm leading-none font-medium">
                        {deadlineTime}
                        {deadlineTime === '00:00' && <span className="text-xs text-amber-600 ml-1">(자정)</span>}
                      </span>
                      <span className="text-gray-700 text-xs">{statistic.description}</span>
                    </div>
                  );
                }

                return renderItem(statistic, index);
              })}
            </div>

            <div className="flex gap-2">
              <button
                className="btn btn-sm btn-info"
                onClick={() => setModalOpen(true)}
              >
                <KeenIcon icon="eye" className="me-0 sm:me-1.5" />
                <span className="hidden sm:inline">상세보기</span>
              </button>

              {/* 총판 또는 운영자 역할이 아닌 경우에만 구매하기 버튼 표시 */}
              {userRole !== USER_ROLES.DISTRIBUTOR && userRole !== USER_ROLES.OPERATOR && (
                <button
                  className={`btn btn-sm ${isGuaranteeType || isPerUnitType
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0'}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSlotModalOpen(true);
                  }}
                >
                  <KeenIcon icon={(isGuaranteeType || isPerUnitType) ? "message-text" : "purchase"} className="me-0 sm:me-1.5" />
                  <span className="hidden sm:inline">{(isGuaranteeType || isPerUnitType) ? '견적요청' : '구매하기'}</span>
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
          service_type: serviceTypeCode || 'NaverTraffic', // 전달받은 서비스 타입 코드 사용
          slot_type: rawData?.slot_type // 보장형 여부 전달
        }}
        serviceCode={serviceTypeCode || 'NaverTraffic'} // 전달받은 서비스 타입 코드 사용
      />
    </>
  );
};

export { CardAdCampaignRow };