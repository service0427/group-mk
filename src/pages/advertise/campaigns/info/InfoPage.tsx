import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CampaignInfoTemplate } from '../components';
import { getServiceData, ServiceData } from '@/data/advertiseServices';
import { CommonTemplate } from '@/components/pageTemplate';
import { SERVICE_TYPE_TO_CATEGORY } from '../components/campaign-components';
import { useAuthContext } from '@/auth';
import { USER_ROLES, hasPermission, PERMISSION_GROUPS } from '@/config/roles.config';

const InfoPage: React.FC = () => {
  const { serviceType } = useParams<{
    serviceType: string;
  }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { userRole } = useAuthContext();
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 비기너가 접근 가능한 순위 확인 서비스
  const rankServices = ['naver-shopping-rank', 'naver-place-rank'];

  useEffect(() => {
    try {
      // URL 파라미터 처리
      if (!serviceType) {
        // 파라미터가 없는 경우 기본값 설정 (ex: naver-traffic)
        navigate('/advertise/campaigns/info/naver-traffic', { replace: true });
        return;
      }
      
      // 권한 체크: 비기너는 순위 확인 서비스만 접근 가능
      if (userRole === USER_ROLES.BEGINNER) {
        if (!rankServices.includes(serviceType)) {
          navigate('/error/404', { replace: true });
          return;
        }
      } else if (!hasPermission(userRole, PERMISSION_GROUPS.ADVERTISEMENT)) {
        // 비기너가 아닌데 광고주 권한도 없으면 접근 불가
        navigate('/error/404', { replace: true });
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

      // getServiceData 호출하여 데이터 가져오기
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
  }, [serviceType, pathname, navigate, userRole]);

  // 캠페인 페이지 경로 생성 (캠페인 소개 페이지 -> 내 서비스 페이지로 변환)
  const getCampaignPath = (): string => {
    // 현재 info 경로를 my 경로로 변경
    return `/advertise/campaigns/my/${serviceType}`;
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

  // 서비스 카테고리 생성
  let serviceCategory = '';
  if (serviceType) {
    // constants.tsx의 SERVICE_TYPE_TO_CATEGORY 매핑 사용
    serviceCategory = SERVICE_TYPE_TO_CATEGORY[serviceType] || serviceType.replace(/-/g, ' ');
  }

  // 서비스 타입에 맞는 title 생성
  const title = `${serviceCategory} 캠페인 소개`;

  // 서비스 타입에 맞는 description 생성
  const description = `서비스 > 캠페인 소개 > ${serviceCategory}`;

  // CommonTemplate으로 감싸서 DescTemplate 렌더링
  return (
    <CommonTemplate
      title={title}
      description={description}
      showPageMenu={false}
      showBreadcrumb={true}
    >
      <CampaignInfoTemplate serviceData={serviceData} campaignPath={getCampaignPath()} />
    </CommonTemplate>
  );
};

export { InfoPage };