import { Fragment } from 'react';
import { useResponsive } from '@/hooks';
import {
  TMenuConfig,
  MenuItem,
  MenuLink,
  MenuTitle,
  MenuArrow,
  Menu,
  KeenIcon
} from '@/components';
import {
  MegaMenuSubProfiles,
  MegaMenuSubAccount,
  MegaMenuSubNetwork,
  MegaMenuSubAuth,
  MegaMenuSubHelp
} from '@/partials/menu/mega-menu';
import { MENU_MEGA } from '@/config';
import { useLanguage } from '@/i18n';

const MegaMenuInner = () => {
  const desktopMode = useResponsive('up', 'lg');
  const { isRTL } = useLanguage();
  const build = (items: TMenuConfig) => {
    const homeItem = items[0];
    const publicProfilesItem = items[1];
    const myAccountItem = items[2];
    const networkItem = items[3];
    const authItem = items[4];
    const helpItem = items[5];

    const linkClass =
      'lg:py-3.5 border-b border-b-transparent menu-item-active:border-b-gray-800 text-gray-800 menu-item-hover:text-gray-900 menu-item-active:text-gray-900 menu-item-here:border-b-gray-800 menu-item-here:text-gray-900';
    const titleClass = 'font-medium text-gray-800 text-sm';

    return (
      <Fragment>
        <MenuItem key="home">
          <MenuLink path={homeItem.path} className={linkClass}>
            <MenuTitle className={titleClass}>{homeItem.title}</MenuTitle>
          </MenuLink>
        </MenuItem>

        <MenuItem
          key="public-profiles"
          toggle={desktopMode ? 'dropdown' : 'accordion'}
          trigger={desktopMode ? 'hover' : 'click'}
          dropdownProps={{
            placement: isRTL() ? 'bottom-end' : 'bottom-start'
          }}
        >
          <MenuLink className={linkClass}>
            <MenuTitle className={titleClass}>{publicProfilesItem.title}</MenuTitle>
            {buildArrow()}
          </MenuLink>
          {MegaMenuSubProfiles(items)}
        </MenuItem>

        <MenuItem
          key="my-account"
          toggle={desktopMode ? 'dropdown' : 'accordion'}
          trigger={desktopMode ? 'hover' : 'click'}
          dropdownProps={{
            placement: isRTL() ? 'bottom-end' : 'bottom-start',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: isRTL() ? [158, 0] : [-158, 0] // [skid, distance]
                }
              }
            ]
          }}
        >
          <MenuLink className={linkClass}>
            <MenuTitle className={titleClass}>{myAccountItem.title}</MenuTitle>
            {buildArrow()}
          </MenuLink>
          {MegaMenuSubAccount(items)}
        </MenuItem>

        <MenuItem
          key="network"
          toggle={desktopMode ? 'dropdown' : 'accordion'}
          trigger={desktopMode ? 'hover' : 'click'}
          dropdownProps={{
            placement: isRTL() ? 'bottom-end' : 'bottom-start',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: isRTL() ? [50, 0] : [-50, 0] // [skid, distance]
                }
              }
            ]
          }}
        >
          <MenuLink className={linkClass}>
            <MenuTitle className={titleClass}>{networkItem.title}</MenuTitle>
            {buildArrow()}
          </MenuLink>
          {MegaMenuSubNetwork(items)}
        </MenuItem>

        <MenuItem
          key="auth"
          toggle={desktopMode ? 'dropdown' : 'accordion'}
          trigger={desktopMode ? 'hover' : 'click'}
          dropdownProps={{
            placement: isRTL() ? 'bottom-end' : 'bottom-start',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: isRTL() ? [100, 0] : [-100, 0] // [skid, distance]
                }
              }
            ]
          }}
        >
          <MenuLink className={linkClass}>
            <MenuTitle className={titleClass}>{authItem.title}</MenuTitle>
            {buildArrow()}
          </MenuLink>
          {MegaMenuSubAuth(items)}
        </MenuItem>

        <MenuItem
          key="help"
          toggle={desktopMode ? 'dropdown' : 'accordion'}
          trigger={desktopMode ? 'hover' : 'click'}
          dropdownProps={{
            placement: isRTL() ? 'bottom-end' : 'bottom-start',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: isRTL() ? [20, 0] : [-20, 0] // [skid, distance]
                }
              }
            ]
          }}
        >
          <MenuLink className={linkClass}>
            <MenuTitle className={titleClass}>{helpItem.title}</MenuTitle>
            {buildArrow()}
          </MenuLink>
          {MegaMenuSubHelp(items)}
        </MenuItem>
      </Fragment>
    );
  };

  const buildArrow = () => {
    return (
      <MenuArrow className="flex lg:hidden text-gray-400">
        <KeenIcon icon="plus" className="text-2xs menu-item-show:hidden" />
        <KeenIcon icon="minus" className="text-2xs hidden menu-item-show:inline-flex" />
      </MenuArrow>
    );
  };

  return (
    <Menu
      multipleExpand={true}
      highlight={true}
      className="flex-col lg:flex-row gap-5 lg:gap-7.5 p-5 lg:p-0"
    >
      {build(MENU_MEGA)}
    </Menu>
  );
};

export { MegaMenuInner };
