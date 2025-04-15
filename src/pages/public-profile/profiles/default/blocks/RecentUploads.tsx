import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

import { DropdownCard1, DropdownCardItem1 } from '@/partials/dropdowns/general';

interface IRecentUploadsItem {
  image: string;
  desc: string;
  date: string;
}
interface IRecentUploadsItems extends Array<IRecentUploadsItem> {}

interface IRecentUploadsProps {
  title: string;
}

const RecentUploads = ({ title }: IRecentUploadsProps) => {
  const { isRTL } = useLanguage();

  const items: IRecentUploadsItems = [
    {
      image: 'pdf.svg',
      desc: 'Project-pitch.pdf',
      date: '4.7 MB 26 Sep 2024 3:20 PM'
    },
    {
      image: 'doc.svg',
      desc: 'Report-v1.docx',
      date: '2.3 MB 1 Oct 2024 12:00 PM'
    },
    {
      image: 'ai.svg',
      desc: 'Framework-App.js',
      date: '0.8 MB 17 Oct 2024 6:46 PM'
    },
    {
      image: 'js.svg',
      desc: 'Mobile-logo.ai',
      date: '0.2 MB 4 Nov 2024 11:30 AM'
    }
  ];

  const renderItem = (item: IRecentUploadsItem, index: number) => {
    return (
      <div key={index} className="flex items-center gap-3">
        <div className="flex items-center grow gap-2.5">
          <img src={toAbsoluteUrl(`/media/file-types/${item.image}`)} alt="" />

          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 cursor-pointer hover:text-primary mb-px">
              {item.desc}
            </span>
            <span className="text-xs text-gray-700">{item.date}</span>
          </div>
        </div>

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
                    offset: isRTL() ? [0, -10] : [0, 10] // [skid, distance]
                  }
                }
              ]
            }}
          >
            <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
              <KeenIcon icon="dots-vertical" />
            </MenuToggle>
            {DropdownCardItem1()}
          </MenuItem>
        </Menu>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>

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
                    offset: isRTL() ? [0, -10] : [0, 10] // [skid, distance]
                  }
                }
              ]
            }}
          >
            <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
              <KeenIcon icon="dots-vertical" />
            </MenuToggle>
            {DropdownCard1()}
          </MenuItem>
        </Menu>
      </div>

      <div className="card-body">
        <div className="grid gap-2.5 lg:gap-5">
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </div>
      </div>

      <div className="card-footer justify-center">
        <Link to="/account/integrations" className="btn btn-link">
          All Files
        </Link>
      </div>
    </div>
  );
};

export {
  RecentUploads,
  type IRecentUploadsItem,
  type IRecentUploadsItems,
  type IRecentUploadsProps
};
