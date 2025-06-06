import React, { useState, useEffect } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { supabase } from '@/supabase';
import { toast } from 'sonner';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Button } from '@/components/ui/button';

// FAQ 유형 정의
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

// FAQ 카테고리 목록
const faqCategories = ['전체', '결제', '포인트', '계정', '광고', '기타'];

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

const FAQPageComponent = () => {
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('전체');
  
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
      toast.error("FAQ 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 FAQ 가져오기
  useEffect(() => {
    fetchFAQs();
  }, []);

  // 클릭 시 조회수 증가
  const incrementViewCount = async (faq: FAQ) => {
    try {
      await supabase
        .from('faq')
        .update({ view_count: (faq.view_count || 0) + 1 })
        .eq('id', faq.id);
    } catch (error) {
      
    }
  };

  // 카테고리별 필터링된 FAQ 목록
  const filteredFAQs = activeCategory === '전체'
    ? faqs
    : faqs.filter(faq => faq.category === activeCategory);

  // 카테고리별 FAQ 그룹화
  const faqsByCategory: Record<string, FAQ[]> = {};
  filteredFAQs.forEach(faq => {
    if (!faqsByCategory[faq.category]) {
      faqsByCategory[faq.category] = [];
    }
    faqsByCategory[faq.category].push(faq);
  });

  return (
    <CommonTemplate
      title="자주 묻는 질문 (FAQ)"
      description="마케팅의 정석 FAQ"
      showPageMenu={false}
    >
      <div className="grid gap-5 lg:gap-7.5">
        {/* 카테고리별 필터 */}
        <div className="card rounded-lg shadow-sm p-3 sm:p-5">
          <div className="flex flex-wrap gap-2 overflow-x-auto">
            {faqCategories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className={`${activeCategory === category ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="card rounded-lg shadow-sm">
          <div className="flex justify-between items-center p-5 border-b">
            <h3 className="text-lg font-medium text-card-foreground">FAQ ({activeCategory})</h3>
            <span className="text-sm text-muted-foreground">총 {filteredFAQs.length}개의 FAQ</span>
          </div>

          <div className="p-4">
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
            ) : (
              <>
                {Object.entries(faqsByCategory).length > 0 ? (
                  activeCategory === '전체' ? (
                    // 전체 카테고리일 때는 카테고리별로 그룹화하여 표시
                    Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
                      <div key={category} className="mb-8">
                        <div className="flex items-center mb-4 py-2 border-b">
                          <h3 className="text-lg font-medium">{category}</h3>
                          <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {categoryFaqs.length}개
                          </span>
                        </div>
                        
                        {/* 데스크톱 아코디언 (md 이상에서 표시) */}
                        <div className="hidden md:block">
                          <Accordion type="single" collapsible className="w-full">
                            {categoryFaqs.map((faq, index) => (
                              <AccordionItem 
                                key={faq.id} 
                                value={faq.id}
                                className="border-b border-border py-2 hover:bg-gray-50/50 transition-colors duration-200"
                              >
                                <AccordionTrigger 
                                  onClick={(e) => {
                                    incrementViewCount(faq);
                                  }}
                                  className="text-left font-medium hover:text-primary py-3 px-4 rounded-md"
                                >
                                  <div className="flex items-start">
                                    <span className="text-primary font-bold mr-3 text-lg">Q.</span>
                                    <span className="pt-0.5">{faq.question}</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground bg-gray-50 rounded-md p-5 mx-4 my-2 shadow-sm">
                                  <div className="flex items-start">
                                    <span className="text-primary font-bold mr-3 text-lg">A.</span>
                                    <div className="whitespace-pre-line break-words overflow-wrap-anywhere pt-0.5">{faq.answer}</div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                        
                        {/* 모바일 리스트 (md 미만에서 표시) */}
                        <div className="block md:hidden">
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {categoryFaqs.map((faq, index) => (
                              <div 
                                key={faq.id} 
                                className="p-3 hover:bg-muted/40 cursor-pointer border-b"
                                onClick={() => incrementViewCount(faq)}
                              >
                                <div className="flex items-start">
                                  <span className="text-xs font-semibold bg-primary/10 text-primary rounded-full min-w-5 h-5 flex items-center justify-center mr-2 mt-0.5">
                                    {index + 1}
                                  </span>
                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 break-words">
                                      {faq.question}
                                    </h3>
                                    <div className="flex justify-between items-center">
                                      <span className={`text-xs ${getCategoryColor(faq.category)}`}>
                                        {faq.category}
                                      </span>
                                      <button className="text-xs text-primary hover:text-primary-dark" onClick={(e) => {
                                        e.stopPropagation();
                                        const item = document.getElementById(`faq-${faq.id}`);
                                        if (item) {
                                          if (item.classList.contains('hidden')) {
                                            item.classList.remove('hidden');
                                          } else {
                                            item.classList.add('hidden');
                                          }
                                        }
                                      }}>
                                        답변 보기
                                      </button>
                                    </div>
                                    <div id={`faq-${faq.id}`} className="hidden mt-3 bg-gray-50 p-3 rounded-md">
                                      <div className="flex items-start">
                                        <span className="text-xs font-semibold bg-primary/10 text-primary rounded-full min-w-5 h-5 flex items-center justify-center mr-2 mt-0.5">
                                          A
                                        </span>
                                        <div className="whitespace-pre-line break-words overflow-wrap-anywhere text-sm text-gray-700">
                                          {faq.answer}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // 특정 카테고리를 선택했을 때는 해당 카테고리의 FAQ만 표시
                    <>
                      {/* 데스크톱 아코디언 (md 이상에서 표시) */}
                      <div className="hidden md:block">
                        <Accordion type="single" collapsible className="w-full">
                          {filteredFAQs.map((faq) => (
                            <AccordionItem 
                              key={faq.id} 
                              value={faq.id}
                              className="border-b border-border py-2 hover:bg-gray-50/50 transition-colors duration-200"
                            >
                              <AccordionTrigger 
                                onClick={(e) => {
                                  incrementViewCount(faq);
                                }}
                                className="text-left font-medium hover:text-primary py-3 px-4 rounded-md"
                              >
                                <div className="flex items-start">
                                  <span className="text-primary font-bold mr-3 text-lg">Q.</span>
                                  <span className="pt-0.5">{faq.question}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground bg-gray-50 rounded-md p-5 mx-4 my-2 shadow-sm">
                                <div className="flex items-start">
                                  <span className="text-primary font-bold mr-3 text-lg">A.</span>
                                  <div className="whitespace-pre-line break-words overflow-wrap-anywhere pt-0.5">{faq.answer}</div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                      
                      {/* 모바일 리스트 (md 미만에서 표시) */}
                      <div className="block md:hidden">
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredFAQs.map((faq, index) => (
                            <div 
                              key={faq.id} 
                              className="p-3 hover:bg-muted/40 cursor-pointer border-b"
                              onClick={() => incrementViewCount(faq)}
                            >
                              <div className="flex items-start">
                                <span className="text-xs font-semibold bg-primary/10 text-primary rounded-full min-w-5 h-5 flex items-center justify-center mr-2 mt-0.5">
                                  {index + 1}
                                </span>
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 break-words">
                                    {faq.question}
                                  </h3>
                                  <div className="flex justify-between items-center">
                                    <span className={`text-xs ${getCategoryColor(faq.category)}`}>
                                      {faq.category}
                                    </span>
                                    <button className="text-xs text-primary hover:text-primary-dark" onClick={(e) => {
                                      e.stopPropagation();
                                      const item = document.getElementById(`faq-${faq.id}`);
                                      if (item) {
                                        if (item.classList.contains('hidden')) {
                                          item.classList.remove('hidden');
                                        } else {
                                          item.classList.add('hidden');
                                        }
                                      }
                                    }}>
                                      답변 보기
                                    </button>
                                  </div>
                                  <div id={`faq-${faq.id}`} className="hidden mt-3 bg-gray-50 p-3 rounded-md">
                                    <div className="flex items-start">
                                      <span className="text-xs font-semibold bg-primary/10 text-primary rounded-full min-w-5 h-5 flex items-center justify-center mr-2 mt-0.5">
                                        A
                                      </span>
                                      <div className="whitespace-pre-line break-words overflow-wrap-anywhere text-sm text-gray-700">
                                        {faq.answer}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    등록된 FAQ가 없습니다.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 p-3 sm:p-5">
          <h3 className="text-base sm:text-lg font-medium text-blue-900 dark:text-blue-100 mb-3 sm:mb-4">원하는 답변을 찾지 못하셨나요?</h3>
          <p className="text-sm sm:text-base text-blue-700 dark:text-blue-200 mb-3 break-words">
            더 자세한 문의사항은 1:1 문의하기를 이용해주세요. 친절하게 답변해 드리겠습니다.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            1:1 문의하기
          </Button>
        </div>
      </div>
    </CommonTemplate>
  );
};

export { FAQPageComponent };