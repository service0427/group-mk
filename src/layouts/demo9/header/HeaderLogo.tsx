import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/utils';
import {
  Menu,
  MenuArrow,
  MenuIcon,
  MenuItem,
  MenuLink,
  MenuSub,
  MenuTitle,
  MenuToggle,
  KeenIcon
} from '@/components';
import { useResponsive } from '@/hooks';

import { useDemo9Layout } from '..';
import { useLanguage } from '@/i18n';

interface IHeaderLogoTeam {
  title: string;
  icon: string;
  urlPartial: string;
  path: string;
}
interface IHeaderLogoTeams extends Array<IHeaderLogoTeam> {}

interface IHeaderLogoMonth {
  title: string;
}
interface IHeaderLogoMonths extends Array<IHeaderLogoMonth> {}

const HeaderLogo = () => {
  const desktopMode = useResponsive('up', 'lg');
  const { setMobileMegaMenuOpen } = useDemo9Layout();
  const { isRTL } = useLanguage();

  const handleSidebarOpen = () => {
    setMobileMegaMenuOpen(true);
  };

  const teams: IHeaderLogoTeams = [
    {
      title: 'MetronicTeam',
      icon: 'profile-circle',
      urlPartial: '/public-profile/',
      path: '/public-profile/profiles/default'
    },
    {
      title: 'KeenTeam',
      icon: 'setting-2',
      urlPartial: '/account/',
      path: '/'
    }
  ];

  const months: IHeaderLogoMonths = [
    { title: 'UrbanNest' },
    { title: 'Celestial Finds' },
    { title: 'BohoChic Bazaar ' }
  ];

  return (
    <div className="flex items-center gap-1 lg:w-[400px] grow lg:grow-0">
      <button
        type="button"
        onClick={handleSidebarOpen}
        className="btn btn-icon btn-light btn-clear btn-sm -ms-2.5 lg:hidden"
      >
        <KeenIcon icon="menu" />
      </button>

      <div className="flex items-center gap-2">
        <Link to="/">
          <img
            src={toAbsoluteUrl('/media/app/mini-logo-circle.svg')}
            className="dark:hidden min-h-[34px]"
            alt="logo"
          />
          <img
            src={toAbsoluteUrl('/media/app/mini-logo-circle-dark.svg')}
            className="hidden dark:inline-block min-h-[34px]"
            alt="logo"
          />
        </Link>
        <h3 className="text-gray-900 text-lg font-medium hidden md:block">Metronic</h3>
      </div>

      {desktopMode && (
        <div className="lg:flex items-center">
          <div className="border-e border-gray-200 h-5 mx-4"></div>

          <Menu className="menu-default">
            <MenuItem
              toggle="dropdown"
              trigger="hover"
              dropdownProps={{
                placement: isRTL() ? 'bottom-end' : 'bottom-start',
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, 10] // [skid, distance]
                    }
                  }
                ]
              }}
            >
              <MenuToggle className="text-gray-900 text-sm font-medium">
                TeamRafa
                <MenuArrow>
                  <KeenIcon icon="down" />
                </MenuArrow>
              </MenuToggle>
              <MenuSub className="menu-default w-48 py-2">
                {teams.map((team, index) => (
                  <MenuItem key={index}>
                    <MenuLink path={team.path}>
                      {team.icon && (
                        <MenuIcon>
                          <KeenIcon icon={team.icon} />
                        </MenuIcon>
                      )}
                      <MenuTitle>{team.title}</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                ))}
              </MenuSub>
            </MenuItem>
          </Menu>

          <div className="border-e border-gray-200 h-5 mx-4"></div>

          <Menu className="menu-default w-[120px]">
            <MenuItem
              toggle="dropdown"
              trigger="hover"
              dropdownProps={{
                placement: isRTL() ? 'bottom-end' : 'bottom-start',
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
              <MenuToggle className="btn btn-light btn-sm flex-nowrap">
                <span className="flex items-center me-1">
                  <KeenIcon icon="shop" className="!text-md" />
                </span>
                <span className="hidden md:inline text-nowrap">RafaShop</span>
                <span className="flex items-center">
                  <KeenIcon icon="down" className="!text-xs" />
                </span>
              </MenuToggle>
              <MenuSub className="menu-default w-48 py-2 scrollable-y max-h-[250px]">
                {months.map((item, index) => (
                  <MenuItem key={index}>
                    <MenuLink path="#">
                      <MenuTitle>{item.title}</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                ))}
              </MenuSub>
            </MenuItem>
          </Menu>
        </div>
      )}
    </div>
  );
};

export { HeaderLogo };
