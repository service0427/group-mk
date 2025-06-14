import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { useLanguage } from '@/i18n';
import { DropdownCard2 } from '@/partials/dropdowns/general';
import { CommonHexagonBadge } from '@/partials/common';

interface IAuthTwoFactorItem {
  icon: string;
  title: string;
  description: string;
  checkbox: boolean;
}
interface IAuthTwoFactorItems extends Array<IAuthTwoFactorItem> {}

const AuthTwoFactor = () => {
  const { isRTL } = useLanguage();

  const items: IAuthTwoFactorItems = [
    {
      icon: 'message-text-2',
      title: 'Text Message (SMS)',
      description: 'Instant codes for secure account verification.',
      checkbox: true
    },
    {
      icon: 'shield-tick',
      title: 'Authenticator App (TOTP)',
      description: 'Elevate protection with an authenticator app for two-factor authentication.',
      checkbox: false
    }
  ];

  const renderItem = (item: IAuthTwoFactorItem, index: number) => {
    return (
      <div
        key={index}
        className="flex items-center justify-between flex-wrap border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5"
      >
        <div className="flex items-center flex-wrap gap-3.5">
          <div className="flex items-center">
            <CommonHexagonBadge
              stroke="stroke-gray-300"
              fill="fill-gray-100"
              size="size-[50px]"
              badge={<KeenIcon icon={item.icon} className="text-xl text-gray-500" />}
            />
          </div>

          <div className="flex flex-col gap-px">
            <a href="#" className="text-sm font-medium text-gray-900 hover:text-primary-active">
              {item.title}
            </a>
            <span className="text-2sm font-medium text-gray-700">{item.description}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-6">
          <label className="switch switch-sm">
            <input
              type="checkbox"
              defaultChecked={item.checkbox}
              value={item.checkbox ? '1' : '2'} 
            />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header" id="auth_two_factor">
        <h3 className="card-title">Two-Factor authentication(2FA)</h3>

        <Menu className="items-stretch">
          <MenuItem
            toggle="dropdown"
            trigger="click"
            dropdownProps={{
              placement: isRTL() ? 'bottom-start' : 'bottom-end',
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: isRTL() ? [0, -10] : [0, 10] // [skid, distance]
                  }
                }
              ]
            }}
          >
            <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
              <KeenIcon icon="dots-vertical" />
            </MenuToggle>
            {DropdownCard2()}
          </MenuItem>
        </Menu>
      </div>

      <div className="card-body">
        <div className="grid gap-5 mb-7">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>

        <div className="w-full">
          <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5 mb-7">
            <label className="form-label max-w-56">Password</label>

            <div className="flex flex-col tems-start grow gap-3 w-full">
              <input className="input" type="text" placeholder="Enter password" />
              <span className="form-info gray-800 font-normal">
                Enter your password to setup Two-Factor authentication
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2.5">
          <button className="btn btn-primary">Setup</button>
        </div>
      </div>
    </div>
  );
};

export { AuthTwoFactor, type IAuthTwoFactorItem, type IAuthTwoFactorItems };
