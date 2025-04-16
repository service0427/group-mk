import { ReactNode } from 'react';

export interface IToolbarProps {
  children?: ReactNode;
}

const Toolbar = ({ children }: IToolbarProps) => {
  return <div className="flex flex-wrap items-center justify-between gap-5 pb-7.5">{children}</div>;
};

export { Toolbar };
