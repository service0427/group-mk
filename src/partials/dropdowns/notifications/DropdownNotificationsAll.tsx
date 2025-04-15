import { useEffect, useRef, useState } from 'react';
import { getHeight } from '@/utils';
import { useViewport } from '@/hooks';
import {
  DropdownNotificationsItem1,
  DropdownNotificationsItem2,
  DropdownNotificationsItem3,
  DropdownNotificationsItem4,
  DropdownNotificationsItem5,
  DropdownNotificationsItem6
} from './items';

const DropdownNotificationsAll = () => {
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
        <DropdownNotificationsItem1
          userName="Joe Lincoln"
          avatar="300-4.png"
          description="mentioned you in"
          link="Latest Trends"
          label="topic"
          time="18 mins ago"
          specialist="Web Design 2024"
          text="For an expert opinion, check out what Mike has to say on this topic!"
        />

        <div className="border-b border-b-gray-200"></div>

        <DropdownNotificationsItem2 />

        <div className="border-b border-b-gray-200"></div>

        <DropdownNotificationsItem3
          userName="Guy Hawkins"
          avatar="300-27.png"
          badgeColor="bg-gray-400"
          description="requested access to"
          link="AirSpace"
          day="project"
          date="14 hours ago"
          info="Dev Team"
        />

        <div className="border-b border-b-gray-200"></div>

        <DropdownNotificationsItem4 />

        <div className="border-b border-b-gray-200"></div>

        <DropdownNotificationsItem5
          userName="Raymond Pawell"
          avatar="300-11.png"
          badgeColor="badge-success"
          description="posted a new article"
          link="2024 Roadmap"
          day=""
          date="1 hour ago"
          info="Roadmap"
        />

        <div className="border-b border-b-gray-200"></div>

        <DropdownNotificationsItem6 />
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

export { DropdownNotificationsAll };
