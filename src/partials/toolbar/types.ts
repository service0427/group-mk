import { ReactNode } from 'react';

export interface IToolbarProps {
  children: ReactNode;
}

export interface IToolbarActionsProps {
  children: ReactNode;
  className?: string;
}

export interface IToolbarHeadingProps {
  children: ReactNode;
}

export interface IToolbarDescriptionProps {
  children: ReactNode;
}

export interface IToolbarPageTitleProps {
  text?: string;
  customTitle?: string;
}
