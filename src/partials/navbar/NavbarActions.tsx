import { INavbarActionsProps } from './';

const NavbarActions = ({ children }: INavbarActionsProps) => {
  return (
    <div className="flex items-center justify-end grow lg:grow-0 lg:pb-4 gap-2.5 mb-3 lg:mb-0">
      {children}
    </div>
  );
};

export { NavbarActions };
