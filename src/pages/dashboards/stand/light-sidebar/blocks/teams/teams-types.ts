export type Pad2 = number | `0${number}`;
export type IsoDate = `${number}-${Pad2}-${Pad2}`;
export type URL = null | `${'http://' | 'https://'}${string}`;

export type Link = {
  url: URL;
  label: '&laquo; Previous' | `${number}` | `Next &raquo;`;
  active: boolean;
};

export type Pagination = {
  links: Link[];
  current_page: number;
  first_page_url: URL;
  from: null | number;
  last_page: number;
  next_page_url: null | URL;
  items_per_page: number;
  prev_page_url: null | number;
  to: number;
  total: number;
};

export type QueryApiResponse<T> = {
  data: T[];
  pagination: Pagination;
};

export type User = {
  avatar: `/media/avatars/${string}`;
  color: string;
  created_at: IsoDate;
  email: `${string}@${string}`;
  email_verified_at: null | boolean;
  first_name: string;
  id: number;
  last_name: string;
  role: string;
  status: string;
  two_steps_auth: number;
  updated_at: IsoDate;
};

export type Team = {
  id: number;
  name: string;
  description: string;
  rating: 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5;
  created_at: IsoDate;
  updated_at: IsoDate;
  users: User[];
};
