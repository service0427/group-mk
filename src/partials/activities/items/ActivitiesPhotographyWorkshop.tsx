import { toAbsoluteUrl } from '@/utils/Assets';

import { TimelinesWrapper } from '@/partials/timelines/default/item';

const ActivitiesPhotographyWorkshop = () => {
  return (
    <TimelinesWrapper icon="code" line={true}>
      <div className="flex flex-col pb-2.5">
        <span className="text-sm text-gray-800">
          Jenny attended a Nature Photography Immersion workshop
        </span>
        <span className="text-xs text-gray-600">3 days ago, 11:45 AM</span>
      </div>

      <div className="card shadow-none">
        <div className="card-body">
          <div className="grid gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="flex items-center gap-5 shrink-0">
                <div className="border border-brand-clarity rounded-lg  max-h-20">
                  <div className="flex items-center justify-center border-b border-b-brand-clarity bg-brand-light rounded-t-lg">
                    <span className="text-2sm text-brand font-medium p-2">Apr</span>
                  </div>
                  <div className="flex items-center justify-center size-12">
                    <span className="font-medium text-gray-800 text-1.5xl tracking-tight">02</span>
                  </div>
                </div>

                <img
                  src={toAbsoluteUrl('/media/images/600x400/8.jpg')}
                  className="rounded-lg max-h-20 max-w-full"
                  alt=""
                />
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  className="text-xs text-brand leading-[14px] hover:text-primary-active mb-px"
                >
                  Photo Workshop
                </a>
                <a
                  href="#"
                  className="text-md font-medium hover:text-primary text-gray-900 leading-4"
                >
                  Nature Photography Immersion
                </a>
                <p className="text-xs text-gray-800 leading-[22px]">
                  Enhance your nature photography skills in a hands-on workshop guided by
                  experienced photographers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TimelinesWrapper>
  );
};

export { ActivitiesPhotographyWorkshop };
