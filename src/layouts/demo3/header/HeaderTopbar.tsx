import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import { toAbsoluteUrl } from '@/utils';
import { Menu, MenuItem, MenuToggle } from '@/components';
import { DropdownUser } from '@/partials/dropdowns/user';
import { ModalSearch } from '@/partials/modals/search/ModalSearch';
import { DropdownNotifications } from '@/partials/dropdowns/notifications';
import { DropdownApps } from '@/partials/dropdowns/apps';
import { DropdownChat } from '@/partials/dropdowns/chat';
import { useLanguage } from '@/i18n';

const HeaderTopbar = () => {
  const itemAppsRef = useRef<any>(null);
  const itemChatRef = useRef<any>(null);
  const itemUserRef = useRef<any>(null);
  const itemNotificationsRef = useRef<any>(null);
  const { isRTL } = useLanguage();

  const handleDropdownChatShow = () => {
    window.dispatchEvent(new Event('resize'));
  };

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const handleSearchModalOpen = () => setSearchModalOpen(true);
  const handleSearchModalClose = () => {
    setSearchModalOpen(false);
  };

  return (
    <div className="flex items-center lg:gap-3.5">
      <Link to={'/account/home/get-started'} className="btn btn-xs btn-primary me-1 sm:me-0">
        Get Started
      </Link>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleSearchModalOpen}
          className="btn btn-icon btn-icon-lg size-8 text-gray-600 hover:text-primary"
        >
          <KeenIcon icon="magnifier" />
        </button>
        <ModalSearch open={searchModalOpen} onOpenChange={handleSearchModalClose} />

        <Menu>
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
            <MenuToggle className="btn btn-icon btn-icon-lg size-8 text-gray-600 hover:text-primary [dropdown-open:text-primary">
              <KeenIcon icon="notification-status" />
            </MenuToggle>
            {DropdownNotifications({ menuTtemRef: itemNotificationsRef })}
          </MenuItem>
        </Menu>

        <Menu>
          <MenuItem
            ref={itemChatRef}
            onShow={handleDropdownChatShow}
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
            <MenuToggle className="btn btn-icon btn-icon-lg size-8 text-gray-600 hover:text-primary [dropdown-open:text-primary">
              <KeenIcon icon="messages" />
            </MenuToggle>

            {DropdownChat({ menuTtemRef: itemChatRef })}
          </MenuItem>
        </Menu>

        <Menu>
          <MenuItem
            ref={itemAppsRef}
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
            <MenuToggle className="btn btn-icon btn-icon-lg size-8 text-gray-600 hover:text-primary [dropdown-open:text-primary">
              <KeenIcon icon="element-11" />
            </MenuToggle>

            {DropdownApps()}
          </MenuItem>
        </Menu>
      </div>

      <Menu>
        <MenuItem
          ref={itemUserRef}
          toggle="dropdown"
          trigger="click"
          dropdownProps={{
            placement: isRTL() ? 'bottom-start' : 'bottom-end',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 9] // [skid, distance]
                }
              }
            ]
          }}
        >
          <MenuToggle className="btn btn-icon rounded-full">
            <img
              className="size-8 rounded-full justify-center border border-gray-500 shrink-0"
              src={toAbsoluteUrl('/media/avatars/gray/5.png')}
              alt=""
            />
          </MenuToggle>
          {DropdownUser({ menuItemRef: itemUserRef })}
        </MenuItem>
      </Menu>
    </div>
  );
};

export { HeaderTopbar };
