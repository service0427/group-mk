import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';
import { useLanguage } from '@/i18n';
import { DropdownCard2 } from '../dropdowns/general';
import { CommonAvatars } from '../common';

import { IProjectExtendedItem, IProjectExtendedProps } from './CardProjectExtended';

const CardProjectExtendedRow = ({
  status,
  logo,
  title,
  description,
  team,
  statistics,
  url
}: IProjectExtendedProps) => {
  const { isRTL } = useLanguage();

  const renderItem = (statistic: IProjectExtendedItem, index: number) => {
    return (
      <div
        key={index}
        className="grid grid-cols-1 content-between gap-1.5 border border-dashed border-gray-300 shrink-0 rounded-md px-2.5 py-2 min-w-24 max-w-auto"
      >
        <span className="text-gray-900 text-2sm leading-none font-semibold">{statistic.total}</span>
        <span className="text-gray-600 text-xs font-medium">{statistic.description}</span>
      </div>
    );
  };

  return (
    <div className="card p-7.5">
      <div className="flex items-center flex-wrap justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center min-w-12">
            <img
              src={toAbsoluteUrl(`/media/brand-logos/${logo}`)}
              className="min-w-12 shrink-0"
              alt=""
            />
          </div>

          <div className="flex flex-col">
            <a href={url} className="text-lg font-medium text-gray-900 hover:text-primary">
              {title}
            </a>

            <div className="text-sm text-gray-700">{description}</div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-5 lg:gap-12">
          <div className="flex items-center flex-wrap gap-5 lg:gap-14">
            <div className="flex items-center lg:justify-center flex-wrap gap-2 lg:gap-5">
              {statistics.map((statistic, index) => {
                return renderItem(statistic, index);
              })}
            </div>

            <div className="w-[125px] shrink-0">
              <span className={`badge badge-md ${status.variant} badge-outline`}>
                {status.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 lg:gap-14">
            <div className="grid justify-end  min-w-24">
              <CommonAvatars group={team.group} size={team.size} />
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
};

export { CardProjectExtendedRow };
