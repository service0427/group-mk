import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FaqAccordionItem } from './FaqAccordionItem';

interface IAdFaqItem {
  title: string;
  text: string;
  category: string;
}
type IAdFaqItems = Array<IAdFaqItem>;

// FAQ 카테고리 목록
const faqCategories = ['전체', '결제', '포인트', '계정', '광고', '기타'];

const AdMiscFaq = () => {
  const [activeCategory, setActiveCategory] = useState('전체');
  
  const items: IAdFaqItems = [
    {
      title: '캐시 충전은 어떻게 하나요?',
      text: "캐시 충전은 마이페이지 > 캐시관리 메뉴에서 진행할 수 있습니다. 신용카드, 실시간 계좌이체, 가상계좌 등 다양한 결제수단을 지원합니다.",
      category: '결제'
    },
    {
      title: '환불 정책은 어떻게 되나요?',
      text: "충전한 캐시는 미사용 상태에서 결제일로부터 7일 이내에 환불이 가능합니다. 이후에는 부분 사용된 경우 사용 금액을 제외한 금액만 환불됩니다.",
      category: '결제'
    },
    {
      title: '포인트는 어떻게 사용하나요?',
      text: "적립된 포인트는 캐시 충전 시 1 포인트 = 1원으로 사용 가능합니다. 최소 1,000 포인트부터 사용 가능하며, 유효기간은 적립일로부터 1년입니다.",
      category: '포인트'
    },
    {
      title: '계정 정보는 어떻게 변경하나요?',
      text: "계정 정보 변경은 마이페이지 > 내 정보 관리 메뉴에서 가능합니다. 비밀번호, 연락처, 이메일 등의 정보를 변경할 수 있습니다.",
      category: '계정'
    },
    {
      title: '광고 집행 결과는 어디서 확인할 수 있나요?',
      text: "광고 집행 결과는 마이페이지 > 광고 관리 > 집행 현황 메뉴에서 확인할 수 있습니다. 일별, 주별, 월별 통계와 함께 상세 리포트를 제공합니다.",
      category: '광고'
    },
    {
      title: '회원 등급은 어떻게 결정되나요?',
      text: "회원 등급은 월간 사용 금액과 누적 사용 금액에 따라 결정됩니다. 자세한 등급별 혜택은 마이페이지 > 회원 등급 안내에서 확인하실 수 있습니다.",
      category: '계정'
    },
    {
      title: '기타 문의사항은 어디로 연락하면 되나요?',
      text: "기타 문의사항은 고객센터(1588-0000)로 전화 문의하시거나, 홈페이지 하단의 1:1 문의하기를 통해 접수해 주시기 바랍니다.",
      category: '기타'
    },
  ];

  // 카테고리별 필터링된 FAQ 목록
  const filteredItems = activeCategory === '전체'
    ? items
    : items.filter(item => item.category === activeCategory);

  return (
    <div className="card bg-card">
      <div className="card-header">
        <h3 className="card-title text-card-foreground">FAQ</h3>
      </div>
      
      {/* 카테고리 필터 */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {faqCategories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => setActiveCategory(category)}
              className={`text-sm ${activeCategory === category ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="card-body py-3">
        {filteredItems.length > 0 ? (
          <div className="faq-accordion">
            {filteredItems.map((item, index) => (
              <FaqAccordionItem
                key={index}
                title={item.title}
                category={item.category}
              >
                {item.text}
              </FaqAccordionItem>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            해당 카테고리에 FAQ가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export { AdMiscFaq, type IAdFaqItem, type IAdFaqItems };