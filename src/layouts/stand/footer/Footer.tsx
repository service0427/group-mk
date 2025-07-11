import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router';
import clsx from 'clsx';
import { generalSettings } from '@/config';
import { AdMiscFaqModal } from '@/partials/misc/AdMiscFaqModal';
import { BusinessInfoModal } from '@/partials/misc/BusinessInfoModal';
import { useStandLayout } from '../';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUIVisibility } from '@/hooks/useUIVisibility';

const Footer = () => {
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isBusinessInfoModalOpen, setIsBusinessInfoModalOpen] = useState(false);
  const { layout } = useStandLayout();
  const { pathname } = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { isVisible, forceVisible, setGlobalVisible } = useUIVisibility();
  const lastScrollYRef = useRef(0);
  const forceVisibleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 모바일에서 스크롤 감지 - MutationObserver로 DOM 준비 확인
  useEffect(() => {
    // 데스크톱에서는 항상 표시
    if (!isMobile) {
      setGlobalVisible(true);
      return;
    }

    let mainContentElement: HTMLElement | null = null;
    let scrollHandler: (() => void) | null = null;
    let observerCleanup: (() => void) | null = null;

    // 스크롤 핸들러 설정 함수
    const setupScrollHandler = () => {
      mainContentElement = document.querySelector('main[role="content"]') as HTMLElement;

      if (!mainContentElement) {
        return false;
      }

      // 초기 스크롤 위치 저장
      lastScrollYRef.current = mainContentElement.scrollTop || 0;

      // 스크롤 핸들러 함수
      scrollHandler = () => {
        try {
          if (!mainContentElement) return;

          // 현재 스크롤 위치
          const currentScrollY = mainContentElement.scrollTop || 0;

          // 이전 스크롤 위치
          const prevScrollY = lastScrollYRef.current;

          // 스크롤 방향 (true: 위로, false: 아래로)
          const isScrollingUp = currentScrollY < prevScrollY;

          // 화면 상단에 있는지 여부
          const isAtTop = currentScrollY < 100;

          // 화면 하단에 있는지 여부
          const containerHeight = mainContentElement.clientHeight;
          const scrollHeight = mainContentElement.scrollHeight;
          const isAtBottom = containerHeight + currentScrollY >= scrollHeight - 100;

          // 강제 표시 중이면 무시
          if (forceVisible) return;

          // 버튼 표시 여부 결정 로직
          if (isScrollingUp || isAtTop || isAtBottom) {
            setGlobalVisible(true);
          } else {
            setGlobalVisible(false);
          }

          // 현재 스크롤 위치를 이전 위치로 저장
          lastScrollYRef.current = currentScrollY;
        } catch (error) {
          // 에러 무시
        }
      };

      // 스크롤 이벤트 리스너 등록
      mainContentElement.addEventListener('scroll', scrollHandler, { passive: true });

      return true;
    };

    // 먼저 시도
    if (!setupScrollHandler()) {
      // 실패 시 MutationObserver로 DOM 변경 감지
      const observer = new MutationObserver(() => {
        if (setupScrollHandler()) {
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      observerCleanup = () => observer.disconnect();
    }

    // cleanup
    return () => {
      if (observerCleanup) observerCleanup();
      if (mainContentElement && scrollHandler) {
        mainContentElement.removeEventListener('scroll', scrollHandler);
      }
    };
  }, [isMobile, forceVisible]);

  // 사이드바 테마에 따라 푸터에도 동일한 테마 적용
  const themeClass: string =
    layout.options.sidebar.theme === 'dark' || pathname === '/dark-sidebar'
      ? 'dark [&.dark]:bg-coal-600'
      : 'dark:bg-coal-600';

  // 모바일에서 footer가 숨겨질 때 main content의 padding-bottom 직접 조정
  useEffect(() => {
    if (isMobile) {
      const mainContent = document.querySelector('main[role="content"]') as HTMLElement;
      if (mainContent) {
        // transition 클래스 추가
        mainContent.style.transition = 'padding-bottom 0.3s ease-in-out';

        if (!isVisible) {
          mainContent.style.paddingBottom = '0';
          document.body.classList.add('footer-hidden');
        } else {
          mainContent.style.paddingBottom = '2.5rem'; // 40px
          document.body.classList.remove('footer-hidden');
        }
      }
    }

    return () => {
      // cleanup: 컴포넌트 unmount 시 스타일 제거
      const mainContent = document.querySelector('main[role="content"]') as HTMLElement;
      if (mainContent) {
        mainContent.style.paddingBottom = '';
        mainContent.style.transition = '';
      }
      document.body.classList.remove('footer-hidden');
    };
  }, [isVisible, isMobile]);

  // 모바일에서 화면 클릭 시 푸터 토글
  useEffect(() => {
    if (!isMobile) return;

    const handleClick = (e: MouseEvent) => {
      // 푸터 자체를 클릭한 경우는 무시
      const footer = document.querySelector('footer');
      if (footer && footer.contains(e.target as Node)) {
        return;
      }

      // 채팅 버튼이나 채팅창을 클릭한 경우는 무시
      const chatButton = document.querySelector('.chat-sticky-button');
      const chatContainer = document.querySelector('.chat-sticky-container');
      if ((chatButton && chatButton.contains(e.target as Node)) ||
        (chatContainer && chatContainer.contains(e.target as Node))) {
        return;
      }

      // 토글 동작
      if (!isVisible) {
        // 숨겨진 상태 -> 표시
        setGlobalVisible(true, true); // force visible

        // 기존 타이머 클리어
        if (forceVisibleTimeoutRef.current) {
          clearTimeout(forceVisibleTimeoutRef.current);
        }

        // 3초 후 강제 표시 해제
        forceVisibleTimeoutRef.current = setTimeout(() => {
          setGlobalVisible(true, false); // remove force
        }, 3000);
      } else if (forceVisible) {
        // 강제 표시 상태 -> 숨김
        setGlobalVisible(false);

        // 타이머 클리어
        if (forceVisibleTimeoutRef.current) {
          clearTimeout(forceVisibleTimeoutRef.current);
        }
      }
    };

    // 전체 document에 이벤트 리스너 추가 (캡처 단계)
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      if (forceVisibleTimeoutRef.current) {
        clearTimeout(forceVisibleTimeoutRef.current);
      }
    };
  }, [isMobile, isVisible, forceVisible]);


  return (
    <footer
      className={clsx(
        'footer z-10 flex items-stretch shrink-0',
        'bg-light border-t border-t-gray-200 dark:border-t-coal-100', // 사이드바와 같은 배경색 및 상단 구분선 추가
        '!h-10', // !important로 강제 적용
        themeClass,
        // 데스크톱에서는 fixed, 모바일에서도 fixed로 변경
        'lg:fixed lg:bottom-0 lg:end-0',
        'fixed bottom-0 left-0 right-0',
        // 모바일에서 transform으로 아래로 숨기기
        'transition-transform duration-300 ease-in-out'
      )}
      style={{
        // 데스크톱에서만 left 위치 조정
        ...(window.innerWidth >= 1024 ? { left: layout.options.sidebar.collapse ? '80px' : '280px' } : {}),
        // 데스크톱에서만 width 계산
        ...(window.innerWidth >= 1024 ? { width: `calc(100% - ${layout.options.sidebar.collapse ? '80px' : '280px'})` } : { width: '100%' }),
        height: '2.5rem', // 40px
        // 모바일에서 transform 인라인 스타일로 적용
        transform: isMobile && !isVisible ? 'translateY(100%)' : 'translateY(0)',
      }}
    >
      {/* Container 대신 직접 패딩을 적용하여 사이드바 근처에 메뉴가 붙도록 함 */}
      <div className="flex items-center justify-between w-full px-4 py-0.5">
        <div className="flex gap-2 font-normal text-2sm">
          <span className="text-gray-500">2025 &copy; 마케팅의정석</span>
          <a
            href="#"
            className="text-gray-600 hover:text-primary"
            onClick={(e) => {
              e.preventDefault();
              setIsBusinessInfoModalOpen(true);
            }}
          >
            [사업자정보 확인]
          </a>
        </div>
        <nav className="flex gap-4 font-normal text-2sm text-gray-600">
          {/* FAQ 링크 */}
          <a
            href="#"
            className="hover:text-primary"
            onClick={(e) => {
              e.preventDefault();
              setIsFaqModalOpen(true);
            }}
          >
            FAQ
          </a>
        </nav>
      </div>

      {/* FAQ 모달 */}
      <AdMiscFaqModal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
      />
      
      {/* 사업자정보 모달 */}
      <BusinessInfoModal
        isOpen={isBusinessInfoModalOpen}
        onClose={() => setIsBusinessInfoModalOpen(false)}
      />
    </footer>
  );
};

export { Footer };