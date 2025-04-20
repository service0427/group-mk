import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FaqAccordionItem } from './FaqAccordionItem';

interface IAdFaqItem {
  title: string;
  text: string;
  category: string;
}
type IAdFaqItems = Array<IAdFaqItem>;

// FAQ 카테고리 목록
const faqCategories = ['전체', '결제', '포인트', '계정', '광고', '기타'];

interface AdMiscFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdMiscFaqModal: React.FC<AdMiscFaqModalProps> = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // 초기 높이를 설정하는 함수
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // 500px 이하인 경우 실제 높이로, 500px보다 크면 500px로 고정
      const containerHeight = contentRef.current.scrollHeight;
      const initialHeight = Math.min(containerHeight, 500);
      setContentHeight(initialHeight);
    }
  }, [isOpen, activeCategory]);
  
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

  // 아코디언 아이템 클릭시 콘텐츠 높이 조정
  const handleAccordionToggle = () => {
    // 아코디언이 열린 후 약간의 딜레이를 주고 높이를 다시 계산
    setTimeout(() => {
      if (contentRef.current) {
        const newHeight = contentRef.current.scrollHeight + 20; // 여분의 공간을 위해 20px 추가
        setContentHeight(newHeight);
      }
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        {/* 모달 헤더 */}
        <DialogHeader className="bg-background py-4 px-8 border-b">
          <DialogTitle className="text-lg font-medium text-foreground">자주 묻는 질문 (FAQ)</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 bg-background">
          {/* 카테고리 필터 */}
          <div className="mb-6">
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
          
          {/* FAQ 리스트 - 동적 높이 조정 */}
          <div 
            ref={contentRef}
            className="overflow-y-auto pr-2 transition-all duration-300 ease-in-out"
            style={{ maxHeight: contentHeight ? `${contentHeight}px` : '350px', minHeight: '250px' }}
          >
            {filteredItems.length > 0 ? (
              <div className="faq-accordion">
                {filteredItems.map((item, index) => (
                  <FaqAccordionItem
                    key={index}
                    title={item.title}
                    category={item.category}
                    onToggle={handleAccordionToggle}
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
          
          {/* 하단 버튼 영역 */}
          <div className="flex justify-end pt-4 mt-6 border-t">
            <Button 
              variant="outline"
              onClick={onClose}
              className="px-4"
            >
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 트리거와 모달을 포함한 FAQ 버튼 컴포넌트
const FaqModalButton: React.FC<{ className?: string; buttonText?: string }> = ({ 
  className, 
  buttonText = "자주 묻는 질문 보기"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {buttonText}
      </Button>
      <AdMiscFaqModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export { AdMiscFaqModal, FaqModalButton };
