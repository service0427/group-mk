import { CommonAvatars } from '@/partials/common';
import { toAbsoluteUrl } from '@/utils/Assets';

interface INowPlayingItem {
  number: string;
  description: string;
}
interface INowPlayingItems extends Array<INowPlayingItem> {}

interface INowPlayingProps {
  image: string;
  logo: string;
  title: string;
  date: string;
  statistics: INowPlayingItem[];
  label: number;
  team: {
    group: Array<{ filename: string }>;
    more?: {
      number: number;
      variant: string;
    };
  };
}

const CardNowPlaying = ({
  image,
  logo,
  title,
  date,
  statistics,
  team,
  label
}: INowPlayingProps) => {
  const renderItem = (statistic: INowPlayingItem, index: number) => {
    return (
      <div key={index} className="grid grid-cols-1 gap-1.5 text-center">
        <span className="text-gray-900 text-2sm leading-none font-semibold">
          {statistic.number}%
        </span>
        <span className="text-gray-600 text-2xs font-medium">{statistic.description}</span>
      </div>
    );
  };

  return (
    <div className="card shadow-none w-[280px] border-0">
      <img
        src={toAbsoluteUrl(`/media/images/600x600/${image}`)}
        className="rounded-t-xl max-w-[280px] shrink-0"
        alt=""
      />

      <div className="card-border card-rounded-b grid gap-6 px-5 py-3.5 mb-4.5">
        <div className="flex items-center gap-2.5">
          <img
            src={toAbsoluteUrl(`/media/images/600x600/${logo}`)}
            className="rounded-full size-10"
            alt=""
          />

          <div className="grid grid-cols-1 gap-0.5">
            <a
              href="#"
              className="text-gray-900 hover:text-primary-active text-md font-semibold mb-px"
            >
              {title}
            </a>

            <span className="flex items-center gap-1.5 text-3xs font-medium text-gray-500">
              {date}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {statistics.map((statistic, index) => {
            return renderItem(statistic, index);
          })}
        </div>

        <div className="flex items-center place-content-between gap-2">
          <CommonAvatars group={team.group} more={team.more} />
          <span className="badge badge-xs badge-warning badge-outline">Rank {label}</span>
        </div>
      </div>
    </div>
  );
};

export { CardNowPlaying, type INowPlayingItem, type INowPlayingItems, type INowPlayingProps };
