import { TMenuConfig, MenuSub } from '@/components/menu';
import { MegaMenuSubDropdown } from './components';

const MegaMenuSubHelp = (items: TMenuConfig) => {
  const helpItem = items[5];

  return (
    <MenuSub className="menu-default py-2.5 lg:w-[225px]">
      {helpItem.children && MegaMenuSubDropdown(helpItem.children)}
    </MenuSub>
  );
};

export { MegaMenuSubHelp };
