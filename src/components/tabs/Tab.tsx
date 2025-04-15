import React, { forwardRef } from 'react';
import { Tab as MuiTab, TabProps as MuiTabProps } from '@mui/base/Tab';
import clsx from 'clsx';

// Define the extended tab component
const Tab = forwardRef<HTMLButtonElement, MuiTabProps>((props, ref) => {
  return (
    <MuiTab
      slotProps={{
        root: ({ selected, disabled }) => ({
          className: clsx('tab', selected && 'active', disabled && 'disabled')
        })
      }}
      {...props}
      ref={ref}
    />
  );
});

export { Tab };
