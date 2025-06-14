import React, { useEffect, useRef, useState } from 'react';
import { CommonTemplate } from '@/components/pageTemplate';
import { useResponsive } from '@/hooks';
import clsx from 'clsx';
import { KeenIcon } from '@/components/keenicons';
import { WithdrawSettingsSection } from './sections/WithdrawSettingsSection';
import { CashSettingsSection } from './sections/CashSettingsSection';
import { SearchLimitsSection } from './sections/SearchLimitsSection';

const SiteGeneralSetting: React.FC = () => {
  const desktopMode = useResponsive('up', 'lg');
  const [activeSection, setActiveSection] = useState('withdraw_settings');
  
  // 사이드바 메뉴 아이템
  const sidebarItems = [
    {
      id: 'withdraw_settings',
      title: '관리자 출금 설정',
      icon: 'dollar'
    },
    {
      id: 'cash_settings',
      title: '캐시 설정',
      icon: 'dollar'
    },
    {
      id: 'search_limits',
      title: '검색 제한 설정',
      icon: 'search-list'
    }
  ];

  // 스크롤 이벤트 처리
  useEffect(() => {
    // main[role="content"] 요소를 찾아서 스크롤 컨테이너로 사용
    const scrollContainer = document.querySelector('main[role="content"]') as HTMLElement;
    
    if (!scrollContainer) {
      console.error('스크롤 컨테이너를 찾을 수 없습니다.');
      return;
    }

    const handleScroll = () => {
      // 현재 보고 있는 섹션 찾기
      const sections = sidebarItems.map(item => ({
        id: item.id,
        element: document.getElementById(item.id)
      }));

      // 화면 중앙을 기준으로 현재 섹션 판단
      const viewportHeight = window.innerHeight;
      const triggerPoint = viewportHeight * 0.3; // 화면 상단에서 30% 지점

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          // 섹션이 트리거 포인트를 지났는지 확인
          if (rect.top <= triggerPoint) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    // 스크롤 이벤트 리스너 추가
    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll(); // 초기 실행
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 섹션 클릭 핸들러
  const handleSectionClick = (targetId: string) => {
    const scrollContainer = document.querySelector('main[role="content"]') as HTMLElement;
    const element = document.getElementById(targetId);
    
    if (element && scrollContainer) {
      // 요소의 절대 위치 계산
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // 스크롤 위치 계산 - 섹션을 화면 상단 근처로 이동
      // 오프셋을 줄여서 섹션이 더 위로 오도록 함
      const offset = 80; // 헤더 높이 정도만 여유 공간
      const scrollPosition = scrollContainer.scrollTop + elementRect.top - containerRect.top - offset;
      
      // 부드러운 스크롤
      scrollContainer.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
      
      // 스크롤 완료 후 활성 섹션 업데이트를 위해 약간의 지연
      setTimeout(() => {
        setActiveSection(targetId);
      }, 100);
    }
  };

  // 모바일 탭 메뉴 렌더링
  const renderMobileTabs = () => {
    return (
      <div className="lg:hidden mb-6 bg-card rounded-lg border border-border p-2">
        <div className="flex space-x-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionClick(item.id)}
              className={clsx(
                "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                activeSection === item.id 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // 사이드바 메뉴 렌더링
  const renderSidebarMenu = () => {
    return (
      <div className="flex flex-col grow relative before:absolute before:start-[11px] before:top-0 before:bottom-0 before:border-s before:border-gray-200">
        {sidebarItems.map((item, index) => (
          <div
            key={item.id}
            onClick={() => handleSectionClick(item.id)}
            className={clsx(
              "cursor-pointer flex items-center gap-1.5 rounded-lg pl-2.5 pr-2.5 py-2.5 border border-transparent text-gray-800 hover:rounded-lg hover:text-primary text-2sm",
              "dark:hover:bg-coal-300 dark:hover:border-gray-100",
              activeSection === item.id && [
                "bg-secondary-active text-primary font-medium",
                "dark:bg-coal-300 dark:border-gray-100"
              ]
            )}
          >
            <span className={clsx(
              "flex w-1.5 relative before:absolute before:left-0 before:top-1/2 before:size-1.5 before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2",
              activeSection === item.id && "before:bg-primary"
            )}></span>
            {item.title}
          </div>
        ))}
      </div>
    );
  };

  return (
    <CommonTemplate
      title="일반 설정"
      description="관리자 메뉴 > 사이트 관리 > 일반 설정"
      showPageMenu={false}
    >
      <div className="container mx-auto">
        {/* 모바일 탭 메뉴 */}
        {renderMobileTabs()}

        <div className="flex grow gap-5 lg:gap-7.5">
          {/* 메인 콘텐츠 영역 */}
          <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5">
            {/* 관리자 출금 설정 섹션 */}
            <section id="withdraw_settings" className="scroll-mt-20">
              <WithdrawSettingsSection />
            </section>

            {/* 캐시 설정 섹션 */}
            <section id="cash_settings" className="scroll-mt-20">
              <CashSettingsSection />
            </section>

            {/* 검색 제한 설정 섹션 */}
            <section id="search_limits" className="scroll-mt-20">
              <SearchLimitsSection />
            </section>
          </div>

          {/* 데스크톱 사이드바 - 오른쪽으로 이동 */}
          {desktopMode && (
            <div className="w-[230px] shrink-0">
              {/* sticky 컨테이너 - 헤더 바로 아래에 위치하도록 조정 */}
              <div className="sticky top-2 h-fit">
                <div className="bg-card rounded-lg border border-border p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                    <KeenIcon icon="setting" className="text-base" />
                    일반 설정 메뉴
                  </h3>
                  {renderSidebarMenu()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </CommonTemplate>
  );
};

export default SiteGeneralSetting;