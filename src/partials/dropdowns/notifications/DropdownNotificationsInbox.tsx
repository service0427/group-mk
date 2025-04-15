import { useEffect, useRef, useState } from 'react';
import { getHeight } from '@/utils';
import { useViewport } from '@/hooks';
import {
  DropdownNotificationsItem10,
  DropdownNotificationsItem11,
  DropdownNotificationsItem12,
  DropdownNotificationsItem13,
  DropdownNotificationsItem3,
  DropdownNotificationsItem5
} from './items';

const DropdownNotificationsInbox = () => {
  const footerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState<number>(0);
  const [viewportHeight] = useViewport();
  const offset = 300;

  useEffect(() => {
    if (footerRef.current) {
      const footerHeight = getHeight(footerRef.current);
      const availableHeight = viewportHeight - footerHeight - offset;
      setListHeight(availableHeight);
    }
  }, [viewportHeight]);

  const buildList = () => {
    return (
      <div className="flex flex-col gap-5 pt-3 pb-4 divider-y divider-gray-200">
        <DropdownNotificationsItem10 />

        <div className="border-b border-b-gray-200"></div>

        <DropdownNotificationsItem11 />

        <div className="border-b border-b-gray-200"></div>

        <DropdownNotificationsItem12 />

        <div className="border-b border-b-gray-200"></div>

        <DropdownNotificationsItem13 />

        <div className="border-b border-b-gray-200"></div>

        <DropdownNotificationsItem3
          userName="Benjamin Harris"
          avatar="300-30.png"
          badgeColor="bg-gray-400"
          description="requested to upgrade plan"
          link=""
          day=""
          date="4 days ago"
          info="Marketing"
        />

        <div className="border-b border-b-gray-200"></div>

        <DropdownNotificationsItem5
          userName="Isaac Morgan"
          avatar="300-24.png"
          badgeColor="badge-success"
          description="mentioned you in"
          link="Data Transmission"
          day="topic"
          date="6 days ago"
          info="Dev Team"
        />

        <div className="border-b border-b-gray-200"></div>
      </div>
    );
  };

  const buildFooter = () => {
    return (
      <>
        <div className="border-b border-b-gray-200"></div>
        <div className="grid grid-cols-2 p-5 gap-2.5">
          <button className="btn btn-sm btn-light justify-center">Archive all</button>
          <button className="btn btn-sm btn-light justify-center">Mark all as read</button>
        </div>
      </>
    );
  };

  return (
    <div className="grow">
      <div className="scrollable-y-auto" style={{ maxHeight: `${listHeight}px` }}>
        {buildList()}
      </div>
      <div ref={footerRef}>{buildFooter()}</div>
    </div>
  );
};

export { DropdownNotificationsInbox };
