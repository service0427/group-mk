import { KeenIcon } from '@/components';
import { Container } from '@/components/container';

import { IIntroLogoInfo, IIntroLogoProps } from './types';
import { toAbsoluteUrl } from '@/utils';
import { useSettings } from '@/providers';

const IntroLogo = ({ image, name, info }: IIntroLogoProps) => {
  const { getThemeMode } = useSettings();

  const buildInfo = (info: IIntroLogoInfo[]) => {
    return info.map((item, index) => {
      return (
        <div className="flex gap-1.25 items-center" key={`info-${index}`}>
          {item.icon && <KeenIcon icon={item.icon} className="text-gray-500 text-sm" />}

          {item.email ? (
            <a
              href="mailto: {{ item.email }}"
              target="_blank"
              className="text-gray-600 font-medium hover:text-primary"
              rel="noreferrer"
            >
              {item.email}
            </a>
          ) : (
            <span className="text-gray-600 font-medium">{item.label}</span>
          )}
        </div>
      );
    });
  };

  const render = () => {
    return (
      <div
        className="bg-center bg-cover bg-no-repeat hero-bg"
        style={{
          backgroundImage:
            getThemeMode() === 'dark'
              ? `url('${toAbsoluteUrl('/media/images/2600x1200/bg-1-dark.png')}')`
              : `url('${toAbsoluteUrl('/media/images/2600x1200/bg-1.png')}')`
        }}
      >
        <Container>
          <div className="flex flex-col items-center gap-2 lg:gap-3.5 py-4 lg:pt-5 lg:pb-10">
            {image}

            <div className="flex items-center gap-1.5">
              <div className="text-lg leading-5 font-semibold text-gray-900">{name}</div>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="text-warning"
              >
                <path
                  d="M12 1L15.585 8.36516L23.5 9.27403L17.75 15.1349L19.17 23L12 19.2652L4.83 23L6.25 15.1349L0.5 9.27403L8.415 8.36516L12 1Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div className="flex flex-wrap justify-center gap-1 lg:gap-4.5 text-sm">
              {buildInfo(info)}
            </div>
          </div>
        </Container>
      </div>
    );
  };

  return render();
};

export { IntroLogo };
