import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';

import { DropdownCrud1, DropdownCrudItem1 } from '@/partials/dropdowns/general';

interface IDealsItem {
  name: string;
  ammount: string;
  date: number;
  label: string;
  color: string;
}
interface IDealsItems extends Array<IDealsItem> {}

const Deals = () => {
  const { isRTL } = useLanguage();

  const items: IDealsItems = [
    {
      name: 'Acme Software License',
      ammount: '5,000',
      date: 30,
      label: 'Ongoing',
      color: 'badge-primary'
    },
    {
      name: 'Strategic Partnership Deal',
      ammount: '12,500',
      date: 45,
      label: 'Closed',
      color: 'badge-success'
    },
    {
      name: 'Client Onboarding',
      ammount: '18,000',
      date: 60,
      label: 'On Hold',
      color: 'badge-warning'
    },
    {
      name: 'Widget Supply Agreement',
      ammount: '3,500',
      date: 10,
      label: 'Canceled',
      color: 'badge-danger'
    },
    {
      name: 'Project X Redesign',
      ammount: '8,200',
      date: 15,
      label: 'Closed',
      color: 'badge-success'
    }
  ];

  const renderItem = (item: IDealsItem, index: number) => {
    return (
      <tr key={index}>
        <td className="text-start">
          <a href="#" className="text-sm font-medium text-gray-900 hover:text-primary">
            {item.name}
          </a>
        </td>

        <td className="text-sm text-gray-800">${item.ammount}</td>

        <td>
          <div className={`badge badge-sm ${item.color} badge-outline`}>{item.label}</div>
        </td>

        <td className="text-sm text-gray-800">{item.date} days</td>

        <td className="text-start">
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
              {DropdownCrudItem1()}
            </MenuItem>
          </Menu>
        </td>
      </tr>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Deals</h3>

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
            {DropdownCrud1()}
          </MenuItem>
        </Menu>
      </div>
      <div className="card-table scrollable-x-auto">
        <table className="table text-end">
          <thead>
            <tr>
              <th className="text-start min-w-[150px] !text-gray-700">Deal Name</th>
              <th className="min-w-[100px] !text-gray-700">Amount</th>
              <th className="min-w-[100px]">Status</th>
              <th className="min-w-[110px] !text-gray-700">Duration</th>
              <th className="w-[30px]"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              return renderItem(item, index);
            })}
          </tbody>
        </table>
      </div>
      <div className="card-footer justify-center">
        <Link to="/account/billing/history" className="btn btn-link">
          All Deals
        </Link>
      </div>
    </div>
  );
};

export { Deals, type IDealsItem, type IDealsItems };
