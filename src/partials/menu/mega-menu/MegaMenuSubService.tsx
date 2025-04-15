import { TMenuConfig, IMenuItemConfig, MenuSub, Menu, MenuItem, MenuLink, MenuTitle } from '@/components/menu';
import { KeenIcon } from '@/components';
import { MegaMenuSubHighlighted } from './components';

const MegaMenuSubService = (items: TMenuConfig, itemIndex: number = 1) => {
  const serviceItem = items[itemIndex];
  const naverServices = serviceItem.children ? serviceItem.children[0] : {};
  const otherServices = serviceItem.children ? serviceItem.children[1] : {};
  const additionalServices = serviceItem.children ? serviceItem.children[2] : {};

  return (
    <MenuSub className="flex-col gap-0 w-full lg:max-w-[900px]">
      <div className="flex flex-col lg:flex-row">
        <div className="pt-4 pb-2 lg:p-7.5 lg:pb-5 grow">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="mb-4">
              <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                {naverServices.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {naverServices.children?.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`naver-service-item-${idx}`}>
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
                {otherServices.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {otherServices.children?.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`other-service-item-${idx}`}>
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
        <div className="lg:w-[250px] mb-4 lg:mb-0 lg:border-l lg:border-s-gray-200 rounded-xl lg:rounded-e-xl lg:rounded-s-none shrink-0 px-3 py-4 lg:p-7.5 bg-light-active dark:bg-coal-500 dark:lg:border-l-coal-100">
          <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-5">
            {additionalServices.heading}
          </h3>
          <div className="menu menu-default menu-fit flex-col">
            {additionalServices.children?.map((item: IMenuItemConfig, idx) => (
              <MenuItem key={`additional-service-item-${idx}`}>
                <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                  {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                  <MenuTitle>{item.title}</MenuTitle>
                </MenuLink>
              </MenuItem>
            ))}
          </div>
        </div>
      </div>
    </MenuSub>
  );
};

export { MegaMenuSubService };
