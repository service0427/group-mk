import React, { forwardRef } from 'react';
import { Tabs as MuiTabs, TabsProps as MuiTabsProps } from '@mui/base/Tabs';

// Define the extended tab component
const Tabs = forwardRef<HTMLDivElement, MuiTabsProps>((props, ref) => {
  return <MuiTabs {...props} ref={ref} />;
});

export { Tabs };
