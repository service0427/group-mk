import { IAvatarsItems } from '@/partials/common';

export interface IModalSearchDocsItem {
  image: string;
  desc: string;
  date: string;
}

export interface IModalSearchSettingsItem {
  icon: string;
  info: string;
}

export interface IModalSearchSettingsGroup {
  title: string;
  children: IModalSearchSettingsItem[];
}

export interface IModalSearchIntegrationsIAvatar {
  filename?: string;
  fallback?: string;
  variant: string;
}

export interface IModalSearchIntegrationsItem {
  logo: string;
  name: string;
  description: string;
  team: IAvatarsItems;
}

export interface IModalSearchUsersItem {
  avatar: string;
  name: string;
  email: string;
  label: string;
  color: string;
}
