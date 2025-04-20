// FAQ 컴포넌트 통합 내보내기
export * from './AdMiscFaq';
export * from './AdMiscFaqModal';
export * from './FaqAccordionItem';
export * from './FaqUsageExample';

// FAQ 관련 타입 정의
export interface IFaqItem {
  title: string;
  text: string;
  category: string;
}

export type FaqItems = Array<IFaqItem>;

// FAQ 카테고리 목록
export const faqCategories = ['전체', '결제', '포인트', '계정', '광고', '기타'];