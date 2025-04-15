import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';

import { DropdownCard2 } from '@/partials/dropdowns/general';

interface IOptionsItem {
  icon: string;
  title: string;
  desc: string;
  path: string;
}
interface IOptionsItems extends Array<IOptionsItem> {}

interface IOptionsProps {
  items: IOptionsItems;
  dropdown: boolean;
}

const Options = ({ items, dropdown }: IOptionsProps) => {
  const { isRTL } = useLanguage();

  const renderProject = (item: IOptionsItem, index: number) => {
    return (
      <div key={index} className="card p-5 lg:p-7.5 lg:pt-7">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <KeenIcon icon={item.icon} className="text-2xl link" />

            {dropdown && (
              <Menu className="items-stretch">
                <MenuItem
                  toggle="dropdown"
                  trigger="click"
                  dropdownProps={{
                    placement: isRTL() ? 'bottom-start' : 'bottom-end',
                    modifiers: [
                      {
                        name: 'offset',
                        options: {
                          offset: isRTL() ? [0, -10] : [0, 10] // [skid, distance]
                        }
                      }
                    ]
                  }}
                >
                  <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
                    <KeenIcon icon="dots-vertical" />
                  </MenuToggle>
                  {DropdownCard2()}
                </MenuItem>
              </Menu>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to={`${item.path}`}
              className="text-base font-medium leading-none text-gray-900 hover:text-primary-active"
            >
              {item.title}
            </Link>
            <span className="text-2sm text-gray-700 leading-5">{item.desc}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-7.5">
      {items.map((item, index) => {
        return renderProject(item, index);
      })}
    </div>
  );
};

export { Options, type IOptionsItem, type IOptionsItems, type IOptionsProps };
