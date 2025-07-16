import { HTMLAttributes } from 'react';

export type TKeenIconsStyle = 'duotone' | 'filled' | 'solid' | 'outline';

export interface IKeenIconsProps extends HTMLAttributes<HTMLElement> {
  icon: string;
  style?: TKeenIconsStyle;
  className?: string;
}
