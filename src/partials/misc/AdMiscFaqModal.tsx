import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Collapse } from '@mui/material';
import { KeenIcon } from '@/components/keenicons';
import clsx from 'clsx';
import { supabase } from '@/supabase';

// 카테고리별 배경색 설정
const getCategoryColor = (category: string) => {
  switch (category) {
    case '결제':
      return 'bg-blue-100 text-blue-800';
    case '포인트':
      return 'bg-green-100 text-green-800';
    case '계정':
      return 'bg-purple-100 text-purple-800';
    case '광고':
      return 'bg-orange-100 text-orange-800';
    case '기타':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

// FAQ 데이터 타입 정의
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
  author_id: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// FaqAccordionItem 컴포넌트 내부로 이동
interface IFaqAccordionItemProps {
  faq: FAQ;
  onToggle?: () => void;
  isDefaultOpen?: boolean;
}

const FaqAccordionItem = ({ 
  faq,
  onToggle,
  isDefaultOpen = false
}: IFaqAccordionItemProps) => {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
    
    // 토글 이벤트 호출
    if (onToggle) {
      // 약간의 지연을 주어 상태 변경 후 호출
      setTimeout(() => {
        onToggle();
      }, 50);
    }
  };
  
  // 초기 열린 상태에서도 토글 이벤트 호출
  useEffect(() => {
    if (isDefaultOpen && onToggle) {
      onToggle();
    }
  }, [isDefaultOpen, onToggle]);

  // 조회수 증가 함수
  const incrementViewCount = async () => {
    try {
      await supabase
        .from('faq')
        .update({ view_count: (faq.view_count || 0) + 1 })
        .eq('id', faq.id);
    } catch (error) {
      
    }
  };

  const categoryColor = getCategoryColor(faq.category);

  const handleClick = () => {
    toggleAccordion();
    incrementViewCount();
  };

  return (
    <div className={clsx(
      'accordion-item [&:not(:last-child)]:border-b border-b-border', 
      isOpen && 'active'
    )}>
      <button 
        type="button" 
        className="accordion-toggle py-4 cursor-pointer w-full flex items-center"
        onClick={handleClick}
      >
        <div className="flex items-start flex-1 text-left">
          <div className="flex">
            <span className="text-primary font-bold mr-3 text-lg">Q.</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor} mr-3`}>
              {faq.category}
            </span>
          </div>
          <span className="text-base text-foreground pt-0.5">{faq.question}</span>
        </div>
        <span className="accordion-indicator ml-2">
          {isOpen ? (
            <KeenIcon icon="minus" style="outline" className="text-muted-foreground text-sm" />
          ) : (
            <KeenIcon icon="plus" style="outline" className="text-muted-foreground text-sm" />
          )}
        </span>
      </button>
      <Collapse in={isOpen} onEntered={onToggle} onExited={onToggle}>
        <div className="accordion-content bg-gray-50 mx-2 my-2 rounded-md">
          <div className="text-foreground text-md py-4 px-4">
            <div className="flex items-start">
              <span className="text-primary font-bold mr-3 text-lg">A.</span>
              <div className="whitespace-pre-line pt-0.5">{faq.answer}</div>
            </div>
          </div>
        </div>
      </Collapse>
    </div>
  );
};

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
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // FAQ 목록 가져오기 - 활성화된 FAQ만 표시
  const fetchFAQs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('faq')
        .select('*')
        .eq('is_active', true)  // 활성화된 FAQ만 조회
        .order('category', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFAQs(data || []);
    } catch (err: any) {
      
      setError('FAQ를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 FAQ 가져오기
  useEffect(() => {
    if (isOpen) {
      fetchFAQs();
    }
  }, [isOpen]);
  
  // 초기 높이를 설정하는 함수
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // setTimeout을 사용하여 DOM이 완전히 렌더링된 후 높이를 계산
      setTimeout(() => {
        if (contentRef.current) {
          // 콘텐츠의 실제 높이를 계산할 때 여유 공간 추가
          const containerHeight = contentRef.current.scrollHeight;
          // 가능한 경우 콘텐츠가 모두 표시되도록 함
          const initialHeight = Math.min(containerHeight + 5, 500); // 5px의 여유 공간 추가
          setContentHeight(initialHeight);
        }
      }, 50); // 약간의 지연 시간을 줌
    }
  }, [isOpen, activeCategory, isLoading]);

  // 카테고리별 필터링된 FAQ 목록
  const filteredFAQs = activeCategory === '전체'
    ? faqs
    : faqs.filter(faq => faq.category === activeCategory);

  // 아코디언 아이템 클릭시 콘텐츠 높이 조정
  const handleAccordionToggle = () => {
    // 아코디언이 열린 후 약간의 딜레이를 주고 높이를 다시 계산
    setTimeout(() => {
      if (contentRef.current) {
        const newHeight = contentRef.current.scrollHeight + 10; // 여유 공간 조정
        setContentHeight(newHeight);
      }
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden" aria-describedby="faq-dialog-description">
        {/* 모달 헤더 */}
        <DialogHeader className="bg-background py-4 px-8 border-b">
          <DialogTitle className="text-lg font-medium text-foreground">자주 묻는 질문 (FAQ)</DialogTitle>
          <DialogDescription id="faq-dialog-description" className="sr-only">
            자주 묻는 질문 및 답변 모음입니다. 카테고리별로 질문을 필터링할 수 있습니다.
          </DialogDescription>
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
            style={{ 
              maxHeight: contentHeight ? `${contentHeight}px` : '350px', 
              minHeight: '250px',
              overflowY: filteredFAQs.length > 0 ? 'auto' : 'hidden' // 아이템이 없으면 스크롤바 숨김
            }}
          >
            {isLoading ? (
              <div className="p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  onClick={fetchFAQs}
                  className="mt-4"
                >
                  다시 시도
                </Button>
              </div>
            ) : filteredFAQs.length > 0 ? (
              <div className="faq-accordion">
                {filteredFAQs.map((faq) => (
                  <FaqAccordionItem
                    key={faq.id}
                    faq={faq}
                    onToggle={handleAccordionToggle}
                  />
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