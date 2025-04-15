import { TMenuConfig, IMenuItemConfig, MenuSub } from '@/components/menu';
import { MegaMenuSubDefault, MegaMenuSubHighlighted, MegaMenuFooter } from './components';

const MegaMenuSubNetwork = (items: TMenuConfig) => {
  const networkItem = items[3];
  const networkItemGeneral = networkItem.children ? networkItem.children[0] : {};
  const networkItemOthers = networkItem.children ? networkItem.children[1] : {};

  return (
    <MenuSub className="flex-col gap-0 w-full lg:max-w-[670px]">
      <div className="flex flex-col lg:flex-row">
        <div className="flex flex-col gap-5 lg:w-[250px] mt-2 lg:mt-0 lg:border-r lg:border-r-gray-200 rounded-xl lg:rounded-none lg:rounded-tl-xl shrink-0 px-3 py-4 lg:p-7.5 bg-light-active dark:bg-coal-500 dark:lg:border-e-coal-100">
          <h3 className="text-sm text-gray-800 font-semibold leading-none ps-2.5 h-3.5">
            {networkItemGeneral.title}
          </h3>
          <div className="menu menu-default menu-fit flex-col">
            {networkItemGeneral.children && MegaMenuSubHighlighted(networkItemGeneral.children)}
          </div>
        </div>
        <div className="pt-4 pb-2 lg:p-7.5 lg:pb-5 grow">
          <div className="grid lg:grid-cols-2 gap-5">
            {networkItemOthers.children?.map((item: IMenuItemConfig, index) => {
              return (
                <div key={`item-${index}`} className="flex flex-col gap-5">
                  <h3 className="flex items-center gap-1.5 text-sm text-gray-800 font-semibold leading-none ps-2.5 h-3.5">
                    {item.title}
                    {item.badge && (
                      <span className="start-auto badge badge-xs badge-primary badge-outline">
                        {item.badge}
                      </span>
                    )}
                  </h3>
                  <div className="menu menu-default menu-fit flex-col">
                    {item.children && MegaMenuSubDefault(item.children)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <MegaMenuFooter />
    </MenuSub>
  );
};

export { MegaMenuSubNetwork };
