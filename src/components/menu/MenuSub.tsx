import { Collapse } from '@mui/material';
import clsx from 'clsx';
import { Children, cloneElement, forwardRef, isValidElement, memo, useEffect, useRef } from 'react';
import { IMenuItemProps, IMenuSubProps, MenuItem } from './';

const MenuSubComponent = forwardRef<HTMLDivElement | null, IMenuSubProps>(
  function MenuSub(props, ref) {
    const {
      show,
      enter,
      toggle = 'accordion',
      className,
      handleParentHide,
      handleEntered,
      handleExited,
      children,
      parentId
    } = props;

    const subMenuRef = useRef<HTMLDivElement | null>(null);
    const finalParentId = parentId !== undefined ? parentId : 'root';

    // 서브메뉴가 열릴 때 스크롤 위치를 조정하는 함수
    useEffect(() => {
      // 아코디언 메뉴이고 show가 true일 때만 스크롤 처리
      if (toggle === 'accordion' && show && subMenuRef.current) {
        // 애니메이션이 완료된 후 스크롤 위치 조정 (setTimeout으로 지연)
        const initialScrollTimer = setTimeout(() => {
          scrollToSubMenu();
        }, 100); // 초기 스크롤 위치 조정을 위한 지연시간

        return () => clearTimeout(initialScrollTimer);
      }
    }, [show, toggle]);

    // Collapse 애니메이션이 완료된 후 추가 스크롤 조정
    const handleCollapseDone = () => {
      if (handleEntered) {
        handleEntered();
      }
      
      // 애니메이션 완료 후 최종 스크롤 위치 조정
      setTimeout(() => {
        scrollToSubMenu(true);
      }, 150);
    };

    // 서브메뉴로 스크롤하는 함수 - 특정 ID를 가진 스크롤 컨테이너 직접 찾기
    const scrollToSubMenu = (scrollToBottom = false) => {
      if (!subMenuRef.current) return;

      // 사이드바의 스크롤 가능한 컨테이너를 직접 ID로 찾기
      const scrollableParent = document.getElementById('sidebar-scrollable-container');
      
      if (!scrollableParent) {
        // 직접 ID로 찾지 못한 경우 기존 방식으로 스크롤 가능한 요소 찾기
        let parentEl = subMenuRef.current.parentElement;
        while (parentEl) {
          // clientHeight와 scrollHeight가 다르면 스크롤 가능한 요소
          const hasScrollbar = parentEl.clientHeight < parentEl.scrollHeight;
          if (hasScrollbar) {
            break;
          }
          parentEl = parentEl.parentElement;
        }
        
        // 그래도 스크롤 가능한 요소를 찾지 못했으면 종료
        if (!parentEl) return;
        
        performScroll(parentEl, scrollToBottom);
      } else {
        // ID로 찾은 컨테이너로 스크롤 수행
        performScroll(scrollableParent, scrollToBottom);
      }
    };
    
    // 실제 스크롤 수행 함수
    const performScroll = (scrollableParent: HTMLElement, scrollToBottom: boolean) => {
      if (!subMenuRef.current) return;
      
      const parentRect = scrollableParent.getBoundingClientRect();
      const subMenuRect = subMenuRef.current.getBoundingClientRect();
      
      // 서브메뉴의 전체 높이 계산 (보이지 않는 부분 포함)
      const subMenuFullHeight = subMenuRef.current.scrollHeight;
      
      // 스크롤 위치 조정 계산
      let scrollPosition = scrollableParent.scrollTop;

      if (scrollToBottom) {
        // 최하위 메뉴까지 모두 보이도록 설정
        // 서브메뉴의 하단까지의 전체 높이 계산
        const subMenuBottom = subMenuRect.top + subMenuFullHeight;
        
        // 보이는 영역보다 서브메뉴가 더 크면 스크롤 조정
        if (subMenuBottom > parentRect.bottom) {
          // 마지막 아이템까지 보이도록 스크롤 위치 계산
          // 추가 여백 확보 (40 → 80)
          scrollPosition = scrollableParent.scrollTop + (subMenuBottom - parentRect.bottom) + 80;
        }
      } else {
        // 기본 스크롤 조정: 메뉴가 보이는 영역 안에 있도록 함
        if (subMenuRect.top < parentRect.top) {
          // 메뉴가 위쪽으로 잘린 경우
          scrollPosition = scrollableParent.scrollTop - (parentRect.top - subMenuRect.top) - 20;
        } else if (subMenuRect.top > parentRect.bottom - 100) {
          // 메뉴가 아래쪽으로 잘린 경우 (최소한 100px는 보이도록)
          scrollPosition = scrollableParent.scrollTop + (subMenuRect.top - (parentRect.bottom - 100));
        }
      }

      // 스크롤 위치 조정
      scrollableParent.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });

      // 중첩된 메뉴 찾기: 펼쳐진 상태인 중첩 메뉴를 모두 확인
      const nestedMenus = subMenuRef.current.querySelectorAll('.menu-item.show');
      
      // 중첩된 메뉴가 있고 스크롤이 필요한 경우 추가적인 스크롤 조정
      if (nestedMenus.length > 0 && scrollToBottom) {
        // 추가 조정을 위한 지연 시간
        setTimeout(() => {
          if (!subMenuRef.current) return;
          
          // 가장 깊은 중첩 메뉴 (맨 마지막 메뉴) 찾기
          const deepestNestedMenu = nestedMenus[nestedMenus.length - 1];
          const nestedMenuItems = deepestNestedMenu.querySelectorAll('.menu-item');
          
          if (nestedMenuItems.length > 0) {
            // 가장 마지막 메뉴 아이템 찾기
            const lastMenuItem = nestedMenuItems[nestedMenuItems.length - 1];
            const lastMenuItemRect = lastMenuItem.getBoundingClientRect();
            
            // 마지막 메뉴 아이템이 보이는 영역 밖에 있는 경우 추가 스크롤
            if (lastMenuItemRect.bottom > parentRect.bottom) {
              // 추가 여백 확보 (20 → 60)
              const additionalScroll = lastMenuItemRect.bottom - parentRect.bottom + 60;
              
              scrollableParent.scrollTo({
                top: scrollPosition + additionalScroll,
                behavior: 'smooth'
              });
            }
          }
        }, 200); // 중첩 메뉴 스크롤을 위한 추가 지연
      }
    };

    const modifiedChildren = Children.map(children, (child, index) => {
      if (isValidElement(child)) {
        if (child.type === MenuItem) {
          // Add some props to each child
          const modifiedProps: IMenuItemProps = {
            handleParentHide,
            parentId: finalParentId,
            id: `${finalParentId}-${index}`
          };

          // Return the child with modified props
          return cloneElement(child, modifiedProps);
        } else {
          return cloneElement(child);
        }
      }

      // Return the child as is if it's not a valid React element
      return child;
    });

    const renderContent = () => {
      if (toggle === 'accordion') {
        return (
          <Collapse
            in={show}
            onEntered={handleCollapseDone}
            onExited={handleExited}
            timeout="auto"
            enter={enter}
          >
            {modifiedChildren}
          </Collapse>
        );
      } else {
        return modifiedChildren;
      }
    };

    return (
      <div
        ref={(node) => {
          // ref 전달
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          // 내부 ref 설정
          subMenuRef.current = node;
        }}
        className={clsx(
          toggle === 'accordion' && 'menu-accordion',
          toggle === 'dropdown' && 'menu-dropdown',
          className && className
        )}
      >
        {renderContent()}
      </div>
    );
  }
);

const MenuSub = memo(MenuSubComponent);
export { MenuSub };