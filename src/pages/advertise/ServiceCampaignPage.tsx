import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getCampaignData, CampaignData } from '@/data/advertiseServices';
import { CommonTemplate } from '@/components/pageTemplate';
import { CampaignTemplate } from './components';

const ServiceCampaignPage: React.FC = () => {
  const { platform, subservice, type } = useParams<{
    platform: string;
    subservice?: string;
    type: string;
  }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // 직접 경로 '/advertise/ntraffic/campaign' 처리
      if (pathname === '/advertise/ntraffic/campaign') {
        const data = getCampaignData('ntraffic', 'campaign');
        if (data) {
          setCampaignData(data);
          setLoading(false);
          return;
        }
      }

      // 일반적인 동적 라우트 처리
      if (!platform || !type) {
        setError('필수 파라미터가 없습니다.');
        setLoading(false);
        return;
      }

      const data = getCampaignData(platform, type, subservice);

      if (!data) {
        setError('캠페인 데이터를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setCampaignData(data);
      setLoading(false);
    } catch (err) {
      // TODO: 오류시 경우 파라미터를 직접하여 변경할 것
      console.error('캠페인 정보 로드 오류:', err);
      setError('캠페인 정보를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [platform, subservice, type, pathname]);

  // 소개 페이지 경로 로직 제거

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

  // CampaignTemplate 내부에서는 이미 CommonTemplate과 유사한 구조를 사용하고 있으므로,
  // 여기에서는 그대로 사용하고, 필요에 따라 CampaignTemplate 자체를 나중에 수정합니다.
  return <CampaignTemplate campaignData={campaignData} />;
};

export { ServiceCampaignPage };