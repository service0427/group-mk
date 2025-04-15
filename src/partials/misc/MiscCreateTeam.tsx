import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

interface ICreateTeamProps {
  className?: string;
  image: ReactNode;
  title: string;
  subTitle: ReactNode;
  engage: {
    path: string;
    btnColor: string;
    label: string;
  };
}

const MiscCreateTeam = ({ className, image, title, subTitle, engage }: ICreateTeamProps) => {
  return (
    <div className={clsx('card', className && className)}>
      <div className="card-body flex flex-col place-content-center gap-5">
        <div className="flex justify-center">{image}</div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-1.5xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm font-medium text-gray-700">{subTitle}</p>
          </div>

          <div className="flex justify-center">
            <Link to={`${engage.path}`} className={`btn ${engage.btnColor}`}>
              {engage.label}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MiscCreateTeam, type ICreateTeamProps };
