import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components/keenicons';
import { toAbsoluteUrl } from '@/utils';

import { useStandLayout } from '../';

const HeaderLogo = () => {
  const { setMobileSidebarOpen, setMobileMegaMenuOpen, megaMenuEnabled } = useStandLayout();

  const handleSidebarOpen = () => {
    setMobileSidebarOpen(true);
  };

  const handleMegaMenuOpen = () => {
    setMobileMegaMenuOpen(true);
  };

  return (
    <div className="flex gap-1 lg:hidden items-center -ms-1">
      <Link to="/" className="shrink-0">
        <img
          src={toAbsoluteUrl('/media/brand-logos/marketing-standard-icon.svg')}
          className="max-h-[32px] w-full"
          alt="마케팅의 정석"
        />
      </Link>

      <div className="flex items-center">
        <button
          type="button"
          className="btn btn-icon btn-light btn-clear btn-sm"
          onClick={handleSidebarOpen}
        >
          <KeenIcon icon="menu" />
        </button>

        {megaMenuEnabled && (
          <button
            type="button"
            className="btn btn-icon btn-light btn-clear btn-sm"
            onClick={handleMegaMenuOpen}
          >
            <KeenIcon icon="burger-menu-2" />
          </button>
        )}
      </div>
    </div>
  );
};

export { HeaderLogo };
