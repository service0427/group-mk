/* eslint-disable react-hooks/exhaustive-deps */
import { ClickAwayListener, Popper } from '@mui/base';
import clsx from 'clsx';
import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  memo,
  MouseEvent,
  ReactElement,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import useResponsiveProp from '@/hooks/useResponsiveProp';
import { useMatchPath } from '../../hooks/useMatchPath';
import {
  IMenuItemRef,
  IMenuItemProps,
  IMenuLabelProps,
  IMenuLinkProps,
  IMenuSubProps,
  MenuHeading,
  MenuLabel,
  MenuLink,
  MenuSub,
  TMenuToggle,
  TMenuTrigger,
  IMenuToggleProps,
  MenuToggle,
  useMenu
} from './';
import { usePathname } from '@/providers';
import { getMenuLinkPath, hasMenuActiveChild } from './utils';

const MenuItemComponent = forwardRef<IMenuItemRef | null, IMenuItemProps>(
  function MenuItem(props, ref) {
    const {
      toggle,
      trigger,
      dropdownProps,
      dropdownZIndex = 1300,
      disabled,
      tabIndex,
      className,
      handleParentHide,
      onShow,
      onHide,
      onClick,
      containerProps: ContainerPropsProp = {},
      children,
      open = false,
      parentId,
      id
    } = props;

    const { ...containerProps } = ContainerPropsProp;

    const menuItemRef = useRef<HTMLDivElement | null>(null);

    const path = props.path || getMenuLinkPath(children);

    const {
      disabled: isMenuDisabled,
      highlight,
      multipleExpand,
      setOpenAccordion,
      isOpenAccordion,
      dropdownTimeout
    } = useMenu();
    const finalParentId = parentId !== undefined ? parentId : '';
    const finalId = id !== undefined ? id : '';

    const menuContainerRef = useRef<HTMLDivElement | null>(null);

    // eslint-disable-next-line no-undef
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { pathname, prevPathname } = usePathname();

    const { match } = useMatchPath(path);

    const propToggle: TMenuToggle = useResponsiveProp(toggle, 'accordion');

    const propTrigger: TMenuTrigger = useResponsiveProp(trigger, 'click');

    const propDropdownProps = useResponsiveProp(dropdownProps);

    const active: boolean = highlight ? path.length > 0 && match : false;

    const [here, setHere] = useState(open);

    const accordionShow = isOpenAccordion(finalParentId, finalId);

    const [show, setShow] = useState(open);

    const [transitioning, setTransitioning] = useState(open);

    const [accordionEnter, setAccordionEnter] = useState(open);

    const hasSub = Children.toArray(children).some(
      (child) => isValidElement(child) && child.type === MenuSub
    );

    const handleHide = () => {
      if (hasSub) {
        setShow(false);
      }

      if (hasSub && propToggle === 'accordion' && multipleExpand === false) {
        setOpenAccordion(finalParentId, '');
      }

      if (handleParentHide) {
        handleParentHide();
      }
    };

    const handleShow = () => {
      if (hasSub) {
        setShow(true);

        // 메뉴가 펼쳐질 때 마지막 메뉴 아이템으로 스크롤
        setTimeout(() => { // 메뉴 아코디언 애니메이션이 끝난 후에 스크롤 처리
          try {
            // 현재 요소가 실제 DOM에 존재하는지 확인
            const element = menuItemRef.current;
            if (element) {
              // 긴 지연 시간을 추가하여 DOM이 완전히 업데이트되고 애니메이션이 끝날 때까지 기다림
              setTimeout(() => {
                try {
                  // 펼쳐진 메뉴의 마지막 항목 찾기 (모든 자식 요소가 로드된 후)
                  const subMenu = element.querySelector('.menu-sub');
                  if (subMenu) {
                    // 가장 마지막 메뉴 항목 찾기
                    // 중첩된 구조에서도 마지막 메뉴 항목을 찾기 위해 모든 하위 메뉴 항목 탐색
                    const allMenuItems = subMenu.querySelectorAll('.menu-item');
                    let lastMenuItem = null;

                    if (allMenuItems.length > 0) {
                      // 가장 마지막 항목을 선택
                      lastMenuItem = allMenuItems[allMenuItems.length - 1];
                    } else {
                      // 서브메뉴에서 직접 마지막 자식 요소 선택
                      lastMenuItem = subMenu.lastElementChild;
                    }

                    // 가장 마지막 요소의 바운딩 박스를 가져와서 영역이 충분히 보이게 스크롤
                    if (lastMenuItem) {
                      // 부모 스크롤 컨테이너 찾기
                      const scrollContainer = document.querySelector('.sidebar-content') || document.querySelector('.sidebar');
                      if (scrollContainer) {
                        // 마지막 항목의 위치와 크기
                        const lastItemRect = lastMenuItem.getBoundingClientRect();
                        // 스크롤 컨테이너의 위치
                        const containerRect = scrollContainer.getBoundingClientRect();

                        // 마지막 항목이 컨테이너 뷰포트 안에 있는지 확인
                        const isInView =
                          lastItemRect.top >= containerRect.top &&
                          lastItemRect.bottom <= containerRect.bottom;

                        if (!isInView) {
                          // 항목이 뷰포트 밖에 있으면 스크롤 조정
                          // 항목이 컨테이너 하단에 위치하도록 스크롤
                          scrollContainer.scrollTop = scrollContainer.scrollTop +
                                                    (lastItemRect.bottom - containerRect.bottom) +
                                                    100; // 여유 공간 추가
                        }
                      } else {
                        // 스크롤 컨테이너를 찾지 못했을 때 폴백 처리
                        lastMenuItem.scrollIntoView({
                          behavior: 'smooth',
                          block: 'end'
                        });
                      }
                    } else {
                      // 마지막 항목이 없으면 현재 요소로 스크롤
                      element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest'
                      });
                    }
                  } else {
                    // 서브메뉴가 없으면 현재 요소로 스크롤
                    element.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest'
                    });
                  }
                } catch (innerError) {
                  console.error('내부 스크롤 처리 오류:', innerError);
                }
              }, 100);
            }
          } catch (error) {
            console.error('스크롤 오류:', error);
          }
        }, 300);
      }

      if (hasSub && propToggle === 'accordion' && multipleExpand === false) {
        setOpenAccordion(finalParentId, finalId);
      }
    };

    const handleMouseEnter = (e: MouseEvent<HTMLElement>) => {
      if (isMenuDisabled) return;

      // Cancel any previously set hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (propTrigger === 'hover') {
        setShow(true);

        if (containerProps.onMouseEnter) {
          containerProps.onMouseEnter(e);
        }
      }
    };

    const handleMouseLeave = (e: MouseEvent<HTMLElement>) => {
      if (isMenuDisabled) return;

      if (propTrigger === 'hover') {
        // Set a timeout to hide the dropdown after `dropdownTimeout` delay
        hideTimeoutRef.current = setTimeout(() => {
          setShow(false);

          if (containerProps.onMouseLeave) {
            containerProps.onMouseLeave(e);
          }

          hideTimeoutRef.current = null; // Reset the timeout reference
        }, dropdownTimeout);
      }
    };

    const handleToggle = (e: MouseEvent<HTMLElement>) => {
      if (isMenuDisabled) return;

      if (disabled) return;

      if (show) {
        if (propToggle === 'accordion') {
          setAccordionEnter(true);
        }

        handleHide();
      } else {
        if (propToggle === 'accordion') {
          setAccordionEnter(true);
        }

        handleShow();
      }

      if (onClick) {
        onClick(e, props);
      }
    };

    const handleClick = (e: MouseEvent<HTMLElement>) => {
      if (disabled) {
        return;
      }

      handleHide();

      if (onClick) {
        onClick(e, props);
      }
    };

    const renderLink = (child: ReactElement) => {
      // Add some props to each child
      const modifiedProps: IMenuLinkProps = {
        hasItemSub: hasSub,
        tabIndex,
        handleToggle,
        handleClick
      };

      // Return the child with modified props
      return cloneElement(child, modifiedProps);
    };

    const renderToggle = (child: ReactElement) => {
      // Add some props to each child
      const modifiedProps: IMenuToggleProps = {
        hasItemSub: hasSub,
        tabIndex,
        handleToggle
      };

      // Return the child with modified props
      return cloneElement(child, modifiedProps);
    };

    const renderLabel = (child: ReactElement) => {
      // Add some props to each child
      const modifiedProps: IMenuLabelProps = {
        hasItemSub: hasSub,
        tabIndex,
        handleToggle,
        handleClick
      };

      // Return the child with modified props
      return cloneElement(child, modifiedProps);
    };

    const renderHeading = (child: ReactElement) => {
      return cloneElement(child);
    };

    const renderSubDropdown = (child: ReactElement) => {
      // Add some props to each child
      const modifiedProps: IMenuSubProps = {
        parentId: `${parentId}-${finalId}`,
        toggle: propToggle,
        handleParentHide: handleHide,
        tabIndex,
        menuItemRef: ref
      };

      const modofiedChild = cloneElement(child, modifiedProps);

      return (
        <Popper
          style={{
            zIndex: dropdownZIndex,
            pointerEvents: trigger === 'click' ? 'auto' : 'none'
          }}
          {...propDropdownProps}
          anchorEl={show ? menuItemRef.current : null}
          open={show}
          autoFocus={false}
          className={clsx(child.props.rootClassName && child.props.rootClassName)}
        >
          <ClickAwayListener onClickAway={handleHide}>
            <div
              className={clsx(
                'menu-container',
                child.props.baseClassName && child.props.baseClassName
              )}
              ref={menuContainerRef}
              style={{ pointerEvents: 'auto' }}
            >
              {modofiedChild}
            </div>
          </ClickAwayListener>
        </Popper>
      );
    };

    const renderSubAccordion = (child: ReactElement) => {
      const handleEntered = () => {
        setTransitioning(true);
      };

      const handleExited = () => {
        setTransitioning(false);
        setAccordionEnter(true);
      };

      // Add some props to each child
      const modifiedProps: IMenuSubProps = {
        parentId: `${parentId}-${finalId}`,
        tabIndex,
        show,
        enter: accordionEnter,
        toggle: propToggle,
        handleClick,
        handleEntered,
        handleExited
      };

      return cloneElement(child, modifiedProps);
    };

    const renderChildren = () => {
      const modifiedChildren = Children.map(children, (child) => {
        if (isValidElement(child)) {
          if (child.type === MenuLink) {
            return renderLink(child);
          } else if (child.type === MenuToggle) {
            return renderToggle(child);
          } else if (child.type === MenuLabel) {
            return renderLabel(child);
          } else if (child.type === MenuHeading) {
            return renderHeading(child);
          } else if (child.type === MenuSub && propToggle === 'dropdown') {
            return renderSubDropdown(child);
          } else if (child.type === MenuSub && propToggle === 'accordion') {
            return renderSubAccordion(child);
          }
        }

        return child;
      });

      return modifiedChildren;
    };

    useImperativeHandle(
      ref,
      () => ({
        current: menuItemRef.current,
        show: () => {
          handleShow();
        },
        hide: () => {
          handleHide();
        },
        isOpen: () => {
          return show;
        }
      }),
      [show]
    );

    useEffect(() => {
      if (show) {
        if (onShow) {
          onShow();
        }
      } else {
        if (onHide) {
          onHide();
        }
      }
    }, [show]);

    useEffect(() => {
      if (propToggle === 'accordion' && multipleExpand === false) {
        setShow(accordionShow);
      }
    }, [accordionShow]);

    useEffect(() => {
      if (highlight) {
        if (hasMenuActiveChild(pathname, children)) {
          if (propToggle === 'accordion') {
            setShow(true);
          }

          setHere(true);
        } else {
          if (propToggle === 'accordion') {
            setShow(false);
          }

          setHere(false);
        }
      }

      if (prevPathname !== pathname && hasSub && propToggle === 'dropdown') {
        handleHide();
      }
    }, [pathname]);

    // Cleanup: ensure that any timeouts are cleared when the component unmounts
    useEffect(() => {
      return () => {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
      };
    }, []);

    return (
      <div
        {...containerProps}
        ref={menuItemRef}
        tabIndex={tabIndex}
        {...(propToggle === 'dropdown' && {
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave
        })}
        className={clsx(
          'menu-item',
          propToggle === 'dropdown' && 'menu-item-dropdown',
          className && className,
          active && 'active',
          show && 'show',
          here && 'here',
          transitioning && 'transitioning'
        )}
      >
        {renderChildren()}
      </div>
    );
  }
);

const MenuItem = memo(MenuItemComponent);
export { MenuItem };
