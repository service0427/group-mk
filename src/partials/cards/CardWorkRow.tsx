import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';
import { useLanguage } from '@/i18n';
import { DropdownCard2 } from '../dropdowns/general';
import { IWorkProps } from './CardWork';

const CardWorkRow = ({
  image,
  description,
  title,
  authorAvatar,
  authorName,
  likes,
  comments
}: IWorkProps) => {
  const { isRTL } = useLanguage();

  return (
    <div className="card p-5">
      <div className="flex flex-wrap justify-between items-center gap-7">
        <div className="flex flex-wrap items-center gap-5">
          <img
            src={toAbsoluteUrl(`/media/images/600x400/${image}`)}
            className="rounded-md max-h-20 max-w-full shrink-0"
            alt=""
          />

          <div className="grid grid-col gap-1">
            <a
              href="#"
              className="text-lg font-semibold text-gray-900 hover:text-primary-active mb-px"
            >
              {title}
            </a>
            <span className="text-sm font-medium text-gray-600">{description}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 lg:gap-7.5">
          <div className="flex items-center gap-1.5">
            <img
              src={toAbsoluteUrl(`/media/avatars/${authorAvatar}`)}
              className="rounded-full h-7"
              alt=""
            />

            <a
              href="#"
              className="text-2sm font-medium text-gray-700 hover:text-primary-active mb-px"
            >
              {authorName}
            </a>
          </div>

          <div className="flex gap-1 items-center w-20 justify-end">
            <KeenIcon icon="heart" className="text-base text-gray-500" />
            <span className="text-2sm font-medium text-gray-700 py-2">{likes}</span>
            <span className="text-2sm font-medium text-gray-700">Likes</span>
          </div>

          <div className="flex gap-1 items-center w-28 justify-end">
            <KeenIcon icon="messages" className="text-base text-gray-500" />
            <span className="text-2sm font-medium text-gray-700 py-2">{comments}</span>
            <span className="text-2sm font-medium text-gray-700">Comments</span>
          </div>

          <Menu className="items-stretch">
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
      </div>
    </div>
  );
};

export { CardWorkRow };
