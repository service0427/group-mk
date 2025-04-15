import { TMenuConfig, IMenuItemConfig, MenuSub, Menu, MenuItem, MenuLink, MenuTitle } from '@/components/menu';
import { KeenIcon } from '@/components';

const MegaMenuSubMyInfo = (items: TMenuConfig, itemIndex: number = 2) => {
  const myInfoItem = items[itemIndex];
  const basicManagement = myInfoItem.children ? myInfoItem.children[0] : {};
  const serviceManagement = myInfoItem.children ? myInfoItem.children[1] : {};
  const cashPointManagement = myInfoItem.children ? myInfoItem.children[2] : {};

  return (
    <MenuSub className="flex-col gap-0 w-full lg:max-w-[900px]">
      <div className="flex flex-col lg:flex-row">
        <div className="pt-4 pb-2 lg:p-7.5 lg:pb-5 grow">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="mb-4">
              <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                {basicManagement.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {basicManagement.children?.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`basic-management-item-${idx}`}>
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
                {serviceManagement.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {serviceManagement.children?.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`service-management-item-${idx}`}>
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
                {cashPointManagement.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {cashPointManagement.children?.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`cash-point-item-${idx}`}>
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

export { MegaMenuSubMyInfo };
