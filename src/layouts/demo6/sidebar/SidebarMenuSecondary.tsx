import clsx from 'clsx';
import { Fragment } from 'react';
import { KeenIcon } from '@/components/keenicons';
import {
  Menu,
  MenuArrow,
  MenuIcon,
  MenuItem,
  MenuLabel,
  MenuLink,
  MenuSub,
  MenuTitle,
  MenuToggle
} from '@/components/menu';

interface IItem {
  title: string;
  open: boolean;
  plus?: boolean;
  children: IItemChild[];
}

interface IItemChild {
  icon: string;
  title: string;
  path: string;
  active?: boolean;
}

const SidebarMenuSecondary = () => {
  const items: IItem[] = [
    {
      title: 'Spaces',
      open: true,
      plus: true,
      children: [
        {
          icon: 'abstract-26',
          title: 'Metrics Hub',
          path: 'public-profile/profiles/creator'
        },
        {
          icon: 'abstract-41',
          title: 'Data Lab',
          active: true,
          path: 'public-profile/profiles/company'
        },
        {
          icon: 'abstract-39',
          title: 'Creative Commons',
          path: 'public-profile/profiles/nft'
        },
        {
          icon: 'abstract-35',
          title: 'KPI Monitor',
          path: 'public-profile/profiles/blogger'
        }
      ]
    },
    {
      title: 'Favorites',
      open: false,
      children: [
        {
          icon: 'badge',
          title: 'Post Date',
          path: 'network/user-cards/mini-cards'
        },
        {
          icon: 'cheque',
          title: 'Licencias Creative',
          path: 'network/user-cards/team-crew'
        },
        {
          icon: 'users',
          title: 'Open Content',
          path: 'network/user-cards/author'
        },
        {
          icon: 'security-user',
          title: 'Copyright',
          path: 'network/user-cards/nft'
        }
      ]
    }
  ];

  const buildMenu = (items: IItem[]) => {
    return items.map((item, index) => {
      return (
        <Fragment key={index}>
          <MenuItem toggle="accordion" trigger="click" open={true}>
            <MenuLabel className="flex items-center justify-between">
              <MenuToggle className="cursor-pointer pb-2 pt-3 ps-[14.5px] rounded-md border border-transparent">
                <MenuArrow className="me-2.5">
                  <KeenIcon icon="right" className="text-sm menu-item-show:hidden text-gray-500" />
                  <KeenIcon
                    icon="down"
                    className="text-sm hidden menu-item-show:inline-flex text-gray-500"
                  />
                </MenuArrow>
                <MenuTitle className="text-sm text-gray-800 font-medium">{item.title}</MenuTitle>
              </MenuToggle>
              {item.plus && (
                <div className="btn btn-sm btn-icon btn-icon-sm text-gray-500 hover:text-gray-800">
                  <KeenIcon icon="plus" />
                </div>
              )}
            </MenuLabel>
            <MenuSub className="menu-accordion gap-px">
              {item.children?.map((item2, index2) => {
                return (
                  <MenuItem key={index2} className={clsx(item2.active && 'active')}>
                    <MenuLink className="py-1 px-2 my-0.5 rounded-md border border-transparent menu-item-active:border-gray-200 menu-item-active:bg-light menu-link-hover:bg-light menu-link-hover:border-gray-200">
                      <MenuIcon className="text-gray-800 menu-link-hover:text-gray-900 rounded-md flex place-content-center size-7 me-2.5 bg-gray-200 border border-gray-300 menu-item-active:border-none menu-link-hover:border-light menu-item-active:bg-light menu-link-hover:bg-light menu-link-hover:border-none dark:menu-item-active:text-gray-900 menu-icon-xs">
                        <KeenIcon icon={item2.icon} />
                      </MenuIcon>
                      <MenuTitle className="text-2sm text-gray-800 menu-item-active:font-medium menu-item-active:text-gray-900 menu-link-hover:text-gray-900">
                        {item2.title}
                      </MenuTitle>
                    </MenuLink>
                  </MenuItem>
                );
              })}
            </MenuSub>
          </MenuItem>

          {index !== items.length - 1 && (
            <div className="border-b border-gray-300 mt-2 mb-1 mx-1.5"></div>
          )}
        </Fragment>
      );
    });
  };

  return (
    <Menu highlight={true} multipleExpand={true} className="flex flex-col w-full gap-1.5 px-3.5">
      {buildMenu(items)}
    </Menu>
  );
};

export { SidebarMenuSecondary };
