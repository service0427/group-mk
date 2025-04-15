import { TMenuConfig, IMenuItemConfig, MenuSub } from '@/components/menu';
import { MegaMenuSubDefault, MegaMenuFooter } from './components';

const MegaMenuSubProfiles = (items: TMenuConfig) => {
  const publicProfilesItem = items[1];

  return (
    <MenuSub className="w-full gap-0 lg:max-w-[875px]">
      <div className="pt-4 pb-2 lg:p-7.5">
        <div className="grid lg:grid-cols-2 gap-5 lg:gap-10">
          {publicProfilesItem.children?.map((item: IMenuItemConfig, index) => {
            return (
              <div key={`item-${index}`} className="menu menu-default menu-fit flex-col">
                <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 mb-2 lg:mb-5">
                  {item.title}
                </h3>
                <div className="grid lg:grid-cols-2 lg:gap-5">
                  {item.children?.map((item: IMenuItemConfig, index) => {
                    return (
                      <div key={`item-${index}`} className="flex flex-col">
                        {item.children && MegaMenuSubDefault(item.children)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <MegaMenuFooter />
    </MenuSub>
  );
};

export { MegaMenuSubProfiles };
