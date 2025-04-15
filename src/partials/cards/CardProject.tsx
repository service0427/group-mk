import { toAbsoluteUrl } from '@/utils/Assets';

import { CommonAvatars } from '../common';

interface IProjectProps {
  logo: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  status: {
    variant: string;
    label: string;
  };
  progress: {
    variant: string;
    value: number;
  };
  team: {
    size?: string;
    group: Array<{ filename?: string; variant?: string; fallback?: string }>;
    more?: {
      variant?: string;
      number?: number;
    };
  };
}

const CardProject = ({
  logo,
  name,
  description,
  startDate,
  endDate,
  status,
  progress,
  team
}: IProjectProps) => {
  return (
    <div className="card p-7.5">
      <div className="flex items-center justify-between mb-3 lg:mb-6">
        <div className="flex items-center justify-center size-[50px] rounded-lg bg-gray-100">
          <img src={toAbsoluteUrl(`/media/brand-logos/${logo}`)} className="" alt="" />
        </div>
        <span className={`badge badge-md ${status.variant} badge-outline`}>{status.label}</span>
      </div>

      <div className="flex flex-col mb-3 lg:mb-6">
        <a
          href="#"
          className="text-lg font-media/brand text-gray-900 hover:text-primary-active mb-px"
        >
          {name}
        </a>
        <span className="text-sm text-gray-700">{description}</span>
      </div>

      <div className="flex items-center gap-5 mb-3.5 lg:mb-7">
        <span className="text-sm text-gray-600">
          Start:&nbsp;
          <span className="text-sm font-medium text-gray-800">{startDate}</span>
        </span>
        <span className="text-sm text-gray-600">
          End:&nbsp;
          <span className="text-sm font-medium text-gray-800">{endDate}</span>
        </span>
      </div>

      <div className={`progress h-1.5 ${progress.variant} mb-4 lg:mb-8`}>
        <div className="progress-bar" style={{ width: `${progress.value}%` }}></div>
      </div>

      <CommonAvatars group={team.group} size={team.size} more={team.more} />
    </div>
  );
};

export { CardProject, type IProjectProps };
