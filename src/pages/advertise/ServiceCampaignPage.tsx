import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CampaignTemplate } from './components';
import { getCampaignData, CampaignData } from '@/data/advertiseServices';

const ServiceCampaignPage: React.FC = () => {
  const { platform, subservice, type } = useParams<{
    platform: string;
    subservice?: string;
    type: string;
  }>();
  const navigate = useNavigate();
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!platform || !type) {
      setError('필수 파라미터가 없습니다.');
      setLoading(false);
      return;
    }

    try {
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
  }, [platform, subservice, type]);

  // 소개 페이지 경로 생성
  const getIntroPath = (): string => {
    if (subservice) {
      return `/advertise/${platform}/${subservice}/${type}/intro`;
    }
    return `/advertise/${platform}/${type}/intro`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !campaignData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">오류 발생</h1>
        <p className="text-gray-600 mb-6">{error || '알 수 없는 오류가 발생했습니다.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return <CampaignTemplate campaignData={campaignData} introPath={getIntroPath()} />;
};

export { ServiceCampaignPage };