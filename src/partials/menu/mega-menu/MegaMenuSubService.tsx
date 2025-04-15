import { TMenuConfig, IMenuItemConfig, MenuSub, Menu, MenuItem, MenuLink, MenuTitle } from '@/components/menu';
import { MegaMenuFooter } from './components';
import { KeenIcon } from '@/components';

const MegaMenuSubService = (items: TMenuConfig, itemIndex: number = 1) => {
  const serviceItem = items[itemIndex];

  return (
    <MenuSub className="w-full gap-0 lg:max-w-[900px]">
      <div className="pt-4 pb-2 lg:p-7.5">
        <div className="grid lg:grid-cols-3 gap-6">
          {serviceItem.children?.map((serviceGroup: IMenuItemConfig, index) => {
            const containerClass = serviceGroup.className 
              ? `${serviceGroup.className}`
              : '';
            
            return (
              <div key={`service-group-${index}`} className={`mb-4 ${containerClass}`}>
                <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-4">
                  {serviceGroup.heading}
                </h3>
                <Menu className="menu-default menu-fit flex-col">
                  {serviceGroup.children?.map((item: IMenuItemConfig, idx) => (
                    <MenuItem key={`service-item-${idx}`}>
                      <MenuLink path={item.path} className="py-2 text-sm flex items-center hover:bg-gray-50 dark:hover:bg-coal-600 px-2 rounded">
                        {item.icon && <KeenIcon icon={item.icon} className="me-2 text-gray-500 w-5 h-5" />}
                        <MenuTitle>{item.title}</MenuTitle>
                      </MenuLink>
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            );
          })}
        </div>
      </div>
      <MegaMenuFooter />
    </MenuSub>
  );
};

export { MegaMenuSubService };
