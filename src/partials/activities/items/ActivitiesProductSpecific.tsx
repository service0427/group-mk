import { TimelinesWrapper } from '@/partials/timelines/default/item';

const ActivitiesProductSpecific = () => {
  return (
    <TimelinesWrapper icon="rocket" line={false}>
      <div className="flex flex-col">
        <div className="text-sm text-gray-800">
          Explored niche demo ideas for product-specific solutions.
        </div>
        <span className="text-xs text-gray-600">3 weeks ago, 4:07 PM</span>
      </div>
    </TimelinesWrapper>
  );
};

export { ActivitiesProductSpecific };
