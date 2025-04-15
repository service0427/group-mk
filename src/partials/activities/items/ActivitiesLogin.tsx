import { TimelinesWrapper } from '@/partials/timelines/default/item';

const ActivitiesLogin = () => {
  return (
    <TimelinesWrapper icon="entrance-left" line={true}>
      <div className="flex flex-col">
        <div className="text-sm text-gray-800">
          Jenny&apos;s last login to the
          <a href="#" className="text-sm link">
            &nbsp;Customer Portal&nbsp;
          </a>
        </div>
        <span className="text-xs text-gray-600">5 days ago, 4:07 PM</span>
      </div>
    </TimelinesWrapper>
  );
};

export { ActivitiesLogin };
