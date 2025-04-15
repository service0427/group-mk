import { Link } from 'react-router-dom';

import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

interface IWorkProps {
  image: string;
  title: string;
  description?: string;
  authorAvatar: string;
  authorName: string;
  likes: number;
  comments: number;
}

const CardWork = ({ image, title, authorAvatar, authorName, likes, comments }: IWorkProps) => {
  return (
    <div className="card border-0">
      <img
        src={toAbsoluteUrl(`/media/images/600x400/${image}`)}
        className="w-full h-auto rounded-t-xl"
        alt=""
      />

      <div className="card-border card-rounded-b flex flex-col gap-2 px-5 py-4.5">
        <Link
          to="/public-profile/profiles/company"
          className="text-lg font-medium text-gray-900 hover:text-primary"
        >
          {title}
        </Link>

        <div className="flex items-center justify-between grow">
          <div className="flex items-center grow">
            <img
              src={toAbsoluteUrl(`/media/avatars/${authorAvatar}`)}
              className="rounded-full size-7 me-2"
              alt=""
            />

            <Link
              to="/public-profile/profiles/nft"
              className="text-2sm text-gray-800 hover:text-primary mb-px"
            >
              {authorName}
            </Link>
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex gap-1 items-center">
              <KeenIcon icon="heart" className="text-base text-gray-500" />
              <span className="text-2sm text-gray-800 py-2">{likes}</span>
            </div>

            <div className="flex gap-1 items-center">
              <KeenIcon icon="messages" className="text-base text-gray-500" />
              <span className="text-2sm text-gray-800 py-2">{comments}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { CardWork, type IWorkProps };
