import { TimelinesWrapper } from '@/partials/timelines/default/item';

const ActivitiesProjectStatus = () => {
  return (
    <TimelinesWrapper icon="rocket" line={false}>
      <div className="flex flex-col">
        <div className="text-sm text-gray-900">
          Completed phase one of client project ahead of schedule.
        </div>
        <span className="text-xs text-gray-600">6 days ago, 10:45 AM</span>
      </div>
    </TimelinesWrapper>
  );
};

export { ActivitiesProjectStatus };
