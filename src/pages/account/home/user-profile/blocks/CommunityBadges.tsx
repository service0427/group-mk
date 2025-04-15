import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { CommonHexagonBadge } from '@/partials/common';
import { useLanguage } from '@/i18n';
import { DropdownCrud1 } from '@/partials/dropdowns/general';

interface ICommunityBadgesItem {
  title: string;
  stroke: string;
  fill: string;
  icon: string;
  iconColor: string;
}
interface ICommunityBadgesItems extends Array<ICommunityBadgesItem> {}

const CommunityBadges = () => {
  const { isRTL } = useLanguage();

  const items: ICommunityBadgesItems = [
    {
      title: 'Expert Contributor Badge',
      stroke: 'stroke-primary-clarity',
      fill: 'fill-primary-light',
      icon: 'abstract-39',
      iconColor: 'text-primary'
    },
    {
      title: 'Innovation Trailblazer',
      stroke: 'stroke-brand-clarity',
      fill: 'fill-brand-light',
      icon: 'abstract-44',
      iconColor: 'text-brand'
    },
    {
      title: 'Impact Recognition',
      stroke: 'stroke-success-clarity',
      fill: 'fill-success-light',
      icon: 'abstract-25',
      iconColor: 'text-success'
    },
    {
      title: 'Performance Honor',
      stroke: 'stroke-info-clarity',
      fill: 'fill-info-light',
      icon: 'delivery-24',
      iconColor: 'text-info'
    }
  ];

  const renderItem = (item: ICommunityBadgesItem, index: number) => {
    return (
      <div
        key={index}
        className="flex items-center justify-between flex-wrap group border border-gray-200 rounded-xl gap-2 px-3.5 py-2.5"
      >
        <div className="flex items-center flex-wrap gap-2.5">
          <CommonHexagonBadge
            size="size-[50px]"
            badge={<KeenIcon icon={item.icon} className={`text-1.5xl ps-px ${item.iconColor}`} />}
            stroke={item.stroke}
            fill={item.fill}
          />

          <span className="text-gray-900 text-sm font-medium">{item.title}</span>
        </div>

        <div className="btn btn-sm btn-icon text-gray-300 group-hover:text-primary-active">
          <svg
            className="size-6"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
          >
            <rect x="3" y="14.5" width="18" height="3" rx="1.5" fill="currentColor" />
            <rect x="3" y="6.5" width="18" height="3" rx="1.5" fill="currentColor" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header gap-2">
        <h3 className="card-title">Badges</h3>

        <Menu>
          <MenuItem
            toggle="dropdown"
            trigger="click"
            dropdownProps={{
              placement: isRTL() ? 'bottom-start' : 'bottom-end',
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: isRTL() ? [0, 10] : [0, -10] // [skid, distance]
                  }
                }
              ]
            }}
          >
            <MenuToggle className="btn btn-sm btn-icon btn-icon-lg text-gray-500 hover:text-primary-active">
              <KeenIcon icon="information-2" />
            </MenuToggle>
            {DropdownCrud1()}
          </MenuItem>
        </Menu>
      </div>

      <div className="card-body pb-7.5">
        <div className="grid gap-2.5">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>
      </div>
    </div>
  );
};

export { CommunityBadges, type ICommunityBadgesItem, type ICommunityBadgesItems };
