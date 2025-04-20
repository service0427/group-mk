import { ICampaign } from '../components/CampaignContent';

// 오늘의집 캠페인 데이터
export const ohouseData: ICampaign[] = [
  {
    id: 'lion-ohouse',
    campaignName: '라이언',
    description: '4가지 방식을 복합하여 진행하는 오늘의집 고급형 캠페인',
    logo: 'animal/svg/lion.svg',
    efficiency: '62%',
    minQuantity: '120개',
    deadline: '21:00',
    status: {
      label: '진행중',
      color: 'success'
    }
  },
  {
    id: 'crocodile-ohouse',
    campaignName: '크로커다일',
    description: '3가지 방식을 복합하여 진행하는 오늘의집 고급형 캠페인',
    logo: 'animal/svg/crocodile.svg',
    efficiency: '61%',
    minQuantity: '120개',
    deadline: '21:00',
    status: {
      label: '진행중',
      color: 'success'
    }
  },
  {
    id: 'flamingo-ohouse',
    campaignName: '플라밍고',
    description: '2가지 방식을 복합하여 진행하는 오늘의집 고급형 캠페인',
    logo: 'animal/svg/flamingo.svg',
    efficiency: '60%',
    minQuantity: '110개',
    deadline: '21:00',
    status: {
      label: '진행중',
      color: 'success'
    }
  },
  {
    id: 'leopard-ohouse',
    campaignName: '레오파드',
    description: '단일 방식으로 진행하는 오늘의집 프리미엄 캠페인',
    logo: 'animal/svg/leopard.svg',
    efficiency: '59%',
    minQuantity: '110개',
    deadline: '21:00',
    status: {
      label: '진행중',
      color: 'success'
    }
  },
  {
    id: 'bear-ohouse',
    campaignName: '베어',
    description: '단일 방식으로 진행하는 오늘의집 프리미엄 캠페인',
    logo: 'animal/svg/bear.svg',
    efficiency: '58%',
    minQuantity: '110개',
    deadline: '21:00',
    status: {
      label: '진행중',
      color: 'success'
    }
  },
  {
    id: 'llama-ohouse',
    campaignName: '라마',
    description: '단일 방식으로 진행하는 오늘의집 기본형 캠페인',
    logo: 'animal/svg/llama.svg',
    efficiency: '57%',
    minQuantity: '100개',
    deadline: '21:00',
    status: {
      label: '진행중',
      color: 'success'
    }
  },
  {
    id: 'teddy-bear-ohouse',
    campaignName: '테디베어',
    description: '단일 방식으로 진행하는 오늘의집 기본형 캠페인',
    logo: 'animal/svg/teddy-bear.svg',
    efficiency: '56%',
    minQuantity: '100개',
    deadline: '21:00',
    status: {
      label: '진행중',
      color: 'success'
    }
  },
  {
    id: 'dolphin-ohouse',
    campaignName: '돌핀',
    description: '단일 방식으로 진행하는 오늘의집 기본형 캠페인',
    logo: 'animal/svg/dolphin.svg',
    efficiency: '55%',
    minQuantity: '100개',
    deadline: '21:00',
    status: {
      label: '진행중',
      color: 'success'
    }
  },
  {
    id: 'owl-ohouse',
    campaignName: '올빼미',
    description: '고급 야간 특화 오늘의집 캠페인',
    logo: 'animal/svg/owl.svg',
    efficiency: '54%',
    minQuantity: '90개',
    deadline: '21:00',
    status: {
      label: '진행중',
      color: 'success'
    }
  },
  {
    id: 'penguin-ohouse',
    campaignName: '펭귄',
    description: '겨울 시즌 특별 기획 오늘의집 캠페인',
    logo: 'animal/svg/penguin.svg',
    efficiency: '53%',
    minQuantity: '90개',
    deadline: '21:00',
    status: {
      label: '진행중',
      color: 'success'
    }
  },
  {
    id: 'koala-ohouse',
    campaignName: '코알라',
    description: '인테리어 특화 오늘의집 캠페인',
    logo: 'animal/svg/koala.svg',
    efficiency: '52%',
    minQuantity: '90개',
    deadline: '21:00',
    status: {
      label: '진행중',
      color: 'success'
    }
  },
  {
    id: 'turtle-ohouse',
    campaignName: '터틀',
    description: '장기 지속형 오늘의집 캠페인',
    logo: 'animal/svg/turtle.svg',
    efficiency: '51%',
    minQuantity: '80개',
    deadline: '21:00',
    status: {
      label: '진행중',
      color: 'success'
    }
  },
  {
    id: 'horse-ohouse',
    campaignName: '호스',
    description: '신속 노출 특화 오늘의집 캠페인',
    logo: 'animal/svg/horse.svg',
    efficiency: '50%',
    minQuantity: '80개',
    deadline: '21:00',
    status: {
      label: '진행중',
      color: 'success'
    }
  },
  {
    id: 'cat-ohouse',
    campaignName: '캣',
    description: '반려동물 용품 특화 오늘의집 캠페인',
    logo: 'animal/svg/cat.svg',
    efficiency: '-%',
    minQuantity: '70개',
    deadline: '21:00',
    status: {
      label: '준비중',
      color: 'gray-300'
    }
  },
  {
    id: 'cow-ohouse',
    campaignName: '카우',
    description: '안정적인 대량 노출 오늘의집 캠페인',
    logo: 'animal/svg/cow.svg',
    efficiency: '-%',
    minQuantity: '70개',
    deadline: '21:00',
    status: {
      label: '준비중',
      color: 'gray-300'
    }
  },
  {
    id: 'elephant-ohouse',
    campaignName: '엘리펀트',
    description: '대규모 노출 특화 오늘의집 캠페인',
    logo: 'animal/svg/elephant.svg',
    efficiency: '-%',
    minQuantity: '70개',
    deadline: '21:00',
    status: {
      label: '준비중',
      color: 'gray-300'
    }
  },
  {
    id: 'giraffe-ohouse',
    campaignName: '지라프',
    description: '상위 노출 특화 오늘의집 캠페인',
    logo: 'animal/svg/giraffe.svg',
    efficiency: '-%',
    minQuantity: '60개',
    deadline: '21:00',
    status: {
      label: '준비중',
      color: 'gray-300'
    }
  },
  {
    id: 'kangaroo-ohouse',
    campaignName: '캥거루',
    description: '신속한 효과 오늘의집 캠페인',
    logo: 'animal/svg/kangaroo.svg',
    efficiency: '-%',
    minQuantity: '60개',
    deadline: '21:00',
    status: {
      label: '준비중',
      color: 'gray-300'
    }
  },
  {
    id: 'sheep-ohouse',
    campaignName: '쉽',
    description: '온라인 연동 오늘의집 캠페인',
    logo: 'animal/svg/sheep.svg',
    efficiency: '-%',
    minQuantity: '60개',
    deadline: '21:00',
    status: {
      label: '준비중',
      color: 'gray-300'
    }
  },
  {
    id: 'pelican-ohouse',
    campaignName: '펠리컨',
    description: '대용량 상품 업로드 오늘의집 캠페인',
    logo: 'animal/svg/pelican.svg',
    efficiency: '-%',
    minQuantity: '60개',
    deadline: '21:00',
    status: {
      label: '준비중',
      color: 'gray-300'
    }
  }
];