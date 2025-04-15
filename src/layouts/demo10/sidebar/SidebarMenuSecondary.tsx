import { toAbsoluteUrl } from '@/utils';
import { Menu, MenuItem, MenuLink, MenuTitle, MenuIcon } from '@/components/menu';

const items = [
  {
    logo: 'x-dark.svg',
    title: '@keenthemes',
    path: 'https://keenthemes.com/metronic/tailwind/docs/'
  },
  {
    logo: 'slack.svg',
    title: '@keenthemes_hub',
    path: 'https://github.com/keenthemes/'
  },
  {
    logo: 'figma.svg',
    title: 'metronic',
    path: 'https://keenthemes.com/metronic/tailwind/docs/'
  }
];

const SidebarMenuSecondary = () => {
  return (
    <div>
      <h3 className="text-sm text-gray-500 uppercase ps-5 inline-block mb-3">Outline</h3>
      <Menu className="flex flex-col w-full gap-1.5 px-3.5">
        {items.map((item, index) => (
          <MenuItem key={index} className="menu-item">
            <MenuLink path={item.path} className="py-1 px-2.5">
              <MenuIcon>
                <span className="rounded-md flex items-center justify-center size-7 bg-coal-black menu-link-hover:border-none me-2">
                  <img
                    src={toAbsoluteUrl(`/media/brand-logos/${item.logo}`)}
                    className="size-3.5"
                    alt={item.title}
                  />
                </span>
              </MenuIcon>
              <MenuTitle className="text-2sm text-gray-700 menu-item-here:text-gray-900 menu-item-active:text-gray-900 menu-link-hover:text-gray-900">
                {item.title}
              </MenuTitle>
            </MenuLink>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export { SidebarMenuSecondary };
