import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { useLanguage } from '@/i18n';
import { DropdownCardItem1 } from '@/partials/dropdowns/general';

interface IConnectedProfilesItem {
  user: {
    name: string;
    tasks: number;
    avatar: string;
  };
  socialLogo: string;
  socialLogoDark?: string;
}
interface IConnectedProfilesItems extends Array<IConnectedProfilesItem> {}

const ConnectedProfiles = () => {
  const { isRTL } = useLanguage();

  const items: IConnectedProfilesItems = [
    {
      user: {
        name: 'Tyler Hero',
        tasks: 26,
        avatar: '300-3.png'
      },
      socialLogo: 'x.svg',
      socialLogoDark: 'x-dark.svg'
    },
    {
      user: {
        name: 'Leslie Alexander',
        tasks: 26,
        avatar: '300-5.png'
      },
      socialLogo: 'google.svg'
    }
  ];

  const renderItem = (item: IConnectedProfilesItem, index: number) => {
    return (
      <div key={index} className="card-group flex justify-between items-center py-4">
        <div className="flex items-center grow gap-2.5">
          <img
            src={toAbsoluteUrl(`/media/avatars/${item.user.avatar}`)}
            className="rounded-full size-9 shrink-0"
            alt=""
          />

          <div className="flex flex-col gap-1">
            <a href="#" className="text-sm font-medium text-gray-900 hover:text-primary-active">
              {item.user.name}
            </a>
            <span className="text-xs text-gray-700">{item.user.tasks} tasks</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {item.socialLogoDark ? (
            <>
              <img
                src={toAbsoluteUrl(`/media/brand-logos/${item.socialLogo}`)}
                className="dark:hidden max-h-5"
                alt=""
              />
              <img
                src={toAbsoluteUrl(`/media/brand-logos/${item.socialLogoDark}`)}
                className="light:hidden max-h-5"
                alt=""
              />
            </>
          ) : (
            <img
              src={toAbsoluteUrl(`/media/brand-logos/${item.socialLogo}`)}
              className="max-h-5"
              alt=""
            />
          )}

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
              {DropdownCardItem1()}
            </MenuItem>
          </Menu>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">2 Profiles Connected</h3>
      </div>
      {items.map((item, index) => {
        return renderItem(item, index);
      })}
      <div className="card-footer justify-center">
        <a href="#" className="btn btn-sm btn-light btn-outline">
          Connect Profile
        </a>
      </div>
    </div>
  );
};

export { ConnectedProfiles, type IConnectedProfilesItem, type IConnectedProfilesItems };
