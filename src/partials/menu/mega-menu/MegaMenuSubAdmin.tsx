import { TMenuConfig, IMenuItemConfig, MenuSub, Menu, MenuItem, MenuLink, MenuTitle } from '@/components/menu';
import { KeenIcon } from '@/components';

const MegaMenuSubAdmin = (items: TMenuConfig, itemIndex: number = 3) => {
  const adminItem = items[itemIndex];
  const siteManagement = adminItem.children ? adminItem.children[0] : {};
  const userManagement = adminItem.children ? adminItem.children[1] : {};
  const campaignManagement = adminItem.children ? adminItem.children[2] : {};
  const slotManagement = adminItem.children ? adminItem.children[3] : {};

  return (
    <MenuSub className="flex-col gap-0 w-full lg:max-w-[900px]">
      <div className="flex flex-col lg:flex-row">
        <div className="pt-4 pb-2 lg:p-7.5 lg:pb-5 grow">
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="mb-4">
              <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                {siteManagement.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {siteManagement.children?.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`site-management-item-${idx}`}>
                    <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                      {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                      <MenuTitle>{item.title}</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                ))}
              </Menu>
            </div>
            <div className="mb-4">
              <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                {userManagement.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {userManagement.children?.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`user-management-item-${idx}`}>
                    <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                      {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                      <MenuTitle>{item.title}</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                ))}
              </Menu>
            </div>
            <div className="mb-4">
              <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                {campaignManagement.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {campaignManagement.children?.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`campaign-management-item-${idx}`}>
                    <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                      {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                      <MenuTitle>{item.title}</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                ))}
              </Menu>
            </div>
            <div className="mb-4">
              <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                {slotManagement.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {slotManagement.children?.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`slot-management-item-${idx}`}>
                    <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                      {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                      <MenuTitle>{item.title}</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                ))}
              </Menu>
            </div>
          </div>
        </div>
      </div>
    </MenuSub>
  );
};

export { MegaMenuSubAdmin };