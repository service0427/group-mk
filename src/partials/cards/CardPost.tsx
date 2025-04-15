import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

interface IPostProps {
  image: string;
  label: string;
  description: string;
  time: string;
}

const CardPost = ({ image, label, description, time }: IPostProps) => {
  return (
    <div className="card shadow-none w-[280px] border-0 mb-4">
      <div
        className="rounded-t-xl w-[280px] h-[240px] bg-cover bg-center"
        style={{ backgroundImage: `url(${toAbsoluteUrl(`/media/images/600x400/${image}`)})` }}
      ></div>

      <div className="card-border card-rounded-b grid gap-1.5 px-5 py-4">
        <a href="#" className="font-medium text-brand text-2sm hover:text-primary">
          {label}
        </a>
        <a
          href="#"
          className="font-medium text-gray-900 text-lg leading-6 mb-1.5 hover:text-primary"
        >
          {description}
        </a>
        <time className="flex items-center gap-1.5 text-2sm font-medium text-gray-600 leading-none">
          <KeenIcon icon="time" className="text-lg text-gray-500" />
          {time}
        </time>
      </div>
    </div>
  );
};

export { CardPost, type IPostProps };
