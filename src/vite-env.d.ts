/// <reference types="vite/client" />

// inert 속성 타입 선언 (접근성 문제 해결용)
declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    inert?: string | undefined;
  }
}

// ApexCharts 타입 선언
declare module 'react-apexcharts' {
  import { ComponentType } from 'react';
  
  interface ApexChartsProps {
    type?: string;
    series?: any;
    width?: string | number;
    height?: string | number;
    options?: any;
    [key: string]: any;
  }
  
  const ApexCharts: ComponentType<ApexChartsProps>;
  export default ApexCharts;
}

declare namespace ApexCharts {
  export interface ApexOptions {
    chart?: any;
    colors?: any;
    stroke?: any;
    grid?: any;
    markers?: any;
    xaxis?: any;
    yaxis?: any;
    dataLabels?: any;
    tooltip?: any;
    legend?: any;
    series?: any;
    [key: string]: any;
  }
}
