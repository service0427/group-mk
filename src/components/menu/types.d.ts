/* eslint-disable no-unused-vars */
import { PopperProps } from '@mui/base';
import { TooltipProps } from '@mui/material/Tooltip';
import { HTMLAttributes, MouseEvent, ReactNode, RefAttributes, RefObject } from 'react';

export type TMenuEventHandler = (e: MouseEvent<HTMLElement>) => void;

export type TMenuClickEvent = (e: MouseEvent<HTMLElement>, props: unknown) => void;

export type TMenuShow = boolean;

export type TMenuTrigger = 'click' | 'hover';

export type TMenuItemTrigger = Record<string, TMenuToggle> | TMenuTrigger;

export type TMenuToggle = 'accordion' | 'dropdown';

export type TMenuItemToggle = Record<string, TMenuToggle> | TMenuToggle;

export type TMenuDropdown = Partial<Omit<PopperProps, 'children'>>;

export type TMenuTabIndex = number;

export interface IMenuProps {
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  highlight?: boolean;
  dropdownTimeout?: number;
  multipleExpand?: boolean;
}

export interface IMenuContextProps {
  className?: string;
  children?: ReactNode;
  highlight?: boolean;
  disabled?: boolean;
  dropdownTimeout?: number;
  multipleExpand?: boolean;
  setOpenAccordion: (parentId: string, id: string) => void;
  isOpenAccordion: (parentId: string, id: string) => boolean;
}

export interface IMenuItemRef {
  show: () => void;
  hide: () => void;
  isOpen: () => boolean;
}

export interface IMenuItemProps {
  path?: string;
  id?: string;
  parentId?: string;
  open?: boolean;
  toggle?: TMenuItemToggle;
  trigger?: TMenuItemTrigger;
  disabled?: boolean;
  dropdownProps?: TMenuDropdown;
  dropdownZIndex?: number;
  className?: string;
  closeParentMenu?: CallableFunction;
  onClick?: TMenuClickEvent;
  onShow?: CallableFunction;
  onHide?: CallableFunction;
  handleParentHide?: CallableFunction;
  handleClick?: TMenuEventHandler;
  tabIndex?: TMenuTabIndex;
  itemRef?: unknown;
  containerProps?: HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement | null>;
  containerRef?: RefObject<HTMLDivElement>;
  children?: ReactNode;
}

export interface IMenuLinkProps {
  ref?: unknown;
  path?: string;
  externalLink?: boolean;
  newTab?: boolean;
  hasItemSub?: boolean;
  className?: string;
  tabIndex?: TMenuTabIndex;
  handleToggle?: TMenuEventHandler;
  handleClick?: TMenuEventHandler;
  children?: ReactNode;
}

export interface IMenuLabelProps {
  hasItemSub?: boolean;
  className?: string;
  tabIndex?: TMenuTabIndex;
  handleToggle?: TMenuEventHandler;
  handleClick?: TMenuEventHandler;
  children?: ReactNode;
}

export interface IMenuToggleProps {
  className?: string;
  tabIndex?: TMenuTabIndex;
  hasItemSub?: boolean;
  menuItemRef?: unknown;
  handleToggle?: TMenuEventHandler;
  handleClick?: TMenuEventHandler;
  onClick?: TMenuClickEvent;
  children?: ReactNode;
}

export interface IMenuSubProps {
  parentId?: string;
  show?: TMenuShow;
  enter?: boolean;
  toggle?: TMenuToggle;
  ref?: unknown;
  menuItemRef?: unknown;
  tabIndex?: number;
  className?: string;
  rootClassName?: string;
  baseClassName?: string;
  onClick?: TMenuClickEvent;
  handleParentHide?: CallableFunction;
  handleClick?: TMenuEventHandler;
  handleEntered?: () => void;
  handleExited?: () => void;
  accordionIn?: boolean;
  children?: ReactNode;
}
export interface IMenuTitleProps {
  className?: string;
  children?: ReactNode;
}

export interface IMenuIconProps {
  className?: string;
  children: ReactNode;
}

export interface IMenuBadgeProps {
  className?: string;
  children: ReactNode;
}

export interface IMenuSeparatorProps {
  className?: string;
}

export interface IMenuBulletProps {
  className?: string;
  children?: ReactNode;
}

export interface IMenuHeadingProps {
  className?: string;
  children: ReactNode;
}

export interface IMenuItemConfig {
  title?: string;
  disabled?: boolean;
  heading?: string;
  icon?: string;
  badge?: string;
  separator?: boolean;
  tooltip?: Partial<TooltipProps>;
  path?: string;
  rootPath?: string;
  bullet?: boolean;
  collapse?: boolean;
  collapseTitle?: string;
  expandTitle?: string;
  toggle?: TMenuItemToggle;
  dropdownProps?: TMenuDropdown;
  trigger?: TMenuItemTrigger;
  children?: IMenuItemConfig[];
  childrenIndex?: number;
}

export type TMenuConfig = IMenuItemConfig[];

export interface IMenuBreadcrumb {
  title?: string;
  path?: string;
  active?: boolean;
}

export type TMenuBreadcrumbs = IMenuBreadcrumb[];
