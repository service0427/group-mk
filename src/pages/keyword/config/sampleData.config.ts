export interface SampleDataConfig {
  [serviceType: string]: {
    [fieldName: string]: {
      sample1: string;
      sample2: string;
    };
  };
}

export const KEYWORD_SAMPLE_DATA: SampleDataConfig = {
  naver_blog: {
    main_keyword: {
      sample1: '맛집 추천',
      sample2: '여행 코스'
    },
    mid: {
      sample1: '1234567',
      sample2: '2345678'
    },
    url: {
      sample1: 'https://blog.naver.com/example1',
      sample2: 'https://blog.naver.com/example2'
    },
    keyword1: {
      sample1: '강남 맛집',
      sample2: '제주도 여행'
    },
    keyword2: {
      sample1: '데이트 코스',
      sample2: '가족 여행'
    },
    keyword3: {
      sample1: '분위기 좋은',
      sample2: '숙박 추천'
    },
    description: {
      sample1: '블로그 포스팅 관련 메모',
      sample2: '여행 정보 관련 메모'
    }
  },
  naver_place: {
    main_keyword: {
      sample1: '스타벅스 강남점',
      sample2: '올리브영 신촌점'
    },
    mid: {
      sample1: '1234567890',
      sample2: '2345678901'
    },
    url: {
      sample1: 'https://map.naver.com/v5/entry/place/1234567890',
      sample2: 'https://map.naver.com/v5/entry/place/2345678901'
    },
    keyword1: {
      sample1: '강남',
      sample2: '신촌'
    },
    keyword2: {
      sample1: '카페',
      sample2: '화장품'
    },
    keyword3: {
      sample1: '스터디카페',
      sample2: '올영세일'
    },
    description: {
      sample1: '24시간 운영',
      sample2: '신상품 입고'
    }
  },
  naver_shopping: {
    main_keyword: {
      sample1: '나이키 운동화',
      sample2: '삼성 갤럭시북'
    },
    mid: {
      sample1: '82345678901',
      sample2: '83456789012'
    },
    url: {
      sample1: 'https://smartstore.naver.com/product/82345678901',
      sample2: 'https://smartstore.naver.com/product/83456789012'
    },
    keyword1: {
      sample1: '나이키',
      sample2: '삼성전자'
    },
    keyword2: {
      sample1: '런닝화',
      sample2: '노트북'
    },
    keyword3: {
      sample1: '에어맥스',
      sample2: 'OLED'
    },
    description: {
      sample1: '2024 신상품',
      sample2: '학생 할인 가능'
    }
  },
  instagram: {
    main_keyword: {
      sample1: '#일상스타그램',
      sample2: '#먹스타그램'
    },
    url: {
      sample1: 'https://www.instagram.com/p/example1',
      sample2: 'https://www.instagram.com/p/example2'
    },
    keyword1: {
      sample1: '#데일리',
      sample2: '#맛집'
    },
    keyword2: {
      sample1: '#오늘의코디',
      sample2: '#카페추천'
    },
    keyword3: {
      sample1: '#패션',
      sample2: '#디저트'
    },
    description: {
      sample1: '일상 공유 게시물',
      sample2: '맛집 리뷰 게시물'
    }
  },
  youtube: {
    main_keyword: {
      sample1: '브이로그 일상',
      sample2: '요리 레시피'
    },
    url: {
      sample1: 'https://www.youtube.com/watch?v=example1',
      sample2: 'https://www.youtube.com/watch?v=example2'
    },
    keyword1: {
      sample1: 'vlog',
      sample2: '집밥'
    },
    keyword2: {
      sample1: '일상브이로그',
      sample2: '간단요리'
    },
    keyword3: {
      sample1: '대학생브이로그',
      sample2: '자취요리'
    },
    mid: {
      sample1: '@vlogger123',
      sample2: '@cookingchannel'
    },
    description: {
      sample1: '주 2회 업로드',
      sample2: '10분 레시피'
    }
  },
  facebook: {
    main_keyword: {
      sample1: '육아 정보',
      sample2: '부동산 투자'
    },
    url: {
      sample1: 'https://www.facebook.com/groups/parenting',
      sample2: 'https://www.facebook.com/pages/realestate'
    },
    keyword1: {
      sample1: '신생아',
      sample2: '아파트'
    },
    keyword2: {
      sample1: '육아팁',
      sample2: '재테크'
    },
    keyword3: {
      sample1: '엄마들',
      sample2: '청약'
    },
    mid: {
      sample1: '123456789',
      sample2: '987654321'
    },
    description: {
      sample1: '육아 커뮤니티',
      sample2: '투자 정보 공유'
    }
  },
  default: {
    main_keyword: {
      sample1: '메인키워드1',
      sample2: '메인키워드2'
    },
    mid: {
      sample1: '12345',
      sample2: '23456'
    },
    url: {
      sample1: 'https://example.com/1',
      sample2: 'https://example.com/2'
    },
    keyword1: {
      sample1: '키워드11',
      sample2: '키워드21'
    },
    keyword2: {
      sample1: '키워드12',
      sample2: '키워드22'
    },
    keyword3: {
      sample1: '키워드13',
      sample2: '키워드23'
    },
    description: {
      sample1: '설명이 필요하면 입력',
      sample2: '설명이 필요하면 입력'
    }
  }
};

// 필드별 열 너비 설정
export const FIELD_COLUMN_WIDTHS: { [key: string]: number } = {
  description: 30,
  url: 35,
  main_keyword: 20,
  default: 20
};

export const getColumnWidth = (fieldName: string): number => {
  return FIELD_COLUMN_WIDTHS[fieldName] || FIELD_COLUMN_WIDTHS.default;
};