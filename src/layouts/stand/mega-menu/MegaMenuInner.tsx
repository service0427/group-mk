import { Fragment, useEffect, useState } from 'react';
import { useResponsive } from '@/hooks';
import { KeenIcon } from '@/components';
import { TMenuConfig, MenuItem, MenuLink, MenuTitle, MenuArrow, Menu } from '@/components/menu';
import {
  MegaMenuSubProfiles,
  MegaMenuSubAccount,
  MegaMenuSubNetwork,
  MegaMenuSubAuth,
  MegaMenuSubHelp,
  MegaMenuSubService,
  MegaMenuSubMyInfo,
  MegaMenuSubAdmin
} from '@/partials/menu/mega-menu';
import { useStandLayout } from '../StandLayoutProvider';
import { MENU_MEGA } from '@/config';
import { useLanguage } from '@/i18n';

const MegaMenuInner = () => {
  const desktopMode = useResponsive('up', 'lg');
  const { isRTL } = useLanguage();
  const [disabled, setDisabled] = useState(true); // Initially set disabled to true
  const { layout, sidebarMouseLeave, setMegaMenuEnabled } = useStandLayout();

  // Change disabled state to false after a certain time (e.g., 5 seconds)
  useEffect(() => {
    setDisabled(true);

    const timer = setTimeout(() => {
      setDisabled(false);
    }, 1000); // 1000 milliseconds

    // Cleanup the timer when the component unmounts
    return () => clearTimeout(timer);
  }, [layout.options.sidebar.collapse, sidebarMouseLeave]);

  useEffect(() => {
    setMegaMenuEnabled(true);
  });

  const build = (items: TMenuConfig) => {
    const homeItem = items[0];
    const serviceItem = items[1];
    const myInfoItem = items[2];
    const adminItem = items[3];
    
    // ?„ì´?œì´ 4ê°??´ìƒ ?ˆì„ ê²½ìš°?ë§Œ ? ë‹¹
    const myAccountItem = items.length > 4 ? items[4] : null;
    const networkItem = items.length > 5 ? items[5] : null;
    const authItem = items.length > 6 ? items[6] : null;
    const helpItem = items.length > 7 ? items[7] : null;

    const linkClass =
      'menu-link text-sm text-gray-700 font-medium menu-link-hover:text-primary menu-item-active:text-gray-900 menu-item-show:text-primary menu-item-here:text-gray-900';
    const titleClass = 'text-nowrap';

    return (
      <Fragment>
        <MenuItem key="home">
          <MenuLink path={homeItem.path} className={linkClass}>
            <MenuTitle className={titleClass}>{homeItem.title}</MenuTitle>
          </MenuLink>
        </MenuItem>

        <MenuItem
          key="services"
          toggle={desktopMode ? 'dropdown' : 'accordion'}
          trigger={desktopMode ? 'hover' : 'click'}
          dropdownProps={{
            placement: isRTL() ? 'bottom-end' : 'bottom-start'
          }}
        >
          <MenuLink className={linkClass}>
            <MenuTitle className={titleClass}>{serviceItem.title}</MenuTitle>
            {buildArrow()}
          </MenuLink>
          {MegaMenuSubService(items)}
        </MenuItem>


        <MenuItem
          key="my-info"
          toggle={desktopMode ? 'dropdown' : 'accordion'}
          trigger={desktopMode ? 'hover' : 'click'}
          dropdownProps={{
            placement: isRTL() ? 'bottom-end' : 'bottom-start'
          }}
        >
          <MenuLink className={linkClass}>
            <MenuTitle className={titleClass}>{myInfoItem.title}</MenuTitle>
            {buildArrow()}
          </MenuLink>
          {MegaMenuSubMyInfo(items)}
        </MenuItem>

        <MenuItem
          key="admin"
          toggle={desktopMode ? 'dropdown' : 'accordion'}
          trigger={desktopMode ? 'hover' : 'click'}
          dropdownProps={{
            placement: isRTL() ? 'bottom-end' : 'bottom-start'
          }}
        >
          <MenuLink className={linkClass}>
            <MenuTitle className={titleClass}>{adminItem.title}</MenuTitle>
            {buildArrow()}
          </MenuLink>
          {MegaMenuSubAdmin(items)}
        </MenuItem>

        {myAccountItem && (
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
                    offset: isRTL() ? [300, 0] : [-300, 0] // [skid, distance]
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
        )}

        {networkItem && (
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
                    offset: isRTL() ? [300, 0] : [-300, 0] // [skid, distance]
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
        )}

        {authItem && (
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
                    offset: isRTL() ? [300, 0] : [-300, 0] // [skid, distance]
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
        )}

        {helpItem && (
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
        )}
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
      disabled={disabled}
      highlight={true}
      className="flex-col lg:flex-row gap-5 lg:gap-7.5 p-5 lg:p-0"
    >
      {build(MENU_MEGA)}
    </Menu>
  );
};

export { MegaMenuInner };
