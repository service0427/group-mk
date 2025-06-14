import { Fragment, useState } from 'react';

import { toAbsoluteUrl } from '@/utils/Assets';

interface IAuthSingleSingOnItem {
  logo: string;
  title: string;
  size: string;
  checked?: boolean;
}
interface IAuthSingleSingOnItems extends Array<IAuthSingleSingOnItem> {}

const AuthSingleSingOn = () => {
  const [clientIdInput, setClientIdInput] = useState('02874374-367145773');
  const [clientSecretInput, setClientSecretInput] = useState('23djfn784957f8022we2232307822-cey2442');
  const [customInput, setCustomInput] = useState('https://devs.keenthemes.com/rl/AirMikeStudios');

  const items: IAuthSingleSingOnItems = [
    {
      logo: 'azure.svg',
      title: 'Microsoft Azure',
      size: 'w-5',
      checked: false
    },
    {
      logo: 'google.svg',
      title: 'Google',
      size: 'w-8',
      checked: true
    },
    {
      logo: 'openid.svg',
      title: 'OpenID Connect',
      size: 'w-24',
      checked: false
    }
  ];

  const renderItem = (item: IAuthSingleSingOnItem, index: number) => {
    return (
      <label
        key={index}
        className="flex align-stretch cursor-pointer bg-center h-44 bg-no-repeat border border-gray-300 rounded-xl border-dashed 
        has-[:checked]:border-primary bg-[length:500px] sso-active singl-sign-on-bg"
      >
        <div className="flex flex-col place-items-center place-content-center rounded-xl grow">
          <div className="flex items-center h-11">
            <img
              src={toAbsoluteUrl(`/media/brand-logos/${item.logo}`)}
              className={item.size}
              alt=""
            />
          </div>
          <span className="text-md font-medium text-gray-900">{item.title}</span>
          <input
            className="appearance-none"
            type="radio"
            name="sso_option"
            defaultChecked={index === 1}
            value="1"
            readOnly
          />
        </div>
      </label>
    );
  };

  return (
    <Fragment>
      <style>
        {`
          .singl-sign-on-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
          }
          .dark .singl-sign-on-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
          }
        `}
      </style>

      <div className="card">
        <div className="card-header" id="auth_social_sign_in_sso">
          <h3 className="card-title">Single Sign On(SSO)</h3>
        </div>
        <div className="card-body flex flex-col gap-7.5 divide-y divide-gray-200">
          <div className="grid gap-7 pt-7.5">
            <div className="text-md font-semibold text-gray-900">
              1. Select SSO integration Type
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">
              {items.map((item, index) => {
                return renderItem(item, index);
              })}
            </div>

            <style>
              {`
                .sso-active:has(:checked) {
                  background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-1.png')}');
                }
                .dark .sso-active:has(:checked) {
                  background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-1-dark.png')}');
                }
              `}
            </style>
          </div>

          <div className="grid gap-7 pt-7.5">
            <div className="text-md font-semibold text-gray-900">
              2. Configure Google authentication
            </div>

            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <label className="form-label max-w-56">Client ID</label>
                <input
                  className="input" 
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                /> 
              </div>
            </div>

            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <label className="form-label max-w-56">Client Secret</label>
                <input
                  className="input" 
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                />  
              </div>
            </div>

            <div className="flex justify-end">
              <button className="btn btn-primary">Save Changes</button>
            </div>
          </div>

          <div className="grid gap-7 pt-7.5">
            <div className="text-md font-semibold text-gray-900">
              3. Note down custom URL for Google SSO authentication
            </div>

            <div className="w-full">
              <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                <label className="form-label max-w-56">Custom Login UTL</label>
                <div className="grow">
                  <div className="input-group">
                    <input
                      className="input" 
                      type="text"
                      value={clientSecretInput}
                      onChange={(e) => setClientSecretInput(e.target.value)}
                    />   
                    <span className="btn btn-primary">Copy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-info pt-7.5 pb-5 text-gray-800 font-normal">
            Single Sign-On (SSO) authentication streamlines access across multiple platforms. Users
            log in once, gaining seamless entry <br />
            to various systems without repetitive credentials.
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export { AuthSingleSingOn, type IAuthSingleSingOnItem, type IAuthSingleSingOnItems };
