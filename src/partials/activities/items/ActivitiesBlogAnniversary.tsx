import { TimelinesWrapper } from '@/partials/timelines/default/item';

const ActivitiesBlogAnniversary = () => {
  return (
    <TimelinesWrapper icon="rocket" line={false}>
      <div className="flex flex-col">
        <div className="text-sm text-gray-800">
          We recently
          <a href="#" className="text-sm font-medium link">
            &nbsp;celebrated&nbsp;
          </a>
          the blog&apos;s 1-year anniversary
        </div>
        <span className="text-xs text-gray-600">3 weeks ago, 4:07 PM</span>
      </div>
    </TimelinesWrapper>
  );
};

export { ActivitiesBlogAnniversary };
