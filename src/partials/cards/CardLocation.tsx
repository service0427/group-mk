import { toAbsoluteUrl } from '@/utils/Assets';

interface ILocationProps {
  image: string;
  title: string;
  description: string;
}

const CardLocation = ({ image, title, description }: ILocationProps) => {
  return (
    <div className="card shadow-none w-[280px] border-0 mb-4">
      <img
        src={toAbsoluteUrl(`/media/images/600x400/${image}`)}
        className="rounded-t-xl max-w-[280px] shrink-0"
        alt=""
      />
      <div className="card-border card-rounded-b px-3.5 h-full pt-3 pb-3.5">
        <a href="#" className="font-medium block text-gray-900 hover:text-primary text-md mb-2">
          {title}
        </a>
        <p className="text-2sm text-gray-700">{description}</p>
      </div>
    </div>
  );
};

export { CardLocation, type ILocationProps };
