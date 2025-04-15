import * as React from 'react';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';

// Tooltip component that applies utility classes and custom styles
const DefaultTooltip = ({ className = '', ...props }: TooltipProps) => (
  <Tooltip
    TransitionProps={{ timeout: 300 }}
    {...props}
    classes={{
      popper: className,
      tooltip:
        '!text-white !rounded-md !text-xs !font-normal !bg-[--tw-tooltip-background-color] !box-shadow[--tw-tooltip-box-shadow] !border[--tw-tooltip-border] !px-2 !py-1.5'
    }}
  />
);

export { DefaultTooltip };
