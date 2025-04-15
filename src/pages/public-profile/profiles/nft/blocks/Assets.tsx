import { KeenIcon } from '@/components';

const Assets = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Assets</h3>
      </div>
      <div className="card-body">
        <div className="grid gap-y-5">
          <div className="flex align-start gap-2">
            <KeenIcon icon="xmr" className="text-2.5xl leading-none text-brand" />

            <div className="flex flex-col gap-2">
              <span className="text-2.5xl font-semibold text-gray-900 leading-none tracking-tight">
                302.97 XMR
              </span>
              <span className="text-sm font-medium text-gray-700">$42,074.81</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Assets };
