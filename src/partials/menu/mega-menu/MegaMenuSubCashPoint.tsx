import { TMenuConfig, IMenuItemConfig, MenuSub, Menu, MenuItem, MenuLink, MenuTitle } from '@/components/menu';
import { KeenIcon } from '@/components';
import { MegaMenuSubHighlighted } from './components';

const MegaMenuSubCashPoint = (items: TMenuConfig, itemIndex: number = 2) => {
  const cashPointItem = items[itemIndex];
  const cashServices = cashPointItem.children ? cashPointItem.children[0] : {};
  const pointServices = cashPointItem.children ? cashPointItem.children[1] : {};

  return (
    <MenuSub className="flex-col gap-0 w-full lg:max-w-[700px]">
      <div className="flex flex-col lg:flex-row">
        <div className="pt-4 pb-2 lg:p-7.5 lg:pb-5 grow">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="mb-4">
              <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                {cashServices.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {cashServices.children?.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`cash-service-item-${idx}`}>
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
                {pointServices.heading}
              </h3>
              <Menu className="menu-default menu-fit flex-col">
                {pointServices.children?.map((item: IMenuItemConfig, idx) => (
                  <MenuItem key={`point-service-item-${idx}`}>
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

export { MegaMenuSubCashPoint };
