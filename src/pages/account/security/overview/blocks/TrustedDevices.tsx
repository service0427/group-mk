import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { toAbsoluteUrl } from '@/utils';

import { DropdownCard2 } from '@/partials/dropdowns/general';

interface ITrustedDevicesItem {
  logo: string;
  browser: string;
  location: string;
  flag: string;
  device: string;
  datetime: string;
}
interface ITrustedDevicesItems extends Array<ITrustedDevicesItem> {}

const TrustedDevices = () => {
  const items: ITrustedDevicesItems = [
    {
      logo: 'chrome.svg',
      browser: 'Chrome',
      location: 'Seville, Spain',
      flag: 'spain.svg',
      device: 'MacOS 12.19.6',
      datetime: 'Active: Today at 9:03 AM'
    },
    {
      logo: 'chrome.svg',
      browser: 'Chrome',
      location: 'Lyon, France',
      flag: 'france.svg',
      device: 'Android 14.35',
      datetime: 'Active: Mar 18 at 9:03 AM'
    }
  ];

  const renderItem = (item: ITrustedDevicesItem, index: number) => {
    return (
      <tr key={index}>
        <td className="min-w-48 w-48">
          <div className="flex items-center gitem gap-2.5">
            <img
              src={toAbsoluteUrl(`/media/brand-logos/${item.logo}`)}
              className="h-6"
              alt="image"
            />

            <div className="flex flex-col">
              <div className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px">
                {item.browser}
              </div>
              <div className="flex gap-1.5">
                <span className="text-xs text-gray-700">{item.location}</span>
                <img
                  src={toAbsoluteUrl(`/media/flags/${item.flag}`)}
                  className="h-3.5 rounded-full"
                  alt="image"
                />
              </div>
            </div>
          </div>
        </td>

        <td className="min-w-56 text-gray-700 font-normal">
          {item.device}
          <br />
          {item.datetime}
        </td>

        <td className="!pr-7.5 min-w-16 text-end">
          <a href="#" className="btn btn-sm btn-icon btn-light btn-clear">
            <KeenIcon icon="exit-right" />
          </a>
        </td>
      </tr>
    );
  };

  return (
    <div className="card min-w-full">
      <div className="card-header">
        <h3 className="card-title">Trusted Devices</h3>

        <Menu className="items-stretch">
          <MenuItem
            toggle="dropdown"
            trigger="click"
            dropdownProps={{
              placement: 'bottom-end',
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, 10] // [skid, distance]
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

      <div className="card-table scrollable-x-auto">
        <div className="scrollable-auto">
          <table className="table align-middle text-gray-600 font-medium text-2sm">
            <tbody>
              {items.map((item, index) => {
                return renderItem(item, index);
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-footer justify-center">
        <a href="#" className="btn btn-link">
          Manage Trusted Devices
        </a>
      </div>
    </div>
  );
};

export { TrustedDevices, type ITrustedDevicesItem, type ITrustedDevicesItems };
