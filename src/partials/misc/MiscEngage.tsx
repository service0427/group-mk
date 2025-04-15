import { Link } from 'react-router-dom';

interface IEngageProps {
  title: string;
  description: string;
  image: any;
  more: {
    url: string;
    title: string;
  };
}

const MiscEngage = ({ title, description, image, more }: IEngageProps) => {
  return (
    <div className="card">
      <div className="card-body px-10 py-7.5 lg:pr-12.5">
        <div className="flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-10">
          <div className="flex flex-col items-start gap-3">
            <h2 className="text-1.5xl font-medium text-gray-900">{title}</h2>

            <p className="text-sm text-gray-800 leading-5.5 mb-2.5">{description}</p>
          </div>

          {image}
        </div>
      </div>

      <div className="card-footer justify-center">
        <Link to={`${more.url}`} className="btn btn-link">
          {more.title}
        </Link>
      </div>
    </div>
  );
};

export { MiscEngage, type IEngageProps };
