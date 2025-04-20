import clsx from 'clsx';
import { memo, ReactNode, useState, useEffect } from 'react';
import { Collapse } from '@mui/material';
import { KeenIcon } from '@/components/keenicons';

interface IFaqAccordionItemProps {
  title: string;
  category: string;
  children: ReactNode;
  isDefaultOpen?: boolean;
  onToggle?: () => void; // 토글 이벤트 핸들러 추가
}

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

const FaqAccordionItem = ({ 
  title, 
  category, 
  children,
  isDefaultOpen = false,
  onToggle
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
  }, []);

  const categoryColor = getCategoryColor(category);

  return (
    <div className={clsx(
      'accordion-item [&:not(:last-child)]:border-b border-b-border',
      isOpen && 'active'
    )}>
      <button 
        type="button" 
        className="accordion-toggle py-4 cursor-pointer w-full flex items-center"
        onClick={toggleAccordion}
      >
        <div className="flex items-center flex-1 text-left">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor} mr-3`}>
            {category}
          </span>
          <span className="text-base text-foreground">{title}</span>
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
        <div className="accordion-content">
          <div className="text-foreground text-md pb-4 pl-10">
            {children}
          </div>
        </div>
      </Collapse>
    </div>
  );
};

export { FaqAccordionItem };
