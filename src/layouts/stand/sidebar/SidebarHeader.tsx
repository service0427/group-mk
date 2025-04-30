import React, { forwardRef, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useStandLayout } from '../';
import { toAbsoluteUrl } from '@/utils';
import { SidebarToggle } from './';

const SidebarHeader = forwardRef<HTMLDivElement, any>((props, ref) => {
  const { layout } = useStandLayout();

  const lightLogo = () => (
    <Fragment>
      <Link to="/" className="dark:hidden">
        <div className="default-logo flex items-center">
          <img
            src={toAbsoluteUrl('/media/brand-logos/marketing-standard-icon.svg')}
            className="w-10 h-10 mr-3"
            alt="마케팅의 정석"
          />
          <span className="text-gray-800 text-lg font-bold">마케팅의 정<span style={{ display: 'inline-block', borderBottom: '1.5px solid currentColor', width: '1em', position: 'relative', top: '-0.2em', marginLeft: '0.1em', marginRight: '0.1em' }}></span>석</span>
        </div>
        <img
          src={toAbsoluteUrl('/media/brand-logos/marketing-standard-icon.svg')}
          className="small-logo w-10 h-10"
          alt="마케팅의 정석"
        />
      </Link>
      <Link to="/" className="hidden dark:block">
        <div className="default-logo flex items-center">
          <img
            src={toAbsoluteUrl('/media/brand-logos/marketing-standard-icon.svg')}
            className="w-10 h-10 mr-3"
            alt="마케팅의 정석"
          />
          <span className="text-white text-lg font-bold">마케팅의 정<span style={{ display: 'inline-block', borderBottom: '1.5px solid currentColor', width: '1em', position: 'relative', top: '-0.2em', marginLeft: '0.1em', marginRight: '0.1em' }}></span>석</span>
        </div>
        <img
          src={toAbsoluteUrl('/media/brand-logos/marketing-standard-icon.svg')}
          className="small-logo w-10 h-10"
          alt="마케팅의 정석"
        />
      </Link>
    </Fragment>
  );

  const darkLogo = () => (
    <Link to="/">
      <div className="default-logo flex items-center">
        <img
          src={toAbsoluteUrl('/media/brand-logos/marketing-standard-icon.svg')}
          className="w-10 h-10 mr-3"
          alt="마케팅의 정석"
        />
        <span className="text-white text-lg font-bold">마케팅의 정<span style={{ display: 'inline-block', borderBottom: '1.5px solid currentColor', width: '1em', position: 'relative', top: '-0.2em', marginLeft: '0.1em', marginRight: '0.1em' }}></span>석</span>
      </div>
      <img
        src={toAbsoluteUrl('/media/brand-logos/marketing-standard-icon.svg')}
        className="small-logo w-10 h-10"
        alt="마케팅의 정석"
      />
    </Link>
  );

  return (
    <div
      ref={ref}
      className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0 py-3"
    >
      {layout.options.sidebar.theme === 'light' ? lightLogo() : darkLogo()}
      <SidebarToggle />
    </div>
  );
});

export { SidebarHeader };
