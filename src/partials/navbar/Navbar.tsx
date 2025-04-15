import { ReactNode } from 'react';

export interface INavbarProps {
  children: ReactNode;
}

export interface INavbarActionsProps {
  children: ReactNode;
}

const Navbar = ({ children }: INavbarProps) => {
  return (
    <div className="flex items-center flex-wrap md:flex-nowrap lg:items-end justify-between border-b border-b-gray-200 dark:border-b-coal-100 gap-3 lg:gap-6 mb-5 lg:mb-10">
      {children}
    </div>
  );
};

export { Navbar };
