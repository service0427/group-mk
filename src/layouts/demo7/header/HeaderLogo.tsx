import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import { toAbsoluteUrl } from '@/utils';
import { MegaMenu } from '../mega-menu';
import { useDemo7Layout } from '@/layouts/demo7/Demo7LayoutProvider';

const HeaderLogo = () => {
  const { setMobileMegaMenuOpen } = useDemo7Layout();

  const handleMobileMegaMenuOpen = () => {
    setMobileMegaMenuOpen(true);
  };

  return (
    <div className="flex items-stretch gap-10 grow">
      <div className="flex items-center gap-2.5">
        <Link to="/">
          <img
            src={toAbsoluteUrl('/media/app/mini-logo-circle-primary.svg')}
            className="dark:hidden min-h-[34px]"
            alt="logo"
          />
          <img
            src={toAbsoluteUrl('/media/app/mini-logo-circle-primary-dark.svg')}
            className="hidden dark:inline-block min-h-[34px]"
            alt="logo"
          />
        </Link>
        <button
          className="lg:hidden btn btn-icon btn-light btn-clear btn-sm"
          onClick={handleMobileMegaMenuOpen}
        >
          <KeenIcon icon="burger-menu-2" />
        </button>
        <h3 className="text-gray-900 text-lg font-medium hidden md:block">Metronic</h3>
      </div>

      <MegaMenu />
    </div>
  );
};

export { HeaderLogo };
