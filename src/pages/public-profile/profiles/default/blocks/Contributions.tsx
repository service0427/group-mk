import ApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useLanguage } from '@/i18n';
import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';

import { DropdownCard2 } from '@/partials/dropdowns/general';

interface IContributionsProps {
  title: string;
}

const Contributions = ({ title }: IContributionsProps) => {
  const { isRTL } = useLanguage();
  const data: number[] = [44, 55, 41, 17, 15];
  const labels: string[] = ['ERP', 'HRM', 'DMS', 'CRM', 'DAM'];
  const colors: string[] = [
    'var(--tw-primary)',
    'var(--tw-brand)',
    'var(--tw-success)',
    'var(--tw-info)',
    'var(--tw-warning)'
  ];

  const options: ApexOptions = {
    series: data,
    labels: labels,
    colors: colors,
    fill: {
      colors: colors
    },
    chart: {
      type: 'donut'
    },
    stroke: {
      show: true,
      width: 2
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        expandOnClick: false
      }
    },
    legend: {
      offsetY: -10,
      offsetX: -10,
      fontSize: '13px',
      fontWeight: '500',
      itemMargin: {
        vertical: 1
      },
      labels: {
        colors: 'var(--tw-gray-700)',
        useSeriesColors: false
      }
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ]
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
            {DropdownCard2()}
          </MenuItem>
        </Menu>
      </div>

      <div className="card-body flex justify-center items-center px-3 py-1">
        <ApexChart
          id="contributions_chart"
          options={options}
          series={options.series}
          type="donut"
          width="100%"
          height="178.7"
        />
      </div>
    </div>
  );
};

export { Contributions, type IContributionsProps };
