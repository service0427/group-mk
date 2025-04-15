import { Fragment, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Outlet, useLocation } from 'react-router';
import {useMenuCurrentItem} from '@/components/menu';
import { useMenus } from '@/providers';
import { Header, Footer } from '..';
import { Toolbar, ToolbarHeading, ToolbarActions } from '../toolbar';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { KeenIcon } from '@/components/keenicons';

const Main = () => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const { isRTL } = useLanguage();
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 20),
    to: addDays(new Date(2025, 0, 20), 20)
  });

  return (
    <Fragment>
      <Helmet>
        <title>{menuItem?.title}</title>
      </Helmet>
      <div className="flex grow flex-col [[data-sticky-header=on]_&]:pt-[--tw-header-height-default]">
        <Header />

        <div className="grow" role="content">
          {!pathname.includes('/public-profile/') && (
            <Toolbar>
              <ToolbarHeading />
              <ToolbarActions>
                <Link to={'/account/home/get-started'} className="btn btn-sm btn-light">
                  <KeenIcon icon="exit-down" className="!text-base" />
                  Export
                </Link>

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      id="date"
                      className={cn(
                        'btn btn-sm btn-light data-[state=open]:bg-light-active',
                        !date && 'text-gray-400'
                      )}
                    >
                      <KeenIcon icon="calendar" className="me-0.5" />
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(date.from, 'LLL dd, y')
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </ToolbarActions>
            </Toolbar>
          )}
          <Outlet />
        </div>
        <Footer />
      </div>
    </Fragment>
  );
};

export { Main };
