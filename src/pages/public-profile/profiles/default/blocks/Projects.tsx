import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';

import { CommonAvatars } from '@/partials/common';
import { DropdownCrud1, DropdownCrudItem1 } from '@/partials/dropdowns/general';

interface IProjectsItem {
  name: string;
  team: {
    group: Array<{ filename?: string; fallback?: string; variant?: string }>;
    more?: {
      number: number;
      variant: string;
    };
  };
  dueDate: string;
  progress: {
    variant: string;
    value: number;
  };
}
interface IProjectsItems extends Array<IProjectsItem> {}

const Projects = () => {
  const { isRTL } = useLanguage();

  const items: IProjectsItems = [
    {
      name: 'Acme software development',
      team: {
        group: [{ filename: '300-4.png' }, { filename: '300-1.png' }, { filename: '300-2.png' }],
        more: {
          number: 3,
          variant: 'text-success-inverse ring-success-light bg-success'
        }
      },
      dueDate: '24 Aug, 2024',
      progress: {
        variant: 'progress-primary',
        value: 60
      }
    },
    {
      name: 'Strategic Partnership Deal',
      team: {
        group: [
          { filename: '300-1.png' },
          { filename: '300-2.png' },
          {
            fallback: 'M',
            variant: 'text-danger-inverse ring-danger-light bg-danger'
          }
        ]
      },
      dueDate: '10 Sep, 2024',
      progress: {
        variant: '',
        value: 100
      }
    },
    {
      name: 'Client Onboarding',
      team: {
        group: [{ filename: '300-20.png' }, { filename: '300-7.png' }]
      },
      dueDate: '19 Sep, 2024',
      progress: {
        variant: 'progress-primary',
        value: 20
      }
    },
    {
      name: 'Widget Supply Agreement',
      team: {
        group: [{ filename: '300-6.png' }, { filename: '300-23.png' }, { filename: '300-12.png' }],
        more: {
          number: 1,
          variant: 'text-primary-inverse ring-primary-light bg-primary'
        }
      },
      dueDate: '5 May, 2024',
      progress: {
        variant: 'progress-success',
        value: 100
      }
    },
    {
      name: 'Project X Redesign',
      team: {
        group: [{ filename: '300-2.png' }, { filename: '300-15.png' }, { filename: '300-18.png' }],
        more: {
          number: 2,
          variant: 'text-success-inverse ring-success-light bg-success'
        }
      },
      dueDate: '1 Feb, 2025',
      progress: {
        variant: 'progress-primary',
        value: 80
      }
    }
  ];

  const renderItem = (item: IProjectsItem, index: number) => {
    return (
      <tr key={index}>
        <td className="text-start">
          <a href="#" className="text-sm font-medium text-gray-900 hover:text-primary">
            {item.name}
          </a>
        </td>

        <td>
          <div className={`progress ${item.progress.variant}`}>
            <div className="progress-bar" style={{ width: `${item.progress.value}%` }}></div>
          </div>
        </td>

        <td>
          <div className="flex justify-end rtl:justify-start shrink-0">
            <CommonAvatars group={item.team.group} more={item.team.more} />
          </div>
        </td>

        <td className="text-sm font-medium text-gray-700">{item.dueDate}</td>

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
        <h3 className="card-title">Projects</h3>

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
              <th className="text-start min-w-52 !font-normal !text-gray-700">Project Name</th>
              <th className="min-w-40 !font-normal !text-gray-700">Progress</th>
              <th className="min-w-32 !font-normal !text-gray-700">People</th>
              <th className="min-w-32 !font-normal !text-gray-700">Due Date</th>
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
        <Link to="/public-profile/projects/3-columns" className="btn btn-link">
          All Projects
        </Link>
      </div>
    </div>
  );
};

export { Projects, type IProjectsItem, type IProjectsItems };
