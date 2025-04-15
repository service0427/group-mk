import { useEffect, useRef, useState } from 'react';
import { getHeight } from '@/utils';
import { useViewport } from '@/hooks';
import {
  DropdownNotificationsItem7,
  DropdownNotificationsItem5,
  DropdownNotificationsItem8,
  DropdownNotificationsItem1,
  DropdownNotificationsItem3
} from './items';

const DropdownNotificationsTeam = () => {
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
        <DropdownNotificationsItem7 />

        <div className="border-b border-b-gray-200"></div>

        <DropdownNotificationsItem5
          userName="Adrian Vale"
          avatar="300-6.png"
          badgeColor="bg-gray-400"
          description="posted a new article"
          link="Marketing"
          day="to 13 May"
          date="2 days ago"
          info="Marketing"
        />

        <div className="border-b border-b-gray-200"></div>

        <DropdownNotificationsItem8 />

        <DropdownNotificationsItem1
          userName="Selene Silverleaf"
          avatar="300-21.png"
          description="commented on"
          link="SiteSculpt"
          label=""
          time="4 days ago"
          specialist="Manager"
          text="This design  is simply stunning! From layout to color, it's a work of art!"
        />

        <div className="border-b border-b-gray-200"></div>

        <DropdownNotificationsItem3
          userName="Thalia Fox"
          avatar="300-13.png"
          badgeColor="badge-success"
          description="has invited you to join"
          link="Design Research"
          day=""
          date="4 days ago"
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

export { DropdownNotificationsTeam };
