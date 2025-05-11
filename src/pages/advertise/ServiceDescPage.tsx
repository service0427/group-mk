import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { DescTemplate } from './components';
import { getServiceData, ServiceData } from '@/data/advertiseServices';
import { CommonTemplate } from '@/components/pageTemplate';

const ServiceDescPage: React.FC = () => {
  const { platform, subservice, type } = useParams<{
    platform: string;
    subservice?: string;
    type: string;
  }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // 직접 경로 '/advertise/ntraffic/desc' 처리
      if (pathname === '/advertise/ntraffic/desc') {
        const data = getServiceData('ntraffic', 'desc');
        if (data) {
          setServiceData(data);
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

      const data = getServiceData(platform, type, subservice);

      if (!data) {
        setError('서비스 데이터를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      setServiceData(data);
      setLoading(false);
    } catch (err) {
      // TODO: 오류시 경우 파라미터를 직접하여 변경할 것

      setError('서비스 정보를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [platform, subservice, type, pathname]);

  // 캠페인 페이지 경로 생성
  const getCampaignPath = (): string => {
    // 직접 경로 '/advertise/ntraffic/desc' 처리
    if (pathname === '/advertise/ntraffic/desc') {
      return '/advertise/ntraffic/campaign';
    }

    // 일반 동적 라우트 처리
    if (subservice) {
      return `/advertise/${platform}/${subservice}/${type}/campaign`;
    }
    return `/advertise/${platform}/${type}/campaign`;
  };

  if (loading) {
    return (
      <CommonTemplate>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </CommonTemplate>
    );
  }

  if (error || !serviceData) {
    return (
      <CommonTemplate title="오류 발생">
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
      </CommonTemplate>
    );
  }

  // DescTemplate 내부에서는 이미 CommonTemplate과 유사한 구조를 사용하고 있으므로,
  // 여기에서는 그대로 사용하고, 필요에 따라 DescTemplate 자체를 나중에 수정합니다.
  return <DescTemplate serviceData={serviceData} campaignPath={getCampaignPath()} />;
};

export { ServiceDescPage };