import {
  Menu,
  MenuItem,
  MenuLink,
  MenuTitle,
  MenuToggle,
  KeenIcon,
  MenuSub,
  MenuIcon
} from '@/components';
import { useLanguage } from '@/i18n';

interface IDashboardDropdownItem {
  title: string;
  path: string;
  icon: string;
  active?: boolean;
}
interface IDashboardDropdownItems extends Array<IDashboardDropdownItem> {}

interface IMenuItem {
  title: string;
  path: string;
  icon: string;
  active?: boolean;
}

interface IDashboardMenuItem {
  title: string;
  children: IMenuItem[];
}
interface IDashboardMenuItems extends Array<IDashboardMenuItem> {}

const SidebarMenuDashboard = () => {
  const { isRTL } = useLanguage();
  const dropdownItems: IDashboardDropdownItems = [
    {
      title: 'Admin API',
      path: '',
      icon: 'calendar',
      active: true
    },
    {
      title: 'Client API',
      path: '',
      icon: 'setting'
    }
  ];

  const menuItems: IDashboardMenuItems = [
    {
      title: 'Configuration',
      children: [
        {
          title: 'API Setup',
          icon: 'setting',
          path: ''
        },
        {
          title: 'Team Settings',
          icon: 'users',
          path: '',
          active: true
        },
        {
          title: 'Authentication',
          icon: 'password-check',
          path: ''
        },
        {
          title: 'Endpoints Configs',
          icon: 'technology-4',
          path: ''
        },
        {
          title: 'Rate Limiting',
          icon: 'chart-line-star',
          path: ''
        }
      ]
    },
    {
      title: 'Security',
      children: [
        {
          title: 'Data Encryption',
          icon: 'chart-line-star',
          path: ''
        },
        {
          title: 'Rate Limiting',
          icon: 'percentage',
          path: ''
        },
        {
          title: 'Access Control',
          icon: 'safe-home',
          path: ''
        },
        {
          title: 'Incident Response',
          icon: 'status',
          path: ''
        }
      ]
    },
    {
      title: 'Analytics',
      children: [
        {
          title: 'Fetching Data',
          icon: 'calendar-8',
          path: ''
        },
        {
          title: 'Custom Reports',
          icon: 'office-bag',
          path: ''
        },
        {
          title: 'Real Time Analytics',
          icon: 'safe-home',
          path: ''
        }
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-7.5 px-2.5">
      <Menu highlight={true} className="menu-default w-full p-0">
        <MenuItem
          className="w-full"
          toggle="dropdown"
          trigger="hover"
          dropdownProps={{
            placement: isRTL() ? 'bottom-start' : 'bottom-end',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 0] // [skid, distance]
                }
              }
            ]
          }}
        >
          <MenuToggle className="w-full btn btn-light btn-sm justify-between flex-nowrap">
            <span className="flex items-center gap-1.5">
              <KeenIcon icon="code" className="!text-md" />
              Client API
            </span>
            <span className="flex items-center lg:ms-4">
              <KeenIcon icon="down" className="!text-xs" />
            </span>
          </MenuToggle>

          <MenuSub className="menu-default w-[182px] py-2">
            {dropdownItems.map((item, index) => (
              <MenuItem key={index} className={item.active ? 'active' : ''}>
                <MenuLink path={item.path}>
                  <MenuIcon>
                    <KeenIcon icon={item.icon} />
                  </MenuIcon>
                  <MenuTitle>{item.title}</MenuTitle>
                </MenuLink>
              </MenuItem>
            ))}
          </MenuSub>
        </MenuItem>
      </Menu>

      <Menu highlight={true} className="flex-col gap-5">
        {menuItems.map((heading, index) => (
          <div key={index} className="flex flex-col gap-px">
            <MenuItem>
              <div className="px-2 text-xs font-medium text-gray-600">{heading.title}</div>
            </MenuItem>

            {heading.children.map((item, index) => (
              <MenuItem key={index} className={item.active ? 'active' : ''}>
                <MenuLink
                  path={item.path}
                  className="py-2 px-2.5 gap-2 rounded-md border border-transparent menu-item-active:border-gray-200 menu-item-active:bg-light menu-link-hover:bg-light menu-link-hover:border-gray-200"
                >
                  <KeenIcon icon={item.icon} />
                  <MenuTitle className="text-2sm text-gray-800 menu-item-active:font-medium menu-item-active:text-primary menu-link-hover:text-primary">
                    {item.title}
                  </MenuTitle>
                </MenuLink>
              </MenuItem>
            ))}
          </div>
        ))}
      </Menu>
    </div>
  );
};

export { SidebarMenuDashboard };
