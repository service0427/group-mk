import { toAbsoluteUrl } from './Assets';

/**
 * 캠페인 데이터 인터페이스
 */
export interface CampaignData {
  id: string | number;
  campaign_name: string;
  description?: string;
  logo?: string;
  efficiency?: string | number;
  min_quantity?: string | number;
  deadline?: string;
  unit_price?: string | number;
  additional_logic?: string | number;
  status: string;
  add_info?: {
    logo_url?: string;
    banner_url?: string;
    [key: string]: any;
  };
}

/**
 * 포맷된 캠페인 데이터 인터페이스
 */
export interface FormattedCampaignData {
  logo: string;
  logoSize?: string; // 옵셔널로 변경
  title: string;
  description: string;
  status: {
    variant: string;
    label: string;
  };
  statistics: Array<{ 
    total: string; 
    description: string;
  }>;
  progress?: { // 옵셔널로 변경
    variant: string;
    value: number;
  };
}

/**
 * 캠페인 상세정보 인터페이스
 */
export interface CampaignDetailData {
  id: string;
  campaignName: string;
  description: string;
  logo: string;
  efficiency: string;
  minQuantity: string;
  deadline: string;
  unitPrice: string;
  additionalLogic: string;
  detailedDescription?: string;
  bannerUrl?: string; // 배너 이미지 URL
  originalData?: any; // 원본 데이터
  status: {
    label: string;
    color: string;
  };
}

/**
 * 상태값에 따른 배지 클래스 반환
 */
export const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'active': return 'badge-success';
    case 'pause': return 'badge-warning';
    case 'pending': return 'badge-info';
    case 'waiting_approval': return 'badge-primary'; // 승인 대기중
    case 'completed': return 'badge-primary';
    case 'rejected': return 'badge-danger';
    default: return 'badge-gray-300';
  }
};

/**
 * 상태값에 따른 표시 텍스트 반환
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active': return '진행중';
    case 'pause': return '표시안함';
    case 'pending': return '준비중';
    case 'waiting_approval': return '승인 대기중';
    case 'completed': return '완료됨';
    case 'rejected': return '반려됨';
    default: return '준비중';
  }
};

/**
 * 상태값에 따른 배지 색상 클래스 반환
 */
export const getStatusColorClass = (variant: string): string => {
  switch (variant) {
    case 'badge-success': return 'success';
    case 'badge-warning': return 'warning';
    case 'badge-info': return 'info';
    case 'badge-primary': return 'primary';
    case 'badge-danger': return 'danger';
    default: return 'gray-300';
  }
};

/**
 * 단위가 없는 값에 단위 추가
 */
export const addUnit = (value: string | number | undefined, unit: string): string => {
  if (value === undefined || value === null) return '-';
  
  const stringValue = String(value);
  if (stringValue === '-') return '-';
  if (stringValue.includes(unit)) return stringValue;
  return `${stringValue}${unit}`;
};

/**
 * 동물 이름과 아이콘을 매핑하는 객체
 */
export const animalNameMap: Record<string, string> = {
  // 한글 동물 이름
  '곰': 'bear',
  '고양이': 'cat',
  '소': 'cow',
  '악어': 'crocodile',
  '돌고래': 'dolphin',
  '코끼리': 'elephant',
  '플라밍고': 'flamingo',
  '기린': 'giraffe',
  '말': 'horse',
  '캥거루': 'kangaroo',
  '코알라': 'koala',
  '표범': 'leopard',
  '사자': 'lion',
  '라마': 'llama',
  '올빼미': 'owl',
  '펠리컨': 'pelican',
  '펭귄': 'penguin',
  '양': 'sheep',
  '테디베어': 'teddy-bear',
  '거북이': 'turtle',

  // 영어 동물 이름
  'bear': 'bear',
  'cat': 'cat',
  'cow': 'cow',
  'crocodile': 'crocodile',
  'dolphin': 'dolphin',
  'elephant': 'elephant',
  'flamingo': 'flamingo',
  'giraffe': 'giraffe',
  'horse': 'horse',
  'kangaroo': 'kangaroo',
  'koala': 'koala',
  'leopard': 'leopard',
  'lion': 'lion',
  'llama': 'llama',
  'owl': 'owl',
  'pelican': 'pelican',
  'penguin': 'penguin',
  'sheep': 'sheep',
  'teddy-bear': 'teddy-bear',
  'teddy': 'teddy-bear',
  'turtle': 'turtle',
};

/**
 * 동물 아이콘 목록
 */
export const animalIcons = [
  'bear', 'cat', 'cow', 'crocodile', 'dolphin', 'elephant', 'flamingo',
  'giraffe', 'horse', 'kangaroo', 'koala', 'leopard', 'lion', 'llama',
  'owl', 'pelican', 'penguin', 'sheep', 'teddy-bear', 'turtle'
];

/**
 * 캠페인 이름에서 동물 아이콘 추출
 */
export const getAnimalIconFromName = (name: string): string | null => {
  if (!name) return null;

  // 캠페인 이름에서 동물 이름을 찾아서 매핑된 아이콘 반환
  const lowerName = name.toLowerCase();

  // 1. 정확한 일치: 이름이 정확히 동물 이름과 일치하는 경우 (공백 제외)
  for (const [animalName, iconName] of Object.entries(animalNameMap)) {
    const normalizedName = lowerName.replace(/\s+/g, '');
    const normalizedAnimal = animalName.toLowerCase().replace(/\s+/g, '');

    if (normalizedName === normalizedAnimal) {
      return iconName;
    }
  }

  // 2. 명시적 선택: 이름이 "cat 선택" 또는 "고양이 선택" 형태인 경우
  for (const [animalName, iconName] of Object.entries(animalNameMap)) {
    if (lowerName.includes(`${animalName.toLowerCase()} 선택`) ||
        lowerName.includes(`selected ${animalName.toLowerCase()}`)) {
      return iconName;
    }
  }

  // 3. 길이가 긴 동물 이름부터 검사: 더 구체적인 이름이 우선하도록
  const sortedEntries = Object.entries(animalNameMap)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [animalName, iconName] of sortedEntries) {
    if (lowerName.includes(animalName.toLowerCase())) {
      return iconName;
    }
  }

  return null;
};

/**
 * 이미지 URL 포맷팅
 */
export const formatImageUrl = (logo: string | undefined, addInfo?: any, campaignName?: string): string => {
  // 1. add_info.logo_url이 있으면 그것을 사용 (업로드된 이미지)
  if (addInfo?.logo_url) {
    return addInfo.logo_url;
  }

  // 2. 로고가 명시적으로 선택된 경우 (드롭다운에서 선택한 동물)
  if (logo) {
    // 로고가 이미 URL인 경우 그대로 반환
    if (logo.includes('http')) {
      return logo;
    }

    // 로고가 동물 이름(예: 'cat', 'giraffe')인 경우
    if (animalIcons.includes(logo)) {
      return toAbsoluteUrl(`/media/animal/svg/${logo}.svg`);
    }

    // 로고가 media 경로부터 시작하는 경우
    if (logo.startsWith('/media')) {
      return toAbsoluteUrl(logo);
    }

    // 로고가 경로를 포함하는 경우 (예: 'animal/svg/cat.svg')
    if (logo.includes('.svg') || logo.includes('.png')) {
      // 경로에서 동물 이름 추출 시도
      let animalName = null;
      if (logo.includes('animal/svg/') || logo.includes('animal\\svg\\')) {
        // animal/svg/cat.svg 또는 animal\svg\cat.svg 형태에서 animal 이름 추출
        const segments = logo.split(/[\/\\]/); // 슬래시나 백슬래시로 분할
        for (let i = 0; i < segments.length; i++) {
          if (segments[i] === 'svg' && i + 1 < segments.length) {
            animalName = segments[i + 1].split('.')[0]; // .svg 확장자 제거
            break;
          }
        }
      }

      // 추출된 동물 이름이 있고 유효한 동물 아이콘인 경우
      if (animalName && animalIcons.includes(animalName)) {
        return toAbsoluteUrl(`/media/animal/svg/${animalName}.svg`);
      }

      return toAbsoluteUrl(`/media/${logo}`);
    }

    // 그 외의 경우, /media/animal/svg/ 폴더에서 찾음
    return toAbsoluteUrl(`/media/animal/svg/${logo}.svg`);
  }

  // 3. 캠페인 이름에서 동물 아이콘 추출 (이름 기반 자동 선택) - logo 필드가 없거나 기본값인 경우에만
  // logo 필드가 유효한 값이라면 이미 위에서 처리되었으므로 여기로 오지 않음
  if (campaignName) {
    const animalFromName = getAnimalIconFromName(campaignName);
    if (animalFromName) {
      return toAbsoluteUrl(`/media/animal/svg/${animalFromName}.svg`);
    }
  }

  // 4. 기본 이미지 사용
  return toAbsoluteUrl('/media/animal/svg/lion.svg');
};

// 사용 가능한 프로그레스 바 색상 정의
const PROGRESS_VARIANTS = [
  'progress-primary',
  'progress-success',
  'progress-info',
  'progress-warning',
  'progress-danger'
];

/**
 * 상태와 인덱스에 따라 프로그레스 바 색상 반환
 */
export const getProgressVariant = (status: string, index: number): string => {
  // 준비중 상태면 회색 프로그레스 바 반환
  if (status === 'pending') {
    return 'progress-gray-300'; // 회색 프로그레스 바
  }
  
  // 반려됨 상태면 연한 빨간색 프로그레스 바 반환
  if (status === 'rejected') {
    return 'progress-danger-light';
  }
  
  // 그 외 상태는 다양한 색상 순환 사용
  const variantIndex = index % PROGRESS_VARIANTS.length;
  return PROGRESS_VARIANTS[variantIndex];
};

/**
 * 캠페인 데이터를 화면에 표시할 형식으로 변환
 */
export const formatCampaignData = (campaign: CampaignData, index: number = 0): FormattedCampaignData => {
  // 기본 통계 항목 배열 생성
  const statistics = [
    {
      total: addUnit(campaign.efficiency, '%'),
      description: '🚀상승효율'
    },
    {
      total: addUnit(campaign.unit_price, '원'),
      description: '💰건당단가'
    },
    {
      total: addUnit(campaign.min_quantity, '개'),
      description: '🧺최소수량'
    },
    {
      total: campaign.deadline || '22:00',
      description: '⏱️접수마감'
    }
  ];
  
  // 추가로직이 0이 아닌 경우에만 통계 항목에 추가
  if (campaign.additional_logic && 
      Number(campaign.additional_logic) !== 0 && 
      campaign.additional_logic !== '0' && 
      campaign.additional_logic !== '-') {
    statistics.splice(2, 0, {
      total: addUnit(campaign.additional_logic, '개'),
      description: '📌추가로직'
    });
  }

  // 로고 경로 우선순위: 1. 업로드된 로고 -> 2. logo 필드 -> 3. 이름에서 추출 -> 4. 기본값

  // 로고 선택 로직
  let logoPath;

  // 1. 업로드된 로고 (add_info.logo_url)
  if (campaign.add_info?.logo_url) {
    logoPath = campaign.add_info.logo_url;
  }
  // 2. logo 필드가 있는 경우 (직접 선택된 동물 아이콘)
  else if (campaign.logo) {
    // logo가 동물 이름인 경우
    if (animalIcons.includes(campaign.logo)) {
      logoPath = `/media/animal/svg/${campaign.logo}.svg`;
    }
    // logo가 경로인 경우
    else {
      // 경로 문자열을 정확하게 처리
      const logoValue = campaign.logo;

      // 경로에서 동물 이름 추출 시도
      let animalName = null;
      if (logoValue.includes('animal/svg/') || logoValue.includes('animal\\svg\\')) {
        // animal/svg/cat.svg 또는 animal\svg\cat.svg 형태에서 animal 이름 추출
        const segments = logoValue.split(/[\/\\]/); // 슬래시나 백슬래시로 분할
        for (let i = 0; i < segments.length; i++) {
          if (segments[i] === 'svg' && i + 1 < segments.length) {
            animalName = segments[i + 1].split('.')[0]; // .svg 확장자 제거
            break;
          }
        }
      }

      // 추출된 동물 이름이 있고 유효한 동물 아이콘인 경우
      if (animalName && animalIcons.includes(animalName)) {
        logoPath = `/media/animal/svg/${animalName}.svg`;
      }
      // 그렇지 않으면 원래 경로 사용
      else {
        logoPath = logoValue.startsWith('/media') ? logoValue : `/media/${logoValue}`;
      }
    }
  }
  // 3. 캠페인 이름에서 동물 아이콘 추출
  else {
    const animalFromName = getAnimalIconFromName(campaign.campaign_name);
    if (animalFromName) {
      logoPath = `/media/animal/svg/${animalFromName}.svg`;
    }
    // 4. 기본값
    else {
      logoPath = '/media/animal/svg/lion.svg';
    }
  }

  return {
    logo: logoPath,
    logoSize: '50px',
    title: campaign.campaign_name,
    description: campaign.description?.replace(/\\n/g, '\n') || '',
    status: {
      variant: getStatusBadgeClass(campaign.status),
      label: getStatusLabel(campaign.status)
    },
    statistics: statistics,
    progress: {
      variant: getProgressVariant(campaign.status, index),
      value: 100
    }
  };
};

/**
 * 캠페인 데이터를 상세보기 모달 형식으로 변환
 */
export const formatCampaignDetailData = (campaign: FormattedCampaignData, originalData?: any): CampaignDetailData => {
  // 추가로직 정보 가져오기
  const additionalLogic = campaign.statistics.find(stat => stat.description.includes('추가로직'));
  
  // 배너 URL 추출
  const bannerUrl = originalData?.add_info?.banner_url || null;
  
  return {
    id: originalData?.id || "",
    campaignName: campaign.title,
    description: campaign.description,
    logo: campaign.logo,
    efficiency: campaign.statistics.find(stat => stat.description.includes('상승효율'))?.total || '0%',
    minQuantity: campaign.statistics.find(stat => stat.description.includes('최소수량'))?.total || '0개',
    deadline: campaign.statistics.find(stat => stat.description.includes('접수마감'))?.total || '-',
    unitPrice: campaign.statistics.find(stat => stat.description.includes('건당단가'))?.total || '0원',
    // 추가로직이 있는 경우에만 값 설정
    additionalLogic: additionalLogic ? additionalLogic.total : '없음',
    // 상세 설명 추가
    detailedDescription: campaign.description,
    // 배너 URL 추가
    bannerUrl: bannerUrl,
    // 원본 데이터 추가
    originalData: originalData,
    status: {
      label: campaign.status.label,
      color: campaign.status.variant
    }
  };
};