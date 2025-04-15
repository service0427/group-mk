import { TimelinesWrapper } from '@/partials/timelines/default/item';

const ActivitiesDesignerWelcome = () => {
  return (
    <TimelinesWrapper icon="design-1" line={true}>
      <div className="flex flex-col">
        <div className="text-sm text-gray-800">
          Onboarded a talented designer to our creative team, adding valuable expertise to upcoming
          projects.
        </div>
        <span className="text-xs text-gray-600">2 weeks ago, 10:45 AM</span>
      </div>
    </TimelinesWrapper>
  );
};

export { ActivitiesDesignerWelcome };
