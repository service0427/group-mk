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
        className="flex items-center justify-between flex-wrap lg:flex-nowrap border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5"
      >
        <div className="flex items-center flex-wrap lg:flex-nowrap gap-3.5">
          <CommonHexagonBadge
            stroke="stroke-gray-300"
            fill="fill-gray-100"
            size="size-[50px]"
            badge={<KeenIcon icon={item.icon} className="text-xl text-gray-500" />}
          />

          <div className="flex flex-col">
            <a
              href="#"
              className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
            >
              {item.title}
            </a>
            <span className="text-2sm text-gray-700">{item.description}</span>
          </div>
        </div>

        <label className="switch switch-sm">
          <input type="checkbox" defaultChecked value="1" />
        </label>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header gap-2" id="settings_auth_two_factor">
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
      <div className="card-body lg:py-7.5">
        <div className="grid gap-5">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { AuthTwoFactor, type IAuthTwoFactorItem, type IAuthTwoFactorItems };
