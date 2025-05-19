import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IntroTemplate } from './campaigns/components';
import { getServiceData, ServiceData } from '@/data/advertiseServices';

const ServiceIntroPage: React.FC = () => {
  const { platform, subservice, type } = useParams<{
    platform: string;
    subservice?: string;
    type: string;
  }>();
  const navigate = useNavigate();
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 첫 번째 useEffect는 구형 URL에서 신규 URL로 리다이렉트
  useEffect(() => {
    // 구형 URL 구조에서 신규 URL 구조로 리다이렉트
    if (platform && type) {
      // 새로운 URL 구조로 리다이렉트
      const newPath = subservice 
        ? `/advertise/campaigns/info/${platform}-${subservice}-${type}`
        : `/advertise/campaigns/info/${platform}-${type}`;
      
      navigate(newPath, { replace: true });
      return;
    }
  }, [platform, subservice, type, navigate]);

  // 두 번째 useEffect는 데이터 로딩 처리
  useEffect(() => {
    if (!platform || !type) {
      setError('필수 파라미터가 없습니다.');
      setLoading(false);
      return;
    }

    try {
      const data = getServiceData(platform, type, subservice);

      if (!data) {
        setError('서비스 데이터를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setServiceData(data);
      setLoading(false);
    } catch (err) {
      setError('서비스 정보를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [platform, subservice, type]);

  // 캠페인 페이지 경로 생성 - 새로운 URL 구조 적용
  const getCampaignPath = (): string => {
    // 새로운 URL 구조로 변환
    if (subservice) {
      return `/advertise/campaigns/my/${platform}-${subservice}-${type}`;
    }
    return `/advertise/campaigns/my/${platform}-${type}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !serviceData) {
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

  return <IntroTemplate serviceData={serviceData} campaignPath={getCampaignPath()} />;
};

export { ServiceIntroPage };