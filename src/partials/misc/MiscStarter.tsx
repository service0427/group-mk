import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

interface IStarterProps {
  image: ReactNode;
  title: string;
  subTitle: ReactNode;
  engage: {
    path: string;
    btnColor: string;
    label: string;
  };
}

const MiscStarter = ({ image, title, subTitle, engage }: IStarterProps) => {
  return (
    <div className="card">
      <div className="card-body flex flex-col items-center gap-2.5 py-7.5">
        <div className="flex justify-center p-7.5 py-9">{image}</div>

        <div className="flex flex-col gap-5 lg:gap-7.5">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-1.5xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-800">{subTitle}</p>
          </div>

          <div className="flex justify-center mb-5">
            <Link to={engage.path} className={`btn ${engage.btnColor}`}>
              {engage.label}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export { MiscStarter, type IStarterProps };
