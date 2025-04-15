import { TimelinesWrapper } from '@/partials/timelines/default/item';

const ActivitiesNewProduct = () => {
  return (
    <TimelinesWrapper icon="people" line={true}>
      <div className="flex flex-col">
        <div className="text-sm text-gray-800">
          Jenny sent an
          <a href="#" className="text-sm link">
            &nbsp;inquiry&nbsp;
          </a>
          about a
          <a href="#" className="text-sm link">
            &nbsp;new product&nbsp;
          </a>
          .
        </div>
        <span className="text-xs text-gray-600">Today, 9:00 AM</span>
      </div>
    </TimelinesWrapper>
  );
};

export { ActivitiesNewProduct };
