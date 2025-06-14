import { Fragment, useState } from 'react';

import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

import { CommonHexagonBadge } from '@/partials/common';

interface IExternalServicesManageApiProps {
  title: string;
  switch: boolean;
}

const ExternalServicesManageApi = ({
  title,
  switch: showSwitch
}: IExternalServicesManageApiProps) => {

const [apikeyInput, setApiKeyInput] = useState('abc123xyz456sample789key000');

  return (
    <Fragment>
      <style>
        {`
          .user-access-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-5.png')}');
          }
          .dark .user-access-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-5-dark.png')}');
          }
        `}
      </style>

      <div className="card">
        <div className="card-header mb-5" id="external_services_manage_api">
          <h3 className="card-title">{title || 'Manage API'}</h3>
          {showSwitch && (
            <div className="flex items-center gap-2">
              <label className="switch switch-sm">
                <span className="switch-label">Pause</span>
                <input type="checkbox" value="1" name="check" readOnly />
              </label>
            </div>
          )}
        </div>

        <div className="card-body lg:py-7.5 grid gap-5 lg:gap-7.5">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
            <label className="form-label max-w-56 text-gray-800 font-normal">API Key</label>

            <label className="input">
              <input
                placeholder="Right icon"
                type="text"
                value={apikeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              /> 
              <button className="btn btn-icon">
                <KeenIcon icon="copy" />
              </button>
            </label>
          </div>

          <div className="flex items-center flex-wrap sm:flex-nowrap justify-between grow border border-gray-200 rounded-xl gap-2 p-5 
          rtl:[background-position:-195px_-85px] [background-position:195px_-85px] bg-no-repeat bg-[length:650px] user-access-bg">
            <div className="flex items-center gap-4">
              <CommonHexagonBadge
                stroke="stroke-brand-clarity"
                fill="fill-brand-light"
                size="size-[50px]"
                badge={<KeenIcon icon="security-user" className="text-xl text-brand" />}
              />

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center flex-wrap gap-2.5">
                  <a
                    href="#"
                    className="text-base font-medium text-gray-900 hover:text-primary-active"
                  >
                    User Access
                  </a>
                  <span className="badge badge-sm badge-outline shrink-0">16 days left</span>
                </div>

                <div className="form-info text-gray-800 font-normal">
                  This API key can only access&nbsp;
                  <a href="https://keenthemes.com/" className="link">
                    @keenthemes
                  </a>
                  <br />
                  Secure access with a unique API key for enhanced functionality.
                </div>
              </div>
            </div>

            <div className="flex items-center flex-wrap md:flex-nowrap gap-1.5">
              <button className="btn btn-sm btn-dark shrink-0">Renew Plan</button>
              <a href="#" className="btn btn-sm btn-clear btn-light">
                Docs
              </a>
            </div>
          </div>

          <p className="text-2sm text-gray-800">
            Unlock the full potential of your application with our API, a secure gateway
            facilitating seamless integration, empowering developers to create innovative and
            dynamic experiences effortlessly.
          </p>
        </div>
      </div>
    </Fragment>
  );
};

export { ExternalServicesManageApi, type IExternalServicesManageApiProps };
