import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils/Assets';

interface INFTProps {
  image: string;
  title: string;
  id: number;
  info: string;
  date: string;
}

const CardNFT = ({ image, id, title, info, date }: INFTProps) => {
  return (
    <div className="card shadow-none border-0 mb-5">
      <div
        className="rounded-t-xl w-[280px] h-[240px] bg-cover bg-center"
        style={{ backgroundImage: `url(${toAbsoluteUrl(`/media/images/600x600/${image}`)})` }}
      ></div>

      <div className="card-border card-rounded-b px-3.5 pt-5 pb-3.5">
        <div className="pb-6">
          <a
            href="#"
            className="block font-medium text-gray-900 hover:text-primary text-md leading-4 mb-2"
          >
            {title}
          </a>
          <div className="text-2sm text-gray-700">
            Token ID:
            <span className="text-2sm font-medium text-gray-800"> {id}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 items-center">
          <div className="flex flex-col gap-2">
            <span className="text-2sm text-gray-700">Current bid</span>

            <div className="flex items-center gap-1">
              <KeenIcon icon="xmr" className="text-lg text-brand leading-none" />
              <span className="text-sm font-semibold text-gray-900 leading-none tracking-tight">
                {info}
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-self-end text-end gap-2">
            <span className="text-2sm text-gray-700">Ending in</span>
            <span className="text-2sm font-semibold text-gray-900 leading-none tracking-tight">
              {date}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { CardNFT, type INFTProps };
