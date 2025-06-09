import { ServiceType } from '@/types/service.types';

// 서비스 타입과 이름 매핑
export const SERVICE_TYPE_MAP: Record<string, { type: ServiceType; name: string }> = {
  'naver-shopping': { type: 'NAVER_PLACE', name: '네이버 쇼핑' }, // 추후 NAVER_SHOPPING으로 변경 필요
  'naver-place': { type: 'NAVER_PLACE', name: '네이버 플레이스' },
  'naver-blog': { type: 'NAVER_BLOG', name: '네이버 블로그' },
  'naver-kin': { type: 'NAVER_KIN', name: '네이버 지식인' },
  'naver-cafe': { type: 'NAVER_CAFE', name: '네이버 카페' },
  'instagram': { type: 'INSTAGRAM', name: '인스타그램' },
  'youtube': { type: 'YOUTUBE', name: '유튜브' },
  'tiktok': { type: 'TIKTOK', name: '틱톡' },
};

// 서비스 효과 모달 onClick 핸들러 생성
export const createServiceEffectHandler = (
  serviceKey: string,
  openModal: (serviceType: ServiceType, serviceName: string) => void
) => {
  return () => {
    const serviceInfo = SERVICE_TYPE_MAP[serviceKey];
    if (serviceInfo) {
      openModal(serviceInfo.type, serviceInfo.name);
    }
  };
};