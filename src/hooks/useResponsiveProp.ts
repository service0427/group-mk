/* eslint-disable react-hooks/rules-of-hooks */
import { useResponsive, TResponsiveBreakpoint } from '.';

export default function useResponsiveProp(prop: any, defaultProp: any = null) {
  let value = prop;

  if (prop) {
    for (const condition in prop) {
      const breakpoint = prop[condition] as TResponsiveBreakpoint;
      if (condition === 'up' && useResponsive('up', breakpoint)) {
        value = prop[condition][breakpoint];
      } else if (condition === 'down' && useResponsive('down', breakpoint)) {
        value = prop[condition][breakpoint];
      }
    }
  }

  value = value ?? defaultProp;

  return value;
}

export { useResponsiveProp };
