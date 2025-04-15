import { ReactNode } from 'react';

export interface IUserProfileHeroInfo {
  email?: string;
  label?: string;
  icon?: string;
}

export interface IUserProfileHeroProps {
  image?: ReactNode;
  name?: string;
  info: IUserProfileHeroInfo[];
}
