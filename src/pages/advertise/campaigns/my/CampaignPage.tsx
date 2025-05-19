import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getCampaignData, CampaignData } from '@/data/advertiseServices';
import { CommonTemplate } from '@/components/pageTemplate';
import { CampaignTemplate } from '../components';
import { CampaignServiceType } from '@/components/campaign-modals/types';
import { CampaignSlotWithKeywordModal } from '@/components/campaign-modals';
import { KeenIcon } from '@/components';

const CampaignPage: React.FC = () => {
  const { serviceType } = useParams<{
    serviceType: string;
  }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 모달 상태 관리 - 항상 동일한 순서로 모든 Hook 호출해야 함
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    try {
      // URL 파라미터 처리
      if (!serviceType) {
        // 파라미터가 없는 경우 기본값 설정 (ex: naver-traffic)
        navigate('/advertise/campaigns/my/naver-traffic', { replace: true });
        return;
      }

      // serviceType에서 platform, subservice, type 추출
      let platform: string;
      let subservice: string | undefined;
      let type: string;

      // URL 형식 분석 (naver-shopping-traffic, naver-auto, coupang-traffic 등)
      const parts = serviceType.split('-');

      if (parts.length === 3) {
        // naver-shopping-traffic 같은 형식
        platform = parts[0];
        subservice = parts[1];
        type = parts[2];
      } else if (parts.length === 2) {
        // naver-auto, coupang-traffic 같은 형식
        platform = parts[0];
        type = parts[1];
        subservice = undefined;
      } else {
        // 알 수 없는 형식
        setError('올바르지 않은 서비스 타입 형식입니다.');
        setLoading(false);
        return;
      }

      // getCampaignData 호출하여 데이터 가져오기
      const data = getCampaignData(platform, type, subservice);

      if (!data) {
        setError('캠페인 데이터를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setCampaignData(data);
      setLoading(false);
    } catch (err) {
      setError('캠페인 정보를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [serviceType, pathname, navigate]);

  if (loading) {
    return (
      <CommonTemplate>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
        </div>
      </CommonTemplate>
    );
  }

  if (error || !campaignData) {
    return (
      <CommonTemplate title="오류 발생">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">오류 발생</h1>
          <p className="text-muted-foreground mb-6">{error || '알 수 없는 오류가 발생했습니다.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            홈으로 돌아가기
          </button>
        </div>
      </CommonTemplate>
    );
  }

  // 서비스 카테고리 생성
  let serviceCategory = '';

  if (serviceType) {
    // URL 형식 분석 (naver-shopping-traffic, naver-auto, coupang-traffic 등)
    if (serviceType === 'naver-shopping-traffic') {
      serviceCategory = 'NS 트래픽';
    } else if (serviceType === 'naver-place-save') {
      serviceCategory = 'NP 저장';
    } else if (serviceType === 'naver-place-share') {
      serviceCategory = 'NP 공유';
    } else if (serviceType === 'naver-place-traffic') {
      serviceCategory = 'NP 트래픽';
    } else if (serviceType === 'naver-auto') {
      serviceCategory = 'N 자동완성';
    } else if (serviceType === 'naver-traffic') {
      serviceCategory = 'N 트래픽';
    } else if (serviceType === 'coupang-traffic') {
      serviceCategory = 'CP 트래픽';
    } else if (serviceType === 'ohouse-traffic') {
      serviceCategory = 'OH 트래픽';
    } else {
      // 알 수 없는 형식인 경우 그대로 표시
      serviceCategory = serviceType.replace(/-/g, ' ');
    }
  }

  // 툴바 액션 버튼 정의
  const toolbarActions = (
    <>
      <button className="btn btn-sm btn-light"
        onClick={() => setModalOpen(true)}
      >
        <span className="hidden md:inline">추가</span>
        <span className="md:hidden"><KeenIcon icon="plus" /></span>
      </button>
      <a href="#" className="hidden md:inline-flex btn btn-sm btn-light">
        양식 엑셀 다운로드
      </a>
      <a href="#" className="hidden md:inline-flex btn btn-sm btn-primary">
        엑셀 업로드
      </a>
    </>
  );

  // 서비스 타입에 맞는 title 생성
  const title = `${serviceCategory} 캠페인 관리`;

  // 서비스 타입에 맞는 description 생성
  const description = `내 정보 관리 > 내 서비스 관리 > ${serviceCategory}`;

  // CommonTemplate으로 감싸서 CampaignTemplate 렌더링
  return (
    <>
      <CommonTemplate
        title={title}
        description={description}
        showPageMenu={false}
        showBreadcrumb={true}
        toolbarActions={toolbarActions}
      >
        <CampaignTemplate campaignData={campaignData} />
      </CommonTemplate>

      {/* 슬롯 추가 모달 */}
      <CampaignSlotWithKeywordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        category={serviceCategory}
        campaign={campaignData?.campaigns?.length > 0 ? {
          id: campaignData.campaigns[0]?.id || '',
          campaign_name: campaignData.campaigns[0]?.name || '',
          status: campaignData.campaigns[0]?.status || '',
          service_type: serviceType
        } : null}
        serviceCode={serviceType}
      />
    </>
  );
};

export { CampaignPage };