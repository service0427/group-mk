import { KeenIcon } from '@/components';

import { CommonAvatars, CommonRating } from '../common';
import { ITeamProps } from './CardTeam';

const CardTeamRow = ({ icon, title, description, labels, rating, team, connected }: ITeamProps) => {
  const renderItem = (label: string, index: number) => {
    return (
      <span key={index} className="badge badge-sm badge-outline">
        {label}
      </span>
    );
  };

  return (
    <div className="card p-7.5">
      <div className="flex flex-wrap justify-between items-center gap-7">
        <div className="flex items-center gap-4">
          <div className="flex justify-center items-center size-14 shrink-0 rounded-full ring-1 ring-gray-300 bg-gray-100">
            <KeenIcon icon={icon} className="text-2xl text-gray-600" />
          </div>
          <div className="grid grid-col gap-1">
            <a
              href="#"
              className="text-base font-medium text-gray-900 hover:text-primary-active mb-px"
            >
              {title}
            </a>
            <span className="text-2sm text-gray-700">{description}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 lg:gap-12">
          <div className="grid gap-5 justify-end lg:text-end">
            <span className="text-2xs font-normal text-gray-500 uppercase">skills</span>
            <div className="flex gap-1.5">
              {labels.map((label, index) => {
                return renderItem(label, index);
              })}
            </div>
          </div>

          <div className="grid justify-end gap-6 lg:text-end">
            <div className="text-2xs text-gray-600 uppercase">rating</div>
            <CommonRating rating={rating.value} round={rating.round} />
          </div>

          <div className="grid justify-end gap-3.5 lg:text-end lg:min-w-24 shrink-0 max-w-auto">
            <span className="text-2xs text-gray-600 uppercase">memebers</span>
            <CommonAvatars
              group={team.group}
              more={team.more}
              className={team.className}
              size={team.size}
            />
          </div>

          <div className="grid justify-end min-w-20">
            {connected ? (
              <a className="btn btn-light btn-sm">
                <KeenIcon icon="check-circle" className="" /> Joined
              </a>
            ) : (
              <a className="btn btn-sm btn-primary">
                <KeenIcon icon="people" className="" /> Join
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { CardTeamRow };
