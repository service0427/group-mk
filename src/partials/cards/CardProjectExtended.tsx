import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';
import { useLanguage } from '@/i18n';
import { DropdownCard2 } from '../dropdowns/general';
import { CommonAvatars } from '../common';

interface IProjectExtendedItem {
  total: string;
  description: string;
}
interface IProjectExtendedItems extends Array<IProjectExtendedItem> {}

interface IProjectExtendedProps {
  status: {
    variant: string;
    label: string;
  };
  logo: string;
  title: string;
  description: string;
  team: {
    size?: string;
    group: Array<{ filename?: string; variant?: string; fallback?: string }>;
  };
  statistics: IProjectExtendedItem[];
  progress?: {
    variant: string;
    value: number;
  };
  url: string;
}

const CardProjectExtended = ({
  status,
  logo,
  title,
  description,
  team,
  statistics,
  progress,
  url
}: IProjectExtendedProps) => {
  const { isRTL } = useLanguage();

  const renderItem = (statistic: IProjectExtendedItem, index: number) => {
    return (
      <div
        key={index}
        className="grid grid-cols-1 content-between gap-1.5 border border-dashed border-gray-300 shrink-0 rounded-md px-2.5 py-2 min-w-24 max-w-auto"
      >
        <span className="text-gray-900 text-sm leading-none font-medium">{statistic.total}</span>
        <span className="text-gray-700 text-xs">{statistic.description}</span>
      </div>
    );
  };

  return (
    <div className="card overflow-hidden grow justify-between">
      <div className="p-5 mb-5">
        <div className="flex items-center justify-between mb-5">
          <span className={`badge ${status.variant} badge-outline`}>{status.label}</span>

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

        <div className="flex justify-center mb-2">
          <img
            src={toAbsoluteUrl(`/media/brand-logos/${logo}`)}
            className="min-w-12 shrink-0"
            alt=""
          />
        </div>

        <div className="text-center mb-7">
          <a href={url} className="text-lg font-medium text-gray-900 hover:text-primary">
            {title}
          </a>

          <div className="text-sm text-gray-700">{description}</div>
        </div>

        <div className="grid justify-center gap-1.5 mb-7.5">
          <span className="text-2xs uppercase text-gray-600 text-center">team</span>
          <CommonAvatars group={team.group} size={team.size} />
        </div>

        <div className="flex items-center justify-center flex-wrap gap-2 lg:gap-5">
          {statistics.map((statistic, index) => {
            return renderItem(statistic, index);
          })}
        </div>
      </div>

      <div className={`progress ${progress?.variant}`}>
        <div className="progress-bar" style={{ width: `${progress?.value}%` }}></div>
      </div>
    </div>
  );
};

export {
  CardProjectExtended,
  type IProjectExtendedItem,
  type IProjectExtendedItems,
  type IProjectExtendedProps
};
