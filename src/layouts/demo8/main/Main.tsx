import { Fragment, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Outlet, useLocation } from 'react-router';
import { Menu, MenuItem, MenuToggle, useMenuCurrentItem } from '@/components/menu';
import { useMenus } from '@/providers';
import { Header, Sidebar, Footer, Toolbar, ToolbarHeading, ToolbarActions } from '..';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components';
import { useResponsive } from '@/hooks';
import { ModalSearch } from '@/partials/modals/search/ModalSearch';
import { DropdownNotifications } from '@/partials/dropdowns/notifications';
import { useLanguage } from '@/i18n';

const Main = () => {
  const mobileMode = useResponsive('down', 'lg');
  const itemNotificationsRef = useRef<any>(null);
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const handleOpen = () => setSearchModalOpen(true);
  const { isRTL } = useLanguage();
  const handleClose = () => {
    setSearchModalOpen(false);
  };

  return (
    <Fragment>
      <Helmet>
        <title>{menuItem?.title}</title>
      </Helmet>
      <div className="flex grow">
        {mobileMode && <Header />}

        <div className="flex flex-col lg:flex-row grow pt-[--tw-header-height] lg:pt-0">
          <Sidebar />

          <div className="flex flex-col grow rounded-xl bg-[--tw-content-bg] dark:bg-[--tw-content-bg-dark] border border-gray-300 dark:border-gray-200 lg:ms-[--tw-sidebar-width] mt-0 lg:mt-5 m-5">
            <div className="flex flex-col grow lg:scrollable-y-auto lg:[scrollbar-width:auto] lg:light:[--tw-scrollbar-thumb-color:var(--tw-content-scrollbar-color)] pt-5">
              <main className="grow" role="content">
                <Toolbar>
                  <ToolbarHeading />

                  <ToolbarActions>
                    <button
                      onClick={handleOpen}
                      className="btn btn-icon btn-icon-lg size-8 rounded-md hover:bg-gray-200 dropdown-open:bg-gray-200 hover:text-primary text-gray-600"
                    >
                      <KeenIcon icon="magnifier" className="!text-base" />
                    </button>
                    <ModalSearch open={searchModalOpen} onOpenChange={handleClose} />

                    <Menu className="me-1.5">
                      <MenuItem
                        ref={itemNotificationsRef}
                        toggle="dropdown"
                        trigger="click"
                        dropdownProps={{
                          placement: isRTL() ? 'bottom-start' : 'bottom-end',
                          modifiers: [
                            {
                              name: 'offset',
                              options: {
                                offset: [10, 10] // [skid, distance]
                              }
                            }
                          ]
                        }}
                      >
                        <MenuToggle className="dropdown-toggle btn btn-icon btn-icon-lg size-8 rounded-md hover:bg-gray-200 dropdown-open:bg-gray-200 hover:text-primary text-gray-600">
                          <KeenIcon icon="notification-status" className="!text-base" />
                        </MenuToggle>
                        {DropdownNotifications({ menuTtemRef: itemNotificationsRef })}
                      </MenuItem>
                    </Menu>

                    <Link
                      to={'/account/home/get-started'}
                      className="btn btn-xs btn-icon-lg btn-light"
                    >
                      <KeenIcon icon="exit-down" className="!text-base" />
                      Export
                    </Link>
                  </ToolbarActions>
                </Toolbar>

                <Outlet />
              </main>
            </div>
            <Footer />
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export { Main };
