import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { MenuSub } from '@/components';
import { useResponsive } from '@/hooks';

interface IDropdownAppsItem {
  logo: string;
  title: string;
  description: string;
  checkbox: boolean;
}

const DropdownApps = () => {
  const desktopMode = useResponsive('up', 'lg');

  const items: IDropdownAppsItem[] = [
    {
      logo: 'jira.svg',
      title: 'Jira',
      description: 'Project management',
      checkbox: false
    },
    {
      logo: 'inferno.svg',
      title: 'Inferno',
      description: 'Ensures healthcare app',
      checkbox: true
    },
    {
      logo: 'evernote.svg',
      title: 'Evernote',
      description: 'Notes management app',
      checkbox: true
    },
    {
      logo: 'gitlab.svg',
      title: 'Gitlab',
      description: 'DevOps platform',
      checkbox: false
    },
    {
      logo: 'google-webdev.svg',
      title: 'Google webdev',
      description: 'Building web experiences',
      checkbox: true
    }
  ];

  const buildHeader = () => {
    return (
      <div className="flex items-center justify-between gap-2.5 text-2xs text-gray-600 font-medium px-5 py-3 border-b border-b-gray-200">
        <span>Apps</span>
        <span>Enabled</span>
      </div>
    );
  };

  const buildFooter = () => {
    return (
      <div className="grid p-5 border-t border-t-gray-200">
        <Link to="/account/api-keys" className="btn btn-sm btn-light justify-center">
          Go to Apps
        </Link>
      </div>
    );
  };

  const buildList = (items: IDropdownAppsItem[]) => {
    return (
      <div className="flex flex-col scrollable-y-auto max-h-[400px] divide-y divide-gray-200">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between flex-wrap gap-2 px-5 py-3.5"
          >
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex items-center justify-center shrink-0 rounded-full bg-gray-100 border border-gray-200 size-10">
                <img
                  src={toAbsoluteUrl(`/media/brand-logos/${item.logo}`)}
                  className="size-6"
                  alt={item.title}
                />
              </div>

              <div className="flex flex-col">
                <a
                  href="#"
                  className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                >
                  {item.title}
                </a>
                <span className="text-2xs font-medium text-gray-600">{item.description}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-5">
              <label className="switch switch-sm">
                <input type="checkbox" defaultChecked={item.checkbox} />
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <MenuSub rootClassName="w-full max-w-[320px]" className="light:border-gray-300">
      {buildHeader()}

      <div className="scrollable-y-auto" style={{ maxHeight: desktopMode ? '400px' : '75vh' }}>
        {buildList(items)}
      </div>

      {buildFooter()}
    </MenuSub>
  );
};

export { DropdownApps };
