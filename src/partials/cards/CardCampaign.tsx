import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';
import { useLanguage } from '@/i18n';
import { DropdownCard2 } from '../dropdowns/general';

interface ICampaignItem {
  total: string;
  description: string;
}
interface ICampaignItems extends Array<ICampaignItem> {}

interface ICampaignProps {
  logo: string;
  logoSize?: string;
  logoDark?: string;
  title: string;
  description: string;
  status: {
    variant: string;
    label: string;
  };
  statistics: ICampaignItem[];
  progress?: {
    variant: string;
    value: number;
  };
  url: string;
}

const CardCampaign = ({
  logo,
  logoSize,
  logoDark,
  title,
  description,
  status,
  statistics,
  progress,
  url
}: ICampaignProps) => {
  const { isRTL } = useLanguage();

  const renderItem = (statistic: ICampaignItem, index: number) => {
    return (
      <div
        key={index}
        className="flex flex-col gap-1.5 border border-dashed border-gray-300 rounded-md px-2.5 py-2"
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

        <div className="flex items-center justify-center h-[50px] mb-2">
          {logoDark ? (
            <>
              <img
                src={toAbsoluteUrl(`/media/brand-logos/${logo}`)}
                className={`dark:hidden size-[${logoSize}] shrink-0`}
                alt=""
              />
              <img
                src={toAbsoluteUrl(`/media/brand-logos/${logoDark}`)}
                className={`light:hidden size-[${logoSize}] shrink-0`}
                alt=""
              />
            </>
          ) : (
            <img
              src={toAbsoluteUrl(`/media/brand-logos/${logo}`)}
              className={`size-[${logoSize}] shrink-0`}
              alt=""
            />
          )}
        </div>

        <div className="text-center mb-7">
          <a href={url} className="text-lg font-medium text-gray-900 hover:text-primary">
            {title}
          </a>

          <div className="text-sm text-gray-700">{description}</div>
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

export { CardCampaign, type ICampaignItem, type ICampaignItems, type ICampaignProps };
