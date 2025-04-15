import { ReactNode } from 'react';

import { KeenIcon } from '@/components';

interface ITimelinesWrapperProps {
  icon: string;
  line: boolean;
  children: ReactNode;
  removeSpace?: boolean;
}

const TimelinesWrapper = ({ line, icon, children, removeSpace }: ITimelinesWrapperProps) => {
  return (
    <div className="flex items-start relative">
      {line && (
        <div className="w-9 start-0 top-9 absolute bottom-0 rtl:-translate-x-1/2 translate-x-1/2 border-s border-s-gray-300"></div>
      )}

      <div className="flex items-center justify-center shrink-0 rounded-full bg-gray-100 border border-gray-300 size-9 text-gray-600">
        <KeenIcon icon={icon} className="text-base" />
      </div>
      <div className={`ps-2.5 ${!removeSpace ? 'mb-7' : ''} text-md grow`}>{children}</div>
    </div>
  );
};

export { TimelinesWrapper };
