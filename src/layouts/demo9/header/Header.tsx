import { useEffect } from 'react';
import clsx from 'clsx';
import { Container } from '@/components/container';

import { useDemo9Layout } from '../';
import { HeaderLogo, HeaderSearch, HeaderTopbar } from '.';

const Header = () => {
  const { headerSticky } = useDemo9Layout();

  useEffect(() => {
    if (headerSticky) {
      document.body.setAttribute('data-sticky-header', 'on');
    } else {
      document.body.removeAttribute('data-sticky-header');
    }
  }, [headerSticky]);

  return (
    <header
      className={clsx(
        'flex items-center transition-[height] shrink-0 bg-[--tw-header-bg] dark:bg-coal-500 h-[--tw-header-height]',
        headerSticky &&
          'transition-[height] fixed z-10 top-0 start-0 end-0 shadow-sm backdrop-blur-md bg-white/70 dark:bg-coal-500/70 dark:border-b dark:border-b-light'
      )}
    >
      <Container className="flex lg:justify-between items-center gap-2.5">
        <HeaderLogo />
        <HeaderSearch />
        <HeaderTopbar />
      </Container>
    </header>
  );
};

export { Header };
