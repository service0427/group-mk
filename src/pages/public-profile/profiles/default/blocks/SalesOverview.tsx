import { KeenIcon } from '@/components';

const SalesOverview = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Sales Overview</h3>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1">
              <div className="size-[11px] border-2 border-brand rounded-full"></div>
              <div className="text-2sm font-medium text-gray-500">Goals</div>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-[11px] border-2 border-success rounded-full"></div>
              <div className="text-2sm font-medium text-gray-500">Sales</div>
            </div>
          </div>

          <button className="btn btn-sm btn-icon btn-light btn-clear">
            <KeenIcon icon="dots-vertical" />
          </button>
        </div>
      </div>
      <div className="px-3 py-1">
        <div id="sales_overview_chart"></div>
      </div>
    </div>
  );
};

export { SalesOverview };
