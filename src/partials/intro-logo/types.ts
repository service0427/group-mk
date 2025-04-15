import { ReactNode } from 'react';

export interface IIntroLogoInfo {
  email?: string;
  label?: string;
  icon?: string;
}

export interface IIntroLogoProps {
  image?: ReactNode;
  name?: string;
  info: IIntroLogoInfo[];
}
