import { IToolbarActionsProps } from './types';

const ToolbarActions = ({ children, className }: IToolbarActionsProps) => {
  return <div className={className || "flex items-center gap-2.5"}>{children}</div>;
};

export { ToolbarActions };
