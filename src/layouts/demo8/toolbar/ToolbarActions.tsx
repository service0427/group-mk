import { ReactNode } from 'react';

export interface IToolbarActionsProps {
  children?: ReactNode;
}

const ToolbarActions = ({ children }: IToolbarActionsProps) => {
  return <div className="flex items-center flex-wrap gap-1.5 lg:gap-2.5">{children}</div>;
};

export { ToolbarActions };
