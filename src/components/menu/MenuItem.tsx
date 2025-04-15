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
